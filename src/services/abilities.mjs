import {benefitCurrent} from './benefits.mjs';
import {coordinateNativeGameplay,registerNativeGameplayHandler} from './native-workshop-coordinator.mjs';
import {writeAuthorityDocument} from './authority.mjs';
import {declareAction} from '../rules/actions.mjs';
import {actionConditions} from './turn-budget.mjs';
import {assertCurrentGameplayActor} from '../rules/current-character.mjs';
import {abilityRollConfiguration,abilityCatalogRecord} from '../rules/ability-roll.mjs';
import {loadWorkshopCatalogs} from './catalog.mjs';
import {isShieldEquipment} from '../rules/equipment-identity.mjs';
import {incomingAttackContext} from './roll-preparation.mjs';
const ID='heroes-of-legend';
/** Explicit adapters for the unchanged current universal actions. All other
 * current abilities remain native rolls/references, never historical handlers. */
const ACTIONS={
 'ability-basic-melee':{name:'Basic Melee',category:'main',handler:'player-basic-melee-v1'},
 'ability-defend':{name:'Defend',category:'maneuver',handler:'defend-v1'},
 'ability-shield-block':{name:'Shield Block',category:'reaction',handler:'shield-block-v1'},
};
export function itemAbilityDefinition(item) {
 assertCurrentGameplayActor(item?.actor);
 const id=item?.getFlag?.(ID,'catalogId'),record=item?.getFlag?.(ID,'workshopRecord'),action=ACTIONS[id];
 if(!action||record?.nodeId!==id||item.getFlag(ID,'grantKind')!=='nativeWorkshop')return null;
 return {id,...action,source:{id,commit:item.getFlag(ID,'sourceCommit')}};
}
const shields=actor=>actor.items.filter(item=>isShieldEquipment(item)&&item.system.quantity>0&&item.system.carried!==false&&item.system.held);
export async function activateOwnedAbility(item,{rangedWeaponItemId=null,weaponItemId=null,weaponAttackOnly=false}={}) {
 assertCurrentGameplayActor(item.actor);
 if(!item.actor?.testUserPermission?.(game.user,'OWNER'))throw new Error('Use an ability belonging to a character or creature you own.');
 const definition=itemAbilityDefinition(item);
 if(['defend-v1','shield-block-v1'].includes(definition?.handler))return activateDefenseBenefit(item);
 const catalogs=await loadWorkshopCatalogs(),record=abilityCatalogRecord(item,catalogs.choices),configuration=abilityRollConfiguration(item,record,catalogs.forge);
 if(weaponAttackOnly && !configuration.weaponKind)return false;
 if (item.actor.getFlag(ID,'nativeWorkshop')?.portable && !configuration.forgeWeaponAttack && (record?.attributeChoices || record?.weaponRequirement)) {
  const sheet = item.actor.sheet;
  if (!sheet.useWorkshopAbility) throw new Error('Open the current character sheet to use this ability.');
  return sheet.useWorkshopAbility(record.id);
 }
 if(configuration.attribute){
  const {SharedRollDialog}=await import('../dialogs/attribute-roll.mjs');const dialog=new SharedRollDialog(item.actor,configuration.attribute,{mode:configuration.attack?'attack':'attribute'});
  Object.assign(dialog.draft,{referenceItemIds:[item.id],abilityItemId:item.id,rangedWeaponItemId,weaponItemId,abilityConfiguration:structuredClone(configuration),damageType:configuration.damageTypes[0]??null});return dialog.render({force:true});
 }
 return (await import('./reference-play.mjs')).postAbilityReference(item,{weaponItemId});
}
export function reviewedDefenseAbilityOptions(actor,{attackMessageId=null,defenderTokenUuid=null}={}) {
 assertCurrentGameplayActor(actor);
 if(actor?.documentName!=='Actor')throw new Error('Choose an available defender.');
 if(defenderTokenUuid&&fromUuidSync(defenderTokenUuid)?.actor?.uuid!==actor.uuid)throw new Error('The selected token is not this defender.');
 if(attackMessageId)incomingAttackContext(attackMessageId);
 const held=shields(actor),owner=actor.testUserPermission(game.user,'OWNER');
 const options=actor.items.filter(item=>item.type==='ability').flatMap(item=>{
  const definition=itemAbilityDefinition(item);if(!['defend-v1','shield-block-v1'].includes(definition?.handler))return [];
  const needsShield=definition.id==='ability-shield-block',reasons=[];
  if(!owner)reasons.push('Only the defender’s owner can activate its benefits.');
  if(needsShield&&!held.length)reasons.push('Hold a shield before using Shield Block.');
  const active=actor.effects.some(effect=>benefitCurrent(effect)&&effect.getFlag(ID,'benefit')?.current===true&&effect.getFlag(ID,'benefit').sourceId===definition.id);
  return [{id:definition.id,name:item.name,itemId:item.id,itemUuid:item.uuid,shieldItemUuid:held[0]?.uuid??null,active,pending:false,available:reasons.length===0,reasons,warnings:[]}];
 });
 return {options};
}
export async function requestDefenseAbility(item,{attackMessageId,defenderTokenUuid=null,shieldItemUuid=null}={}) {
 assertCurrentGameplayActor(item.actor);
 if(!attackMessageId)throw new Error('Choose an incoming attack before using a defense benefit.');
 if(defenderTokenUuid&&fromUuidSync(defenderTokenUuid)?.actor?.uuid!==item.actor.uuid)throw new Error('The selected token is not this defender.');
 incomingAttackContext(attackMessageId);return activateDefenseBenefit(item,{shieldItemUuid,attackMessageId,defenderTokenUuid});
}
export function activateDefenseBenefit(item,options={}) {
 return coordinateNativeGameplay(item.actor,{kind:'defense-benefit',operationId:foundry.utils.randomID(),payload:{itemId:item.id,options}});
}
export function removeDefenseBenefit(item) {
 return coordinateNativeGameplay(item.actor,{kind:'defense-benefit',operationId:foundry.utils.randomID(),payload:{itemId:item.id,remove:true}});
}
registerNativeGameplayHandler('defense-benefit',async(actor,payload,context)=>{
 assertCurrentGameplayActor(actor);
 const item=actor.items.get(payload.itemId),definition=itemAbilityDefinition(item),key=`flags.${ID}.nativeDefenseActions.${context.operationId}`;
 let record=actor.getFlag(ID,'nativeDefenseActions')?.[context.operationId];
 const signature=JSON.stringify(payload);
 if(record&&record.signature!==signature)throw new Error('The saved defense action changed.');
 if(!record){
  if(!actor.testUserPermission(context.author,'OWNER')||!['defend-v1','shield-block-v1'].includes(definition?.handler))throw new Error('Use a current defense ability on an actor you own.');
  if(payload.options?.attackMessageId)incomingAttackContext(payload.options.attackMessageId);
  const tokenUuid=payload.options?.defenderTokenUuid;
  if(tokenUuid&&fromUuidSync(tokenUuid)?.actor?.uuid!==actor.uuid)throw new Error('The selected defender token changed.');
  let shieldItemUuid=payload.options?.shieldItemUuid;
  if(definition.id==='ability-shield-block'&&!payload.remove){const held=shields(actor);shieldItemUuid??=held[0]?.uuid;if(!held.some(item=>item.uuid===shieldItemUuid))throw new Error('Hold a shield before using Shield Block.');}
  const combats=game.combats?.contents??[...(game.combats?.values?.()??game.combats??[])];
  const matches=combats.flatMap(combat=>{
   const state=combat.getFlag(ID,'encounter');if(!state)return [];
   return [...combat.combatants].filter(participant=>participant.actor?.uuid===actor.uuid&&(!tokenUuid||participant.token?.uuid===tokenUuid)).map(participant=>({combat,state,participant}));
  });
  if(matches.length>1)throw new Error('Choose the exact defender token in its encounter before using this ability.');
  const match=matches[0],budget=match?.state.budgets?.[match.participant.id];
  if(match&&!budget)throw new Error('The defender’s native action budget is unavailable.');
  if(match&&!payload.remove)declareAction(budget,{operationId:context.operationId,sourceId:definition.id,category:definition.category,ownTurn:match.state.current===match.participant.id,conditions:actionConditions(actor)});
  record={signature,status:'prepared',sourceId:definition.id,key:definition.id==='ability-shield-block'?'shield-block':'defend',name:item.name,img:item.img,remove:Boolean(payload.remove),shieldItemUuid:shieldItemUuid??null,
   ...(match?{combatUuid:match.combat.uuid,participantId:match.participant.id,anchor:{combatId:match.combat.id,participantId:match.participant.id,turnId:budget.turnId},category:definition.category}: {})};
  await context.write({[key]:record},{status:'prepared'});
 }
 if(record.status!=='applied'){
  if(record.combatUuid&&!record.remove){
   const combat=await fromUuid(record.combatUuid),state=combat?.getFlag(ID,'encounter'),budget=state?.budgets?.[record.participantId];
   if(!budget)throw new Error('The saved encounter budget is unavailable. Ask the DA to reconcile the saved defense action.');
   if(budget.turnId===record.anchor.turnId&&!budget.operations[context.operationId]){
    const next=structuredClone(state);next.budgets[record.participantId]=declareAction(budget,{operationId:context.operationId,sourceId:record.sourceId,category:record.category,ownTurn:state.current===record.participantId,conditions:actionConditions(actor)});next.revision++;
    await writeAuthorityDocument(combat,{[`flags.${ID}.encounter`]:next});
   }
  }
  const effects=structuredClone(actor.toObject().effects??[]),existing=effects.find(effect=>effect.flags?.[ID]?.benefit?.current===true&&effect.flags[ID].benefit.key===record.key);
  if(record.remove){if(existing)existing.disabled=true;}
  else{
   const effect={_id:existing?._id??foundry.utils.randomID(),name:record.name,img:record.img,disabled:false,flags:{[ID]:{benefit:{key:record.key,current:true,manual:!record.anchor,sourceId:record.sourceId,shieldItemUuid:record.shieldItemUuid,...(record.anchor?{anchor:record.anchor}:{})}}}};
   if(existing)effects[effects.indexOf(existing)]=effect;else effects.push(effect);
  }
  record={...record,status:'applied'};await context.write({effects,[key]:record},{status:'complete'});
 }
 if(item&&!record.remove)await (await import('./reference-play.mjs')).postAbilityReference(item);
 return {status:'complete',sourceId:record.sourceId,removed:record.remove};
});

