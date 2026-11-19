import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectNativeWorkshopInventory} from '../src/rules/native-inventory-projection.mjs';
import {nativeItemForWorkshopInstance,nativeWorkshopInventoryId} from '../src/rules/native-item-identity.mjs';
import {workshopCharacter} from '../src/rules/workshop-character.mjs';
import {workshopCatalogs} from '../src/rules/workshop-forge-catalog.mjs';
import {applyForgePlaytest} from '../src/rules/forge-playtest-catalog.mjs';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const [choices,inventory,wounds,forge,references,portable]=await Promise.all(['../static/data/choices.json','../static/data/inventory.json','../static/data/wounds.json','../static/data/forge.json','../static/data/forge-references.json','../Build-Offs/revised/builds/wizard-level-3.hol.json'].map(read));
const current=applyForgePlaytest(forge,references);
const catalogs=workshopCatalogs(choices,inventory,wounds,current.forge,current.references);
const native=(id,system,acquisition=null)=>({id,type:'equipment',name:id,system,getFlag:(namespace,key)=>key==='acquisitionInstance'?acquisition:key==='grantKind'&&acquisition?'nativeWorkshop':undefined});
test('native projection uses original quantity, edited bulk and torch hands without duplicate gear',()=>{
 const managed=native('torch',{quantity:2,bulk:3,carried:true,held:true,hands:1,inventoryDie:6},'torch-instance');
 const custom=native('custom',{quantity:3,bulk:4,carried:true,held:false,worn:false,hands:0});
 const actor={items:[managed,custom]};const before=JSON.stringify(actor);
 const result=projectNativeWorkshopInventory(actor,[{instanceId:'torch-instance',catalogId:'item-lighting-bundle',quantity:1,bulk:1,inventoryDie:6}]);
 assert.equal(result.items.length,1);assert.equal(result.items[0].bulk,6);assert.equal(result.items[0].quantity,2);assert.equal(result.items[0].hands,1);
 assert.equal(result.additional.length,1);assert.equal(result.additional[0].bulk,12);assert.equal(result.additional[0].nativeId,'custom');
 assert.equal(JSON.stringify(actor),before);
});
test('copies of a managed acquisition and foreign acquisitions keep their own native Item identities',()=>{
 const original=native('original',{},'shop-starter-food-bundle');
 const copied=native('copy',{},'shop-starter-food-bundle');
 const foreign=native('foreign',{},'shop-other-character');
 const creating=native('new',{},'shop-new-local');
 const actor={
   items:[original,copied,foreign,creating],
   getFlag:(_,key)=>key==='nativeWorkshop' ? {inventoryInstances:['shop-starter-food-bundle']} : {createdIds:['new']},
 };
 for (const item of actor.items) item.actor=actor;
 assert.equal(nativeItemForWorkshopInstance(actor,'shop-starter-food-bundle'),original);
 assert.equal(nativeItemForWorkshopInstance(actor,nativeWorkshopInventoryId(copied)),copied);
 assert.equal(nativeItemForWorkshopInstance(actor,'shop-other-character'),undefined);
 assert.equal(nativeItemForWorkshopInstance(actor,nativeWorkshopInventoryId(foreign)),foreign);
 assert.equal(nativeItemForWorkshopInstance(actor,'shop-new-local'),creating);
});
test('native custom carried gear affects burden and Speed without changing creation or teaching abilities',()=>{
 const original=workshopCharacter(portable.draft,catalogs);
 const actor={items:[native('unknown-heavy',{quantity:2,bulk:8,carried:true,held:false,worn:false})]};
 const projected=workshopCharacter(portable.draft,catalogs,undefined,{projectInventory:items=>projectNativeWorkshopInventory(actor,items)});
 assert.equal(projected.inventory.bulk,original.inventory.bulk+16);
 assert.equal(projected.inventory.encumbrance,Math.max(0,projected.inventory.bulk-projected.inventory.capacity));
 assert.equal(projected.summary.speed,Math.max(0,original.summary.unencumberedSpeed-projected.inventory.encumbrance));
 assert.equal(projected.inventory.items.length,original.inventory.items.length);
 assert.deepEqual(projected.creation,original.creation);assert.deepEqual(projected.limits,original.limits);
 assert.deepEqual(projected.state.learned,original.state.learned);
 actor.items[0].system.carried=false;
 assert.equal(workshopCharacter(portable.draft,catalogs,undefined,{projectInventory:items=>projectNativeWorkshopInventory(actor,items)}).inventory.bulk,original.inventory.bulk);
});
test('effective native Brawn changes carrying capacity while creation pools and SP remain base',()=>{
 const original=workshopCharacter(portable.draft,catalogs);
 const projected=workshopCharacter(portable.draft,catalogs,undefined,{projectAttributes:attributes=>({...attributes,brawn:attributes.brawn+3})});
 assert.equal(projected.inventory.capacity,original.inventory.capacity+9);
 assert.deepEqual(projected.limits,original.limits);assert.deepEqual(projected.development,original.development);
 assert.deepEqual(projected.creation,original.creation);
});
