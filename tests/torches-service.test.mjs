import {assertCurrentGameplayActor} from '../src/rules/current-character.mjs';
import {nativeItemForWorkshopInstance} from "../src/rules/native-item-identity.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createContext,SourceTextModule,SyntheticModule} from 'node:vm';
import {torchClock,torchLight,TORCH_CHECK_SECONDS} from '../src/rules/consumables.mjs';
const ID='heroes-of-legend';
const clone=value=>structuredClone(value);
class ForcedDeletion {}
function document(source){
 const doc=clone(source);
 doc.getFlag=(scope,key)=>doc.flags?.[scope]?.[key];
 doc.toObject=()=>JSON.parse(JSON.stringify(doc));
 doc.update=async changes=>{for(const [key,value] of Object.entries(changes)){const parts=key.split('.');let target=doc;for(const part of parts.slice(0,-1))target=target[part]??={};const final=parts.at(-1);if(value instanceof ForcedDeletion)delete target[final];else target[final]=clone(value);}return doc;};
 return doc;
}
async function fixture({tracked=true,after=6}={}){
 const hooks=new Map(),docs=new Map(),requests=[],checks=[],warnings=[],handlers=new Map();let pending=Promise.resolve(),counter=0;
 const actor=document({uuid:'Actor.hero',name:'Hero',type:'character',flags:{[ID]:{nativeWorkshop:{portable:{format:'heroes-of-legend-character',schemaVersion:7,draft:{}}}}},items:[]});actor.testUserPermission=()=>true;
 const item=document({id:'torch',uuid:'Actor.hero.Item.torch',name:'Lighting bundle',type:'equipment',system:{catalogId:'item-lighting-bundle',quantity:1,carried:true,held:false,hands:0,inventoryDie:6},flags:{}});
 actor.items=[item];actor.items.get=id=>actor.items.find(item=>item.id===id);
 const token=document({uuid:'Scene.test.Token.hero',light:{bright:0,dim:0,color:null},flags:{}});token.actor=actor;token.parent={grid:{distance:5}};
 token.toObject=()=>({light:clone(token.light)});token.clone=changes=>({toObject:()=>({light:clone(changes.light)})});actor.getActiveTokens=()=>[token];
 docs.set(actor.uuid,actor);docs.set(token.uuid,token);
 const game={user:{id:'gm',isGM:true},users:[{id:'gm',isGM:true}],socket:{id:'client'},settings:{get:()=>({userId:'gm',clientId:'client'})},time:{worldTime:0},actors:[actor]};
 const consumeOwnedSupply=async(actor,item,{operationId})=>{const saved=actor.getFlag(ID,'supplyActions')?.[operationId];if(saved)return saved;checks.push(operationId);const record={after,tracked:true};await item.update({'system.inventoryDie':after});await actor.update({[`flags.${ID}.supplyActions.${operationId}`]:record});return record;};
 const exports={registerNativeGameplayHandler:(kind,handler)=>handlers.set(kind,handler),coordinateNativeGameplay:(target,{kind,operationId,payload})=>{
  requests.push({flags:{[ID]:{torchRequest:{...payload,kind}}}});
  const execute=()=>handlers.get(kind)(target,payload,{author:game.user,operationId,write:changes=>target.update(changes),executeNested:(_kind,nested)=>consumeOwnedSupply(target,target.items.get(nested.itemId),{operationId:nested.options.operationId,label:nested.label})});
  pending=pending.catch(()=>{}).then(execute);return pending;
 },assertCurrentGameplayActor,nativeItemForWorkshopInstance,assertSupplyActionAvailable:actor=>{if(actor.getFlag(ID,"pendingInventory"))throw new Error("Finish the unfinished supply check first.");},torchClock,torchLight,TORCH_CHECK_SECONDS,tracksConsumable:()=>tracked,consumeOwnedSupply,createActionMessage:async source=>{requests.push(source);return source;},shouldProcessRequest:()=>true,enqueueCharacterOperation:operation=>{pending=pending.catch(()=>{}).then(operation);return pending;}};
 const context=createContext({structuredClone,game,canvas:{tokens:{controlled:[]}},fromUuid:async uuid=>docs.get(uuid),foundry:{data:{operators:{ForcedDeletion}},utils:{randomID:()=>`torch-${++counter}`,escapeHTML:value=>value},applications:{api:{DialogV2:{confirm:async()=>true}}}},ui:{notifications:{warn:value=>warnings.push(value),error:value=>warnings.push(value)}},Hooks:{on:(name,fn)=>hooks.set(name,fn),once:(name,fn)=>hooks.set(name,fn)}});
 const module=new SourceTextModule(await readFile(new URL('../src/services/torches.mjs',import.meta.url),'utf8'),{context});
 await module.link(async()=>{const dep=new SyntheticModule(Object.keys(exports),function(){for(const [key,value] of Object.entries(exports))this.setExport(key,value);},{context});await dep.link(()=>{});await dep.evaluate();return dep;});await module.evaluate();const api=module.namespace;api.registerTorches();
 async function command(command,{id=`message-${++counter}`,author=game.user}={}){return exports.coordinateNativeGameplay(actor,{kind:'torch-toggle',operationId:id,payload:{itemId:item.id,command,tokenUuid:token.uuid}});}
 return {api,actor,item,token,game,checks,warnings,requests,command,hooks,setTracking:value=>{tracked=value;},settled:async()=>{await pending;await new Promise(resolve=>setTimeout(resolve,0));await pending;}};
}
test('torch service checks ownership and lights three squares without occupying a hand',async()=>{
 const f=await fixture();f.actor.testUserPermission=()=>false;
 await assert.rejects(f.api.requestTorchToggle(f.actor,'torch'),/own/);f.actor.testUserPermission=()=>true;
 f.actor.items.push({id:'greatsword',type:'equipment',system:{quantity:1,carried:true,held:true,hands:2}});
 await f.command('light');assert.equal(f.token.light.bright,15);assert.equal(f.token.light.dim,15);
 assert.equal(f.item.system.held,false);assert.equal(f.item.system.hands,0);assert.equal(f.item.getFlag(ID,'torch').pendingLight,false);
});
test('lit-only hourly clock pauses partial hours, tracking-off never consumes, depletion restores light and hands',async()=>{
 const f=await fixture({after:0});await f.command('light');
 f.game.time.worldTime=1800;await f.command('extinguish');assert.equal(f.checks.length,0);assert.equal(f.item.getFlag(ID,'torch').elapsedSeconds,1800);
 f.game.time.worldTime=9000;await f.command('light');f.game.time.worldTime=10800;await f.api.tickTorch(f.actor,f.item);
 assert.equal(f.checks.length,1);assert.equal(f.item.getFlag(ID,'torch').lit,false);assert.equal(f.token.light.bright,0);assert.equal(f.item.system.held,false);assert.equal(f.item.system.hands,0);
 const off=await fixture({tracked:false});await off.command('light');off.game.time.worldTime=10000;await off.api.tickTorch(off.actor,off.item);assert.equal(off.checks.length,0);assert.equal(off.item.getFlag(ID,'torch').elapsedSeconds,0);
});
test('interrupted light can extinguish; unrelated token-light changes survive',async()=>{
 const f=await fixture();await f.command('light');await f.item.update({[`flags.${ID}.torch.pendingLight`]:true});await f.command('extinguish');assert.equal(f.item.getFlag(ID,'torch').lit,false);assert.equal(f.token.light.bright,0);
 await f.command('light');f.token.light={...f.token.light,bright:40,color:'#ffffff'};await f.command('extinguish');assert.equal(f.token.light.bright,40);assert.equal(f.token.light.color,'#ffffff');assert.equal(f.token.getFlag(ID,'torchItem'),undefined);
});
test('lost check acknowledgment replays a receipt once and blocks missing-result rerolls',async()=>{
 const f=await fixture();await f.command('light');
 f.game.time.worldTime=3600;const operation='torch-torch-1';
 await f.item.update({[`flags.${ID}.torch.pendingCheck`]:operation});
 await assert.rejects(f.api.tickTorch(f.actor,f.item),/interrupted/);assert.equal(f.checks.length,0);
 await f.actor.update({[`flags.${ID}.supplyActions.${operation}`]:{after:6,tracked:true}});
 await f.api.tickTorch(f.actor,f.item);assert.equal(f.checks.length,0);assert.equal(f.item.getFlag(ID,'torch').checkIndex,1);assert.equal(f.item.getFlag(ID,'torch').elapsedSeconds,0);
 await f.api.tickTorch(f.actor,f.item);assert.equal(f.checks.length,0);
});
test('rewound game time cannot recharge already-accounted torch time',async()=>{
 const f=await fixture();await f.command('light');f.game.time.worldTime=3600;await f.api.tickTorch(f.actor,f.item);assert.equal(f.checks.length,1);
 f.game.time.worldTime=0;await f.api.tickTorch(f.actor,f.item);f.game.time.worldTime=3600;await f.api.tickTorch(f.actor,f.item);assert.equal(f.checks.length,1);
});

