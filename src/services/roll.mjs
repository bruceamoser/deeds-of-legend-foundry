import {updateNativeWorkshopOperation,completeNativeWorkshopOperation} from './native-workshop-coordinator.mjs';
import {tracksConsumable} from "./consumables.mjs";
import {assertSummonPresent} from "../rules/summon-profile.mjs";
import {summonAttackConfiguration} from "../rules/creature-sheet-profile.mjs";
import {resolvedAttackEffects} from "../rules/attack-outcomes.mjs";
import {DAMAGE_TYPE_LABELS} from "../rules/damage.mjs";
import {basicAttackDamageProfile,nativeWeaponTrainingIds} from "../rules/weapon-training.mjs";
import {attackEquipmentSnapshot} from "./attack-equipment.mjs";
import { abilityCatalogRecord, abilityRollConfiguration, assertAbilityConfiguration } from "../rules/ability-roll.mjs";
import { loadCatalogs } from "./catalog.mjs";
import { selectedReferences } from "./reference-play.mjs";
import { incomingOutcome } from "../rules/creature-actions.mjs";
import { rollBasis, prepareRoll } from "./roll-preparation.mjs";
import { renderMarkdown } from "../rules/authored-markdown.mjs";
import { classifyRoll } from "../rules/roll.mjs";

export async function rollAttribute(actor, attributeKey, draft = {}) {
  const basis = rollBasis(actor, attributeKey);
  return rollPrepared(actor, basis, draft);
}

export async function rollPrepared(actor, basis, draft) {
  const current = rollBasis(
    actor,
    basis.attributeKey,
    basis.mode,
    basis.attackMessageId,
    basis.defenderTokenUuid,
    {
      actorTokenUuid: basis.actorTokenUuid,
      targetTokenUuid: basis.mode === "attack" ? null : basis.targetTokenUuid,
    },
  );
  if (JSON.stringify(current) !== JSON.stringify(basis))
    throw new Error("Roll sources changed. Review the dialog before rolling.");
  const ability = await validatedRollAbility(actor,draft);
  const equipment = selectedAttackEquipment(actor,ability,draft,current.attributeKey);
  const prepared = prepareRoll(current,draft);
  const references = rollReferences(actor,current,draft,game.user.id);
  let ammunition;
  if (ability?.ranged) {
    const {rangedAmmunition} = await import("./ranged-ammunition.mjs");
    ammunition = rangedAmmunition(actor,draft.rangedWeaponItemId);
  }
  let nativeAttackOperationId;
  if (actor.type === "character" && ability?.attack && ability.weaponKind && draft.abilityItemId) {
    draft.nativeAttackOperationId ??= foundry.utils.randomID();
    nativeAttackOperationId = draft.nativeAttackOperationId;
    await (await import("./abilities.mjs")).prepareNativeBasicAttack(actor,draft.abilityItemId,nativeAttackOperationId,current.actorTokenUuid);
    const operation = actor.getFlag("heroes-of-legend","nativeWorkshopPendingRoll");
    await updateNativeWorkshopOperation(actor,{...operation,status:"evaluating"});
  }
  const mode = game.settings.get("core", "messageMode");
  const {roll,snapshot} = await evaluateRoll(actor,current,draft,{
    ability,equipment,references,plan:prepared,rollerId:game.user.id,allowInteractive:mode!=="blind",
  });
  if(nativeAttackOperationId){
    const operation=actor.getFlag('heroes-of-legend','nativeWorkshopPendingRoll');
    await updateNativeWorkshopOperation(actor,{...operation,status:'evaluated',faces:roll.dice[0].results.filter(result=>!result.rerolled).map(result=>result.result),formula:roll.formula});
  }
  const message = await roll.toMessage(
    {
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: game.i18n.localize(
        `HOL.Attributes.${prepared.resolvedAttributeKey ?? basis.attributeKey}`,
      ),
      flags: { "heroes-of-legend": { roll: snapshot } },
    },
    { messageMode: mode },
  );
  if (ammunition && tracksConsumable(ammunition.ammo)) {
    try {
      const {consumeOwnedSupply} = await import("./inventory.mjs");
      await consumeOwnedSupply(actor,ammunition.ammo,{operationId:message.id,label:ammunition.ammo.name});
    } catch(error) { ui.notifications.error(`Attack rolled; ammunition check failed: ${error.message}`); }
  }
  if(nativeAttackOperationId){await completeNativeWorkshopOperation(actor,nativeAttackOperationId);delete draft.nativeAttackOperationId;}
  return message;
}
async function validatedRollAbility(actor,draft) {
  assertSummonPresent(actor);
  let ability = draft.summonAttackId ? summonAttackConfiguration(actor,draft.summonAttackId) : undefined;
  if (draft.abilityItemId) {
    const item = actor.items.get(draft.abilityItemId);
    if (item?.type !== "ability" || !actor.testUserPermission(game.user, "OWNER"))
      throw new Error("This ability is no longer available to roll.");
    const catalogs = await loadCatalogs();
    ability = abilityRollConfiguration(item,abilityCatalogRecord(item,catalogs.choices),catalogs.forge);
  }
  if (ability) assertAbilityConfiguration(ability,draft.abilityConfiguration);
  return ability;
}

