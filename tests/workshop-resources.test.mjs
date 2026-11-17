import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {workshopSupplyUse,workshopResupply,workshopConditionDamage,workshopFavorites} from '../src/rules/workshop-resources.mjs';
import {workshopCatalogs} from '../src/rules/workshop-forge-catalog.mjs';
import {applyForgePlaytest} from '../src/rules/forge-playtest-catalog.mjs';
import {readPortableCharacter} from '../src/rules/portable-character.mjs';
const read=async name=>JSON.parse(await readFile(new URL(`../static/data/${name}.json`,import.meta.url)));
const [choices,inventory,wounds,forge,references]=await Promise.all(['choices','inventory','wounds','forge','forge-references'].map(read));
const current=applyForgePlaytest(forge,references),catalogs=workshopCatalogs(choices,inventory,wounds,current.forge,current.references);
test('final supply dose heals before exhaustion without consuming stack quantity',()=>{
 const item={catalogId:'item-lesser-healing-bottle',quantity:2,inventoryDie:4};
 const result=workshopSupplyUse({item,face:1,hp:3,maxHp:25,catalog:catalogs.inventory});
 assert.equal(result.hp,9);assert.equal(result.after,0);assert.equal(item.quantity,2);assert.equal(item.inventoryDie,4);
 assert.equal(workshopSupplyUse({item:{...item,catalogId:'item-food-bundle',inventoryDie:8},face:1,hp:3,maxHp:25,catalog:catalogs.inventory}).after,6);
 assert.throws(()=>workshopSupplyUse({item:{...item,quantity:0},face:1,hp:0,maxHp:25,catalog:catalogs.inventory}),/quantity/);
});
test('current potion supply honors stacked Debt, Life resistance and missing HP',()=>{
 const item={catalogId:'item-lesser-healing-bottle',quantity:1,inventoryDie:4};
 const use=(hp,recovery={},lifeResistance=0)=>workshopSupplyUse({item,face:1,hp,maxHp:20,recovery,lifeResistance,catalog:catalogs.inventory});
 assert.equal(use(15,{unavailableHp:3,debtUsed:true}).hp,17);
 assert.equal(use(17,{unavailableHp:3,debtUsed:true}).healed,0);
 assert.equal(use(0,{},2).hp,4);assert.equal(use(19,{},3).healed,1);assert.equal(use(20,{},3).healed,0);
 assert.throws(()=>use(0,{},-1),/Life resistance/);
});
test('resupply restores empty stacks while respecting the printed die cap',()=>{
 const item={catalogId:'item-food-bundle',inventoryDie:0};
 assert.equal(workshopResupply({item,steps:1,catalog:catalogs.inventory}).after,4);
 const cap=catalogs.inventory.equipment.find(record=>record.id===item.catalogId).inventoryDie;
 assert.equal(workshopResupply({item,steps:6,catalog:catalogs.inventory}).after,cap);
});
test('manual condition damage only computes current damage, preserves sources and invokes no retired survival',()=>{
 const burning={id:'fire',key:'burning',rating:2,persistence:'temporary',source:'Spell'};
 assert.deepEqual(workshopConditionDamage({condition:burning,resistances:{fire:3}}),{amount:0});
 assert.deepEqual(workshopConditionDamage({condition:burning,contributions:[burning,{...burning,id:'second',rating:3}],resistances:{fire:3}}),{amount:2});
 assert.deepEqual(workshopConditionDamage({condition:{...burning,key:'bleeding'},resistances:{physical:3}}),{amount:2});
 assert.equal(burning.rating,2);assert.throws(()=>workshopConditionDamage({condition:{...burning,key:'poisoned'}}),/does not deal HP damage/);
});
test('current Favorites map learned and universal actions and keep native inventory identities',async()=>{
 const portable=JSON.parse(await readFile(new URL('../Build-Offs/revised/builds/wizard-level-3.hol.json',import.meta.url)));
 const {draft,preview}=readPortableCharacter(portable,catalogs,catalogs.languages);
 const weapon=preview.inventory.items.find(item=>item.catalogId==='item-ordinary-melee-weapon');
 draft.play??={};draft.play.favorites={abilities:['ability-move'],items:[weapon.instanceId]};
 const favorites=workshopFavorites(preview,draft,catalogs);
 assert.ok(favorites.some(row=>row.record.id==='ability-move'));
 assert.equal(favorites.filter(row=>row.record.id==='ability-basic-melee').length,1);
 assert.ok(favorites.some(row=>row.sourceItems.some(item=>item.instanceId===weapon.instanceId)));
});
