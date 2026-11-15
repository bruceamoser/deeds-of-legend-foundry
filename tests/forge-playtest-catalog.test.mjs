import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { forgeEligibility } from "../src/rules/forge.mjs";
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
  assert.equal(
    forge.nodes.filter((entry) => entry.kind === "section" && entry.level === 2)
      .length,
    29,
  );
  assert.equal(
    forgeEligibility(
      forge,
      state(1, ["elements", "flame:0", "flame:1"]),
      "flame:2",
    ).eligible,
    false,
  );
  assert.equal(
    forgeEligibility(
      forge,
      state(2, ["elements", "flame:0", "flame:1"]),
      "flame:2",
    ).eligible,
    true,
  );
  assert.equal(
    forgeEligibility(
      forge,
      state(1, ["spellcraft", "spellcraft:soul-capacity:1"]),
      "spellcraft:soul-capacity:2",
    ).eligible,
    false,
  );
  assert.equal(
    forgeEligibility(
      forge,
      state(2, [
        "spellcraft",
        "spellcraft:soul-capacity:1",
        "spellcraft:soul-capacity:2",
      ]),
      "spellcraft:soul-capacity:3",
    ).eligible,
    false,
  );

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
  assert.deepEqual(get("combined:iron-tempest").requires, [
    "arms:bladework:4",
    "armor:harness:4",
  ]);
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
    undefined,
  );
  assert.equal(source.nodes.find(({ id }) => id === "flame:2").level, 0);
});

test("Sustain Spell is a universal Maneuver and its current journal uses zero SP", () => {
  const action = forge.basicActions.find(
    ({ id }) => id === "ability-sustain-spell",
  );
  assert.equal(action.action, "Maneuver");
  assert.equal(action.sp, 0);
  const journals = applyForgePlaytestJournals(data("-journals"));
  const magic = journals.records.find(({ id }) => id === "rule-magic").markdown;
  assert.match(magic, /Sustain costs 0 SP/);
  assert.doesNotMatch(magic, /spend a Maneuver and 1 SP/);
});

test("approved Goblin ancestry contributes one starting SP", () => {
  assert.equal(forge.ancestries.find(entry => entry.id === "ancestry-goblin").spContribution, 1);
});
