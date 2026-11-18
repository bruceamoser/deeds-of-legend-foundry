import { ATTRIBUTES } from "./character.mjs";
import { MELEE_WEAPON_CATALOG_IDS } from "./equipment-identity.mjs";

export function workshopRollAttributes(record) {
  if (record?.attributeChoices?.length)
    return record.attributeChoices.filter(key => ATTRIBUTES.includes(key));
  const printed = record?.attribute ?? record?.reference?.rules?.details?.find(detail => detail.label === "Attribute")?.value;
  const key = ATTRIBUTES.find(attribute => printed?.toLowerCase().startsWith(attribute));
  return key ? [key] : [];
}

export function restrictedWorkshopRollAttributes(record) {
  return record?.attributeChoices || record?.weaponRequirement
    ? workshopRollAttributes(record)
    : [];
}

export function workshopWeaponLabel(requirement) {
  return requirement === "one-handed-melee" ? "suitable one-handed melee weapon" : "melee weapon";
}

/** Match stable catalog identities and the hands required to wield the item. */
export function workshopWeaponMatches(item, requirement) {
  return (MELEE_WEAPON_CATALOG_IDS.includes(item.catalogId) || item.catalogId === "item-ember-edge")
    && item.quantity > 0
    && (requirement !== "one-handed-melee" || item.hands === 1);
}

export function heldWorkshopWeapons(items, requirement) {
  return items.filter(item => item.held && item.carried !== false && workshopWeaponMatches(item, requirement));
}

export function validateWorkshopAbilityUse(record, items, attribute) {
  const allowed = restrictedWorkshopRollAttributes(record);
  if (attribute !== undefined && allowed.length && !allowed.includes(attribute))
    throw new Error("Choose one of the attributes listed for this ability.");
  const requirement = record?.weaponRequirement;
  if (requirement && !heldWorkshopWeapons(items, requirement).length)
    throw new Error(`Wield a ${workshopWeaponLabel(requirement)} to use ${record.name}.`);
}
