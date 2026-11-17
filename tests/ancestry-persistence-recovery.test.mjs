import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { currentCreationDraft, readPortableCharacter, writePortableCharacter } from "../src/rules/portable-character.mjs";
import { workshopCharacter } from "../src/rules/workshop-character.mjs";
import { normalizeWorkshopPlay } from "../src/rules/workshop-play.mjs";

const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url)));
const [choices, inventory, heroes] = await Promise.all([
  read("../static/data/choices.json"), read("../static/data/inventory.json"), read("./fixtures/reference-heroes.json"),
]);
const catalogs = { choices: choices.records, inventory, commit: choices.sourceCommit };
const debtTrait = "trait-oath-bound-the-debt-comes-due";

test("current ancestry aliases normalize narrowly, preserve published IDs, and never edit live play state", () => {
  for (const [ancestryId, expected] of [
    ["ancestry-elf", "ancestry-elf"], ["ancestry-dwarf", "ancestry-dwarf"],
    ["ancestry-wood-elf", "ancestry-elf"], ["ancestry-hill-dwarf", "ancestry-dwarf"],
  ]) {
    const input = { ...structuredClone(heroes.characters[0].draft), ancestryId,
      traitIds: ["trait-elf-fleet"],
      play: { hp: 3, gritSpent: 1, memorizedMessage: "Keep this note.",
        wounds: [{ id: "wound-kept", name: "Old scar", notes: "Retain the remedy." }],
        inventory: { added: [], removed: ["creation-outfit"] } },
      profile: { story: "Keep this history." },
    };
    const before = structuredClone(input);
    const normalized = currentCreationDraft(input, "previous-source");
    assert.equal(normalized.ancestryId, expected);
    assert.deepEqual(normalized.traitIds, before.traitIds);
    assert.deepEqual(normalized.play, before.play);
    assert.deepEqual(input, before);
    assert.deepEqual(currentCreationDraft(normalized), normalized);
    for (const schemaVersion of [1, 2, 3]) {
      const file = {format: "heroes-of-legend-character", schemaVersion, sourceCommit: "old", draft: input};
      const restored = readPortableCharacter(file, catalogs).draft;
      assert.equal(restored.ancestryId, expected);
      assert.deepEqual(restored.traitIds, before.traitIds);
      assert.equal(restored.play.hp, 3);
      assert.equal(restored.play.gritSpent, 1);
      assert.equal(restored.play.memorizedMessage, before.play.memorizedMessage);
      assert.deepEqual(restored.play.wounds, before.play.wounds);
      assert.deepEqual(restored.play.inventory.removed, before.play.inventory.removed);
      assert.deepEqual(restored.profile, before.profile);
    }
  }
});
