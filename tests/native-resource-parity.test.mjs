import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { movementProfile } from "../src/rules/movement-budget.mjs";
import { handLayout } from "../src/rules/hands.mjs";
import { passiveDefenseSources } from "../src/rules/passive-defenses.mjs";
import { recoveryPreview } from "../src/services/recovery.mjs";
const inventory = JSON.parse(await readFile(new URL("../static/data/inventory.json", import.meta.url)));
const choices = JSON.parse(await readFile(new URL("../static/data/choices.json", import.meta.url)));
test("zero-quantity native stacks contribute no Bulk, hand occupancy or passive benefit", () => {
  const items = [{ id: "empty", catalogId: "item-travel-clothes", bulk: 2, quantity: 0, held: true, hands: 2, worn: true }];
  assert.equal(movementProfile({ speedBase: 6, agility: 0, brawn: 0, items }).bulk, 0);
  assert.equal(handLayout(items).occupied, 0);
  const equipment = inventory.equipment.find(record => record.id === "item-ordinary-light-armor");
  const ability = choices.records.find(record => record.id === "ability-wear-light-armor");
  assert.equal(passiveDefenseSources({ abilities: [{ instanceId: "training", catalogId: ability.id, source: ability.source }], equipment: [{ instanceId: "armor", catalogId: equipment.id, source: equipment.source, worn: true, quantity: 0 }] }).resistances.length, 0);
});
test("raw old native characters are invalid for recovery and preserve data", () => {
 const actor={type:"character",getFlag:()=>undefined};
 const basis={hp:0,maxHp:15,survival:{marks:2,wounds:4}};
 assert.throws(()=>recoveryPreview(actor,basis,{kind:"grit"}),/invalid for current play/);
 assert.deepEqual(basis.survival,{marks:2,wounds:4});
});