const BASIC_ATTACKS=new Set(['ability-basic-melee','ability-basic-ranged','ability-basic-unarmed','ability-basic-throw','ability-opportunity-attack']);
export const prepareNativeBasicAttack=(actor,itemId,operationId,actorTokenUuid)=>coordinateNativeGameplay(actor,{kind:'action-budget',operationId,payload:{itemId,actorTokenUuid}});
export const prepareNativeActionCost=(actor,id,operationId,mode='cast')=>coordinateNativeGameplay(actor,{kind:'action-budget',operationId,payload:{id,mode}});
registerNativeGameplayHandler('action-budget',async(actor,payload,context)=>{
 assertCurrentGameplayActor(actor);
 const attack=Boolean(payload.itemId),item=attack?actor.items.get(payload.itemId):actor.items.find(item=>item.type==='ability'&&item.getFlag(ID,'catalogId')===payload.id&&item.getFlag(ID,'grantKind')==='nativeWorkshop'),sourceId=item?.getFlag(ID,'catalogId');
 if(actor.type!=='character'||!item||item.getFlag(ID,'grantKind')!=='nativeWorkshop'||item.getFlag(ID,'workshopRecord')?.nodeId!==sourceId)throw new Error('Choose a current owned action.');
 let category;
 const catalogs=await loadWorkshopCatalogs();
 if(attack){
  const configuration=abilityRollConfiguration(item,abilityCatalogRecord(item,catalogs.choices),catalogs.forge);
  if(!BASIC_ATTACKS.has(sourceId)&&!configuration.forgeWeaponAttack)throw new Error('Choose a current owned weapon attack.');
  category=configuration.category;
 } else {
  if(!['cast','sustain'].includes(payload.mode)||(payload.mode==='sustain'&&sourceId!=='ability-sustain-spell'))throw new Error('Unsupported native action cost.');
  const source=catalogs.choices.find(record=>record.id===sourceId)??catalogs.forge.spells.find(record=>record.id===sourceId);
  if(!source)throw new Error('That current action no longer exists.');
  const action=source.action??source.reference?.rules?.details?.find(detail=>detail.label==='Action')?.value??'';
  category=payload.mode==='sustain'?'maneuver':/^Main Action\b/i.test(action)?'main':/^Maneuver\b/i.test(action)?'maneuver':/^Reaction\b/i.test(action)?'reaction':null;
 }

 const pending=actor.getFlag(ID,'nativeWorkshopPendingRoll');
 if(pending&&(pending.id!==context.operationId||pending.status!=='prepared'||pending.authorId&&pending.authorId!==context.author.id))throw new Error('An earlier roll awaits reconciliation. Do not roll its dice again.');
 const key=`flags.${ID}.nativeAttackActions.${context.operationId}`,signature=JSON.stringify(payload);
 let record=actor.getFlag(ID,'nativeAttackActions')?.[context.operationId];
 if(record&&record.signature!==signature)throw new Error('The saved action changed.');
 if(!record){
  const combats=game.combats?.contents??[...(game.combats?.values?.()??game.combats??[])];
  const matches=(category?combats:[]).flatMap(combat=>{const state=combat.getFlag(ID,'encounter');if(!state)return [];return [...combat.combatants].filter(participant=>participant.actor?.uuid===actor.uuid&&(!payload.actorTokenUuid||participant.token?.uuid===payload.actorTokenUuid)).map(participant=>({combat,state,participant}));});
  if(matches.length>1)throw new Error('Control the exact attacking token in its encounter.');
  const match=matches[0],budget=match?.state.budgets?.[match.participant.id];
  if(match&&!budget)throw new Error('The attacker’s native action budget is unavailable.');
  if(match)declareAction(budget,{operationId:context.operationId,sourceId,category,ownTurn:match.state.current===match.participant.id,conditions:actionConditions(actor)});
  record={signature,status:'prepared',sourceId,category,...(match?{combatUuid:match.combat.uuid,participantId:match.participant.id,turnId:budget.turnId}:{})};
  await context.write({[key]:record,...(attack||payload.mode==='cast'?{[`flags.${ID}.nativeWorkshopPendingRoll`]:{id:context.operationId,status:'prepared',kind:attack?'native-basic-attack':'cast',authorId:context.author.id}}:{})},{status:'prepared'});
 }
 if(record.status!=='paid'){
  if(record.combatUuid){
   const combat=await fromUuid(record.combatUuid),state=combat?.getFlag(ID,'encounter'),budget=state?.budgets?.[record.participantId];
   if(!budget||budget.turnId!==record.turnId)throw new Error('The attacking turn changed before its action completed. Ask the DA to reconcile the paid action; no dice were rolled.');
   if(!budget.operations[context.operationId]){const next=structuredClone(state);next.budgets[record.participantId]=declareAction(budget,{operationId:context.operationId,sourceId,category:record.category,ownTurn:state.current===record.participantId,conditions:actionConditions(actor)});next.revision++;await writeAuthorityDocument(combat,{[`flags.${ID}.encounter`]:next});}
  }
  await context.write({[key]:{...record,status:'paid'}},{status:'paid'});
 }
 return {status:'paid',operationId:context.operationId};
});
