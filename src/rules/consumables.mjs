export const CONSUMABLE_TYPES = Object.freeze({
  ammunition:'Arrows and other ammunition', lighting:'Torches and lighting supplies',
  potions:'Potions and tonics', food:'Food', water:'Water',
  crafting:'Crafting materials', other:'Other consumable supplies',
});
export function consumableType(item) {
  const selected=item?.system?.consumableType;
  if (selected === 'none') return null;
  if (Object.hasOwn(CONSUMABLE_TYPES,selected)) return selected;
  const id=item?.system?.catalogId ?? item?.catalogId ?? item?.id ?? '';
  if(id==='item-ammunition-bundle')return 'ammunition';
  if(id==='item-lighting-bundle')return 'lighting';
  if(/healing-bottle|clearing-tonic/.test(id))return 'potions';
  if(id==='item-food-bundle')return 'food';
  if(id==='item-water-flask')return 'water';
  if(id==='item-material-bundle')return 'crafting';
  return 'other';
}
export const TORCH_CHECK_SECONDS=3600;
/** Accrue game-time only. Rewinding time never refunds already used fuel. */
export function torchClock(state, worldTime, tracking=true) {
  if(!Number.isFinite(worldTime))throw new Error('Game time must be a number.');
  const elapsed=Math.max(0,Number(state?.elapsedSeconds)||0);
  const since=Number.isFinite(state?.lastWorldTime)?Math.max(0,worldTime-state.lastWorldTime):0;
  const total=elapsed+(state?.lit && tracking ? since : 0);
  return {...state,lastWorldTime:worldTime,elapsedSeconds:total,checksDue:state?.lit && tracking ? Math.floor(total/TORCH_CHECK_SECONDS):0};
}
export function torchLight(previous, distance) {
  if(!Number.isFinite(distance)||distance<=0)throw new Error('The scene needs a positive grid distance.');
  const radius=3*distance;
  return {...previous,bright:Math.max(previous?.bright??0,radius),dim:Math.max(previous?.dim??0,radius),
    ...(Math.max(previous?.bright??0,previous?.dim??0)<radius ? {color:'#ffb35c',alpha:0.25,animation:{type:'torch',speed:3,intensity:3}} : {})};
}
