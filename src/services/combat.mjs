import {expireStaleBenefits} from './benefits.mjs';
import {initialBudgets,prepareParticipantBudget} from './turn-budget.mjs';
import {settleSummonExpiry} from "./summon-lifecycle.mjs";
import {summonState} from "../rules/summon-profile.mjs";
import {settleTurnConditions,turnEndContent} from "./turn-end-conditions.mjs";
import { createActionMessage, shouldProcessRequest } from "./authority.mjs";
import { ensureAuthorityReady } from "./authority.mjs";
import {
  enqueueCharacterOperation,
  isCreationAuthority,
  writeAuthorityDocument,
} from "./authority.mjs";
import {
  startEncounter,
  chooseParticipant,
  finishTurn,
  reconcileTurnRoster,
  selectTurn,
  finishSelectedTurn,
  canCancelTurn,
  cancelTurn,
  encounterSideLabel,
} from "../rules/encounter.mjs";
const ID = "heroes-of-legend";
export function combatSide(combatant) {
  const override = combatant.getFlag(ID, "side");
  if (["players", "opposition"].includes(override)) return override;
  return combatant.actor?.type === "character" ? "players" : "opposition";
}
function tokenPosition(combat, id) {
  const token = combat.combatants.get(id)?.token;
  return token ? [token.x, token.y, token.elevation, token._stats?.modifiedTime ?? null] : null;
}
export function canCancelParticipantTurn(combat, state) {
  return canCancelTurn(state) &&
    JSON.stringify(state.turnSelection.position) === JSON.stringify(tokenPosition(combat, state.current));
}
export async function requestCombat(combat, kind, payload = {}) {
  if (!combat) throw new Error("Choose an encounter before requesting an action.");
  await ensureAuthorityReady({ shared: true, coordinated: true });
  let openingRoll;
  if (kind === "start") {
    if (combat.getFlag(ID,"encounter")) throw new Error("This encounter has already started.");
    if (!game.user.isGM && !combat.combatants.some(participant=>participant.actor?.testUserPermission(game.user,"OWNER"))) throw new Error("Join this encounter with a character you own before starting it.");
    openingRoll = await new foundry.dice.Roll("3d6").evaluate();
  }
  return createActionMessage({
    ...(openingRoll ? {rolls:[openingRoll]} : {}),
    content: `Encounter ${kind} requested.`,
    ...(kind === "start"
      ? {}
      : {
          whisper: game.users
            .filter((u) => u.isGM || u.id === game.user.id)
            .map((u) => u.id),
        }),
    flags: {
      [ID]: {
        combatRequest: {
          ...payload,
          combatUuid: combat.uuid,
          kind,
          revision: combat.getFlag(ID, "encounter")?.revision ?? 0,
        },
      },
    },
  }, { shared: true, coordinated: true });
}
export function resolveCombatRequest(id, combatUuid) {
  return enqueueCharacterOperation(() => apply(id, combatUuid), {
    requestId: id,
  });
}
async function apply(id, combatUuid) {
  const message = game.messages.get(id),
    request = message?.getFlag(ID, "combatRequest");
  const combat =
    typeof (combatUuid ?? request?.combatUuid) === "string"
      ? await fromUuid(combatUuid ?? request.combatUuid)
      : null;
  if (
    combat?.documentName !== "Combat" ||
    !message?.author ||
    !request ||
    !["start", "ambush", "choose", "cancel", "finish", "roster"].includes(request.kind)
  )
    throw new Error("Invalid encounter request.");
  const receipt = combat.getFlag(ID, "operationReceipts")?.[id];
  if (receipt?.applied) {
    if (
      receipt.authorId !== message.author.id ||
      receipt.request !== JSON.stringify(request)
    )
      throw new Error(
        "Completed request was changed; its receipt cannot be reused.",
      );
    if (!canCancelParticipantTurn(combat, combat.getFlag(ID, "encounter"))) await expireStaleBenefits(combat);
    await presentResult(message, combat);
    return { status: "complete", replay: true };
  }
  const state = combat.getFlag(ID, "encounter"),
    combatant = combat.combatants.get(
      request.kind === "choose"
        ? (request.id ?? state?.current)
        : state?.current,
    ),
    actor = combatant?.actor;
  if (["choose", "cancel", "finish"].includes(request.kind)) {
    if (
      !message.author.isGM &&
      (combatant?.hidden || !actor?.testUserPermission(message.author, "OWNER"))
    )
      throw new Error("Manage a visible participant you own, or ask the DA.");
  } else if (request.kind === "start") {
    if (!message.author.isGM && !combat.combatants.filter(participant => participant.actor?.testUserPermission(message.author, "OWNER")).length)
      throw new Error("Join this encounter with a character you own before starting it.");
  } else if (!message.author.isGM)
    throw new Error("Only the DA can change the encounter roster.");
  if (
    !Number.isSafeInteger(request.revision) ||
    request.revision !== (state?.revision ?? 0)
  )
    throw new Error(
      "The encounter changed. Choose again.",
    );
  let next,turnEnd;
  const participants = () => combat.combatants.filter(c=>!summonState(c.actor)?.record).map(c=>({id:c.id,side:combatSide(c)}));
  if (["start", "ambush"].includes(request.kind)) {
    if (state) throw new Error("This encounter has already started.");
    if (request.kind === "ambush") next = startEncounter(participants(), null, {ambushSide: request.side});
    else {
      const roll = message.rolls?.[0];
      if (message.rolls?.length !== 1 || roll?.formula !== "3d6" || roll.dice?.length !== 1 || roll.dice[0].faces !== 6)
        throw new Error("Opening initiative requires one unmodified native 3d6 roll.");
      const faces = roll.dice[0].results.filter(result => result.active !== false).map(result => result.result);
      next = startEncounter(participants(),faces);
    }
    next.budgets=initialBudgets(combat,next.roster);
  } else if (request.kind === "choose") {
    if (summonState(actor)?.record) throw new Error("Summons act through their controller's commands. Choose the controller's turn.");
    if (!combat.combatants.has(request.id)) throw new Error("That participant is no longer in the encounter.");
    if (!state) throw new Error("Make the opening roll, or have the DA resolve an ambush first.");
    const current = reconcileTurnRoster(state,participants());
    next = current.startingSide ? chooseParticipant(current,request.id) : selectTurn(current, request.id);
    const prepared=prepareParticipantBudget(combat,next,request.id,request,message.author);
    next.budgets={...(next.budgets??{}),[request.id]:prepared.budget};
    next.speedProfiles={...(next.speedProfiles??{}),[request.id]:prepared.profile};
    if(prepared.ruling)next.speedRulings={...(next.speedRulings??{}),[request.id]:prepared.ruling};
    next.turnSelection.position=tokenPosition(combat,request.id);
  } else if (request.kind === "cancel") {
    const current=state && reconcileTurnRoster(state,participants());
    if (!canCancelParticipantTurn(combat,current))
      throw new Error("Only an unused turn can be cancelled.");
    next = cancelTurn(current);
  } else if (request.kind === "finish") {
    if (!state) throw new Error("Choose a participant first.");
    const current=reconcileTurnRoster(state,participants());
    await settleSummonExpiry(combat,actor,state);
    turnEnd=await settleTurnConditions(actor,`${combat.id}-${state.serial}-${state.current}`,{author:message.author});
    next = current.startingSide ? finishTurn(current) : finishSelectedTurn(current);
  } else {
    if (!state) throw new Error("Choose a participant first.");
    if (request.mode !== "withdraw" && !combat.combatants.has(request.id)) throw new Error("Add the combatant first.");
    if(state.current===request.id)throw new Error("Finish the current turn first.");
    next=structuredClone(state);next.revision++;
    next.roster=next.roster.filter(participant=>participant.id!==request.id);
    if(request.mode!=="withdraw")next.roster.push({id:request.id,side:combatSide(combat.combatants.get(request.id)),withdrawn:false});
    if(request.mode!=="withdraw"&&!next.budgets?.[request.id])next.budgets={...(next.budgets??{}),...initialBudgets(combat,[{id:request.id}])};
  }
  if (!isCreationAuthority()) return { status: "authority-lost" };
  const turn = next.current
    ? combat.turns.findIndex((c) => c.id === next.current)
    : null;
  if (turn === -1)
    throw new Error("The native turn list changed. Refresh and retry.");
  const commit = {
    round: next.round,
    turn,
    [`flags.${ID}.encounter`]: foundry.data.operators.ForcedReplacement.create(next),
    [`flags.${ID}.operationReceipts.${id}`]: {
      applied: true,
      kind: request.kind,
      authorId: message.author.id,
      request: JSON.stringify(request),
      revision: next.revision,
      ...(turnEnd?{turnEnd}:{}),
    },
  };
  const completedRounds = state ? Math.max(0,next.round-state.round) : 0;
  await writeAuthorityDocument(combat, commit, completedRounds ? {worldTime:{delta:6*completedRounds}} : {});
  if (!canCancelParticipantTurn(combat, next)) await expireStaleBenefits(combat);
  await presentResult(message, combat);
  return { status: "complete", replay: false };
}
async function presentResult(message, combat) {
  const state = combat.getFlag(ID, "encounter"),
    kind = message.getFlag(ID, "combatRequest").kind;
  if (
    combat.getFlag(ID, "operationReceipts")?.[message.id]?.status ===
    "cancelled"
  ) {
    await message.update({
      content: "The DA cancelled this unapplied turn change.",
    });
    return;
  }
  const result=combat.getFlag(ID,"operationReceipts")?.[message.id]?.turnEnd;
  if(result){await message.update({content:turnEndContent(result)});return;}
  const current=combat.combatants.get(state.current);
  const opening=state.opening?.ambushSide ? "Ambush" : state.opening ? `Opening ${state.opening.total}` : "";
  const side=encounterSideLabel(state.nextSide);
  await message.update({content:current ? `${foundry.utils.escapeHTML(current.name)}’s turn.` : state.startingSide ? `${opening ? `${opening} · ` : ""}${side} act next. ${encounterSideLabel(state.startingSide)} start each round.` : kind === "finish" ? "Turn finished." : "Encounter ready."});
}
export function registerCombatRequests() {
  Hooks.on("createChatMessage", (message) => {
    if (message.getFlag(ID, "combatRequest") && shouldProcessRequest(message))
      resolveCombatRequest(message.id).catch(async (e) => {
        ui.notifications.error(e.message);
        await message.update({
          content: `Encounter needs attention: ${foundry.utils.escapeHTML(e.message)}`,
        });
      });
  });
}
