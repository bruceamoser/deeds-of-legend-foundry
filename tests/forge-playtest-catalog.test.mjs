import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { forgeEligibility, learnForgeEntry } from "../src/rules/forge.mjs";
import {
  applyForgePlaytest,
  applyForgePlaytestJournals,
} from "../src/rules/forge-playtest-catalog.mjs";

const data = (name) =>
  JSON.parse(
    readFileSync(new URL(`../static/data/forge${name}.json`, import.meta.url)),
  );
const source = data("");
const originalRefs = data("-references");
const { forge, references } = applyForgePlaytest(source, originalRefs);

test("every sample identity can take three distinct starting disciplines", () => {
  assert.equal(forge.playtest, true);
  assert.ok(
    forge.origins.every(
      ({ pairs }) =>
        new Set(pairs.map(({ disciplineId }) => disciplineId)).size === 2,
    ),
  );
  assert.ok(
    forge.classes.every(
      ({ disciplineIds, spAttribute }) =>
        new Set(disciplineIds).size === 4 &&
        ["guile", "knowledge", "reason"].includes(spAttribute),
    ),
  );
  for (const { id, draft } of data("-party").party) {
    const available = (origin) =>
      forge.origins.find((item) => item.id === origin.id).pairs;
    const cls = forge.classes.find((entry) => entry.id === draft.classId);
    assert.ok(
      available(draft.culture).some(({ disciplineId: culture }) =>
        available(draft.background).some(
          ({ disciplineId: background }) =>
            culture !== background &&
            cls.disciplineIds.some(
              (choice) => choice !== culture && choice !== background,
            ),
        ),
      ),
      id,
    );
  }
});

test("the playtest gates preserve ordered links and require deeper armor training", () => {
  const state = (level, learned) => ({ level, learned, dp: 12 });
  const get = (id) => forge.nodes.find((entry) => entry.id === id);
  assert.equal(forge.rulesRevision, 299);
  assert.equal(forge.nodes.filter(node => node.kind === "combined").length, 0);
  for (const discipline of forge.disciplines) {
    for (const path of discipline.paths) {
      assert.equal(path.steps.length, path.bookId ? 4 : 7, path.id);
      path.steps.forEach((id, index) => {
        const node = get(id);
        assert.equal(node.level, index < 3 ? 1 : index < 6 ? 3 : 7, `${id} level gate`);
        assert.equal(forgeEligibility(forge, state(1, node.requires), id).eligible, index < 3, `${id} at level 1`);
      });
    }
  }
  for (const node of forge.nodes.filter(node => node.kind === "spell-mastery" || node.kind === "mastery")) {
    assert.equal(node.level, 7, node.id);
    assert.equal(node.requires.length, 1, node.id);
    assert.equal(forgeEligibility(forge, state(6,node.requires), node.id).eligible, false, node.id);
    assert.equal(forgeEligibility(forge, state(7,node.requires), node.id).eligible, true, node.id);
  }

  assert.deepEqual(get("armor:harness:3").requires, ["armor:harness:2"]);
  assert.equal(
    forgeEligibility(
      forge,
      state(2, [
        "armor",
        "armor:harness:1",
        "armor:harness:2",
        "armor:harness:3",
      ]),
      "armor:harness:4",
    ).eligible,
    false,
  );
  assert.deepEqual(get("arms:bladework:7").requires, ["arms:bladework:6"]);
  assert.match(get("armor:harness:3").effect, /medium armor/);
  assert.match(get("armor:harness:4").effect, /heavy armor/);
  assert.deepEqual(
    ["light", "medium", "heavy"].map(
      (weight) =>
        references.equipment.find(
          ({ id }) => id === `item-ordinary-${weight}-armor`,
        ).physicalResistance,
    ),
    [1, 2, 3],
  );
  assert.equal(
    originalRefs.equipment.find(({ id }) => id === "item-ordinary-light-armor")
      .physicalResistance,
    1,
  );
  assert.equal(source.nodes.find(({ id }) => id === "flame:2").level, 1);
  assert.deepEqual(source, data(""), "overlay does not mutate canonical source");
});

test("Sustain Spell is a universal Maneuver and its current journal uses zero SP", () => {
  const action = forge.basicActions.find(
    ({ id }) => id === "ability-sustain-spell",
  );
  assert.equal(action.action, "Maneuver");
  assert.match(action.effect, /Spend 0 SP/);
  assert.equal(action.dp, null);
  const journals = applyForgePlaytestJournals(data("-journals"));
  const magic = journals.records.find(({ id }) => id === "rule-magic").markdown;
  assert.match(magic, /(?:Sustain costs|Spend|costs?) (?:\*\*)?0 SP/i);
  assert.doesNotMatch(magic, /spend a Maneuver and 1 SP/);
});

test("approved Goblin ancestry contributes one starting SP", () => {
  assert.equal(forge.ancestries.find(entry => entry.id === "ancestry-goblin").spContribution, 1);
});


test("all class/discipline pairs have explicit entry prices, charged once by shared eligibility", () => {
  for (const cls of forge.classes) {
    assert.equal(Object.keys(cls.disciplineCosts).length, forge.disciplines.length);
    for (const discipline of forge.disciplines) {
      const cost = cls.disciplineCosts[discipline.id];
      assert.ok([1, 2, 3].includes(cost), `${cls.name}: ${discipline.name}`);
      const state = { classId: cls.id, level: 1, dp: cost, learned: [] };
      assert.equal(forgeEligibility(forge, state, discipline.id).cost, cost);
      assert.equal(forgeEligibility(forge, { ...state, dp: cost - 1 }, discipline.id).eligible, false);
      const bought = learnForgeEntry(forge, state, discipline.id);
      assert.equal(bought.state.dp, 0);
      assert.equal(learnForgeEntry(forge, bought.state, discipline.id).eligible, false);
      for (const path of discipline.paths) {
        assert.deepEqual(path.steps.map(id => forgeEligibility(forge, state, id).cost), path.bookId ? [1, 2, 2, 3] : [1, 2, 2, 3, 4, 4, 5]);
      }
    }
    assert.doesNotMatch(cls.referenceMarkdown, /costs 1 DP for every class/);
  }
  const price = (classId, id) => forgeEligibility(forge, { classId, level: 1, dp: 10, learned: [] }, id).cost;
  assert.equal(price("class-arcanist", "elements"), 1);
  assert.equal(price("class-protector", "elements"), 3);
  assert.equal(price("class-protector", "wards"), 2);
  assert.ok(Object.values(forge.classes.find(c => c.id === "class-odd").disciplineCosts).every(n => n === 2));
  assert.equal(forgeEligibility(forge, { level: 1, dp: 10, learned: [] }, "elements").eligible, false);
});

test("current learning journal uses class prices and no level-two gates", () => {
  const journals = applyForgePlaytestJournals(data("-journals"));
  for (const id of ["rule-development", "rule-learning"]) {
    const text = journals.records.find(r => r.id === id).markdown;
    assert.match(text, /1, 2 or 3 DP (?:listed by|printed for) your class/);
    assert.doesNotMatch(text, /level-2 third|Spend 1 DP to begin|discipline for 1 DP/);
  }
});
