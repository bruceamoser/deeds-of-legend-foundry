import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { forgeEligibility, forgeLearning, learnForgeEntry } from "../src/rules/forge.mjs";
import { workshopCatalogs } from "../src/rules/workshop-forge-catalog.mjs";
import { workshopCharacter } from "../src/rules/workshop-character.mjs";
import { readPortableCharacter, writePortableCharacter } from "../src/rules/portable-character.mjs";

const read = (name) => JSON.parse(readFileSync(new URL(`../static/data/${name}.json`, import.meta.url)));
const graph = read("forge");
const catalogs = workshopCatalogs(...["choices", "inventory", "wounds", "forge", "forge-references"].map(read));
const { party } = read("forge-party");

test("each level-seven mastery requires only its own path or spellbook endpoint", () => {
  assert.equal(graph.nodes.some(node => node.kind === "combined"), false);
  const masteries = graph.nodes.filter(({ kind, level }) => ["mastery", "section", "training"].includes(kind) && level === 7);
  assert.equal(masteries.length, 84);
  for (const node of masteries) {
    const state = { level: 7, dp: node.dp, learned: node.requires };
    assert.equal(node.requires.length, 1, node.name);
    assert.equal(node.dp, 5, node.name);
    assert(forgeEligibility(graph, state, node.id).eligible, node.name);
    for (const omitted of node.requires)
      assert(!forgeEligibility(graph, { ...state, learned: state.learned.filter((id) => id !== omitted) }, node.id).eligible, omitted);
    assert(!forgeEligibility(graph, { ...state, level: 6 }, node.id).eligible);
    assert(!forgeEligibility(graph, { ...state, dp: node.dp - 1 }, node.id).eligible);
    const result = learnForgeEntry(graph, state, node.id);
    assert.equal(result.state.dp, 0);
    assert(!learnForgeEntry(graph, result.state, node.id).eligible);
    assert(!state.learned.includes(node.id));
  }
});

test("Fencing and Tactics retain their imported starting choices, class prices and weapon requirements", () => {
  const expected = [
    { id: "fencing", classId: "class-blade", origin: "origin-background-salle-student", other: "athletics", cost: "one-handed-melee", roll: "Agility", attack: "fencing:pointwork:1" },
    { id: "tactics", classId: "class-leader", origin: "origin-background-company-runner", other: "guard", cost: "melee", roll: "Knowledge", attack: "tactics:openings:1" },
  ];
  for (const { id, classId, origin, other, cost, roll, attack } of expected) {
    const discipline = graph.disciplines.find(d => d.id === id);
    assert.equal(discipline.paths.length, 4);
    assert.deepEqual(graph.origins.find(entry => entry.id === origin).pairs.map(pair => pair.disciplineId), [id, other]);
    assert.equal(forgeEligibility(graph, { classId, level: 1, dp: 1, learned: [] }, id).cost, 1);
    assert.equal(forgeEligibility(graph, { classId: "class-arcanist", level: 1, dp: 1, learned: [] }, id).eligible, false);
    const item = catalogs.choices.find(choice => choice.id === attack);
    assert.equal(item.weaponRequirement, cost);
    assert.equal(item.reference.rules.details.find(field => field.label === "Attribute").value, roll);
  }
  const flexNodes = graph.nodes.filter(node => node.attributeChoices);
  assert.deepEqual(flexNodes.map(node => node.id), [
    "arms:bladework:1", "arms:dueling:4", "arms:dueling:7", "arms:unarmed:1", "arms:unarmed:4", "arms:unarmed:7",
  ]);
  for (const node of flexNodes) assert.deepEqual(node.attributeChoices, ["brawn", "agility"]);
  for (const id of ["arms:bladework:4", "arms:bladework:7"]) {
    const item = catalogs.choices.find(choice => choice.id === id);
    assert.equal(item.reference.rules.details.find(field => field.label === "Attribute").value, "Brawn");
    assert.equal(item.attributeChoices, undefined);
  }
  assert.equal(graph.nodes.find(node => node.id === "tactics:coordination:1").weaponRequirement, undefined);
});

test("Direct Thrust trades damage for a step on Standard or Strong", () => {
  const effect = id => graph.nodes.find(node => node.id === id).effect;
  assert.match(effect("fencing:pointwork:1"), /1\/2\/4 physical damage\. On Standard or Strong, you may move 1 square after the attack\./);
  assert.match(effect("fencing:pointwork:3"), /The movement from Direct Thrust avoids movement reactions\./);
  assert.match(effect("arms:bladework:1"), /2\/3\/5 physical damage\. On Strong, you may move 1 square after the attack\./);
});

