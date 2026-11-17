import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const ID='heroes-of-legend';
async function fixture(){
 const users=[{id:'gm',isGM:true},{id:'owner-a',isGM:false},{id:'owner-b',isGM:false}];users.activeGM={...users[0],isSelf:true};
 const flags={},messages=new Map(),gmHooks=new Map(),formulas=[],items=[{id:'ammo',name:'Arrows',type:'equipment',system:{catalogId:'item-ammunition-bundle',quantity:1,inventoryDie:8}},{id:'armor',name:'Custom Armor',type:'equipment',system:{catalogId:'custom',quantity:1,inventoryDie:0},description:'Keep me'}];
 messages.find=fn=>[...messages.values()].find(fn);let serial=0,failItemAck=false,failRoll=false;
 const actor={uuid:'Actor.hero',type:'creature',pack:null,name:'Hero',getFlag:(_,key)=>flags[key],testUserPermission:user=>users.some(owner=>owner.id===user?.id),items};items.get=id=>items.find(item=>item.id===id);
 actor.update=async changes=>{assert.ok(!Object.hasOwn(changes,'items'),'supply never replaces Actor.items');for(const[key,value]of Object.entries(changes)){const path=key.split('.').slice(2);let target=flags;for(const part of path.slice(0,-1))target=target[part]??={};target[path.at(-1)]=structuredClone(value);}return actor;};
 for(const item of items){item.actor=actor;item.uuid=`Actor.hero.Item.${item.id}`;item.update=async changes=>{assert.deepEqual(Object.keys(changes),['system.inventoryDie']);item.system.inventoryDie=changes['system.inventoryDie'];if(failItemAck){failItemAck=false,failRoll=false;throw Error('Item acknowledgement lost');}return item;};}
 async function client(user){
  const context=vm.createContext({structuredClone,TextEncoder,crypto:webcrypto,setTimeout,clearTimeout,console,Date,Map,Promise,JSON,fromUuid:async uuid=>uuid===actor.uuid?actor:null,
   game:{user,users,socket:{id:user.id==='gm'?'gm-socket':`${user.id}-socket`},settings:{get:()=>({userId:'gm',clientId:'gm-socket'})},messages,actors:[actor],scenes:[],combats:[]},
   foundry:{utils:{randomID:()=>`generated-${++serial}`,escapeHTML:String},dice:{Roll:class{constructor(formula){this.formula=formula;this.dice=[{results:[{active:true,result:1}]}];}async evaluate(){assert.equal(user.id,'gm','only relay evaluates dice');formulas.push(this.formula);if(failRoll){failRoll=false;throw Error('Roll result lost');}items[1].description='Edited while supply roll awaited';await Promise.resolve();return this;}toJSON(){return{formula:this.formula};}static fromData(value){return value;}}}},
   Hooks:{on:(key,fn)=>{if(user.id==='gm')gmHooks.set(key,fn);},once:()=>{}},ui:{notifications:{error:()=>{},warn:()=>{}}},
  });
  context.ChatMessage={getSpeaker:()=>({actor:actor.uuid}),create:async data=>{const message={...structuredClone(data),id:`message-${++serial}`,author:user,getFlag(scope,key){return this.flags?.[scope]?.[key];},async update(changes){for(const[key,value]of Object.entries(changes)){const path=key.split('.');let target=this;for(const part of path.slice(0,-1))target=target[part]??={};target[path.at(-1)]=structuredClone(value);}return this;}};messages.set(message.id,message);if(message.getFlag(ID,'nativeWorkshopRequest'))queueMicrotask(()=>gmHooks.get('createChatMessage')?.(message));return message;}};
  const modules=new Map();
  async function load(name){if(modules.has(name))return modules.get(name);
   const url=new URL(`../src/services/${name}.mjs`,import.meta.url),module=new vm.SourceTextModule(await readFile(url,'utf8'),{context});modules.set(name,module);
   await module.link(async spec=>{
    if(['./authority.mjs','./native-workshop-coordinator.mjs'].includes(spec))return load(spec.slice(2,-4));
    let values;
    if(spec==='./native-workshop-state.mjs')values={};else if(spec==='./consumables.mjs')values={tracksConsumable:()=>true};else values=await import(new URL(spec,url));
    return new vm.SyntheticModule(Object.keys(values),function(){for(const[key,value]of Object.entries(values))this.setExport(key,value);},{context});
   });await module.evaluate();return module;
  }
  const coordinator=(await load('native-workshop-coordinator')).namespace;if(user.id==='gm')coordinator.registerNativeWorkshopRequests();
  return {api:(await load('inventory')).namespace,coordinator};
 }
 const gm=await client(users[0]),a=await client(users[1]),b=await client(users[2]);
 const until=async predicate=>{const end=Date.now()+2000;while(!predicate()){if(Date.now()>end)throw Error('Fixture did not settle');await new Promise(resolve=>setTimeout(resolve,1));}};
 return{actor,items,flags,messages,formulas,gm,a,b,until,loseItemAck:()=>{failItemAck=true;},loseRoll:()=>{failRoll=true;}};
}
test('two actual owner transports share one GM supply executor: d8 to d6 to d4, unrelated Item edits survive',async()=>{
 const f=await fixture();
 const results=await Promise.all([f.a.api.consumeOwnedSupply(f.actor,f.items[0],{operationId:'owner-a-use'}),f.b.api.consumeOwnedSupply(f.actor,f.items[0],{operationId:'owner-b-use'})]);
 assert.deepEqual(f.formulas,['1d8','1d6']);assert.equal(f.items[0].system.inventoryDie,4);assert.equal(f.items[1].description,'Edited while supply roll awaited');
 assert.deepEqual(results.map(result=>result.after).sort(),[4,6]);
 await f.a.api.consumeOwnedSupply(f.actor,f.items[0],{operationId:'owner-a-use'});assert.equal(f.formulas.length,2);assert.equal(f.items[0].system.inventoryDie,4);
});
test('a lost Item acknowledgement resumes its saved result without another roll or depletion',async()=>{
 const f=await fixture();f.loseItemAck();
 const result=f.a.api.consumeOwnedSupply(f.actor,f.items[0],{operationId:'lost-ack'});
 await f.until(()=>f.flags.supplyActions?.['lost-ack']?.phase==='rolled'&&f.items[0].system.inventoryDie===6);
 const request=[...f.messages.values()].find(message=>message.getFlag(ID,'nativeWorkshopRequest'));
 await f.gm.coordinator.resolveNativeWorkshopRequest(request.id);
 assert.equal((await result).after,6);assert.deepEqual(f.formulas,['1d8']);assert.equal(f.flags.supplyActions['lost-ack'].phase,'applied');
});


