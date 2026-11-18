import {tracksConsumable} from "./consumables.mjs";
import {compatibleAmmunition, ORDINARY_RANGED_WEAPON} from "../rules/equipment-identity.mjs";
import {nativeItemForWorkshopInstance, nativeWorkshopInventoryId} from "../rules/native-item-identity.mjs";
const ID = "heroes-of-legend";

export function selectedRangedAmmunition(actor, weapon) {
  const itemId = weapon.getFlag(ID, "ammunitionItemId");
  const instanceId = weapon.getFlag(ID, "ammunitionInstanceId");
  return (itemId ? actor.items.get(itemId) : undefined) ??
    (instanceId ? nativeItemForWorkshopInstance(actor, instanceId) : undefined);
}

export async function setRangedWeaponAmmunition(actor, weaponInstanceId, ammoInstanceId) {
  if (!actor.testUserPermission(game.user, "OWNER")) throw new Error("You must own this character to assign its ammunition.");
  const weapon = nativeItemForWorkshopInstance(actor, weaponInstanceId);
  if (weapon?.type !== "equipment" || weapon.system.catalogId !== ORDINARY_RANGED_WEAPON)
    throw new Error("That ranged weapon is no longer in your inventory.");
  const ammo = ammoInstanceId ? nativeItemForWorkshopInstance(actor, ammoInstanceId) : null;
  if (ammoInstanceId && (ammo?.type !== "equipment" || !compatibleAmmunition(weapon.system, ammo.system)))
    throw new Error("Choose compatible ammunition that you are carrying.");
  await weapon.update({
    [`flags.${ID}.ammunitionItemId`]: ammo?.id ?? null,
    [`flags.${ID}.ammunitionInstanceId`]: ammo ? nativeWorkshopInventoryId(ammo) : null,
  });
}

export function rangedWeaponOptions(actor, selectedId = null) {
  return actor.items.filter(item => item.type === "equipment" && item.system.catalogId === ORDINARY_RANGED_WEAPON && item.system.quantity > 0 && item.system.carried !== false)
    .sort((a,b) => Number(b.system.held)-Number(a.system.held) || a.name.localeCompare(b.name))
    .map((item,index) => ({id:item.id,name:item.name,selected:selectedId ? item.id === selectedId : index === 0}));
}
export function rangedAmmunition(actor, selectedId = null) {
  const options = rangedWeaponOptions(actor,selectedId);
  const weapon = actor.items.get(options.find(option=>option.selected)?.id);
  if (!weapon) throw new Error("Add a ranged weapon and assign its ammunition before rolling this attack.");
  const ammo = selectedRangedAmmunition(actor, weapon);
  if (ammo?.type !== "equipment" || !compatibleAmmunition(weapon.system, ammo.system) || (tracksConsumable(ammo) && !ammo.system.inventoryDie))
    throw new Error(`Assign ammunition to ${weapon.name} in Inventory before rolling this attack. Choose a carried bundle with supply remaining.`);
  return {weapon,ammo};
}
