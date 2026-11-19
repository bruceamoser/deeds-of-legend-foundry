import {coordinateNativeGameplay,registerNativeGameplayHandler} from "./native-workshop-coordinator.mjs";
import {assertCurrentGameplayActor} from "../rules/current-character.mjs";
import {nativeItemForWorkshopInstance} from "../rules/native-item-identity.mjs";
import {torchClock,torchLight,TORCH_CHECK_SECONDS} from '../rules/consumables.mjs';
import {tracksConsumable} from './consumables.mjs';
import {assertSupplyActionAvailable} from './inventory.mjs';
import {enqueueCharacterOperation} from './authority.mjs';
const ID='heroes-of-legend';
const stateOf=item=>item?.getFlag(ID,'torch') ?? {};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function executor() {
  const relay=game.settings.get(ID,'actionRelay');
  return game.user.isGM && relay?.userId===game.user.id && relay?.clientId===game.socket.id;
}
function lightingItem(actor,instance) {
  const item=nativeItemForWorkshopInstance(actor,instance);return item?.type==='equipment'?item:null;
}
export function torchItemActions(actor,item) {
  const owned=lightingItem(actor,item.instanceId??item.id);
  if(owned?.system.catalogId!=='item-lighting-bundle')return [];
  const state=stateOf(owned);
  return [{action:'torch-toggle',label:state.pendingCheck?'Resolve torch check':state.lit?'Extinguish torch':'Light torch',
    disabled:!actor.testUserPermission(game.user,'OWNER'),title:state.pendingCheck?'Check the supply die before continuing.':'Maneuver · light within 3 squares'}];
}
function chooseToken(actor) {
  const selected=(canvas?.tokens?.controlled??[]).map(token=>token.document).filter(token=>token.actor?.uuid===actor.uuid);
  const available=selected.length ? selected : actor.getActiveTokens(true,true);
  if(available.length!==1)throw new Error('Select exactly one token for this character to carry the torch.');
  return available[0];
}
export async function requestTorchToggle(actor,instance) {
  assertCurrentGameplayActor(actor);
  if(!actor.testUserPermission(game.user,'OWNER'))throw new Error('You must own this character to use its torch.');
  const item=lightingItem(actor,instance);
  if(item?.system.catalogId!=='item-lighting-bundle')throw new Error('Choose an owned lighting bundle.');
  const state=stateOf(item);
  let command=state.lit?'extinguish':'light';
  if(state.pendingCheck) {
    const confirmed=await foundry.applications.api.DialogV2.confirm({window:{title:'Resolve interrupted torch check'},content:'<p>This hourly check was interrupted. Check chat and set the lighting bundle’s supply die to the correct result before continuing. Continuing records that hour as handled; it does not roll again.</p>',yes:{label:'I have checked the supply die'}});
    if(!confirmed)return;
    command='reconcile';
  }
  const token=command==='light'?chooseToken(actor):null;
  return coordinateNativeGameplay(actor,{kind:'torch-toggle',operationId:foundry.utils.randomID(),payload:{itemId:item.id,command,tokenUuid:token?.uuid??null}});
}
async function restoreLight(item,{deleted=false}={}) {
  const state=stateOf(item);
  for(const light of state.lights??[]) {
    const token=await fromUuid(light.uuid);
    if(!token)continue;
    if(token.getFlag(ID,'torchItem')!==item.uuid)continue;
    // A DA or another light effect may have changed this token since ignition.
    const current=token.toObject().light;
    const updates={[`flags.${ID}.torchItem`]:new foundry.data.operators.ForcedDeletion()};
    if(same(current,light.applied))updates.light=light.before;
    await token.update(updates);
  }
  if(deleted)return;
  const fresh=stateOf(item);
  const changes={[`flags.${ID}.torch`]:{...fresh,lit:false,pendingLight:false,lights:[],lastWorldTime:game.time.worldTime}};
  if(item.system.held && item.system.hands===1 && fresh.priorArrangement)Object.assign(changes,{
    'system.held':fresh.priorArrangement.held,'system.hands':fresh.priorArrangement.hands,
  });
  await item.update(changes);
}
async function ignite(actor,item,token) {
  if(stateOf(item).lit)return;
  assertSupplyActionAvailable(actor);
  if(!item.system.quantity || !item.system.carried)throw new Error('Carry the lighting bundle before lighting a torch.');
  if(tracksConsumable(item) && !item.system.inventoryDie)throw new Error('The lighting bundle is depleted.');
  if(!token || token.actor?.uuid!==actor.uuid)throw new Error('Choose this character’s token.');
  if(token.getFlag(ID,'torchItem') && token.getFlag(ID,'torchItem')!==item.uuid)throw new Error('Extinguish the torch already lighting this token first.');
  const before=token.toObject().light;
  const proposed=torchLight(before,token.parent.grid.distance);
  // Cleaning through the public document clone gives the exact persisted LightData shape.
  const applied=token.clone({light:proposed},{keepId:true}).toObject().light;
  const state={...stateOf(item),lit:true,pendingLight:true,lastWorldTime:game.time.worldTime,
    elapsedSeconds:stateOf(item).elapsedSeconds??0,checkIndex:stateOf(item).checkIndex??0,
    priorArrangement:null,lights:[{uuid:token.uuid,before,applied}]};
  await item.update({[`flags.${ID}.torch`]:state});
  await token.update({light:applied,[`flags.${ID}.torchItem`]:item.uuid});
  await item.update({[`flags.${ID}.torch.pendingLight`]:false});
}
export function tickTorch(actor,item,now=game.time.worldTime) {
  return coordinateNativeGameplay(actor,{kind:'torch-tick',operationId:foundry.utils.randomID(),payload:{itemId:item.id,now}});
}
async function tickTorchInternal(actor,item,now,context) {
  let state=stateOf(item);
  if(!state.lit)return;
  if(state.pendingLight)throw new Error(`${item.name}: torch lighting was interrupted. Extinguish it and light it again.`);
  // A supply result can commit before its chat/follow-up acknowledgement fails.
  // Finish that exact operation before depletion cleanup; never roll it again.
  if(state.pendingCheck && actor.getFlag(ID,'supplyActions')?.[state.pendingCheck]) {
    const result=await context.executeNested('supply',{itemId:item.id,label:'One hour of torch use',options:{operationId:state.pendingCheck}});
    state=stateOf(item);
    await item.update({[`flags.${ID}.torch`]:{...state,pendingCheck:null,checkIndex:(state.checkIndex??0)+1,elapsedSeconds:Math.max(0,state.elapsedSeconds-TORCH_CHECK_SECONDS)}});
    state=stateOf(item);
    if(result.after===0 && result.tracked!==false)return restoreLight(item);
  }
  if(!item.system.carried || !item.system.quantity || (tracksConsumable(item)&&!item.system.inventoryDie))return restoreLight(item);
  const clock=torchClock(state,Math.max(now,state.lastWorldTime??now),tracksConsumable(item));
  const {checksDue,...saved}=clock;
  await item.update({[`flags.${ID}.torch`]:saved});
  for(let index=0;index<checksDue;index++) {
    state=stateOf(item);
    const operationId=state.pendingCheck??`torch-${item.id}-${(state.checkIndex??0)+1}`;
    if(state.pendingCheck && !actor.getFlag(ID,'supplyActions')?.[operationId])throw new Error(`${item.name}: resolve the interrupted hourly supply check before continuing.`);
    if(!state.pendingCheck)assertSupplyActionAvailable(actor);
    if(!state.pendingCheck)await item.update({[`flags.${ID}.torch.pendingCheck`]:operationId});
    const result=await context.executeNested('supply',{itemId:item.id,label:'One hour of torch use',options:{operationId}});
    state=stateOf(item);
    await item.update({[`flags.${ID}.torch`]:{...state,pendingCheck:null,checkIndex:(state.checkIndex??0)+1,elapsedSeconds:Math.max(0,state.elapsedSeconds-TORCH_CHECK_SECONDS)}});
    if(result.after===0 && result.tracked!==false){await restoreLight(item);break;}
  }
}
registerNativeGameplayHandler('torch-toggle',async(actor,request,context)=>{
  assertCurrentGameplayActor(actor);
  if(!actor.testUserPermission(context.author,'OWNER'))throw new Error('Only this character’s owner can use its lighting bundle.');
  const item=actor.items.get(request.itemId);
  if(item?.system.catalogId!=='item-lighting-bundle')throw new Error('The lighting bundle is unavailable.');
  if(request.command==='light')await ignite(actor,item,await fromUuid(request.tokenUuid));
  else if(request.command==='extinguish'){try{if(!stateOf(item).pendingLight)await tickTorchInternal(actor,item,game.time.worldTime,context);}finally{await restoreLight(item);}}
  else if(request.command==='reconcile') {
    const state=stateOf(item);if(!state.pendingCheck)throw new Error('There is no interrupted torch check.');
    await item.update({[`flags.${ID}.torch`]:{...state,pendingCheck:null,checkIndex:(state.checkIndex??0)+1,elapsedSeconds:Math.max(0,state.elapsedSeconds-TORCH_CHECK_SECONDS)}});
    await tickTorchInternal(actor,item,game.time.worldTime,context);
  }else throw new Error('Unknown torch action.');
  const result={itemId:item.id,lit:stateOf(item).lit};await context.write({},result);return result;
});
registerNativeGameplayHandler('torch-tick',async(actor,{itemId,now},context)=>{
  assertCurrentGameplayActor(actor);
  const item=actor.items.get(itemId);if(item?.system.catalogId!=='item-lighting-bundle')throw new Error('The lighting bundle is unavailable.');
  await tickTorchInternal(actor,item,now,context);
  const result={itemId,lit:stateOf(item).lit};await context.write({},result);return result;
});
/** Include unlinked token Actors on every scene, once per document identity. */
export function torchActors() {
  const actors=new Map();
  const add=actor=>{if(actor?.uuid && !actor.pack)actors.set(actor.uuid,actor);};
  for(const actor of game.actors ?? [])add(actor);
  for(const scene of game.scenes ?? [])for(const token of scene.tokens ?? [])add(token.actor);
  return [...actors.values()];
}
let scheduled=false, rerun=false;
function scheduleTicks() {
  if(!executor())return;
  if(scheduled){rerun=true;return;}
  scheduled=true;
  void (async()=>{
    for(const actor of torchActors())for(const item of actor.items)if(stateOf(item).lit) {
      try{await tickTorch(actor,item);}catch(error){ui.notifications.warn(error.message);}
    }
  })().finally(()=>{scheduled=false;if(rerun){rerun=false;scheduleTicks();}});
}
export function registerTorches() {
  Hooks.on('updateWorldTime',scheduleTicks);
  Hooks.on('updateSetting',setting=>{if(setting.key===`${ID}.actionRelay`)scheduleTicks();});
  Hooks.on('holConsumableTrackingChanged',()=>{
    if(!executor())return;
    void enqueueCharacterOperation(async()=>{for(const actor of torchActors())for(const item of actor.items)if(stateOf(item).lit)await item.update({[`flags.${ID}.torch.lastWorldTime`]:game.time.worldTime});});
  });
  Hooks.on('updateItem',(item,changes)=>{if(stateOf(item).lit && changes.system && (!item.system.carried || !item.system.quantity || (tracksConsumable(item)&&!item.system.inventoryDie)))scheduleTicks();});
  Hooks.on('deleteItem',item=>{if(executor()&&stateOf(item).lit)void enqueueCharacterOperation(()=>restoreLight(item,{deleted:true})).catch(error=>ui.notifications.warn(error.message));});
  Hooks.once('ready',scheduleTicks);
}