function selectedAttackEquipment(actor,ability,draft,attributeKey) {
  if (ability?.attack && ability.attributes?.length && !ability.attributes.includes(attributeKey))
    throw new Error("Choose an attribute listed for this attack.");
  if (ability?.damageTypes?.length && !ability.damageTypes.includes(draft.damageType))
    throw new Error("Choose the printed damage type in the roll dialog.");
  return ability ? attackEquipmentSnapshot(actor,ability,ability.ranged?draft.rangedWeaponItemId:draft.weaponItemId) : null;
}

function rollReferences(actor,basis,draft,rollerId) {
  return selectedReferences(actor,draft,{
    mode:basis.mode,attributeKey:basis.attributeKey,initiatingItemId:draft.abilityItemId,
    defenderTokenUuid:basis.defenderTokenUuid,user:game.users?.get(rollerId) ?? game.user,
  });
}

export async function evaluatePreparedRoll(actor,basis,draft,{rollerId=game.user.id,allowInteractive=false}={}) {
  const ability = await validatedRollAbility(actor,draft);
  const equipment = selectedAttackEquipment(actor,ability,draft,basis.attributeKey);
  const references = rollReferences(actor,basis,draft,rollerId);
  const plan = prepareRoll(basis,draft);
  return evaluateRoll(actor,basis,draft,{ability,equipment,references,plan,rollerId,allowInteractive});
}

async function evaluateRoll(actor,basis,draft,{ability,equipment,references,plan,rollerId,allowInteractive}) {
  const roll = await new foundry.dice.Roll(plan.formula).evaluate({
    allowInteractive,
  });
  const retained = roll.dice[0].results
    .filter((result) => result.active)
    .map((result) => result.result);
  const result = classifyRoll(retained, plan.attribute);
  if (ability?.weaponKind === "opportunity") {
    const id = equipment?.itemUuid ? "ability-basic-melee" : "ability-basic-unarmed";
    const profile = basicAttackDamageProfile(nativeWeaponTrainingIds(actor),id);
    ability = {...ability,outcomes:Object.fromEntries(["weak","standard","strong"].map((tier,index)=>[tier,`${profile[index]} physical damage`]))};
  }
  const snapshot = {
    schemaVersion: 2,
    ...(ability ? {ability, damageType:draft.damageType ?? null, resolvedEffects:resolvedAttackEffects(ability.outcomes[result.tier],{damageType:draft.damageType})} : {}),
    ...(equipment ? {equipment} : {}),
    references,
    actorUuid: actor.uuid,
    defenderTokenUuid: basis.defenderTokenUuid,
    rollerId,
    attackMessageId: basis.attackMessageId,
    attackOutcome: incomingOutcome(basis.incoming, result.tier),
    targetTokenUuid: basis.targetTokenUuid ?? null,
    attributeKey: basis.attributeKey,
    mode: basis.mode,
    perception: structuredClone(draft.perception ?? {}),
    ...plan,
    retained,
    dice: roll.dice[0].results.map((die, index) => ({ index, face: die.result, kept: Boolean(die.active) })),
    ...result,
  };
  return { roll, snapshot };
}

