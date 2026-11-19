import * as equipmentBonuses from "../src/rules/equipment-bonuses.mjs";
import {DAMAGE_TYPES} from "../src/rules/damage.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as effects from '../src/rules/effective-attributes.mjs';
import {WATER_FLASK} from "../src/rules/equipment-identity.mjs";
import {legacyWaterSupplyDie} from "../src/rules/inventory.mjs";
import {CONSUMABLE_TYPES} from '../src/rules/consumables.mjs';
import * as character from '../src/rules/character.mjs';
import {normalizeForgeRecovery} from "../src/rules/forge-recovery.mjs";
import {normalizeRecovery} from '../src/rules/recovery.mjs';
import {updateOwnedDocument} from '../src/services/documents.mjs';
import {rollBasis} from '../src/services/roll-preparation.mjs';
const item=(name,attribute,mode,value,cursed=false)=>({_id:name,id:name,name,type:'equipment',system:{quantity:1,carried:true,worn:true,held:false,attributeEffects:[{attribute,mode,value,cursed}]}});
async function model(path){
 class Field {constructor(...args){this.args=args;}}
 const context=vm.createContext({structuredClone,foundry:{data:{fields:Object.fromEntries(['ArrayField','SchemaField','StringField','BooleanField','HTMLField'].map(key=>[key,Field]))},abstract:{TypeDataModel:class{static migrateData(source){return source;}}}}});
 const exports={...equipmentBonuses,DAMAGE_TYPES,WATER_FLASK,legacyWaterSupplyDie,CONSUMABLE_TYPES,...effects,...character,normalizeRecovery,normalizeForgeRecovery,StrictNumberField:Field};
 const mod=new vm.SourceTextModule(await readFile(new URL(path,import.meta.url),'utf8'),{context});
 await mod.link(async()=>new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context}));await mod.evaluate();return mod.namespace;
}
test('native character derives equipped effective attributes without changing creation attributes, HP, SP or DP totals',async()=>{
 const {CharacterData}=await model('../src/models/character.mjs');const data=Object.create(CharacterData.prototype);
 Object.assign(data,{_source:{sp:{max:6}},attributes:Object.fromEntries(character.ATTRIBUTES.map(key=>[key,{base:1}])),health:{value:8,baseMax:14},grit:{granted:1,spent:0},sp:{value:3,max:6},parent:{items:[item('Ring','brawn','modifier',2),item('Curse','brawn','modifier',-1,true),item('Crown','fortitude','set',3)]}});
 CharacterData.prototype.prepareDerivedData.call(data);assert.equal(data.attributes.brawn.effective,0);assert.equal(data.attributes.fortitude.effective,3);assert.equal(data.attributes.brawn.base,1);assert.equal(data.health.max,14);assert.equal(data.sp.max,6);assert.equal(data.attributeTotal,6);assert.equal(data.health.value,8);
 data.parent.items.pop();data.parent.items.pop();CharacterData.prototype.prepareDerivedData.call(data);assert.equal(data.attributes.brawn.effective,3);assert.equal(data.attributes.fortitude.effective,1);
});
test('inactive, stored, zero-quantity and removed effects never modify play attributes',()=>{
 const ring=item('Ring','agility','modifier',2);
 for(const changes of [{quantity:0},{carried:false},{worn:false}])assert.equal(effects.equipmentAttributeValue(1,[{...ring,system:{...ring.system,...changes}}],'agility'),1);
 assert.equal(effects.equipmentAttributeValue(1,[{...ring,system:{...ring.system,worn:false,held:true}}],'agility'),3);
 assert.equal(effects.equipmentAttributeValue(1,[],'agility'),1);
});
test('conflicting sets/overrides identify the items; explicit curse overrides exact sets',()=>{
 const a=item('Crown','reason','set',3),b=item('Circlet','reason','set',4),curse=item('Curse','reason','curse-override',-2,true);
 assert.throws(()=>effects.validateEquipmentAttributeArrangement([a,b]),/Reason.*one set-value.*Crown, Circlet/);
 assert.equal(effects.equipmentAttributeValue(1,[a,curse],'reason'),-2);
 assert.throws(()=>effects.validateEquipmentAttributeArrangement([curse,{...curse,name:'Second curse'}]),/competing explicit curse overrides/);
 assert.throws(()=>effects.validateItemAttributeEffects([{attribute:'reason',mode:'curse-override',value:2,cursed:false}]),/Mark.*cursed/);
});
test('schema retains signed item values and rejects malformed effects without capping exact set values',async()=>{
 const {EquipmentData}=await model('../src/models/equipment.mjs');const schema=EquipmentData.defineSchema();
 assert.deepEqual(Array.from(schema.consumableType.args[0].choices),["auto","none",...Object.keys(CONSUMABLE_TYPES)]);
 const value=schema.attributeEffects.args[0].args[0].value;assert.equal(value.args[0].min,undefined);
 for(const effect of [{attribute:'luck',mode:'set',value:3,cursed:false},{attribute:'reason',mode:'set',value:1.5,cursed:false}])assert.throws(()=>EquipmentData.validateJoint({inventoryDie:0,attributeEffects:[effect]}),/attribute effect/);
 assert.doesNotThrow(()=>EquipmentData.validateJoint({inventoryDie:0,attributeEffects:[{attribute:'reason',mode:'set',value:5,cursed:false}]}));
});
test('native equipment upgrades old filled or empty flasks once',async()=>{
 const {EquipmentData}=await model('../src/models/equipment.mjs');
 const migrate=(schemaVersion,inventoryDie,waterUnits)=>EquipmentData.migrateData({
  schemaVersion,catalogId:WATER_FLASK,inventoryDie,...(waterUnits===undefined?{}:{waterUnits}),
 });
 for(const [die,units,converted] of [[0,1,8],[0,0,0],[0,undefined,8],[6,1,6]]){
  const item=migrate(1,die,units);
  assert.equal(item.schemaVersion,2);assert.equal(item.inventoryDie,converted);
  assert(!Object.hasOwn(item,'waterUnits'));
 }
 assert.equal(migrate(2,0).inventoryDie,0);
});
test('owned native Item write refuses a second equipped set before mutation and allows removing a conflicting effect',async()=>{
 const a=item('Crown','reason','set',3),b=item('Circlet','reason','set',4);b.system.worn=false;let writes=0;
 const actor={items:[a,b]},document={...b,actor,testUserPermission:()=>true,update:async()=>{writes++;}};
 globalThis.game={user:{id:'owner'},i18n:{localize:s=>s}};
 await assert.rejects(updateOwnedDocument(document,{'system.worn':true}),/one set-value/);assert.equal(writes,0);
 await updateOwnedDocument(document,{'system.attributeEffects':[],'system.worn':true});assert.equal(writes,1);
 document.testUserPermission=()=>false;await assert.rejects(updateOwnedDocument(document,{'system.attributeEffects':[]}),/NoPermission/);assert.equal(writes,1);
});
test('native roll basis recomputes actual effective attributes and refuses unresolved equipped conflicts',()=>{
 const items=[item('Ring','brawn','modifier',2)];const actor={uuid:'Actor.hero',type:'character',items,effects:[],system:{attributes:{brawn:{base:1,effective:1}},health:{value:12},grit:{available:1}},getFlag:(_,key)=>key==='nativeWorkshop'?{portable:{format:'heroes-of-legend-character',schemaVersion:7,draft:{}}}:null,testUserPermission:()=>true};globalThis.game={user:{id:'owner',targets:new Set()}};
 globalThis.fromUuidSync=()=>actor;assert.equal(rollBasis(actor,'brawn').attribute,3);
 items.push(item('Crown','brawn','set',3),item('Circlet','brawn','set',4));assert.throws(()=>rollBasis(actor,'brawn'),/Brawn.*one set-value.*Crown.*Circlet/);
});
test('compact equipment editor parses six controls, signed values and curse flags without accepting empty enabled values',()=>{
 const row=(attribute,mode,value,cursed=false)=>({dataset:{attributeEffect:attribute},querySelector:selector=>selector==='[data-effect-mode]'?{value:mode}:selector==='[data-effect-value]'?{value}:{checked:cursed}});
 assert.deepEqual(effects.readAttributeEffectRows([row('brawn','modifier','-1',true),row('reason','none',''),row('fortitude','set','3')]),[{attribute:'brawn',mode:'modifier',value:-1,cursed:true},{attribute:'fortitude',mode:'set',value:3,cursed:false}]);
 assert.throws(()=>effects.readAttributeEffectRows([row('reason','set','')]),/whole signed value/);
});

test('native character recovery schema and joint validation accept stacked unavailable HP without changing other resources',async()=>{
 const {CharacterData}=await model('../src/models/character.mjs');const schema=CharacterData.defineSchema();const accounting=schema.recovery.args[0].unavailableHp.args[0];assert.equal(accounting.max,undefined);
 const data={attributes:{},health:{value:0,baseMax:20},grit:{spent:0,granted:1},recovery:{unavailableHp:15,debtUsed:true}};assert.doesNotThrow(()=>CharacterData.validateJoint(data));assert.throws(()=>CharacterData.validateJoint({...data,recovery:{unavailableHp:-1,debtUsed:true}}),/Invalid unavailable HP/);
});
