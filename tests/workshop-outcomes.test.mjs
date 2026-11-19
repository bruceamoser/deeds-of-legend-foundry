import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { workshopRollOutcome } from "../src/rules/workshop-outcomes.mjs";

const { nodes } = JSON.parse(readFileSync(new URL("../static/data/forge.json", import.meta.url)));
const node = id => nodes.find(record => record.id === id);

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
