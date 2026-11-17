import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeDamageState} from '../src/rules/native-health.mjs';
import {managedService} from './helpers/managed-service.mjs';
let applyOwnedDamage;
import {forgeHeal,forgeStabilize} from '../src/rules/forge-vitals.mjs';
const ID='heroes-of-legend';
const basis={hp:3,maxHp:12,sp:2,maxSp:6,gritSpent:0,gritGranted:1,recovery:{},state:{scars:['Old scar']}};
test('falling creates Dying and fall Grit trigger; a positive hit at zero owes its own immediate player roll',()=>{
 const fall=nativeDamageState(basis,4,'first');assert.equal(fall.hp,0);assert.equal(fall.forgeVitals.dying,true);assert.equal(fall.forgeVitals.gritTrigger,'fall');assert.deepEqual(fall.forgeVitals.immediateDeathRolls,[]);
 const hit=nativeDamageState({...basis,hp:0,state:fall.forgeVitals},1,'second');assert.equal(hit.deathRollRequired,true);assert.deepEqual(hit.forgeVitals.immediateDeathRolls,['second']);
 const next=nativeDamageState({...basis,hp:0,state:hit.forgeVitals},1,'third');assert.deepEqual(next.forgeVitals.immediateDeathRolls,['second','third']);assert.deepEqual(next.forgeVitals.scars,['Old scar']);
 const immune=nativeDamageState({...basis,hp:0,state:next.forgeVitals},0,'immune');assert.equal(immune.deathRollRequired,false);assert.deepEqual(immune.forgeVitals.immediateDeathRolls,['second','third']);
});
test('healing and stabilization resolve ordinary Dying tallies without generating legacy wounds',()=>{
 const dying={hp:0,dying:true,failedDeathRolls:2,successfulDeathRolls:1,gritSpent:0};const limits={maxHp:12,maxSp:6,gritGranted:1};
 const healed=forgeHeal(dying,limits,2);assert.equal(healed.hp,2);assert.equal(healed.dying,false);assert.equal(healed.failedDeathRolls,0);
 const stable=forgeStabilize(dying,limits);assert.equal(stable.hp,0);assert.equal(stable.dying,false);assert.equal(stable.successfulDeathRolls,0);
 const hit=nativeDamageState({...basis,hp:0,state:stable},1,'stable-hit');assert.equal(hit.forgeVitals.dying,true);assert.deepEqual(hit.forgeVitals.immediateDeathRolls,['stable-hit']);
});
async function fixture(){
 const flags={nativeWorkshop:{portable:{format:'heroes-of-legend-character',schemaVersion:7,draft:{}}},forgeVitals:{scars:['Old scar']}},user={id:'owner',isGM:true},actor={id:'hero',uuid:'Actor.health-test',name:'Hero',type:'character',items:[],system:{health:{value:3,max:12},sp:{value:2,max:6},grit:{spent:0,granted:1},recovery:{}},testUserPermission:()=>true,getFlag:(_,key)=>flags[key]};
 let writes=0,failAcknowledgement=false;
 actor.update=async changes=>{writes++;for(const[path,value]of Object.entries(changes)){if(path==='system.health.value')actor.system.health.value=value;else if(path.startsWith('flags.')){const keys=path.split('.').slice(2);let at=flags;for(const key of keys.slice(0,-1))at=at[key]??={};at[keys.at(-1)]=structuredClone(value);}}if(failAcknowledgement){failAcknowledgement=false;throw Error('Lost acknowledgement');}};
 globalThis.game={user,world:{id:'unit'},i18n:{localize:s=>s},messages:new Map()};globalThis.foundry={utils:{randomID:()=> 'random'}};
 applyOwnedDamage=(await managedService('../../src/services/explicit-damage.mjs')).applyOwnedDamage;
 return {actor,flags,get writes(){return writes;},loseAcknowledgement(){failAcknowledgement=true;}};
}
test('owned damage atomically persists HP/death state/event receipt; lost acknowledgement cannot duplicate immediate rolls',async()=>{
 const f=await fixture();await applyOwnedDamage(f.actor,[{type:'physical',amount:4}],{operationId:'fall'});assert.equal(f.actor.system.health.value,0);assert.equal(f.flags.forgeVitals.dying,true);assert.deepEqual(f.flags.forgeVitals.immediateDeathRolls,[]);assert.equal(f.flags.survival,undefined);assert.equal(f.flags.wounds,undefined);
 f.loseAcknowledgement();await assert.rejects(applyOwnedDamage(f.actor,[{type:'physical',amount:1}],{operationId:'hit-zero'}),/Lost acknowledgement/);assert.deepEqual(f.flags.forgeVitals.immediateDeathRolls,['hit-zero']);
 await applyOwnedDamage(f.actor,[{type:'physical',amount:1}],{operationId:'hit-zero'});assert.equal(f.writes,2);assert.deepEqual(f.flags.forgeVitals.immediateDeathRolls,['hit-zero']);
 f.actor.system.damageImmunities=['fire'];await applyOwnedDamage(f.actor,[{type:'fire',amount:2}],{operationId:'immune'});assert.equal(f.flags.explicitDamage.immune.total,0);assert.deepEqual(f.flags.forgeVitals.immediateDeathRolls,['hit-zero']);
});

test('current native recovery uses half-HP Grit, clears both tallies, honors stacked Debt and rejects safe breath',async()=>{
 const {nativeRecoveryState}=await import('../src/rules/native-health.mjs');
 const current={...basis,hp:0,recovery:{unavailableHp:2,debtUsed:true},forgeVitals:{dying:true,failedDeathRolls:2,successfulDeathRolls:1,gritTrigger:'failure',scars:['Old scar'],immediateDeathRolls:['hit']}};
 const grit=nativeRecoveryState(current,{kind:'grit'});assert.equal(grit.after,6);assert.equal(grit.gritSpent,1);assert.equal(grit.forgeVitals.failedDeathRolls,0);assert.deepEqual(grit.forgeVitals.immediateDeathRolls,[]);
 const healed=nativeRecoveryState(current,{kind:'heal',amount:12});assert.equal(healed.after,10);assert.equal(healed.forgeVitals.dying,false);assert.deepEqual(healed.forgeVitals.scars,['Old scar']);
 const stable=nativeRecoveryState(current,{kind:'stabilize'});assert.equal(stable.after,0);assert.equal(stable.forgeVitals.dying,false);assert.equal(stable.forgeVitals.successfulDeathRolls,0);
 assert.throws(()=>nativeRecoveryState(current,{kind:'breath'}),/safe overnight rest/);
 assert.throws(()=>nativeRecoveryState({...current,forgeVitals:{...current.forgeVitals,dead:true}},{kind:'heal',amount:1}),/died/);
});