test("Forge keeps technique improvements on the same attack and teaches one spell per advanced purchase", () => {
  let state = { classId: "class-arcanist", level: 1, dp: 40, learned: [] };
  const learn = (id) => {
    const result = learnForgeEntry(graph, state, id);
    assert(result.eligible, result.reasons.join(" "));
    state = result.state;
  };
  assert(!forgeEligibility(graph, state, "air:0").eligible);
  for (const id of ["elements", "air:0", "air:1", "air:2", "arms", "arms:impact:1", "arms:impact:2", "arms:impact:3"]) learn(id);
  assert(!forgeEligibility(graph, state, "air:3").eligible);
  state.level = 3;
  learn("air:3");
  const learning = forgeLearning(graph, state.learned);
  assert.deepEqual(learning.spells.map(({ page }) => page), ["1", "2", "3", "4", "5", "6", "7", "8"]);
  learn("air:4");
  assert.equal(forgeLearning(graph,state.learned).spells.length,9);
  learn("air:5");
  assert.equal(forgeLearning(graph,state.learned).spells.length,10);
  assert(!forgeEligibility(graph,state,"air:6").eligible);
  state.level=7;learn("air:6");
  assert.equal(forgeLearning(graph,state.learned).spells.length,11);
  assert.equal(learning.spells[0].sp, 0);
  assert.deepEqual(learning.improvements.get("arms:impact:1").map(({ id }) => id), ["arms:impact:2", "arms:impact:3"]);
  assert.deepEqual(learning.abilities.map(({ id }) => id), ["arms:impact:1"]);
});

test("canonical example heroes match current book numbers and survive a portable round trip", () => {
  const printed = [
    [20, 4, 8, 8], [15, 3, 0, 7], [15, 7, 5, 7],
    [13, 7, 9, 8], [13, 7, 7, 7], [13, 13, 15, 7],
  ];
  for (const [{ draft, id }, expected] of party.map((entry, index) => [entry, printed[index]])) {
    const preview = workshopCharacter(draft, catalogs);
    assert(preview.valid, `${id}: ${JSON.stringify(preview.errors)}`);
    assert.deepEqual([
      preview.limits.maxHp, preview.limits.maxSp, preview.inventory.remainingCoins, preview.inventory.bulk,
    ], expected, id);
    assert.equal(preview.limits.gritGranted, 1);
    const loaded = readPortableCharacter(writePortableCharacter(draft, catalogs, { ready: true }), catalogs);
    assert.deepEqual(loaded.preview.state.learned, preview.state.learned);
    assert.deepEqual(loaded.preview.state.recipes, preview.state.recipes);
    assert.deepEqual(loaded.preview.ledger, preview.ledger);
  }
});

test("levels 3 and 7 grant one signature each and do not duplicate DP, Grit, or learning", () => {
  const draft = structuredClone(party[0].draft);
  const cls = graph.classes.find((record) => record.id === draft.classId);
  const withoutGrant = (tier) => cls.signatures[tier].find((id) => !/grants one/.test(graph.signatures.find((s) => s.id === id).equipment));
  draft.progression = { level: 7, levels: {
    3: { purchases: [2,3,4,5].map(step => ({id: `arms:impact:${step}`})), signatures: { 3: withoutGrant(3) } },
    4: { purchases: [{id: "arms:impact:6"}] },
    7: { purchases: [{id: "arms:impact:7"}], signatures: { 7: withoutGrant(7) } },
  } };
  draft.play = { hp: 5, sp: 2, gritSpent: 1, scars: ["A thin line over the brow."] };
  const once = workshopCharacter(draft, catalogs);
  assert(once.valid, JSON.stringify(once.errors));
  assert.equal(once.development.current, 31);
  assert.equal(once.development.total, 8 + 6 + 7 + 8 + 9 + 10 + 11);
  assert.equal(once.limits.maxHp, 56);
  assert.equal(once.limits.maxSp, 16);
  assert.equal(once.limits.gritGranted, 3);
  assert.equal(once.advancementLedger.filter(entry => entry.kind === "signature-grant").length, 2);
  assert(once.state.learned.includes("arms:impact:7"));
  const twice = readPortableCharacter(writePortableCharacter(draft, catalogs, { ready: true }), catalogs);
  assert.deepEqual(twice.preview.advancementLedger, once.advancementLedger);
  assert.equal(twice.draft.play.sp, 2);
  assert.equal(twice.draft.play.gritSpent, 1);
});
