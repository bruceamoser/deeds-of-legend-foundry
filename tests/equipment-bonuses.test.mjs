import test from "node:test";
import assert from "node:assert/strict";
import { equipmentBonuses, resourceClamp } from "../src/rules/equipment-bonuses.mjs";
import { damageEvent } from "../src/rules/damage.mjs";

const gear = (name, bonuses, arrangement = { worn: true }) => ({
  name, type: "equipment", system: { quantity: 1, carried: true, bonuses, ...arrangement },
});

test("equipped gear applies only the strongest stat bonus and matching resistance", () => {
  const result = equipmentBonuses([
    gear("Belt", { hp: 4, sp: 1, fire: 1, cold: 2 }),
    gear("Wand", { hp: 2, sp: 3, speed: 2, fire: 2 }, { held: true }),
    gear("Packed ring", { hp: 10, cold: 3 }, {}),
    gear("Stored ring", { hp: 10 }, { worn: true, carried: false }),
    gear("Missing ring", { hp: 10 }, { worn: true, quantity: 0 }),
  ]);
  assert.deepEqual([result.hp, result.sp, result.speed], [4, 3, 2]);
  const event = damageEvent({
    components: [{ type: "fire", amount: 5 }, { type: "cold", amount: 5 }],
    resistances: result.resistances,
  });
  assert.equal(event.total, 6);
});

test("lowering maximums clamps resources and raising them leaves current values alone", () => {
  const lowered = resourceClamp({ hp: 16, sp: 7 }, { maxHp: 12, maxSp: 5 });
  assert.deepEqual(lowered, { "system.health.value": 12, "system.sp.value": 5 });
  assert.deepEqual(
    resourceClamp({ hp: lowered["system.health.value"], sp: lowered["system.sp.value"] }, { maxHp: 16, maxSp: 7 }),
    {},
  );
});

test("character preparation derives boosted maxima without filling current resources", async () => {
  const before = globalThis.foundry;
  try {
    globalThis.foundry = { data: { fields: { NumberField: class {} } }, abstract: { TypeDataModel: class {} } };
    const { CharacterData } = await import("../src/models/character.mjs");
    const mantle = gear("Mantle", { hp: 4, sp: 2 });
    const equipment = [mantle];
    const model = Object.assign(new CharacterData(), {
      parent: { items: equipment },
      _source: { sp: { max: 5 } },
      health: { value: 8, baseMax: 12 },
      sp: { value: 3, max: 5 },
      grit: { granted: 1, spent: 0 },
      attributes: Object.fromEntries(["brawn", "fortitude", "agility", "guile", "knowledge", "reason"].map(key => [key, { base: 0 }])),
    });
    model.prepareDerivedData();
    model.prepareDerivedData();
    assert.deepEqual([model.health.value, model.health.max, model.sp.value, model.sp.max], [8, 16, 3, 7]);
    assert.equal(model._source.sp.max, 5);
    Object.assign(model.health, { value: 16 });
    Object.assign(model.sp, { value: 7 });
    mantle.system.worn = false;
    model.prepareDerivedData();
    assert.deepEqual([model.health.value, model.health.max, model.sp.value, model.sp.max], [12, 12, 5, 5]);
    mantle.system.worn = true;
    model.prepareDerivedData();
    assert.deepEqual([model.health.value, model.health.max, model.sp.value, model.sp.max], [12, 16, 5, 7]);
  } finally {
    globalThis.foundry = before;
  }
});
