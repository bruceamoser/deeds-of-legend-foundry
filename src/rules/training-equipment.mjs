import { weaponTraining } from "./weapon-training.mjs";
import { workshopWeaponMatches } from "./workshop-ability.mjs";

const melee = "item-ordinary-melee-weapon";
const ranged = "item-ordinary-ranged-weapon";
const ammunition = "item-ammunition-bundle";
const shield = "item-ordinary-shield";
const lightArmor = "item-ordinary-light-armor";
const mediumArmor = "item-ordinary-medium-armor";
const heavyArmor = "item-ordinary-heavy-armor";
export const LEARNED_GEAR_PREFIX = "inventory-learned-";

export const STARTING_PROVISIONS = Object.freeze([
  "item-food-bundle", "item-water-flask", "item-lighting-bundle", "item-lesser-healing-bottle",
]);

export function startingProvisions() {
  return STARTING_PROVISIONS.map(id => ({ id, quantity: 1, instanceId: `shop-starter-${id.slice(5)}` }));
}

export function provisionSalePrice(item) {
  if (!item?.definition || !STARTING_PROVISIONS.includes(item.catalogId) ||
      item.instanceId !== `shop-starter-${item.catalogId.slice(5)}` ||
      item.quantity !== 1 || (item.inventoryDie ?? null) !== item.definition.inventoryDie ||
      (item.waterUnits ?? 1) !== 1) return 0;
  return Math.floor(item.definition.price / 2);
}

/** Supply the ordinary gear a learned technique needs. One item can serve several techniques. */
export function addTrainingEquipment(items, state, catalog, draft) {
  const learned = new Set([...(state.learned ?? []), ...(state.abilities ?? [])]);
  const families = weaponTraining([...learned]);
  const twoHands = learned.has("ability-signature-warden-follow-my-footsteps") ||
    learned.has("ability-signature-warden-through-bramble");
  const oneHand = twoHands || families.has("throw") ||
    [...learned].some(id => id.startsWith("fencing:") && id !== "fencing") ||
    learned.has("guard:shieldwork:7");
  const requirements = new Map();
  if (families.has("melee") || families.has("throw") || learned.has("ability-signature-shadow-exploit-confusion"))
    requirements.set(melee, twoHands ? 2 : 1);
  if (families.has("ranged")) {
    requirements.set(ranged, 1);
    requirements.set(ammunition, 1);
  }
  if ([...learned].some(id => id.startsWith("guard:shieldwork:")) ||
      learned.has("armor:advance:7") || learned.has("armor:harness:7")) requirements.set(shield, 1);
  if (learned.has("armor:harness:1")) requirements.set(lightArmor, 1);
  if (learned.has("armor:harness:3")) requirements.set(mediumArmor, 1);
  if (learned.has("armor:harness:4")) requirements.set(heavyArmor, 1);
  if (learned.has("ability-a-party-piece")) requirements.set("item-musical-instrument", 1);
  if ([...learned].some(id => id.startsWith("subterfuge:locks:"))) requirements.set("item-lock-tools", 1);
  if ([...learned].some(id => id.startsWith("craft:repairs:"))) requirements.set("item-craft-tools", 1);
  const removed = new Set(draft.play?.inventory?.removed ?? []);
  const available = [
    ...items,
    ...(draft.play?.inventory?.added ?? []).map(entry => ({
      ...entry, catalogId: entry.id,
      hands: catalog.equipment.find(record => record.id === entry.id)?.handChoices[0] ?? 0,
    })),
  ].filter(item => !removed.has(item.instanceId)).map(item => ({
    ...item, ...draft.play?.inventory?.overrides?.[item.instanceId],
  }));
  for (const [id, count] of requirements) {
    const definition = catalog.equipment.find(record => record.id === id);
    if (!definition) continue;
    const matches = item => item.quantity > 0 && (id === melee
      ? workshopWeaponMatches(item, oneHand ? "one-handed-melee" : "melee")
      : (item.catalogId === id || item.compatibleWith?.includes(id)));
    let missing = count - available.filter(matches).length;
    for (let slot = 1; slot <= count && missing > 0; slot++) {
      const instanceId = `${LEARNED_GEAR_PREFIX}${id.slice(5)}${slot > 1 ? `-${slot}` : ""}`;
      if (removed.has(instanceId) || available.some(item => item.instanceId === instanceId)) continue;
      items.push({
        instanceId, catalogId: id, quantity: 1, hands: definition.handChoices[0] ?? 0,
        inventoryDie: definition.inventoryDie, source: "training",
      });
      missing--;
    }
  }
  return items;
}
