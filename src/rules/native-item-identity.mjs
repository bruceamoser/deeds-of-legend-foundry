const ID='heroes-of-legend';
export const NATIVE_INVENTORY_PREFIX='inventory-native-';
export function nativeWorkshopInventoryId(item) {
  const managed=item.getFlag?.(ID,'grantKind')==='nativeWorkshop';
  const acquisition=item.getFlag?.(ID,'acquisitionInstance');
  if(managed && acquisition)return acquisition;
  const id=item.id??item._id;
  return typeof id==='string'?NATIVE_INVENTORY_PREFIX+[...id].map(char=>char.charCodeAt(0).toString(16).padStart(2,'0')).join(''):null;
}
export function nativeItemForWorkshopInstance(actor,instance) {
  return [...actor.items].find(item=>item.id===instance || item.getFlag?.(ID,'acquisitionInstance')===instance || nativeWorkshopInventoryId(item)===instance);
}

/** A newly held catalog weapon must occupy its printed default hand count.
 * Explicit nonzero native arrangements and genuinely hands-free items survive. */
export function nativeEquipmentHands(item,definition) {
  const system=item.system??item;
  if(Number.isSafeInteger(system.hands)&&system.hands>0)return system.hands;
  if(!system.held || system.carried===false || !(system.quantity>0))return system.hands??0;
  return definition?.handChoices?.find(hands=>hands>0)??(system.hands??0);
}
