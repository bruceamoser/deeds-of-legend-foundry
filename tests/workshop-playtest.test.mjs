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
  assert.deepEqual(state.development, { level: 1, current: 2, spent: 6, total: 8, expired: 0 });
  assert.equal(state.limits.maxSp, 3);
  assert.equal(state.state.learning.spells.length, 8);
  assert.ok(state.state.learning.spells.some((spell) => spell.action === "Maneuver" && spell.sp === 0));
  assert.ok(state.state.learning.spells.some((spell) => spell.action === "Reaction"));

  const caster = example("vaelis-emberglass");
  caster.attributes = { brawn: -1, agility: 1, fortitude: 1, guile: 0, knowledge: 2, reason: 0 };
  caster.purchases[1] = purchases("flame:0", "flame:1", "air:0", "air:1", "water:0", "spellcraft:soul-capacity:1", "spellcraft:mind-capacity:1", "spellcraft:recovery:1");
  state = hero(caster);
  assert.deepEqual(state.errors, []);
  assert.equal(state.development.total, 12);
  assert.equal(state.limits.maxSp, 11);
  assert.equal(state.state.learning.spells.length, 10);
  assert.ok(state.state.learning.spells.some((spell) => spell.action === "Main Action" && spell.sp === 0));

  const broad = example("oren-brass");
  broad.traitIds = ["trait-human-weathered", "trait-human-shared-table"]; // No extra DP trait.
  broad.attributes = { brawn: -1, agility: 0, fortitude: -1, guile: 2, knowledge: 2, reason: 1 };
  broad.purchases[1] = purchases("craft:repairs:1", "craft:mixtures:1", "craft:safeguards:1", "craft:workshop:1", "craft:workshop:2", "scholarship:planning:1", "scholarship:investigation:1", "scholarship:disputation:1", "detection:0", "farseeing:0");
  broad.acquisitions = {"craft:workshop:1": {recipes:["recipe-bound-torches","recipe-travel-food"]}, "craft:workshop:2":{recipes:["recipe-twisted-cord","recipe-wooden-brace"]}};
  state = hero(broad);
  assert.deepEqual(state.errors, []);
  assert.equal(state.development.total, 15);
  assert.ok(state.state.learning.abilities.length >= 5);
  assert.equal(state.state.recipes.length, 4);
  assert.ok(state.state.learning.spells.some((spell) => spell.action === "Ritual"));
  for (const draft of [physical, caster, broad]) {
    const atFirst = hero(draft);
    draft.progression = { level: 2, levels: {} };
    const atSecond = hero(draft);
    assert.deepEqual(atSecond.errors, []);
    assert.equal(atSecond.development.current, atFirst.development.current + 8);
    assert.equal(atSecond.limits.maxSp, atFirst.limits.maxSp + 2);
  }

  broad.traitIds = ["trait-human-far-walker", "trait-human-shared-table"];
  const withAdaptable = hero(broad);
  assert.deepEqual(withAdaptable.errors, []);
  assert.equal(withAdaptable.development.total, 16 + 9);
  assert.deepEqual(
    withAdaptable.advancementLedger.filter(entry => entry.kind === "award"),
    [{ kind: "award", level: 2, delta: 9 }],
  );
});

test("worn armor gives resistance while training removes its Agility penalty", () => {
  const draft = example("borin-bridgekeeper");
  draft.purchases[1] = purchases("armor:harness:1", "armor:harness:2");
  const suits = ["medium", "heavy"].map((armor) => ({
    id: `item-ordinary-${armor}-armor`, instanceId: `inventory-${armor}`, quantity: 1,
  }));
  draft.play = { inventory: { added: suits, removed: [] } };
  draft.loadout["inventory-medium"] = { worn: true, carried: true };
  draft.loadout["inventory-heavy"] = { worn: true, carried: true };
  assert.equal(hero(draft).resistances.physical, 3);
  assert.equal(hero(draft).attributes.agility, draft.attributes.agility - 3);
  draft.loadout["inventory-heavy"].worn = false;
  assert.equal(hero(draft).resistances.physical, 2);
  assert.equal(hero(draft).attributes.agility, draft.attributes.agility - 2);
  draft.purchases[1].push(...purchases("armor:harness:3"));
  assert.equal(hero(draft).resistances.physical, 2);
  assert.equal(hero(draft).attributes.agility, draft.attributes.agility);
  draft.loadout["inventory-heavy"].worn = true;
  assert.equal(hero(draft).resistances.physical, 3);
  assert.equal(hero(draft).attributes.agility, draft.attributes.agility - 3);
  const training = forgeEligibility(forge, hero(draft).state, "armor:harness:4");
  assert.deepEqual(training.reasons, ["Available at level 3."]);
  draft.progression = { level: 3, levels: {
    3: { purchases: purchases("armor:harness:4"), signatures: {
      3: forge.classes.find(({ id }) => id === draft.classId).signatures[3][0],
    } },
  } };
  assert.deepEqual(hero(draft).errors, []);
  assert.equal(hero(draft).resistances.physical, 3);
  assert.equal(hero(draft).attributes.agility, draft.attributes.agility);
  draft.loadout["inventory-heavy"].worn = false;
  assert.equal(hero(draft).resistances.physical, 2);
});