export function renderRollSummary(message, element) {
  const reference = message.getFlag("heroes-of-legend", "abilityReference");
  if (message.isContentVisible && /\bdamage\b/i.test(reference?.damageText ?? "") && !element.querySelector(".hol-reference-damage")) {
    const button = document.createElement("button"); button.type = "button"; button.className = "hol-reference-damage";
    button.textContent = "Apply Damage…";
    button.addEventListener("click", async () => {
      if (button.disabled) return; button.disabled = true;
      try { const {promptChatDamage} = await import("../dialogs/chat-damage.mjs"); await promptChatDamage(message, reference.damageText); }
      catch (error) { ui.notifications.error(error.message); }
      finally { button.disabled = false; }
    });
    element.querySelector(".hol-reference-card")?.append(button);
  }
  const result = message.getFlag("heroes-of-legend", "roll");
  if (
    !result ||
    !message.isContentVisible ||
    element.querySelector(".hol-roll-summary")
  )
    return;
  const summary = document.createElement("div");
  summary.className = "hol-roll-summary hol-chat-card";
  summary.dataset.tier = result.tier;
  summary.dataset.chatKind = result.mode;
  const header = document.createElement("header");
  header.className = "hol-chat-header";
  const identity = document.createElement("div"), actorName = document.createElement("small"), heading = document.createElement("h3");
  actorName.textContent = `${message.speaker?.alias ?? ""} · ${result.mode === "defense" ? "Defense" : result.mode === "attack" ? "Attack" : "Check"}`;
  const attributeName = game.i18n.localize(`HOL.Attributes.${result.resolvedAttributeKey ?? result.attributeKey}`);
  const incoming = game.messages?.get?.(result.attackMessageId)?.getFlag("heroes-of-legend", "attackCard");
  heading.textContent = result.mode === "defense" ? `Defend${incoming?.title ? ` · ${incoming.title}` : ""}` : result.equipment?.name ?? result.ability?.name ?? "Attribute check";
  identity.append(heading);
  const actor = typeof fromUuidSync === "function" && result.actorUuid
    ? fromUuidSync(result.actorUuid)
    : game.actors?.get?.(message.speaker?.actor);
  header.append(identity);
  const bar = document.createElement("div"); bar.className = "hol-chat-bar";
  const barPart = text => { const part = document.createElement("span"); part.textContent = text; bar.append(part); };
  if(result.equipment && result.ability?.name)barPart(result.ability.name);
  if (incoming?.attackerName) barPart(`Against ${incoming.attackerName}`);
  barPart(`${attributeName} ${result.attribute >= 0 ? "+" : ""}${result.attribute}`);
  barPart(result.net ? `${Math.abs(result.net)} ${result.net < 0 ? "Banes" : "Boons"}` : "Even");
  barPart(`${result.count}d6 · ${result.net ? `keep ${result.net > 0 ? "highest" : "lowest"} 3` : "keep 3"}`);
  const resolution = document.createElement("div"); resolution.className = "hol-chat-resolution";
  const verdict = document.createElement("div"); verdict.className = `hol-chat-verdict ${result.tier}`;
  const total = document.createElement("strong"), tier = document.createElement("span");
  total.textContent = result.total;
  tier.textContent = `${game.i18n.localize(`HOL.Tiers.${result.tier}`)}${result.mode === "defense" ? " defense" : ""}`;
  verdict.append(total, tier);
  summary.append(header, bar, resolution);
  const original = result.dice ?? message.rolls?.[0]?.dice?.[0]?.results?.map((die, index) => ({ index, face: die.result, kept: Boolean(die.active) })) ?? [];
  if (original.length) {
    const dice = document.createElement("div");
    dice.className = "hol-chat-dice";
    dice.setAttribute("aria-label", "Rolled dice");
    for (const die of original) {
      const face = document.createElement("span");
      face.className = `hol-chat-die ${die.kept ? "kept" : "discarded"}`;
      face.dataset.dieIndex = die.index;
      face.textContent = die.face;
      face.setAttribute("role", "img");
      face.setAttribute("aria-label", `${die.face}, ${die.kept ? "kept" : "discarded"}`);
      dice.append(face);
    }
    resolution.append(dice);
  }
  resolution.append(verdict);
  if(result.ability?.trigger){const trigger=document.createElement("p");trigger.className="hol-chat-trigger";const label=document.createElement("strong");label.textContent="Trigger: ";trigger.append(label,document.createTextNode(result.ability.trigger));summary.append(trigger);}
  if (result.ability?.outcomes?.[result.tier] || result.ability?.effect) {
    const outcome = document.createElement("div");
    outcome.className = "hol-chat-effect hol-chat-ability-outcome";
    outcome.innerHTML = renderMarkdown(result.ability.outcomes[result.tier] || result.ability.effect);
    summary.append(outcome);
  }
  if (result.natural !== "none") {
    const natural = document.createElement("p");
    natural.className = "hol-chat-natural";
    natural.textContent = game.i18n.localize(`HOL.Naturals.${result.natural}`);
    summary.append(natural);
  }
  const detail = document.createElement("details"), detailLabel = document.createElement("summary"), audit = document.createElement("p");
  detailLabel.textContent = "Roll details";
  audit.textContent = game.i18n.format("HOL.RollDetails", {
    faces: result.retained.join(", "),
    boons: result.boons,
    banes: result.banes,
  });
  detail.className = "hol-chat-details";
  detail.append(detailLabel, audit);
  const damageText = result.ability?.outcomes?.[result.tier] ?? result.attackOutcome?.text ?? "";
  const effects = result.resolvedEffects ?? (result.attackOutcome?.components ? result.attackOutcome
    : Number.isSafeInteger(result.attackOutcome?.damage)
      ? {components:[{type:result.attackOutcome.type,amount:result.attackOutcome.damage}],conditions:[]}
      : resolvedAttackEffects(damageText,{damageType:result.damageType}));
  if (result.attackOutcome) {
    const outcome = document.createElement("p"); outcome.className = "hol-chat-effect";
    outcome.textContent = result.attackOutcome.text ?? `${result.attackOutcome.damage} ${result.attackOutcome.type} damage`;
    summary.append(outcome);
  }
  if (effects && result.ability) {
    const printed = summary.querySelector(".hol-chat-ability-outcome");
    if (printed) detail.append(printed);
    if (result.ability.effect) {
      const full = document.createElement("div");
      full.className = "hol-chat-effect";
      full.innerHTML = renderMarkdown(result.ability.effect);
      detail.append(full);
    }
  }
  if (effects?.manual) {
    const reminder = document.createElement("p");
    reminder.className = "hol-chat-effect hol-chat-manual";
    reminder.textContent = `Additional effect to resolve at the table: ${effects.manual}`;
    summary.append(reminder);
  }
  let damageButton;
  if (effects?.components.length || effects?.conditions.length) {
    const outcomePanel = document.createElement("div");
    outcomePanel.className = "hol-chat-damage-outcome";
    const amount = document.createElement("strong");
    amount.className = "hol-chat-damage-amount";
    amount.textContent = effects.components.length === 1 ? `Damage: ${effects.components[0].amount} ${DAMAGE_TYPE_LABELS[effects.components[0].type]}` : `Damage: ${effects.components.reduce((total,c)=>total+c.amount,0)}${effects.components.length ? " · " + effects.components.map(c=>`${c.amount} ${DAMAGE_TYPE_LABELS[c.type]}`).join(" + ") : ""}`;
    outcomePanel.append(amount);
    if (effects.conditions.length) {
      const condition = document.createElement("span");
      condition.className = "hol-chat-damage-conditions";
      condition.textContent = `Conditions: ${effects.conditions.map(c=>`${c.key[0].toUpperCase()+c.key.slice(1)} ${c.rating}`).join(" · ")}`;
      outcomePanel.append(condition);
    }
    const status = document.createElement("span");
    status.className = "hol-chat-applied-status";
    status.setAttribute("role","status");
    const showApplied = applied => {
      status.textContent = applied.length ? applied.map(entry => `Applied: ${entry.conditions?.length ? entry.conditions.map(c=>`${c.key[0].toUpperCase()+c.key.slice(1)} ${c.rating}`).join(" · ") + " · " : ""}${entry.total} damage → ${entry.name}`).join("; ") : "";
    };
    showApplied((game.messages?.contents ?? []).filter(m=>m.getFlag("heroes-of-legend","explicitDamageResult")?.sourceMessageId === message.id).flatMap(m=>m.getFlag("heroes-of-legend","explicitDamageResult").applied ?? []));
    outcomePanel.append(status);
    summary.append(outcomePanel);
    const button = document.createElement("button"); button.type = "button";
    button.className = "hol-apply-damage"; button.textContent = "Apply Damage";
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      button.disabled = true;
      try {
        const {applySelectedDamage} = await import("./explicit-damage.mjs");
        const applied = await applySelectedDamage(effects.components,{conditions:effects.conditions,sourceMessageId:message.id,label:heading.textContent});
        showApplied(applied.applied);
      } catch(error) { ui.notifications.error(error.message); }
      finally { button.disabled = false; }
    });
    damageButton = button;
  }
  if (result.references?.length) {
    const references = document.createElement("p");
    references.className = "hol-roll-references";
    references.append(document.createTextNode("References: "));
    for (const [index, reference] of result.references.entries()) {
      if (index) references.append(document.createTextNode(" · "));
      const link = document.createElement("a");
      link.className = "content-link";
      link.dataset.uuid = reference.itemUuid;
      link.dataset.type = "Item";
      link.dataset.link = "";
      link.textContent = reference.name;
      references.append(link);
    }
    detail.append(references);
  }
  if (result.sources?.length) {
    const list = document.createElement("ul");
    for (const source of result.sources) {
      const li = document.createElement("li");
      li.textContent = `${source.label}: ${source.amount} ${source.kind}`;
      list.append(li);
    }
    detail.append(list);
  }
  const footer = document.createElement("footer"); footer.className = "hol-chat-footer";
  if (damageButton) footer.append(damageButton);
  if (actor?.isOwner && actor.type === "character" && result.mode === "attribute" && !result.ability) {
    const development = actor.getFlag("heroes-of-legend", "development") ?? {};
    const traits = development.creation?.traitIds ?? development.ancestryTraitIds ?? [];
    const borrowed = development.creation?.borrowedTraitId;
    if (traits.includes("trait-oath-bound-the-debt-comes-due") ||
        traits.includes("trait-human-many-homes") && borrowed === "trait-oath-bound-the-debt-comes-due") {
      const debt = document.createElement("button"); debt.type = "button";
      debt.textContent = "The Debt Comes Due · pay 1 HP & reroll";
      debt.disabled = Boolean(actor.system.recovery?.debtUsed || actor.system.health.value < 2 || result.debtReroll);
      debt.addEventListener("click", async () => {
        if (debt.disabled) return;
        debt.disabled = true;
        try { const {requestDebtReroll} = await import("./debt-reroll.mjs"); await requestDebtReroll(actor,message); }
        catch (error) { ui.notifications.error(error.message); debt.disabled = false; }
      });
      footer.append(debt);
    }
  }
  summary.append(footer);
  const content = element.querySelector(".message-content");
  if (!content) return;
  // Keep Foundry's evaluated dice and tooltip controls available without a
  // second primary result panel above the approved card. Never rebuild dice.
  const nativeNodes = [...content.querySelectorAll(".dice-roll"), ...element.querySelectorAll(".message-flavor, .flavor-text")];
  if (["attribute", "attack", "defense"].includes(result.mode))
    nativeNodes.push(...Array.from(content.childNodes).filter(node => node.nodeType === 3 && node.textContent.trim()));
  if (nativeNodes.length) {
    detail.classList.add("hol-native-roll-details");
    detail.append(...nativeNodes);
  }
  summary.append(detail);
  content.append(summary);
}
