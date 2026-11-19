import { healingPlan } from "./damage.mjs";
import { conditionEndPlan } from "./conditions.mjs";
import { inventoryCheck, refillInventory } from "./inventory.mjs";
import { healingPotionAdapter, HEALING_POTION_IDS } from "./potions.mjs";
import { normalizeForgeRecovery } from "./forge-recovery.mjs";

export function workshopSupplyUse({
  item,
  face,
  hp,
  maxHp,
  catalog,
  lifeResistance = 0,
  recovery,
}) {
  if (!item || item.quantity < 1)
    throw new Error("This supply has no quantity remaining.");
  let potion = null;
  if (HEALING_POTION_IDS.includes(item.catalogId)) {
    potion = catalog.forge
      ? catalog.equipment.find((record) => record.id === item.catalogId)
      : healingPotionAdapter(item.catalogId, catalog);
    if (!Number.isSafeInteger(potion?.healing) || potion.healing < 1)
      throw new Error(`Missing healing amount for ${item.catalogId}.`);
  }
  const check = inventoryCheck({ die: item.inventoryDie, retained: face });
  const afterHp = potion ? healingPlan({
    amount: potion.healing, current: hp, max: maxHp,
    unavailableHp: normalizeForgeRecovery(recovery).unavailableHp,
    lifeResistances: [lifeResistance],
  }).after : hp;
  return {
    ...check,
    hp: afterHp,
    healed: afterHp - hp,
    potion: Boolean(potion),
  };
}

export function workshopResupply({ item, steps, catalog }) {
  if (!item) throw new Error("Choose an inventory stack to resupply.");
  const maximumDie = catalog.equipment.find(
    (e) => e.id === item.catalogId,
  )?.inventoryDie;
  if (![1, 2, 3, 4, 5, 6].includes(steps))
    throw new Error("Choose 1–6 resupply steps.");
  return refillInventory({ die: item.inventoryDie, steps, maximumDie });
}

/** Apply one condition's combined damage, with resistance once and no decay. */
export function workshopConditionDamage({
  condition,
  contributions = [condition],
  resistances = {},
}) {
  const event = conditionEndPlan(
    contributions.filter((c) => c.key === condition.key),
    {
      turnId: "web-manual",
      resistances: Object.entries(resistances).map(([type, value]) => ({
        type,
        value,
      })),
    },
  ).events[0];
  if (!event) throw new Error("This condition does not deal HP damage.");
  return { amount: event.damage.total };
}

export function workshopFavorites(character, draft, catalogs) {
  const records = new Map(catalogs.choices.map((r) => [r.id, r]));
  const selected = draft.play?.favorites ?? {},
    rows = new Map();
  const add = (id, item) => {
    const record = records.get(id);
    if (!record) return;
    const supply = Number.isInteger(item?.inventoryDie);
    const key = supply ? `${id}:${item.instanceId}` : id;
    if (rows.has(key)) {
      if (item) rows.get(key).sourceItems.push(item);
      return;
    }
    rows.set(key, {
      record,
      basic: Boolean(record.universal),
      visible: true,
      sourceItems: item ? [item] : [],
      ...(supply ? { inventoryInstance: item } : {}),
      favoriteRow: true,
    });
  };
  for (const id of selected.abilities ?? []) {
    if (character.state.abilities.includes(id) || records.get(id)?.universal)
      add(id);
  }
  for (const instance of selected.items ?? []) {
    const item = character.inventory.items.find(
      (i) => i.instanceId === instance,
    );
    if (!item) continue;
    const ids =
      item.catalogId === "item-ordinary-melee-weapon"
        ? [
            "ability-basic-melee",
            "ability-basic-throw",
            "ability-opportunity-attack",
          ]
        : item.catalogId === "item-ordinary-ranged-weapon"
          ? ["ability-basic-ranged"]
          : item.catalogId === "item-ordinary-shield"
            ? ["ability-shield-block"]
            : HEALING_POTION_IDS.includes(item.catalogId)
              ? ["ability-use-a-healing-potion"]
              : ["ability-handle-an-item"];
    for (const id of ids) add(id, item);
  }
  return [...rows.values()];
}