test("a mixed martial and magical build reaches its own level-seven masteries without intersections", () => {
  const draft = example("vaelis-emberglass");
  draft.purchases[1] = [];
  draft.progression = { level: 7, levels: {} };
  let state = hero(draft).state;
  assert.equal(state.dp, 76);
  const { nodes } = forgeIndex(forge);
  const learnPath = key => {
    if (state.learned.includes(key)) return;
    for (const parent of nodes.get(key).requires) learnPath(parent);
    const outcome = learnForgeEntry(forge, state, key);
    assert.ok(outcome.eligible, outcome.reasons.join(" "));
    state = outcome.state;
  };
  learnPath("arms:bladework:6");
  assert.equal(forgeEligibility(forge, {...state,level:6}, "arms:bladework:7").eligible,false);
  learnPath("arms:bladework:7");
  learnPath("air:5");
  const mastery = "air:6";
  assert.deepEqual(nodes.get(mastery).requires,["air:5"]);
  assert.equal(forgeEligibility(forge,{...state,level:6},mastery).eligible,false);
  assert.equal(forgeEligibility(forge,{...state,learned:state.learned.filter(id=>id!=="air:5")},mastery).eligible,false);
  learnPath(mastery);
  assert.equal(state.dp,31); // 76 - Arms entry3 - martial path21 - spellbook21.
  assert.ok(!forge.nodes.some(node=>node.kind==="combined"));
});

test("older portable characters retain identity and resources while changed paths refund for rebuilding", () => {
  const draft = structuredClone(original[0].draft);
  draft.play = { hp: 7, sp: 2, scars: ["Eye scar"] };
  const saved = readPortableCharacter({ format: PORTABLE_FORMAT, schemaVersion: 5, draft }, catalogs);
  assert.equal(saved.draft.name, draft.name);
  assert.deepEqual(saved.draft.classDisciplines, ["guard"]);
  assert.deepEqual(saved.draft.purchases[0], []);
  assert.ok(!saved.draft.purchases[1].some(({ id }) => id === "armor:harness:1"));
  assert.ok(saved.draft.learningReview.includes("armor:harness:1"));
  assert.equal(saved.preview.development.current, saved.preview.development.total);
  assert.deepEqual(saved.draft.play.scars, ["Eye scar"]);
  assert.equal(saved.draft.play.hp, 7);
  assert.equal(saved.draft.play.sp, 2);
  assert.equal(saved.preview.limits.maxHp, 20);
  const persisted = JSON.parse(writePortableCharacter(saved.draft, catalogs));
  assert.equal(persisted.schemaVersion, 7);
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
  draft.purchases[1] = purchases("arms", "armor", "guard", "wilderness", "fencing");
  const overBudget = hero(draft);
  assert.ok(overBudget.errors.some(error => error.code === "purchase"));
  assert.equal(draft.purchases[1].length, 5, "unaffordable stored choices remain repairable");
});

test("schema-7 imports return DP for retired Small Talents and keep active purchases", () => {
  const first = "ability-another-tongue";
  const later = "ability-quick-exit";
  assert(!forge.nodes.some(({ kind }) => kind === "talent"));
  assert(!forge.basicActions.some(({ id }) => [first, later].includes(id)));
  const legacy = structuredClone(forge);
  for (const id of [first, later]) legacy.nodes.push({ id, kind: "talent", level: 1, dp: 1, requires: [] });
  const legacyCatalogs = workshopCatalogs(data("choices"), data("inventory"), data("wounds"), legacy, references);

  const draft = example("borin-bridgekeeper");
  draft.purchases[1] = purchases("guard:shelter:1", first);
  draft.acquisitions = { [first]: { languageId: "goblin" } };
  draft.progression = { level: 2, levels: { 2: { purchases: purchases("guard:watchfulness:1", later) } } };
  draft.play = { hp: 9, sp: 1, favorites: { abilities: [later, "ability-basic-melee"], items: [] } };
  const old = { format: PORTABLE_FORMAT, schemaVersion: 7, draft };
  const prior = readPortableCharacter(old, legacyCatalogs);
  assert(prior.preview.valid, JSON.stringify(prior.preview.errors));
  const migrated = readPortableCharacter(old, catalogs);
  assert(migrated.preview.valid, JSON.stringify(migrated.preview.errors));
  assert.equal(migrated.preview.development.current, prior.preview.development.current + 2);
  assert.deepEqual(migrated.draft.purchases[1], purchases("guard:shelter:1"));
  assert.deepEqual(migrated.draft.progression.levels[2].purchases, purchases("guard:watchfulness:1"));
  assert.deepEqual(migrated.draft.acquisitions, {});
  assert.deepEqual(migrated.draft.play.favorites.abilities, ["ability-basic-melee"]);
  assert.deepEqual([migrated.draft.play.hp, migrated.draft.play.sp], [9, 1]);
  const reloaded = readPortableCharacter(writePortableCharacter(migrated.draft, catalogs), catalogs);
  assert.deepEqual(reloaded.draft, migrated.draft);
  assert.equal(reloaded.preview.development.current, migrated.preview.development.current);
});
