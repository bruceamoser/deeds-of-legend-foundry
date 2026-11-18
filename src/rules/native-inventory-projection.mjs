import { nativeItemForWorkshopInstance, nativeWorkshopInventoryId } from './native-item-identity.mjs';

/** Read native gear for play presentation without changing portable construction. */
export function projectNativeWorkshopInventory(actor, knownItems) {
  const seen = new Set();
  const project = (item, prior = {}) => {
    const system = item.system ?? {};
    const quantity = Math.max(0, system.quantity ?? 0);
    const carried = quantity > 0 && system.carried !== false;
    return { ...prior, quantity, bulk: Math.max(0, system.bulk ?? 0) * quantity,
      carried, held: carried && Boolean(system.held), worn: carried && Boolean(system.worn),
      hands: system.hands ?? 0,
      // Keep non-supply catalog entries non-supplies; their native schema uses 0.
      inventoryDie: prior.inventoryDie == null && !system.inventoryDie ? prior.inventoryDie : system.inventoryDie,
      ...(Number.isSafeInteger(system.waterUnits) ? { waterUnits: system.waterUnits } : {}),
    };
  };
  const items = knownItems.map(prior => {
    const item = nativeItemForWorkshopInstance(actor, prior.instanceId);
    if (!item || item.type !== 'equipment') return prior;
    seen.add(item.id ?? item._id);
    const ammoId = item.getFlag?.('heroes-of-legend', 'ammunitionItemId');
    const ammo = ammoId ? actor.items.get?.(ammoId) : undefined;
    const ammunitionInstanceId = (ammo ? nativeWorkshopInventoryId(ammo) : null) ??
      item.getFlag?.('heroes-of-legend', 'ammunitionInstanceId') ?? prior.ammunitionInstanceId;
    return { ...project(item, prior), ...(ammunitionInstanceId ? { ammunitionInstanceId } : {}) };
  });
  const additional = [...actor.items].filter(item => item.type === 'equipment' && !seen.has(item.id ?? item._id))
    .map(item => project(item, { nativeId: item.id ?? item._id, catalogId: item.system?.catalogId }));
  return { items, additional };
}
