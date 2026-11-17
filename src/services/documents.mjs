import {validateEquipmentAttributeArrangement} from "../rules/effective-attributes.mjs";
/** Sheet mutation boundary. Foundry performs schema and server permission validation too. */
export async function updateOwnedDocument(document, data, options = {}) {
  if (!document.testUserPermission(game.user, "OWNER")) throw new Error(game.i18n.localize("HOL.NoPermission"));
  if (!document.id) throw new Error("Save a world document before editing it.");
  if (Array.isArray(data.items)) validateEquipmentAttributeArrangement(data.items);
  if (document.type === "equipment" && document.actor && ["attributeEffects","quantity","carried","held","worn"].some(key => Object.hasOwn(data,`system.${key}`)||Object.hasOwn(data.system??{},key))) {
    const items=[...document.actor.items].map(item=>structuredClone(item.toObject?.()??item));
    const item=items.find(item=>(item._id??item.id)===document.id);
    if (item) {
      Object.assign(item.system,data.system??{});
      for (const key of ["attributeEffects","quantity","carried","held","worn"]) if(Object.hasOwn(data,`system.${key}`))item.system[key]=data[`system.${key}`];
      validateEquipmentAttributeArrangement(items);
    }
  }
  return document.update(data, options);
}

/** Correct the displayed HP directly; do not infer wounds or spend resources. */
export async function setOwnedHp(actor, hp) {
  if (!Number.isSafeInteger(hp) || hp < 0 || hp > actor.system.health.max)
    throw new Error("HP must be a whole number within the actor’s maximum.");
  return updateOwnedDocument(actor, {
    "system.health.value": hp,
    "flags.heroes-of-legend.damageRevision": (actor.getFlag("heroes-of-legend", "damageRevision") ?? 0) + 1,
  });
}
