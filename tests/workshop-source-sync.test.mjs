import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const lock = read("content/forge-source-lock.json");
const graph = read("static/data/forge.json");

test("Workshop generated catalogs share the immutable Forge source pin", () => {
  for (const name of ["forge", "forge-journals", "forge-references", "forge-party", "forge-creatures"])
    assert.equal(read(`static/data/${name}.json`).sourceCommit, lock.commit, name);
  const journals = read("static/data/forge-journals.json").records;
  assert.equal(journals.find(record => record.id === "rule-objectives").source.path, "design/rules/objectives.md");
  for (const record of journals)
    assert.equal(createHash("sha256").update(record.markdown).digest("hex"), record.source.sha256, record.source.path);
});

test("Workshop preserves current spell actions and complete effects", () => {
  const spell = name => graph.spells.find(record => record.name === name);
  assert.match(spell("Goodberry").effect, /1 HP/);
  assert.equal(spell("Plant Growth").action, "Main Action");
  assert.match(spell("Plant Growth").effect, /difficult terrain/);
  assert.equal(spell("Shapechange").action, "Main Action");
  assert.match(spell("Shapechange").effect, /Main Action to bite or claw one adjacent creature/);
});
