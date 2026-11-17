import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const ID='heroes-of-legend';
async function fixture(){
 const flags={nativeWorkshop:{portable:{format:'heroes-of-legend-character',schemaVersion:7,draft:{}}},forgeVitals:{dying:true,failedDeathRolls:2,successfulDeathRolls:1,gritTrigger:'failure',immediateDeathRolls:['hit'],scars:['Old scar']}},messages=new Map(),user={id:'owner',isGM:true};let writes=0;
 const actor={id:'hero',uuid:'Actor.hero',type:'character',items:[],system:{health:{value:0,max:15},sp:{value:2,max:6},grit:{spent:0,granted:1,available:1},recovery:{unavailableHp:2,debtUsed:true}},getFlag:(_,key)=>flags[key],testUserPermission:()=>true,validate(){}};
 const game={user,users:[user],messages},context=vm.createContext({structuredClone,game,fromUuid:async()=>actor,foundry:{utils:{expandObject:s=>s}}});
 const authority={ensureAuthorityReady:async()=>{},shouldProcessRequest:()=>true,isCreationAuthority:()=>true,enqueueCharacterOperation:run=>run(),writeAuthorityDocument:async(_actor,changes)=>{writes++;for(const[path,value]of Object.entries(changes)){if(path.startsWith('system.')){const keys=path.split('.').slice(1);actor.system[keys[0]][keys[1]]=value;continue;}const keys=path.split('.').slice(2);let at=flags;for(const key of keys.slice(0,-1))at=at[key]??={};at[keys.at(-1)]=structuredClone(value);}},createActionMessage:async data=>{const message={...data,id:`message${messages.size}`,author:user,getFlag:(_,key)=>data.flags[ID][key],update:async changes=>Object.assign(message,changes)};messages.set(message.id,message);return message;}};
 const url=new URL('../src/services/recovery.mjs',import.meta.url),mod=new vm.SourceTextModule(await readFile(url,'utf8'),{context});
 await mod.link(async spec=>{const exports=spec==='./authority.mjs'?authority:spec==='./turn-lock.mjs'?{assertNoPendingTurn(){}}:await import(new URL(spec,url));return new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context});});await mod.evaluate();
 const basis=()=>import('../src/services/damage.mjs').then(({damageBasis})=>damageBasis(actor));
 const action=async draft=>{const message=await mod.namespace.requestRecovery(actor,await basis(),draft);await mod.namespace.resolveRecoveryRequest(message.id);return message;};
 return {actor,flags,action,api:mod.namespace,get writes(){return writes;}};
}
test('current native Grit receipt persists half-HP and both cleared death tallies once without legacy state',async()=>{
 const f=await fixture(),message=await f.action({kind:'grit'});assert.equal(f.actor.system.health.value,8);assert.equal(f.actor.system.grit.spent,1);assert.equal(f.flags.forgeVitals.dying,false);assert.equal(f.flags.forgeVitals.failedDeathRolls,0);assert.equal(f.flags.forgeVitals.successfulDeathRolls,0);assert.deepEqual(f.flags.forgeVitals.immediateDeathRolls,[]);assert.equal(f.flags.survival,undefined);assert(f.flags.operationReceipts[message.id].applied);
 await f.api.resolveRecoveryRequest(message.id);assert.equal(f.writes,1);assert.equal(f.actor.system.grit.spent,1);
});
test('current native recovery refuses safe breath without a write and healing respects stacked unavailable HP',async()=>{
 const f=await fixture();await assert.rejects(f.action({kind:'breath'}),/safe overnight rest/);assert.equal(f.writes,0);await f.action({kind:'heal',amount:20,lifeResistance:0});assert.equal(f.actor.system.health.value,13);assert.equal(f.flags.forgeVitals.dying,false);assert.equal(f.flags.survival,undefined);
});
