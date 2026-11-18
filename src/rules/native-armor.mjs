import { forgeArmorRequirement } from './forge-character.mjs';

const resistanceByArmor = {
  'item-ordinary-light-armor': 1,
  'item-ordinary-medium-armor': 2,
  'item-ordinary-heavy-armor': 3,
};

function wornArmor(equipment) {
  return equipment
    .map(item => ({ id: item.id, instanceId: item.instanceId, ...(item.system ?? item) }))
    .filter(item => item.worn && item.quantity > 0 && item.carried !== false && resistanceByArmor[item.catalogId]);
}

/** The worn suit supplies physical resistance regardless of training. */
export function nativeForgeArmorSources(equipment) {
  return wornArmor(equipment).map(item => ({
    sourceId: `forge-armor-${item.instanceId ?? item.id}`,
    type: 'physical',
    value: resistanceByArmor[item.catalogId],
    label: `Worn ${item.catalogId.split('-')[2]} armor`,
    automatic: true,
  }));
}

/** Use the harshest worn untrained armor penalty, rather than stacking suits. */
export function untrainedArmorPenalty(learnedIds, equipment) {
  const trained = new Set(learnedIds ?? []);
  return Math.max(0, ...wornArmor(equipment)
    .filter(item => !trained.has(forgeArmorRequirement(item.catalogId, true)))
    .map(item => resistanceByArmor[item.catalogId]));
}
