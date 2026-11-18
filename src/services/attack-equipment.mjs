import {isShieldEquipment} from "../rules/equipment-identity.mjs";
import {workshopWeaponMatches} from "../rules/workshop-ability.mjs";

export const UNARMED_OPTION = "__unarmed__";

/** Pick equipment by stable catalog identity; player-visible names may be edited. */
export function attackEquipmentOptions(actor, configuration, selectedId = null) {
  const kind = configuration?.weaponKind;
  if (!kind) return [];
  const carried = actor.items.filter(item => item.type === "equipment" && item.system.quantity > 0 && item.system.carried !== false);
  const held = carried.filter(item => item.system.held);
  const looseThrow = !configuration.forgeWeaponAttack && kind === "thrown";
  const eligible = (looseThrow || kind === "ranged" || kind === "melee" && !configuration.weaponRequirement ? carried : held)
    .filter(item => {
      if (kind === "thrown") return true;
      if (kind === "shield") return isShieldEquipment(item);
      if (kind === "ranged") return item.system.catalogId === "item-ordinary-ranged-weapon";
      if (kind === "melee" || kind === "opportunity") return workshopWeaponMatches(item.system, configuration.weaponRequirement);
      return false;
    })
    .sort((a,b) => Number(b.system.held)-Number(a.system.held) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    .map(item => ({id:item.id, name:item.name}));
  if (kind === "unarmed" || kind === "opportunity" && held.reduce((used,item) => used + (item.system.hands || 1), 0) < 2)
    eligible.push({id:UNARMED_OPTION,name:"Unarmed"});
  return eligible.map((item,index) => ({...item,selected:selectedId ? item.id===selectedId : index===0}));
}

export function attackEquipmentSnapshot(actor, configuration, selectedId = null) {
  const kind = configuration?.weaponKind;
  if (!kind) return null;
  const chosen = attackEquipmentOptions(actor,configuration,selectedId).find(option => option.selected);
  if (!chosen) throw new Error(selectedId
    ? "The selected attack item is no longer available. Choose its replacement."
    : kind === "opportunity" ? "Hold a melee weapon or keep a hand free to make this opportunity attack."
    : "Choose a suitable weapon or item before rolling this attack.");
  if (chosen.id === UNARMED_OPTION) return {itemUuid:null,name:chosen.name};
  const item = actor.items.get(chosen.id);
  return {itemUuid:item.uuid,name:item.name};
}
