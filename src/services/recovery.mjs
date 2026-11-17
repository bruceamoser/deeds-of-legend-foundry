import {assertCurrentGameplayActor} from '../rules/current-character.mjs';
import {nativeRecoveryState} from '../rules/native-health.mjs';
import {healingPlan} from '../rules/damage.mjs';
import {ancestryTraitIds} from '../rules/ancestry.mjs';
import {isSummon} from '../rules/summon-profile.mjs';
import {damageBasis} from './damage.mjs';
import {applyDebtReroll} from './debt-reroll.mjs';
import {createActionMessage,shouldProcessRequest,ensureAuthorityReady,enqueueCharacterOperation,writeAuthorityDocument} from './authority.mjs';
const ID='heroes-of-legend';
/** Current heroes use only Forge recovery; creatures retain simple HP. */
export function recoveryPreview(actor,basis,draft) {
 assertCurrentGameplayActor(actor);
 if(draft.kind==='breath')throw new Error('Use a safe overnight rest; a safe breath does not restore HP.');
 if(!['heal','grit','stabilize','correct','setHp','debt','dawn'].includes(draft.kind))throw new Error('Unknown recovery operation.');
 if(actor.type==='character')return nativeRecoveryState(basis,draft,{traitIds:ancestryTraitIds(actor.getFlag(ID,'nativeWorkshop').portable.draft)});
 if(actor.type!=='creature')throw new Error('Choose a current character or creature.');
 if(['correct','setHp'].includes(draft.kind)) {
  if(!Number.isSafeInteger(draft.hp)||draft.hp<0||draft.hp>basis.maxHp)throw new Error('HP must be a whole number within the actor’s maximum.');
  return {after:draft.hp};
 }
 if(draft.kind!=='heal')throw new Error('Only a current character has death rolls, Grit and stabilization.');
 if(basis.hp===0)throw new Error('Ordinary healing cannot revive a defeated creature. Correct HP only if it was recorded incorrectly.');
 const healing=healingPlan({amount:draft.amount,current:basis.hp,max:basis.maxHp,recipientKind:isSummon(actor)?'summon':'creature',lifeResistances:[...(basis.passiveDefenses?.resistances??[]).filter(source=>source.type==='life').map(source=>source.value),draft.lifeResistance??0]});
 if(!healing.allowed)throw new Error('This creature cannot receive ordinary healing.');
 return {after:healing.after};
}
export async function requestRecovery(actor,basis,draft) {
 assertCurrentGameplayActor(actor);
 if(!actor.testUserPermission(game.user,'OWNER'))throw new Error('Only this actor’s owner can record recovery.');
 await ensureAuthorityReady({shared:true,coordinated:true});
 return createActionMessage({content:'Recovery requested.',whisper:game.users.filter(user=>user.isGM||user.id===game.user.id).map(user=>user.id),flags:{[ID]:{recoveryRequest:{actorUuid:actor.uuid,basis,draft}}}},{shared:true,coordinated:true});
}
export function resolveRecoveryRequest(id){return enqueueCharacterOperation(()=>apply(id),{requestId:id});}
async function apply(id) {
 const message=game.messages.get(id),request=message?.getFlag(ID,'recoveryRequest'),actor=await fromUuid(request?.actorUuid??'');
 if(!message?.author||!actor?.testUserPermission(message.author,'OWNER'))throw new Error('Only this actor’s owner can record recovery.');
 assertCurrentGameplayActor(actor);
 const basis=damageBasis(actor),signature=JSON.stringify(request),prior=actor.getFlag(ID,'operationReceipts')?.[id];
 if(request.draft?.rollMessageId||request.draft?.kind==='debt-result')return applyDebtReroll(actor,message,request,basis,signature);
 if(prior?.applied){if(prior.request!==signature||prior.authorId!==message.author.id)throw new Error('The completed recovery request changed.');return {status:'complete',replay:true};}
 if(JSON.stringify(basis)!==JSON.stringify(request.basis))throw new Error('HP or defenses changed. Review recovery again.');
 const plan=recoveryPreview(actor,basis,request.draft),changes={'system.health.value':plan.after,[`flags.${ID}.damageRevision`]:basis.revision+1,[`flags.${ID}.recoveryEvents.${id}`]:{kind:request.draft.kind,authorId:message.author.id,before:basis,after:plan},[`flags.${ID}.operationReceipts.${id}`]:{applied:true,authorId:message.author.id,request:signature}};
 if(plan.forgeVitals)changes[`flags.${ID}.forgeVitals`]=plan.forgeVitals;
 if(plan.gritSpent!==undefined)changes['system.grit.spent']=plan.gritSpent;
 if(plan.recovery)changes['system.recovery']=plan.recovery;
 if(actor.type==='creature')changes[`flags.${ID}.creatureDefeated`]=plan.after===0;
 actor.validate({changes:foundry.utils.expandObject(changes),strict:true,fallback:false});await writeAuthorityDocument(actor,changes);
 await message.update({content:`Recovery recorded: HP ${basis.hp} → ${plan.after}.`});return {status:'complete',replay:false};
}
export function registerRecoveryRequests(){Hooks.on('createChatMessage',message=>{if(message.getFlag(ID,'recoveryRequest')&&shouldProcessRequest(message))resolveRecoveryRequest(message.id).catch(error=>ui.notifications.error(error.message));});}
