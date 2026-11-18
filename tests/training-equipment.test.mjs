import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { newCreationDraft } from "../src/rules/creation.mjs";
import { addTrainingEquipment, provisionSalePrice } from "../src/rules/training-equipment.mjs";
import { basicAttackDamageProfile } from "../src/rules/weapon-training.mjs";
import { rangedAmmunition, setRangedWeaponAmmunition } from "../src/services/ranged-ammunition.mjs";

const catalog = JSON.parse(readFileSync(new URL("../static/data/inventory.json", import.meta.url)));
const definition = id => catalog.equipment.find(record => record.id === id);
const melee = "item-ordinary-melee-weapon", ranged = "item-ordinary-ranged-weapon",
  arrows = "item-ammunition-bundle";

test("paid provisions include four distinct defaults and have a reusable resale value", () => {
  const draft = newCreationDraft({ paidProvisions: true });
  assert.deepEqual(draft.shopping.map(item => item.id), ["item-food-bundle", "item-water-flask", "item-lighting-bundle", "item-lesser-healing-bottle"]);
  assert.equal(draft.shopping.reduce((sum, item) => sum + definition(item.id).price, 0), 37);
  const water = draft.shopping[1];
  const item = { ...water, catalogId: water.id, definition: definition(water.id) };
  assert.equal(provisionSalePrice(item), 1);
  assert.equal(provisionSalePrice({ ...item, waterUnits: 0 }), 0);
});

test("learning supplies missing gear once and roots and unarmed training require none", () => {
  assert.deepEqual(addTrainingEquipment([], { learned: ["arms", "arms:unarmed:1", "armor"] }, catalog, {}), []);
  const state = { learned: ["arms:bladework:1", "marksmanship:readiness:1", "marksmanship:precision:1", "armor:harness:1"] };
  const purchased = { catalogId: melee, quantity: 1, hands: 2, instanceId: "shop-sword" };
  const gear = addTrainingEquipment([purchased], state, catalog, {});
  assert.deepEqual(gear.map(item => item.catalogId), [melee, ranged, arrows, "item-ordinary-light-armor"]);
  assert.deepEqual(addTrainingEquipment(gear, state, catalog, {}), gear);
  const fencing = addTrainingEquipment([purchased], { learned: ["fencing:pointwork:1"] }, catalog, {});
  assert.equal(fencing[1].hands, 1);
  assert.equal(fencing[1].source, "training");
  assert.equal(addTrainingEquipment([], { learned: ["arms:bladework:1"] }, catalog, {
    play: {inventory: {removed: ["inventory-learned-ordinary-melee-weapon"]}},
  }).length, 0);
});

test("only learned weapon-family techniques improve the corresponding Basic attack", () => {
  for (const key of ["melee", "ranged", "throw", "unarmed"]) {
    assert.deepEqual(basicAttackDamageProfile(["arms", "marksmanship", "armor"], `ability-basic-${key}`), [1, 1, 2]);
  }
  assert.deepEqual(basicAttackDamageProfile(["arms:unarmed:1"], "ability-basic-unarmed"), [1, 2, 4]);
  assert.deepEqual(basicAttackDamageProfile(["fencing:pointwork:1"], "ability-basic-melee"), [2, 3, 5]);
  assert.deepEqual(basicAttackDamageProfile(["marksmanship:thrown-weapons:1"], "ability-basic-throw"), [2, 3, 5]);
  assert.deepEqual(basicAttackDamageProfile(["marksmanship:readiness:1"], "ability-basic-ranged"), [2, 3, 5]);
  assert.deepEqual(basicAttackDamageProfile(["arms:dueling:1"], "ability-basic-melee"), [1, 1, 2]);
});

test("two owned ranged weapons can select different owned supply stacks", async () => {
  globalThis.game = { user: {}, settings: { get: () => true } };
  const gear = (id, catalogId, inventoryDie = 0) => {
    const flags = { grantKind: "nativeWorkshop", acquisitionInstance: `instance:${id}` };
    return {
      id, type: "equipment", name: id, system: { catalogId, inventoryDie, quantity: 1, carried: true },
      getFlag: (_scope, key) => flags[key],
      update: async changes => {
        for (const [key, value] of Object.entries(changes)) flags[key.split(".").at(-1)] = value;
      },
    };
  };
  const bow = gear("bow", ranged), crossbow = gear("crossbow", ranged);
  const first = gear("first", arrows, 6), second = gear("second", arrows, 4);
  const items = [bow, crossbow, first, second];
  items.get = id => items.find(item => item.id === id);
  const actor = { items, testUserPermission: () => true };
  await setRangedWeaponAmmunition(actor, "instance:bow", "instance:first");
  await setRangedWeaponAmmunition(actor, "instance:crossbow", "instance:second");
  assert.equal(rangedAmmunition(actor, "bow").ammo, first);
  assert.equal(rangedAmmunition(actor, "crossbow").ammo, second);
  first.system.carried = false;
  assert.throws(() => rangedAmmunition(actor, "bow"), /carried bundle/);
  await setRangedWeaponAmmunition(actor, "instance:crossbow", "");
  assert.throws(() => rangedAmmunition(actor, "crossbow"), /Assign ammunition/);
});