test('manual missing-result reconciliation closes its hour without a second supply roll',async()=>{
 const f=await fixture();await f.command('light');f.game.time.worldTime=3600;
 await f.item.update({[`flags.${ID}.torch.pendingCheck`]:'torch-torch-1'});
 await assert.rejects(f.api.tickTorch(f.actor,f.item),/interrupted/);
 await f.api.requestTorchToggle(f.actor,'torch');
 assert.equal(f.requests.at(-1).flags[ID].torchRequest.command,'reconcile');
 assert.equal(f.checks.length,0);assert.equal(f.item.getFlag(ID,'torch').checkIndex,1);assert.equal(f.item.getFlag(ID,'torch').pendingCheck,null);
});

test('committed depletion with lost acknowledgment completes receipt then restores without reroll',async()=>{
 const f=await fixture();await f.command('light');f.game.time.worldTime=3600;
 await f.item.update({'system.inventoryDie':0,[`flags.${ID}.torch.pendingCheck`]:'torch-torch-1',[`flags.${ID}.torch.elapsedSeconds`]:3600});
 await f.actor.update({[`flags.${ID}.supplyActions.torch-torch-1`]:{after:0,tracked:true}});
 await f.api.tickTorch(f.actor,f.item);
 assert.equal(f.checks.length,0);assert.equal(f.item.getFlag(ID,'torch').pendingCheck,null);assert.equal(f.item.getFlag(ID,'torch').checkIndex,1);assert.equal(f.item.getFlag(ID,'torch').lit,false);assert.equal(f.token.light.bright,0);
});
test('external supply depletion schedules light restoration immediately',async()=>{
 const f=await fixture();await f.command('light');await f.item.update({'system.inventoryDie':0});f.hooks.get('updateItem')(f.item,{system:{inventoryDie:0}});await f.settled();assert.equal(f.item.getFlag(ID,'torch').lit,false);assert.equal(f.token.light.bright,0);assert.equal(f.checks.length,0);
});

