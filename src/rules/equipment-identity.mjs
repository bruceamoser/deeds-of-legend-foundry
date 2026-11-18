/** Stable capabilities, never display names, identify equipment used by rules. */
export const SHIELD_CATALOG_IDS = Object.freeze(["item-ordinary-shield"]);
export const MELEE_WEAPON_CATALOG_IDS = Object.freeze([
  "item-ordinary-melee-weapon",
]);
export const ORDINARY_RANGED_WEAPON = "item-ordinary-ranged-weapon";
export const ORDINARY_AMMUNITION = "item-ammunition-bundle";
export const WATER_FLASK = "item-water-flask";

export function compatibleAmmunition(weapon, ammo) {
  return weapon?.catalogId === ORDINARY_RANGED_WEAPON &&
    ammo?.catalogId === ORDINARY_AMMUNITION && ammo.quantity > 0 && ammo.carried !== false;
}

export function isShieldEquipment(item) {
  return (
    item?.type === "equipment" &&
    SHIELD_CATALOG_IDS.includes(item.system?.catalogId)
  );
}

export function isMeleeWeaponEquipment(item) {
  return (
    item?.type === "equipment" &&
    MELEE_WEAPON_CATALOG_IDS.includes(item.system?.catalogId)
  );
}
