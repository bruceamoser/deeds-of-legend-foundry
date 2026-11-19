import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { forgeRest } from "../src/rules/forge-vitals.mjs";
import { nativeRestState } from "../src/rules/native-health.mjs";

const limits = { maxHp: 18, maxSp: 12, gritGranted: 2, unavailableHp: 1 };
const play = {
  hp: 2, sp: 2, gritSpent: 1, scars: ["Arrow scar"], firstAidUsed: true,
  spellcraftRecoveryUsed: true, mindPalaceUsed: true, soulWellspringUsed: true,
  recovery: { unavailableHp: 1, debtUsed: true },
};

test("brief rest restores base HP and SP plus learned Spellcraft and preserves treatment use", () => {
  const brief = forgeRest(play, limits, { kind: "brief-rest", spellcraft: true }, { spellcraftRestoration: 4 });
  assert.deepEqual([brief.hp, brief.sp, brief.gritSpent], [8, 9, 1]);
  assert.equal(brief.firstAidUsed, true);
  assert.equal(brief.spellcraftRecoveryUsed, true);
  assert.equal(brief.mindPalaceUsed, true);
  assert.equal(brief.soulWellspringUsed, true);
  assert.deepEqual(brief.scars, play.scars);
  const topped = forgeRest({ ...brief, hp: 16, firstAidPending: true }, limits, { kind: "brief-rest" });
  assert.deepEqual([topped.hp, topped.sp], [17, 12]);
  assert.equal(topped.firstAidPending, true);
  assert.throws(() => forgeRest(play, limits, { kind: "brief-rest", spellcraft: true }), /Learn Spellcraft/);
  const fromOlderClient = forgeRest({ ...play, firstAidUsed: false }, limits, { kind: "brief-rest", firstAid: { total: 15 } });
  assert.equal(fromOlderClient.hp, 8);
  assert.equal(fromOlderClient.firstAidUsed, false);
});

test("night’s rest restores effective HP and SP and renews nightly abilities without declaring dawn", () => {
  const restored = forgeRest(play, limits, { kind: "nights-rest" });
  assert.deepEqual([restored.hp, restored.sp, restored.gritSpent], [17, 12, 1]);
  for (const key of ["firstAidUsed", "spellcraftRecoveryUsed", "mindPalaceUsed", "soulWellspringUsed"])
    assert.equal(restored[key], false);
  assert.deepEqual(restored.recovery, { unavailableHp: 1, debtUsed: false });
  assert.deepEqual(restored.scars, play.scars);
  const adjudicated = forgeRest({ ...play, hp: 0, dying: true, failedDeathRolls: 2 }, limits, { kind: "nights-rest" });
  assert.equal(adjudicated.hp, restored.hp);
  assert.equal(adjudicated.dying, false);
  assert.equal(adjudicated.failedDeathRolls, 0);
});

test("coordinated rest writes once, records both resources and posts the completed result", async () => {
  const id = "heroes-of-legend";
  const basis = {
    hp: 2, sp: 2, maxHp: 18, maxSp: 12, gritGranted: 2, gritSpent: 1, revision: 3,
    recovery: play.recovery, forgeVitals: { scars: play.scars, soulWellspringUsed: true },
  };
  const results = {};
  const actor = { type: "character", uuid: "Actor.tyra", testUserPermission: user => user.id === "owner", getFlag: (_, key) => key === "restResults" ? results : [] };
  const author = { id: "owner" };
  const messages = [];
  const writes = [];
  let handler;
  const context = vm.createContext({
    game: { user: author, messages },
    ChatMessage: { getSpeaker: () => ({ alias: "Tyra" }), create: async message => messages.push({ ...message, getFlag: (scope, key) => message.flags[scope][key] }) },
  });
  const exports = {
    assertCurrentGameplayActor: actor => actor, nativeRestState,
    forgeLearning: () => ({ recoverySp: 4 }), loadWorkshopCatalogs: async () => ({ forge: {} }), damageBasis: () => basis,
    registerNativeGameplayHandler: (_name, fn) => { handler = fn; },
    coordinateNativeGameplay: (actor, { operationId, payload }) => handler(actor, payload, {
      author, operationId,
      write: async (changes, result) => { writes.push(changes); results[operationId] = result; },
    }),
  };
  const module = new vm.SourceTextModule(await readFile(new URL("../src/services/rest.mjs", import.meta.url), "utf8"), { context });
  await module.link(() => new vm.SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context }));
  await module.evaluate();
  const draft = { kind: "brief-rest", spellcraft: true };
  await module.namespace.requestRest(actor, draft, { operationId: "rest1" });
  await module.namespace.requestRest(actor, draft, { operationId: "rest1" });
  assert.equal(writes.length, 1);
  assert.equal(writes[0]["system.health.value"], 8);
  assert.equal(writes[0]["system.sp.value"], 9);
  assert.equal(writes[0]["system.grit.spent"], undefined);
  assert.equal(writes[0][`flags.${id}.forgeVitals`].soulWellspringUsed, true);
  assert.equal(messages.length, 1);
  assert.match(messages[0].content, /HP 2 → 8 · SP 2 → 9/);
  assert.match(messages[0].content, /Spellcraft Recovery: \+4 SP/);
  await assert.rejects(module.namespace.requestRest(actor, { kind: "nights-rest" }, { operationId: "rest1" }), /different choices/);
});
