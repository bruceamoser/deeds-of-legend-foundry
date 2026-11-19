import { assertCurrentGameplayActor } from "../rules/current-character.mjs";
import { forgeLearning } from "../rules/forge.mjs";
import { nativeRestState } from "../rules/native-health.mjs";
import { loadWorkshopCatalogs } from "./catalog.mjs";
import { damageBasis } from "./damage.mjs";
import { coordinateNativeGameplay, registerNativeGameplayHandler } from "./native-workshop-coordinator.mjs";

const ID = "heroes-of-legend";

function assertRestOwner(actor, user) {
  assertCurrentGameplayActor(actor);
  if (actor.type !== "character" || actor.pack || actor.isToken || !actor.testUserPermission(user, "OWNER"))
    throw new Error("Choose a world character you own to record a rest.");
}

export async function requestRest(actor, draft, { operationId = foundry.utils.randomID() } = {}) {
  assertRestOwner(actor, game.user);
  const result = await coordinateNativeGameplay(actor, { kind: "rest", operationId, payload: draft });
  if (!game.messages.find(message => {
    const stored = message.getFlag(ID, "restResult");
    return stored?.operationId === operationId && stored.actorUuid === actor.uuid;
  })) {
    const label = result.kind === "brief-rest" ? "Brief Rest" : "Night’s Rest";
    const titleCase = value => value[0].toUpperCase() + value.slice(1);
    const care = result.firstAid;
    const details = [
      care ? `${care.label}: ${titleCase(care.tier)} (${care.total}), +${care.restored} HP` : "",
      result.spellcraftSp !== undefined ? `Spellcraft Recovery: +${result.spellcraftSp} SP` : "",
    ].filter(Boolean).join(" · ");
    try {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<section class="hol-chat-card"><p><strong>${label}</strong></p><p>HP ${result.before.hp} → ${result.after.hp} · SP ${result.before.sp} → ${result.after.sp}</p>${details ? `<p>${details}</p>` : ""}</section>`,
        flags: { [ID]: { restResult: result } },
      });
    } catch {
      ui.notifications.warn("The rest was recorded. Its chat summary could not be posted.");
    }
  }
  return result;
}

registerNativeGameplayHandler("rest", async (actor, draft, context) => {
  assertRestOwner(actor, context.author);
  if (!draft || !["brief-rest", "nights-rest"].includes(draft.kind))
    throw new Error("Choose a Brief Rest or a Night’s Rest.");
  const operationId = context.operationId;
  const source = JSON.stringify(draft);
  const previous = actor.getFlag(ID, "restResults")?.[operationId];
  if (previous) {
    if (previous.source !== source || previous.authorId !== context.author.id)
      throw new Error("This rest has different choices. Start a new rest.");
    return previous;
  }
  let spellcraftRestoration = 0;
  if (draft.spellcraft) {
    const { forge } = await loadWorkshopCatalogs();
    spellcraftRestoration = forgeLearning(forge, actor.getFlag(ID, "forgeLearned") ?? []).recoverySp;
  }
  const basis = damageBasis(actor);
  const plan = nativeRestState(basis, { kind: draft.kind, firstAid: draft.firstAid, spellcraft: draft.spellcraft }, { spellcraftRestoration });
  const result = {
    operationId, source, actorUuid: actor.uuid, authorId: context.author.id, kind: draft.kind,
    before: { hp: basis.hp, sp: basis.sp }, after: { hp: plan.hp, sp: plan.sp },
    ...(plan.firstAid ? { firstAid: plan.firstAid } : {}),
    ...(draft.spellcraft ? { spellcraftSp: plan.spellcraftSp } : {}),
  };
  const storedPlay = actor.getFlag(ID, "nativeWorkshop")?.portable?.draft?.play;
  const nightlyCleanup = {};
  if (draft.kind === "nights-rest" && storedPlay) {
    const path = `flags.${ID}.nativeWorkshop.portable.draft.play`;
    if (storedPlay.mainSpent) nightlyCleanup[`${path}.mainSpent`] = false;
    if (storedPlay.maneuverSpent) nightlyCleanup[`${path}.maneuverSpent`] = false;
    if (storedPlay.sustain) nightlyCleanup[`${path}.-=sustain`] = null;
  }
  await context.write({
    ...nightlyCleanup,
    "system.health.value": plan.hp,
    "system.sp.value": plan.sp,
    "system.recovery": plan.recovery,
    [`flags.${ID}.forgeVitals`]: plan.forgeVitals,
    [`flags.${ID}.damageRevision`]: basis.revision + 1,
    [`flags.${ID}.restResults.${operationId}`]: result,
  }, result);
  return result;
});
