import { DAMAGE_TYPES, DAMAGE_TYPE_LABELS } from "./damage.mjs";

export const EQUIPMENT_STAT_BONUSES = Object.freeze({ hp: "Maximum HP", sp: "Maximum SP", speed: "Speed" });
export const EQUIPMENT_BONUS_LABELS = Object.freeze({
  ...EQUIPMENT_STAT_BONUSES,
  ...DAMAGE_TYPE_LABELS,
});

export function isEquipped(item) {
  const system = item?.system;
  return item?.type === "equipment" && system?.quantity > 0 && system.carried !== false && (system.held || system.worn);
}

export function equipmentBonuses(items = []) {
  const bonuses = { hp: 0, sp: 0, speed: 0, resistances: [] };
  for (const item of items) {
    if (!isEquipped(item)) continue;
    const effects = item.system.bonuses ?? {};
    for (const key of Object.keys(EQUIPMENT_STAT_BONUSES))
      bonuses[key] = Math.max(bonuses[key], effects[key] ?? 0);
    for (const type of DAMAGE_TYPES) {
      const value = Math.min(3, effects[type] ?? 0);
      if (value > 0) bonuses.resistances.push({ type, value, label: item.name ?? "Equipment" });
    }
  }
  return bonuses;
}

export function resourceClamp(current, limits) {
  const changes = {};
  if (current.hp > limits.maxHp) changes["system.health.value"] = limits.maxHp;
  if (current.sp > limits.maxSp) changes["system.sp.value"] = limits.maxSp;
  return changes;
}
