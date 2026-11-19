import {ensureAuthorityReady,createActionMessage,shouldProcessRequest,enqueueCharacterOperation,writeAuthorityDocument} from './authority.mjs';
import * as state from './native-workshop-state.mjs';
const ID='heroes-of-legend';
const pending=new Map();
const gameplayHandlers=new Map();
export function registerNativeGameplayHandler(kind,handler){if(gameplayHandlers.has(kind))throw new Error('Duplicate managed gameplay handler.');gameplayHandlers.set(kind,handler);}
export async function reconcileNativeGameplayOperation(actor){
 const saved=Object.values(actor.getFlag(ID,'nativeWorkshopOperations')??{}).find(saved=>saved.kind==='gameplay'&&saved.status==='applying');
 if(!saved)throw new Error('No interrupted managed gameplay action remains.');
 const action=game.messages.get(saved.id)?.getFlag(ID,'nativeWorkshopRequest');
 if(!action||action.kind!=='gameplay')throw new Error('The saved gameplay request is unavailable. Ask the DA to review its persisted resource receipt.');
 return coordinateNativeGameplay(actor,clone(action.payload));
}
export const coordinateNativeGameplay=(actor,{kind,operationId,payload})=>request(actor,'gameplay',{kind,operationId,payload});
function assertGameplayOwner(actor,user=game.user){if(!['character','creature'].includes(actor?.type)||actor.pack||!actor.testUserPermission(user,'OWNER'))throw new Error('Choose an actor you own.');}
const methods={save:'saveNativeWorkshopState',commit:'commitNativeWorkshopCharacter',identity:'saveNativeWorkshopIdentity',draft:'saveNativeWorkshopDraft',sell:'sellNativeWorkshopEquipment'};
const kinds=new Set([...Object.keys(methods),'gameplay','claim-roll','roll-phase','complete-roll','interrupt-roll']);
const clone=value=>structuredClone(value);
async function digest(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function assertOwner(actor,user=game.user){if(actor?.type!=='character'||actor.pack||actor.isToken||!actor.testUserPermission(user,'OWNER'))throw new Error('Only the owner of this world character can change its Workshop.');}
function revision(actor){return actor.getFlag(ID,'nativeWorkshop')?.revision??0;}
function receipt(actor,id){return actor?.getFlag(ID,'nativeWorkshopOperations')?.[id];}
function validateReceipt(saved,signature,authorId){if(!saved?.applied||saved.signature!==signature||saved.authorId!==authorId)throw new Error('The completed Workshop action changed. Reconcile the saved operation.');}
async function resultFor(actor,kind,saved){if(kind==='draft')return state.loadNativeWorkshopDraft(actor);if(!methods[kind])return clone(saved.result);return state.loadNativeWorkshopState(actor);}
/** One private durable request targets one GM socket, including requests from GM tabs.
 * Uncertain acknowledgements retain a local identity and are never resent as a new action. */
async function request(actor,kind,payload={},options={}) {
 (kind==='gameplay'?assertGameplayOwner:assertOwner)(actor);
 if(!kinds.has(kind))throw new Error('Unknown Workshop action.');
 const mutatesCharacter=Boolean(methods[kind])||kind==='gameplay';
 const existing=mutatesCharacter?pending.get(actor.uuid):null;
 if(existing) {
  const saved=receipt(actor,existing.id);
  if(saved?.status==='applying'&&kind==='gameplay'&&payload.operationId===saved.operationId){
   validateReceipt(saved,existing.signature,existing.authorId);pending.delete(actor.uuid);
  }else{
   const status=game.messages.get(existing.id)?.getFlag(ID,'nativeWorkshopStatus');
   if(saved){validateReceipt(saved,existing.signature,existing.authorId);pending.delete(actor.uuid);}
   else if(status?.status==='failed'){pending.delete(actor.uuid);}
   else throw new Error('Foundry has not confirmed the previous change. Its request is saved and can still complete.');
  }
 }
 await ensureAuthorityReady({shared:true,coordinated:true});
 const action={actorUuid:actor.uuid,kind,payload:clone(payload),options:clone(options),expectedRevision:options.expectedRevision??revision(actor)};
 const signature=await digest(action);
 const message=await createActionMessage({content:'Workshop action.',whisper:game.users.filter(user=>user.isGM||user.id===game.user.id).map(user=>user.id),flags:{[ID]:{nativeWorkshopRequest:action}}},{shared:true,coordinated:true});
 const record={id:message.id,signature,authorId:game.user.id};
 if(mutatesCharacter)pending.set(actor.uuid,record);
 const acknowledge=()=>{if(pending.get(actor.uuid)?.id===record.id)pending.delete(actor.uuid);};
 const deadline=Date.now()+30000;
 while(Date.now()<deadline) {
  const saved=receipt(actor,message.id);
  if(saved&&(kind!=='gameplay'||saved.status==='complete')){validateReceipt(saved,signature,record.authorId);acknowledge();return resultFor(actor,kind,saved);}
  const status=game.messages.get(message.id)?.getFlag(ID,'nativeWorkshopStatus');
  if(status?.status==='failed'){acknowledge();throw new Error(status.error);}
  await new Promise(done=>setTimeout(done,100));
 }
 throw new Error('Foundry did not confirm this Workshop action. The original request was saved.');
}
export const saveNativeWorkshopState=(actor,saved,options={})=>request(actor,'save',{saved},options);
export const commitNativeWorkshopCharacter=(actor,portable,options={})=>request(actor,'commit',{portable},options);
export const saveNativeWorkshopIdentity=(actor,portable,options={})=>request(actor,'identity',{portable},options);
export const saveNativeWorkshopDraft=(actor,portable,options={})=>request(actor,'draft',{portable},options);
export const sellNativeWorkshopEquipment=(actor,sale,options={})=>request(actor,'sell',{sale},options);
export const claimNativeWorkshopOperation=(actor,operation)=>request(actor,'claim-roll',{operation});
export const updateNativeWorkshopOperation=(actor,operation)=>request(actor,'roll-phase',{operation});
export const completeNativeWorkshopOperation=(actor,id)=>request(actor,'complete-roll',{id});
export const interruptNativeWorkshopOperation=(actor,id)=>request(actor,'interrupt-roll',{id});
export const nativeWorkshopRoll=(actor,id)=>actor.getFlag(ID,'nativeWorkshopRolls')?.[id];
const rollFlag=(id)=>`flags.${ID}.nativeWorkshopRolls.${id}`;
export function workshopRollClaimChanges(actor,operation) {
 const previous=actor.getFlag(ID,'nativeWorkshopPendingRoll');
 return {
  ...(previous?{
   [rollFlag(previous.id)]:{...previous,status:'interrupted',interruptedPhase:previous.status},
   [`flags.${ID}.-=nativeWorkshopPendingRoll`]:null,
  }:{}),
  ...(operation?{[rollFlag(operation.id)]:operation}:{}),
 };
}
export function resolveNativeWorkshopRequest(id){return enqueueCharacterOperation(()=>apply(id),{requestId:id});}
async function apply(id) {
 const message=game.messages.get(id),action=message?.getFlag(ID,'nativeWorkshopRequest');
 if(!action||!kinds.has(action.kind)||typeof action.actorUuid!=='string')throw new Error('Invalid Workshop request.');
 if(!game.user.isGM)throw new Error('Only the selected GM coordinator can execute a Workshop request.');
 const actor=await fromUuid(action.actorUuid);(action.kind==='gameplay'?assertGameplayOwner:assertOwner)(actor,message.author);
 const signature=await digest(action),prior=receipt(actor,id);
 if(prior){validateReceipt(prior,signature,message.author.id);if(prior.status!=='applying')return resultFor(actor,action.kind,prior);}
 const unresolved=Object.values(actor.getFlag(ID,'nativeWorkshopOperations')??{}).find(saved=>saved.kind==='gameplay'&&saved.status==='applying');
 if(unresolved&&!(action.kind==='gameplay'&&action.payload.operationId===unresolved.operationId))throw new Error('A managed gameplay action needs reconciliation before another resource change.');
 const expected=action.expectedRevision;if(methods[action.kind]&&(!Number.isSafeInteger(expected)||expected!==revision(actor)))throw new Error('The character changed in another window. Reload it before saving.');
 const saved={id,applied:true,authorId:message.author.id,signature,kind:action.kind,revision:revision(actor)+Number(Boolean(methods[action.kind]))};
 if(action.kind==='gameplay'){
  const handler=gameplayHandlers.get(action.payload?.kind),operationId=action.payload?.operationId;
  if(!handler||typeof operationId!=='string'||!/^[A-Za-z0-9_-]{1,160}$/.test(operationId)||(Object.hasOwn(action.payload.payload?.options??{},'operationId')&&action.payload.payload.options.operationId!==operationId))throw new Error('Invalid managed gameplay request.');
  saved.operationId=operationId;saved.status='applying';
  const context={author:message.author,operationId,rootOperationId:operationId,write:async(changes,result)=>{
    saved.result=clone(result);
    await writeAuthorityDocument(actor,{...changes,[`flags.${ID}.nativeWorkshopOperations.${saved.id}`]:saved});
  }};
  context.executeNested=(kind,payload)=>{
   const nested=gameplayHandlers.get(kind);if(!nested)throw new Error('Unknown nested gameplay operation.');
   const nestedId=payload.options?.operationId??operationId;
   return nested(actor,clone(payload),{...context,operationId:nestedId});
  };
  const result=await handler(actor,clone(action.payload.payload),context);
  saved.status='complete';saved.result=clone(result);
  const completed={[`flags.${ID}.nativeWorkshopOperations.${saved.id}`]:saved};
  for(const old of Object.values(actor.getFlag(ID,'nativeWorkshopOperations')??{}))if(old.kind==='gameplay'&&old.status==='applying'&&old.operationId===operationId)completed[`flags.${ID}.nativeWorkshopOperations.${old.id}`]={...old,status:'complete',result:clone(result)};
  await writeAuthorityDocument(actor,completed);
 } else if(methods[action.kind]) {
  const retired=workshopRollClaimChanges(actor);
  if(Object.keys(retired).length)await writeAuthorityDocument(actor,retired);
  const options={...action.options,expectedRevision:expected,operationReceipt:saved};
  const value=action.kind==='save'?action.payload.saved:action.kind==='sell'?action.payload.sale:action.payload.portable;
  await state[methods[action.kind]](actor,value,options);
 } else {
  const operation=action.payload?.operation, rollId=operation?.id??action.payload?.id;
  if(typeof rollId!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(rollId))throw new Error('Invalid Workshop roll identity.');
  const roll=nativeWorkshopRoll(actor,rollId);
  const changes={};
  if(action.kind==='claim-roll') {
   if(roll)throw new Error('This roll has already been started.');
   if(operation?.status!=='prepared')throw new Error('Invalid Workshop roll claim.');
   saved.result={id:rollId,kind:operation.kind,status:'prepared',authorId:message.author.id};
   Object.assign(changes,workshopRollClaimChanges(actor,saved.result));
  } else {
   if(roll && roll.authorId!==message.author.id)throw new Error('Only the owner who started this use can finish it.');
   if(action.kind==='roll-phase') {
    const allowed=roll?.status==='prepared'?'evaluating':roll?.status==='evaluating'?'evaluated':null;
    if(!allowed||operation?.status!==allowed)throw new Error('This roll has already advanced. Submit a fresh roll to try again.');
    if(operation.status==='evaluated'&&(!Array.isArray(operation.faces)||operation.faces.length<1||operation.faces.length>6||operation.faces.some(face=>!Number.isSafeInteger(face)||face<1||face>20)))throw new Error('Invalid retained Workshop dice.');
    saved.result={...roll,...clone(operation),authorId:roll.authorId};
    changes[rollFlag(rollId)]=saved.result;
   } else {
    if(action.kind==='complete-roll'&&!roll)throw new Error('This Workshop roll could not be found.');
    if(roll && !['complete','interrupted'].includes(roll.status)) {
     saved.result=action.kind==='interrupt-roll'
      ? {...roll,status:'interrupted',interruptedPhase:roll.status}
      : {id:roll.id,kind:roll.kind,status:'complete',authorId:roll.authorId};
     changes[rollFlag(rollId)]=saved.result;
    } else saved.result=roll??{id:rollId,status:'interrupted'};
   }
  }
  changes[`flags.${ID}.nativeWorkshopOperations.${saved.id}`]=saved;
  await writeAuthorityDocument(actor,changes);
 }
 const after=receipt(actor,id);validateReceipt(after,signature,message.author.id);
 await message.update({[`flags.${ID}.nativeWorkshopStatus`]:{status:'complete'}});
 return resultFor(actor,action.kind,after);
}
export function registerNativeWorkshopRequests(){
 Hooks.on('createChatMessage',message=>{if(!message.getFlag(ID,'nativeWorkshopRequest')||!shouldProcessRequest(message))return;resolveNativeWorkshopRequest(message.id).catch(async error=>{
  const action=message.getFlag(ID,'nativeWorkshopRequest'),actor=await fromUuid(action.actorUuid).catch(()=>null);
  if(receipt(actor,message.id))return;
  await message.update({[`flags.${ID}.nativeWorkshopStatus`]:{status:'failed',error:error.message}}).catch(()=>{});
 });});
 Hooks.on('renderChatMessageHTML',(message,element)=>{if(message.getFlag(ID,'nativeWorkshopRequest')){element.hidden=true;element.style.display='none';}});
}
