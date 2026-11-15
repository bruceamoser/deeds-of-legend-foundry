import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyForgePlaytest } from "../src/rules/forge-playtest-catalog.mjs";
import { forgeEligibility, forgeIndex, learnForgeEntry } from "../src/rules/forge.mjs";
import {
  PORTABLE_FORMAT, readPortableCharacter, writePortableCharacter,
} from "../src/rules/portable-character.mjs";
import { workshopCatalogs } from "../src/rules/workshop-forge-catalog.mjs";
import { workshopCharacter } from "../src/rules/workshop-character.mjs";
import { workshopPlaytestParty } from "../scripts/workshop-playtest-party.mjs";

const data = (name) => JSON.parse(readFileSync(new URL(`../static/data/${name}.json`, import.meta.url)));
const original = data("forge-party").party;
const { forge, references } = applyForgePlaytest(data("forge"), data("forge-references"));
const catalogs = workshopCatalogs(data("choices"), data("inventory"), data("wounds"), forge, references);
const party = workshopPlaytestParty(original, catalogs);
const example = (id) => structuredClone(party.find((hero) => hero.id === id).draft);
const purchases = (...ids) => ids.map((id) => ({ id }));
const hero = (draft) => workshopCharacter(draft, catalogs);

test("level-one DP supports physical, battle-caster, and broad generalist builds with different tradeoffs", () => {
  const physical = example("vaelis-emberglass");
  physical.attributes = { brawn: 2, agility: 1, fortitude: 2, guile: -1, knowledge: 0, reason: -1 };
  physical.purchases[1] = purchases("flame:0", "flame:1", "air:0", "air:1");
  let state = hero(physical);
  assert.deepEqual(state.errors, []);
  assert.deepEqual(state.development, { level: 1, current: 0, spent: 6, total: 6, expired: 0 });
  assert.equal(state.limits.maxSp, 3);
  assert.equal(state.state.learning.spells.length, 8);
  assert.ok(state.state.learning.spells.some((spell) => spell.action === "Maneuver" && spell.sp === 0));
  assert.ok(state.state.learning.spells.some((spell) => spell.action === "Reaction"));

  const caster = example("vaelis-emberglass");
  caster.attributes = { brawn: -1, agility: 1, fortitude: 1, guile: 0, knowledge: 2, reason: 0 };
  caster.purchases[1] = purchases("flame:0", "flame:1", "air:0", "air:1", "water:0", "spellcraft:soul-capacity:1", "spellcraft:mind-capacity:1", "spellcraft:recovery:1");
  state = hero(caster);
  assert.deepEqual(state.errors, []);
  assert.equal(state.development.total, 10);
  assert.equal(state.limits.maxSp, 11);
  assert.equal(state.state.learning.spells.length, 10);
  assert.ok(state.state.learning.spells.some((spell) => spell.action === "Main Action" && spell.sp === 0));

  const broad = example("oren-brass");
  broad.traitIds = ["trait-human-weathered", "trait-human-many-homes"]; // No extra DP trait.
  broad.attributes = { brawn: -1, agility: 0, fortitude: -1, guile: 2, knowledge: 2, reason: 1 };
  broad.purchases[1].push(...purchases("craft:construction:1", "farseeing:0"));
  state = hero(broad);
  assert.deepEqual(state.errors, []);
  assert.equal(state.development.total, 13);
  assert.ok(state.state.learning.abilities.length >= 5);
  assert.equal(state.state.recipes.length, 4);
  assert.ok(state.state.learning.spells.some((spell) => spell.action === "Ritual"));
  for (const draft of [physical, caster, broad]) {
    const atFirst = hero(draft);
    draft.progression = { level: 2, levels: {} };
    const atSecond = hero(draft);
    assert.deepEqual(atSecond.errors, []);
    assert.equal(atSecond.development.current, atFirst.development.current + 6);
    assert.equal(atSecond.limits.maxSp, atFirst.limits.maxSp + 2);
  }
});

