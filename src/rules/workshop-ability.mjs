import { ATTRIBUTES } from "./character.mjs";
import { MELEE_WEAPON_CATALOG_IDS } from "./equipment-identity.mjs";
import { isForgeSpell, signatureSpellCost } from "./forge-casting.mjs";

export function workshopRollAttributes(record, override) {
  if (ATTRIBUTES.includes(override)) return [override];
  if (record?.attributeChoices?.length)
    return record.attributeChoices.filter(key => ATTRIBUTES.includes(key));
  const printed = record?.attribute ?? record?.reference?.rules?.details?.find(detail => detail.label === "Attribute")?.value;
  const key = ATTRIBUTES.find(attribute => printed?.toLowerCase().startsWith(attribute));
  return key ? [key] : [];
}

export const workshopRollSourceId = id => id === "ability-opportunity-attack" ? "ability-basic-melee" : id;

export function canCustomizeWorkshopRoll(record) {
  return record?.id === workshopRollSourceId(record?.id) && workshopRollAttributes(record).length > 0 &&
    !isForgeSpell(record) && !Number.isInteger(signatureSpellCost(record));
}

export function restrictedWorkshopRollAttributes(record, override) {
  return override || record?.attributeChoices || record?.weaponRequirement
    ? workshopRollAttributes(record, override)
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

export function validateWorkshopAbilityUse(record, items, attribute, override) {
  const allowed = restrictedWorkshopRollAttributes(record, override);
  if (attribute !== undefined && allowed.length && !allowed.includes(attribute))
    throw new Error("Choose one of the attributes listed for this ability.");
  const requirement = record?.weaponRequirement;
  if (requirement && !heldWorkshopWeapons(items, requirement).length)
    throw new Error(`Wield a ${workshopWeaponLabel(requirement)} to use ${record.name}.`);
}
