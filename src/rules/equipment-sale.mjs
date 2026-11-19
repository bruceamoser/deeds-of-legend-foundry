/** The market offers half the printed price per unit of intact gear. */
export function standardEquipmentSalePrice(definition, {quantity, inventoryDie} = {}) {
  if (!Number.isSafeInteger(definition?.price) || definition.price < 0 ||
      !Number.isSafeInteger(quantity) || quantity < 1 ||
      (definition.inventoryDie != null && inventoryDie !== definition.inventoryDie)) return null;
  const proceeds = Math.floor(definition.price / 2) * quantity;
  return Number.isSafeInteger(proceeds) ? proceeds : null;
}
