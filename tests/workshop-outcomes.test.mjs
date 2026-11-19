import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { workshopRollOutcome } from "../src/rules/workshop-outcomes.mjs";

const { nodes, spells, signatureDevelopment } = JSON.parse(readFileSync(new URL("../static/data/forge.json", import.meta.url)));
const node = id => nodes.find(record => record.id === id);
const spell = id => spells.find(record => record.id === id);
const signature = id => {
  const record = signatureDevelopment.signatures.find(entry => entry.id === id);
  return { ...record, effect: record.rulesMarkdown };
};

test("Wild Harvest uses the same rolled steps for the chat report and replenishment", () => {
  const harvest = node("wilderness:provisioning:1");
  assert.deepEqual(workshopRollOutcome(harvest, [], "standard"), {
    text: ["2 supply die steps"], supplySteps: 2,
  });
  const trained = [node("wilderness:provisioning:2"), node("wilderness:provisioning:3")];
  assert.deepEqual(workshopRollOutcome(harvest, trained, "weak"), {
    text: ["2 supply die steps"], supplySteps: 2,
  });
  assert.deepEqual(workshopRollOutcome(harvest, trained, "strong"), {
    text: ["4 supply die steps"], supplySteps: 4,
  });
});

test("progress follows learned quantities while other numeric effects retain their own value", () => {
  const hand = node("subterfuge:locks:1"), improvement = node("subterfuge:locks:2");
  assert.deepEqual(workshopRollOutcome(hand, [], "standard").text, ["2 progress"]);
  assert.deepEqual(workshopRollOutcome(hand, [improvement], "standard").text, ["3 progress"]);
  assert.deepEqual(workshopRollOutcome({effect:"Restore 2/4/6 HP and move up to 1/2/3 squares."}, [], "weak").text,
    ["2 HP", "up to 1 square"]);
  assert.deepEqual(workshopRollOutcome({effect:"The project requires 3 steps."}, [], "standard").text, []);
});

test("utility spell quantities preserve the printed object, cap, and conditions", () => {
  const resolve = (id, tier) => workshopRollOutcome(spell(id), [], tier).text.join(" ");
  assert.match(resolve("spell:thought:3", "standard"), /Learn 2 immediate concerns or sensory impressions/);
  assert.match(resolve("spell:binding:8", "strong"), /Apply Slowed 4 and Paralyzed 2/);
  assert.match(resolve("spell:restoration:7", "standard"), /Choose one temporary condition; reduce it by 4/);
  assert.match(resolve("spell:decay:8", "weak"), /Inflict Poisoned 1\*/);
  assert.match(resolve("spell:channeling:4", "strong"), /Transfer 3 of the target's current SP.*limited by its available SP/);
  assert.match(resolve("spell:channeling:8", "standard"), /If either is unwilling, transfer 5 instead/);
  assert.match(resolve("spell:channeling:a3", "weak"), /roll for 2 if either is unwilling/);
  assert.equal(resolve("spell:binding:a2", "weak"), "10 HP");
  assert.equal(resolve("spell:binding:a2", "strong"), "20 HP");
});

test("tier-labeled utility checks respect result and target alternatives", () => {
  const novice = signature("ability-signature-shadow-turn-their-eye");
  const healer = signature("ability-signature-shepherd-careful-transfer");
  assert.deepEqual(workshopRollOutcome(novice, [], "strong").text, ["5 progress"]);
  assert.deepEqual(workshopRollOutcome(healer, [], "standard").text,
    ["One ally: restore 11 HP", "Two allies: restore 7 HP each"]);
  assert.match(workshopRollOutcome(node("tactics:coordination:4"), [], "strong").text.join(" "), /chosen ally gains 1 Boon/);
  assert.deepEqual(workshopRollOutcome(node("tactics:coordination:4"), [], "weak").text, []);
});
