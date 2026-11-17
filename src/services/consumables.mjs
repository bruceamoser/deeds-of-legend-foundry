import {CONSUMABLE_TYPES,consumableType} from '../rules/consumables.mjs';
const ID='heroes-of-legend';
export function tracksConsumable(item) {
  const type=consumableType(item);
  if(!type)return false;
  try {return game.settings.get(ID,`trackConsumable-${type}`)!==false;}catch{return true;}
}
export function consumableTracking() {
  return Object.fromEntries(Object.keys(CONSUMABLE_TYPES).map(type=>[type,tracksConsumable({system:{consumableType:type}})]));
}
export function registerConsumableSettings() {
  for(const [type,label] of Object.entries(CONSUMABLE_TYPES)) game.settings.register(ID,`trackConsumable-${type}`,{
    name:`Track ${label.toLowerCase()}`,hint:'Check supply and deplete this consumable type when used. Uncheck to use owned supplies without depletion.',
    scope:'world',config:true,type:Boolean,default:true,
    onChange:()=>Hooks.callAll('holConsumableTrackingChanged',type),
  });
}
