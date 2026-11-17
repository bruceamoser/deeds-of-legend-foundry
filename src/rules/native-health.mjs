import {isCurrentCharacter} from "./current-character.mjs";
import {normalizeForgeRecovery,payForgeDebt,nextForgeDawn} from "./forge-recovery.mjs";
import {forgeDamage, forgeVitals,forgeHeal,forgeSpendGrit,forgeStabilize} from "./forge-vitals.mjs";
const KEYS = ["dying","dead","failedDeathRolls","successfulDeathRolls","gritTrigger","scars","firstAidUsed","firstAidPending","spellcraftRecoveryUsed"];
/** Native resource fields remain authoritative; flags contain only recovery/death
 * state. Pending immediate rolls are durable event identities, never automatic dice. */
export function nativeDamageState({hp,maxHp,sp=0,maxSp=0,gritSpent=0,gritGranted=0,recovery={},state={}}, damage, eventId = null) {
  const limits={maxHp,maxSp,gritGranted,unavailableHp:recovery.unavailableHp??0};
  const play=forgeVitals({...state,hp,sp,gritSpent,recovery},limits);
  const result=damage===0 ? {play,deathRollRequired:false} : forgeDamage(play,limits,damage);
  const pending=[...new Set((state.immediateDeathRolls??[]).filter(id=>typeof id==="string"&&id))];
  if(result.deathRollRequired&&eventId&&!pending.includes(eventId))pending.push(eventId);
  return {hp:result.play.hp,deathRollRequired:result.deathRollRequired,
    forgeVitals:{...Object.fromEntries(KEYS.map(key=>[key,structuredClone(result.play[key])])),immediateDeathRolls:pending}};
}

export function hasNativeForgeState(actor) {
 return isCurrentCharacter(actor);
}
export function nativeRecoveryState(basis,draft,{traitIds=[]}={}) {
 const recovery=normalizeForgeRecovery(basis.recovery),limits={maxHp:basis.maxHp,maxSp:basis.maxSp??0,gritGranted:basis.gritGranted??0,unavailableHp:recovery.unavailableHp};
 let play=forgeVitals({...basis.forgeVitals,hp:basis.hp,sp:basis.sp??0,gritSpent:basis.gritSpent??0,recovery},limits),accounting=recovery;
 if(draft.kind==='breath')throw new Error('Use a safe overnight rest for current heroes; a safe breath does not restore HP.');
 if(['correct','setHp'].includes(draft.kind)) {
  if(!Number.isSafeInteger(draft.hp)||draft.hp<0||draft.hp>basis.maxHp)throw new Error('HP must be a whole number within the actor’s maximum.');
  play=forgeVitals({...play,hp:draft.hp,...(draft.hp>0?{dying:false,dead:false,failedDeathRolls:0,successfulDeathRolls:0,gritTrigger:null}:basis.hp>0?{dying:true,gritTrigger:'fall'}:{})},limits);
 } else if(draft.kind==='heal') {
  const values=[...(basis.passiveDefenses?.resistances??[]).filter(source=>source.type==='life').map(source=>source.value),draft.lifeResistance??0];
  if(values.some(value=>!Number.isSafeInteger(value)||value<0))throw new Error('Life resistance must be a nonnegative integer.');
  play=forgeHeal(play,limits,draft.amount,{lifeResistance:Math.min(3,Math.max(0,...values))});
 } else if(draft.kind==='grit') play=forgeSpendGrit(play,limits,draft.trigger??play.gritTrigger??(play.dying?'turn-start':'stable'));
 else if(draft.kind==='stabilize') play=forgeStabilize(play,limits);
 else if(draft.kind==='debt'||draft.kind==='dawn') {
  const result=draft.kind==='debt'?payForgeDebt({hp:play.hp,maxHp:limits.maxHp,recovery,traitIds}):nextForgeDawn({hp:play.hp,recovery});
  accounting=result.recovery;play={...play,hp:result.hp};
 } else throw new Error('Unknown current recovery operation.');
 const pending=play.hp>0||!play.dying?[]:[...(basis.forgeVitals?.immediateDeathRolls??[])];
 return {after:play.hp,state:null,forgeVitals:{...Object.fromEntries(KEYS.map(key=>[key,structuredClone(play[key])])),immediateDeathRolls:pending},gritSpent:play.gritSpent,recovery:accounting};
}
