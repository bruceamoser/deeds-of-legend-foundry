import {coordinateNativeGameplay,registerNativeGameplayHandler} from './native-workshop-coordinator.mjs';
import { CONDITION_KINDS } from "../rules/conditions.mjs";
import { damageBasis, damagePreview } from "./damage.mjs";
import { updateOwnedDocument } from "./documents.mjs";
const ID = "heroes-of-legend";
const queues = new Map();
const escape = value => foundry.utils.escapeHTML(String(value ?? ""));

/** One durable request uses the same GM queue as Workshop resource saves. */
export function applyOwnedDamage(actor,components,options={}) {
 const operationId=options.operationId??foundry.utils.randomID();
 return coordinateNativeGameplay(actor,{kind:'damage',operationId,payload:{components,options:{...options,operationId}}});
}
registerNativeGameplayHandler('damage',(actor,payload,context)=>executeOwnedDamage(actor,payload.components,payload.options,context));
function executeOwnedDamage(actor, components, {
  operationId = foundry.utils.randomID(), sourceMessageId = null, label = "Damage",
  resistances = [], weaknesses = [], bypassResistance = false, conditions = [], isAttack = true,
} = {}, context) {
  if (!actor || actor.pack || !["character", "creature"].includes(actor.type) ||
      !actor.testUserPermission(context.author, "OWNER"))
    return Promise.reject(new Error("Select a character or creature you own to apply damage."));
  if (!Array.isArray(conditions) || conditions.some(condition => !Object.hasOwn(CONDITION_KINDS,condition.key) ||
      !Number.isSafeInteger(condition.rating) || condition.rating < 1 ||
      (CONDITION_KINDS[condition.key] === "binary" && condition.rating !== 1) ||
      (condition.persistence != null && !["temporary","starred","maintained","binary"].includes(condition.persistence))))
    return Promise.reject(new Error("Choose valid conditions and ratings before applying damage."));
  const sourceMessage = sourceMessageId ? game.messages?.get(sourceMessageId) : null;
  const attackMessage = game.messages?.get(sourceMessage?.getFlag(ID,"roll")?.attackMessageId);
  const conditionSource = attackMessage?.getFlag(ID,"attackCard")?.actorUuid
    ?? (sourceMessage?.speaker?.actor ? `Actor.${sourceMessage.speaker.actor}` : label);
  const source = JSON.stringify({ components, sourceMessageId, resistances, weaknesses, bypassResistance, conditions, isAttack });
  const settleConditions = async record => {
    if (!conditions.length) return record;
    const applied=[], errors=[];
    for (const [index,condition] of conditions.entries()) {
      try {
        await context.executeNested('condition',{key:condition.key,rating:condition.rating,options:{source:conditionSource,...condition,operationId:`${operationId}-${index}`,postChat:false}});
        applied.push(condition);
      } catch(error) { errors.push(`${condition.key} ${condition.rating}: ${error.message}`); }
    }
    return {...record,conditions:applied,...(errors.length ? {conditionError:errors.join("; ")} : {})};
  };
  const run = async () => {
    if (!actor.testUserPermission(context.author, "OWNER")) throw new Error("You no longer own this damage target.");
    const previous = actor.getFlag(ID, "explicitDamage")?.[operationId];
    if (previous) {
      if (previous.source !== source) throw new Error("This damage action has different values. Start a new action.");
      return settleConditions({ ...previous, replay: true });
    }
    const basis = damageBasis(actor);
    const plan = components.length ? damagePreview(actor, basis, { components, resistances, weaknesses }, { bypassResistance, isAttack, eventId:operationId })
      : {after:basis.hp,event:{total:0,components:[]}};
    const record = { operationId, sourceMessageId, source, label, authorId: context.author.id,
      before: basis.hp, after: plan.after, total: plan.event.total, event: plan.event, deathRollRequired:Boolean(plan.deathRollRequired), conditions };
    await context.write({ "system.health.value": plan.after,
      ...(plan.forgeVitals ? {[`flags.${ID}.forgeVitals`]:plan.forgeVitals} : {}),
      [`flags.${ID}.damageRevision`]: basis.revision + 1,
      [`flags.${ID}.explicitDamage.${operationId}`]: record },record);
    return settleConditions(record);
  };
  const task = (queues.get(actor.uuid) ?? Promise.resolve()).catch(() => {}).then(() =>
    globalThis.navigator?.locks?.request
      ? navigator.locks.request(`${ID}:damage:${game.world.id}:${actor.uuid}`, run) : run());
  queues.set(actor.uuid, task);
  task.finally(() => { if (queues.get(actor.uuid) === task) queues.delete(actor.uuid); }).catch(() => {});
  return task;
}

/** Apply to selected tokens, never targets or an inferred character. Linked tokens share HP. */
export async function applySelectedDamage(components, { sourceMessageId = null, label = "Damage", conditions = [] } = {}) {
  const selected = globalThis.canvas?.tokens?.controlled ?? [];
  if (!selected.length) throw new Error("Select one or more tokens, then click Apply Damage.");
  const actors = new Map(), names = new Map(), skipped = [];
  for (const token of selected) {
    if (!token.actor) { skipped.push(`${token.name ?? "Token"}: no actor`); continue; }
    actors.set(token.actor.uuid, token.actor);
    names.set(token.actor.uuid, token.actor.isToken ? (token.name ?? token.actor.name) : token.actor.name);
  }
  const operationId = foundry.utils.randomID(), applied = [];
  for (const actor of actors.values()) {
    try {
      const result = await applyOwnedDamage(actor, components, { operationId, sourceMessageId, label, conditions });
      applied.push({ actorUuid: actor.uuid, name: names.get(actor.uuid), ...result });
      if(result.conditionError)ui.notifications.warn(`${actor.name}: HP damage applied; condition not applied: ${result.conditionError}`);
    } catch (error) { skipped.push(`${actor.name}: ${error.message}`); }
  }
  if (applied.length) {
    const content = `<article class="hol-damage-chat"><p class="hol-damage-label"><strong>${escape(label)}</strong> <span>· applied</span></p><table aria-label="Applied damage"><thead><tr><th scope="col">Target</th><th scope="col">Damage</th><th scope="col">HP</th></tr></thead><tbody>${applied.map(result => `<tr><th scope="row">${escape(result.name)}</th><td>${result.total}<small>${resistanceSummary(result.event)}</small></td><td>${result.before} → ${result.after}${result.deathRollRequired ? "<small>Immediate Fortitude death roll required</small>" : ""}${result.conditions?.length ? `<small>${result.conditions.map(condition=>`${escape(condition.key)} ${condition.rating}`).join(" · ")}</small>` : ""}</td></tr>`).join("")}</tbody></table></article>`;
    try { await ChatMessage.create({ content, flags: { [ID]: { explicitDamageResult: { operationId, sourceMessageId, applied } } } }); }
    catch { ui.notifications.warn("Damage was applied, but the chat summary could not be posted. Check HP before clicking again."); }
  }
  if (skipped.length) ui.notifications.warn(`Not applied: ${skipped.join("; ")}`);
  return { applied, skipped };
}

function resistanceSummary(event) {
  const applied=(event.breakdown??[]).filter(component=>component.resistance>0);
  const parts=applied.map(component=>`${escape(component.type)} resistance ${component.resistance}`);
  for(const component of event.immuneComponents??[])parts.push(`${escape(component.type)} immunity`);
  if(event.minimumApplied)parts.push("minimum 1 attack damage");
  return parts.join(" · ")||"No resistance applied";
}
