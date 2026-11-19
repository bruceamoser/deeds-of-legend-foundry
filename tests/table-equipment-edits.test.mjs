import test from 'node:test';
import assert from 'node:assert/strict';
import {requestEquipment,equipmentBasis} from '../src/services/equipment.mjs';
import {supplyResultState} from '../src/services/inventory.mjs';
const ID='heroes-of-legend';
function fixture(owner=true){
 const flags={},source=[{_id:'sword',name:'Excalibur',type:'equipment',system:{catalogId:'item-ordinary-melee-weapon',description:'A blade of legend.',hands:2,held:false,worn:false,carried:true,quantity:1,inventoryDie:0}},{_id:'bow',name:'Bow',type:'equipment',system:{hands:2,held:false,worn:false,carried:true,quantity:1,inventoryDie:8}}];let writes=0;
 const system={health:{value:12,baseMax:12},sp:{value:5,max:5}};
 const actor={uuid:'Actor.table',id:'table',documentName:'Actor',testUserPermission:()=>owner,getFlag:(_,key)=>flags[key],toObject:()=>structuredClone({items:source,system}),async update(changes){writes++;if(changes.items)source.splice(0,source.length,...structuredClone(changes.items));for(const[k,v]of Object.entries(changes)){
   if(k.startsWith(`flags.${ID}.`))flags[k.slice(`flags.${ID}.`.length)]=v;
   if(k==="system.health.value")system.health.value=v;
   if(k==="system.sp.value")system.sp.value=v;
 }return actor;}};
 Object.defineProperty(actor,'items',{get(){const items=source.map(s=>({...s,id:s._id,actor,getFlag:()=>null}));items.get=id=>items.find(i=>i.id===id);return items;}});
 globalThis.game={user:{id:'owner'},i18n:{localize:()=> 'No permission'}};
 globalThis.ChatMessage={create(){throw Error('Equipment edits must not post chat');}};
 return {actor,source,system,get writes(){return writes;}};
}
test('owner arrangement is silent and permits equipment exceeding hand capacity while preserving identity and authored edits',async()=>{
 const f=fixture(),basis=equipmentBasis(f.actor),items=basis.items.map(item=>({...item,held:true}));
 await requestEquipment(f.actor,basis,items,2);
 assert(f.source.every(item=>item.system.held));assert.equal(f.source.reduce((n,item)=>n+item.system.hands,0),4);
 assert.equal(f.source[0].name,'Excalibur');assert.equal(f.source[0].system.description,'A blade of legend.');assert.equal(f.source[0].system.catalogId,'item-ordinary-melee-weapon');assert.equal(f.writes,1);
});
test('putting away an item clamps live resources in the same equipment update', async () => {
 const f = fixture();
 Object.assign(f.source[0].system, { worn: true, bonuses: { hp: 4, sp: 2 } });
 f.system.health.value = 16;
 f.system.sp.value = 7;
 const basis = equipmentBasis(f.actor);
 await requestEquipment(f.actor, basis, basis.items.map(item => ({ ...item, worn: false })), 2);
 assert.deepEqual([f.system.health.value, f.system.sp.value, f.writes], [12, 5, 1]);
 const unarmed = equipmentBasis(f.actor);
 await requestEquipment(f.actor, unarmed, unarmed.items.map(item => ({ ...item, worn: true })), 2);
 assert.deepEqual([f.system.health.value, f.system.sp.value], [12, 5]);
});
test('equipment permission and document identity remain enforced without hand regulation',async()=>{
 const denied=fixture(false);await assert.rejects(requestEquipment(denied.actor,null,[],2),/owner/);assert.equal(denied.writes,0);
 const f=fixture(),basis=equipmentBasis(f.actor);await assert.rejects(requestEquipment(f.actor,basis,[basis.items[0],basis.items[0]],2),/list changed/);assert.equal(f.writes,0);
});
test('supply cards distinguish moving down one die size from depletion',()=>{
 assert.equal(supplyResultState({before:8,after:6,exhausted:false}),'Moved down one size · d8 → d6 · Not depleted');
 assert.equal(supplyResultState({before:4,after:0,exhausted:true}),'Moved down one size · d4 → 0 · Depleted');
 assert.equal(supplyResultState({before:8,after:8,exhausted:false}),'Not depleted');
});