test('actual coordinator permits DA confirmation of a missing original roll using the same operation identity',async()=>{
 const f=await fixture();f.loseRoll();
 const original=f.a.api.consumeOwnedSupply(f.actor,f.items[0],{operationId:'missing-result'});
 await f.until(()=>f.flags.supplyActions?.['missing-result']?.phase==='rolling'&&f.formulas.length===1);
 await assert.rejects(f.b.api.reconcileOwnedSupply(f.actor,f.items[0],{operationId:'missing-result'}),/Only the DA/);
 await f.items[0].update({'system.inventoryDie':6});
 const fixed=await f.gm.api.reconcileOwnedSupply(f.actor,f.items[0],{operationId:'missing-result'});
 assert.equal(fixed.reconciled,true);assert.equal((await original).after,6);assert.equal(f.formulas.length,1);
 assert.ok(Object.values(f.flags.nativeWorkshopOperations).every(receipt=>receipt.status==='complete'));
});
test('manual depletion is item-only, serialized and replay-safe while preserving quantity and authored identity',async()=>{
 const f=await fixture();f.items[1].description='Independent edit';f.items[0].name='My engraved arrows';
 const result=await f.a.api.depleteOwnedSupply(f.actor,f.items[0],{operationId:'manual-empty'});
 assert.equal(result.changed,true);
 await f.a.api.depleteOwnedSupply(f.actor,f.items[0],{operationId:'manual-empty'});
 assert.equal(f.items[0].system.inventoryDie,0);assert.equal(f.items[0].system.quantity,1);
 assert.equal(f.items[0].name,'My engraved arrows');assert.equal(f.items[0].system.catalogId,'item-ammunition-bundle');
 assert.equal(f.items[1].description,'Independent edit');assert.equal(f.formulas.length,0);
 assert.equal((await f.a.api.depleteOwnedSupply(f.actor,f.items[0],{operationId:'already-empty'})).changed,false);
});
test('manual depletion rejects denied owners and foreign document identities before any request or mutation',async()=>{
 const f=await fixture();const count=f.messages.size;
 await assert.rejects(f.a.api.depleteOwnedSupply(f.actor,{...f.items[0],actor:{uuid:'Actor.other'}},{operationId:'foreign'}),/owned/);
 f.actor.testUserPermission=()=>false;
 await assert.rejects(f.a.api.depleteOwnedSupply(f.actor,f.items[0],{operationId:'denied'}),/owned/);
 assert.equal(f.messages.size,count);assert.equal(f.items[0].system.inventoryDie,8);assert.equal(f.items[0].system.quantity,1);
 assert.equal(f.formulas.length,0);
});

test('nested torch supply missing result reconciles under the saved outer authority identity without reroll',async()=>{
 const f=await fixture();f.loseRoll();
 f.gm.coordinator.registerNativeGameplayHandler('torch-test',async(actor,payload,context)=>context.executeNested('supply',{itemId:'ammo',options:{operationId:'hourly-check'}}));
 const original=f.a.coordinator.coordinateNativeGameplay(f.actor,{kind:'torch-test',operationId:'outer-torch',payload:{}});
 await f.until(()=>f.flags.supplyActions?.['hourly-check']?.phase==='rolling'&&f.formulas.length===1);
 assert.equal(f.flags.supplyActions['hourly-check'].authorityOperationId,'outer-torch');
 await f.items[0].update({'system.inventoryDie':6});
 await f.gm.api.reconcileOwnedSupply(f.actor,f.items[0],{operationId:'hourly-check'});
 assert.equal((await original).after,6);assert.equal(f.formulas.length,1);
 assert.ok(Object.values(f.flags.nativeWorkshopOperations).every(receipt=>receipt.status==='complete'));
});