test("armor uses the highest trained worn suit; heavy training stays behind Armor II and level three", () => {
  const draft = example("borin-bridgekeeper");
  draft.purchases[1] = purchases("armor:harness:1", "armor:harness:2");
  const suits = ["medium", "heavy"].map((armor) => ({
    id: `item-ordinary-${armor}-armor`, instanceId: `inventory-${armor}`, quantity: 1,
  }));
  draft.play = { inventory: { added: suits, removed: [] } };
  draft.loadout["inventory-medium"] = { worn: true, carried: true };
  draft.loadout["inventory-heavy"] = { worn: true, carried: true };
  assert.equal(hero(draft).resistances.physical, 1);
  draft.purchases[1].push(...purchases("armor:harness:3"));
  assert.equal(hero(draft).resistances.physical, 2);
  const training = forgeEligibility(forge, hero(draft).state, "armor:harness:4");
  assert.deepEqual(training.reasons, ["Available at level 3."]);
  draft.progression = { level: 3, levels: {
    3: { purchases: purchases("armor:harness:4"), signatures: {
      3: forge.classes.find(({ id }) => id === draft.classId).signatures[3][0],
    } },
  } };
  assert.deepEqual(hero(draft).errors, []);
  assert.equal(hero(draft).resistances.physical, 3);
  draft.loadout["inventory-heavy"].worn = false;
  assert.equal(hero(draft).resistances.physical, 2);
});

test("a four-discipline hybrid is reachable, with its exact endpoints, at level seven", () => {
  const draft = example("vaelis-emberglass");
  draft.purchases[1] = purchases();
  draft.progression = { level: 7, levels: {} };
  const planned = hero(draft).state;
  assert.equal(planned.dp, 62);
  const id = "combined:colossus-of-the-forge";
  const { nodes } = forgeIndex(forge);
  const path = (key, state) => {
    if (state.learned.includes(key)) return state;
    for (const other of nodes.get(key).requires) state = path(other, state);
    const outcome = learnForgeEntry(forge, state, key);
    assert.ok(outcome.eligible, outcome.reasons.join(" "));
    return outcome.state;
  };
  const endpointIds = ["flame:3", "imbuement:3", "arms:bladework:4", "craft:construction:4"];
  assert.deepEqual(nodes.get(id).requires, endpointIds);
  const state = endpointIds.reduce((before, endpoint) => path(endpoint, before), planned);
  assert.equal(forgeEligibility(forge, { ...state, level: 6 }, id).eligible, false);
  for (const endpoint of endpointIds) {
    assert.equal(forgeEligibility(forge, { ...state, learned: state.learned.filter((key) => key !== endpoint) }, id).eligible, false);
  }
  const result = learnForgeEntry(forge, state, id);
  assert.equal(result.eligible, true);
  assert.equal(result.cost, 5);
});

test("older portable characters keep identity, planned choices and live resources during conversion", () => {
  const draft = structuredClone(original[0].draft);
  draft.play = { hp: 7, sp: 2, scars: ["Eye scar"] };
  const saved = readPortableCharacter({ format: PORTABLE_FORMAT, schemaVersion: 4, draft }, catalogs);
  assert.equal(saved.draft.name, draft.name);
  assert.deepEqual(saved.draft.classDisciplines, ["guard"]);
  assert.deepEqual(saved.draft.purchases[0], []);
  assert.ok(saved.draft.purchases[1].some(({ id }) => id === "armor:harness:1"));
  assert.ok(saved.draft.purchases[1].some(({ id }) => id === "arms:impact:3"));
  assert.deepEqual(saved.draft.play.scars, ["Eye scar"]);
  assert.equal(saved.draft.play.hp, 7);
  assert.equal(saved.draft.play.sp, 2);
  assert.equal(saved.preview.limits.maxHp, 19);
  const persisted = JSON.parse(writePortableCharacter(saved.draft, catalogs));
  assert.equal(persisted.schemaVersion, 5);
  assert.deepEqual(persisted.draft, saved.draft);
});

test("class-priced discipline purchases replay, refund, and export at their paid cost", () => {
  const draft = example("vaelis-emberglass");
  draft.purchases[1] = [];
  const before = hero(draft);
  assert.equal(before.state.classId, "class-arcanist");
  assert.ok(!before.state.learned.includes("arms"));
  draft.purchases[1] = purchases("arms");
  const bought = hero(draft);
  assert.deepEqual(bought.errors, []);
  assert.equal(bought.development.current, before.development.current - 3);
  assert.equal(bought.development.spent, 3);
  const exported = writePortableCharacter(draft, catalogs);
  // The existing portable contract retains choices; current rules recalculate costs.
  assert.equal(readPortableCharacter(JSON.parse(exported), catalogs).preview.development.current, bought.development.current);
  draft.purchases[1] = [];
  assert.equal(hero(draft).development.current, before.development.current);
  draft.purchases[1] = purchases("arms", "armor", "guard", "wilderness");
  const overBudget = hero(draft);
  assert.ok(overBudget.errors.some(error => error.code === "purchase"));
  assert.equal(draft.purchases[1].length, 4, "unaffordable stored choices remain repairable");
});
