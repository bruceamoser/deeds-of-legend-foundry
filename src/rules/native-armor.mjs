import { forgeArmorRequirement } from './forge-character.mjs';

/** The armor supplies resistance; training permits using that armor. */
export function nativeForgeArmorSources(abilities, equipment) {
  const learned = new Set(abilities.map(item => item.catalogId));
  const values = {'item-ordinary-light-armor':1,'item-ordinary-medium-armor':2,'item-ordinary-heavy-armor':3};
  return equipment.filter(item => item.worn && item.quantity > 0 && item.carried !== false &&
    learned.has(forgeArmorRequirement(item.catalogId, true))).map(item => ({
      sourceId:`forge-armor-${item.instanceId}`, type:'physical', value:values[item.catalogId],
      label:`Worn ${values[item.catalogId] === 3 ? 'heavy' : values[item.catalogId] === 2 ? 'medium' : 'light'} armor`,
      automatic:true,
    })).filter(source=>Number.isInteger(source.value));
}