test('automatic ticks include synthetic scene Actors and deduplicate linked world Actors',async()=>{
 const f=await fixture();await f.command('light');
 f.game.actors=[];f.actor.uuid='Scene.test.Token.hero.Actor.synthetic';f.game.scenes=[{tokens:[{actor:f.actor}]}];
 f.game.time.worldTime=3600;f.hooks.get('updateWorldTime')();await f.settled();
 assert.equal(f.checks.length,1);assert.equal(f.item.getFlag(ID,'torch').checkIndex,1);
 f.game.actors=[f.actor];f.game.scenes.push({tokens:[{actor:f.actor},{actor:f.actor}]});
 assert.equal(f.api.torchActors().length,1);
 f.game.time.worldTime=7200;f.hooks.get('updateWorldTime')();await f.settled();assert.equal(f.checks.length,2);
 f.game.time.worldTime=8000;f.hooks.get('holConsumableTrackingChanged')();await f.settled();assert.equal(f.item.getFlag(ID,'torch').lastWorldTime,8000);
});
test('two GM clients process automatic torch time only on the designated relay',async()=>{
 const authority=await fixture(),other=await fixture();await authority.command('light');
 other.game.socket.id='other-client';other.game.actors=[authority.actor];
 authority.game.time.worldTime=3600;other.game.time.worldTime=3600;
 other.hooks.get('updateWorldTime')();authority.hooks.get('updateWorldTime')();await Promise.all([authority.settled(),other.settled()]);
 assert.equal(authority.checks.length,1);assert.equal(other.checks.length,0);
 assert.equal(authority.item.getFlag(ID,'torch').checkIndex,1);
});


test('inventory reservations block torch ignition and hourly rolls before a torch reservation is created',async()=>{
 const f=await fixture();await f.actor.update({[`flags.${ID}.pendingInventory`]:{requestId:'existing'}});
 await assert.rejects(f.command('light'),/unfinished supply/);assert.equal(f.item.getFlag(ID,'torch'),undefined);
 await f.actor.update({[`flags.${ID}.pendingInventory`]:null});await f.command('light');f.game.time.worldTime=3600;
 await f.actor.update({[`flags.${ID}.pendingInventory`]:{requestId:'existing'}});
 await assert.rejects(f.api.tickTorch(f.actor,f.item),/unfinished supply/);assert.equal(f.item.getFlag(ID,'torch').pendingCheck,undefined);assert.equal(f.checks.length,0);
 await assert.rejects(f.command('extinguish'),/unfinished supply/);assert.equal(f.item.getFlag(ID,'torch').lit,false);assert.equal(f.token.light.bright,0);
 await f.actor.update({[`flags.${ID}.pendingInventory`]:null});await f.command('light');await f.api.tickTorch(f.actor,f.item);assert.equal(f.checks.length,1);
});


test('deleting a lit lighting bundle restores token light without writing deleted item or rolling',async()=>{
 const f=await fixture();await f.command('light');
 f.item.update=()=>assert.fail('deleted Item cannot be updated');
 f.hooks.get('deleteItem')(f.item);await f.settled();
 assert.equal(f.token.light.bright,0);assert.equal(f.token.getFlag(ID,'torchItem'),undefined);assert.equal(f.checks.length,0);
});


test('two held weapons leave their arrangements intact when using a lighting bundle',async()=>{
 const f=await fixture();
 for(const id of ["first-sword","second-sword"])f.actor.items.push({id,type:"equipment",system:{catalogId:"item-ordinary-melee-weapon",quantity:1,carried:true,held:true,hands:0}});
 await f.command('light');assert.equal(f.item.getFlag(ID,'torch').lit,true);
 assert.deepEqual(f.actor.items.slice(1).map(item=>[item.system.held,item.system.hands]),[[true,0],[true,0]]);
});
