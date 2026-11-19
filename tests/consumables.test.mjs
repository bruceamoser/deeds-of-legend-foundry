import test from 'node:test';
import assert from 'node:assert/strict';
import {consumableType,torchClock,torchLight} from '../src/rules/consumables.mjs';
import {normalizeWorkshopPlay} from '../src/rules/workshop-play.mjs';
test('consumable classification uses stable mechanics, not custom names',()=>{
 assert.equal(consumableType({name:'Dragon Fang',system:{catalogId:'item-ammunition-bundle'}}),'ammunition');
 assert.equal(consumableType({system:{catalogId:'item-lighting-bundle'}}),'lighting');
 assert.equal(consumableType({system:{catalogId:'item-lesser-healing-bottle'}}),'potions');
 assert.equal(consumableType({system:{consumableType:'none'}}),null);
});
test('torch accrues lit game time, preserves partial hours and never charges disabled or reversed time',()=>{
 let state=torchClock({lit:true,lastWorldTime:0,elapsedSeconds:0},1800);
 assert.equal(state.checksDue,0);
 state=torchClock({...state,lit:false},9000);assert.equal(state.elapsedSeconds,1800);
 state=torchClock({...state,lit:true},10800);assert.equal(state.checksDue,1);
 state=torchClock({...state,elapsedSeconds:0},18000,false);assert.equal(state.elapsedSeconds,0);
 state=torchClock(state,100);assert.equal(state.elapsedSeconds,0);
 state=torchClock(state,7300);assert.equal(state.checksDue,2);
});
test('torch radius uses scene units and preserves stronger existing light',()=>{
 const prior={bright:0,dim:0,color:null};const light=torchLight(prior,5);
 assert.equal(light.bright,15);assert.equal(light.dim,15);assert.equal(prior.bright,0);
 assert.equal(torchLight({bright:40,dim:60,color:'#ffffff'},5).bright,40);
});
test('custom equipment name survives normalization without changing catalog identity',()=>{
 const catalogs={choices:[],inventory:{equipment:[],recipes:[]}};
 const value=normalizeWorkshopPlay({inventory:{added:[],removed:[],overrides:{'creation-outfit':{name:'  Grandfather’s coat  '}}}},catalogs);
 assert.equal(value.inventory.overrides['creation-outfit'].name,'Grandfather’s coat');
 assert.throws(()=>normalizeWorkshopPlay({inventory:{added:[],removed:[],overrides:{'creation-outfit':{name:''}}}},catalogs));
});

test('legacy portable water becomes a normal supply die once and does not replenish on reload',()=>{
 const catalogs={};
 const overrides={
  'legacy-full':{waterUnits:1},
  'legacy-empty':{waterUnits:0},
  'current-partial':{inventoryDie:6,waterUnits:1},
  'current-empty':{inventoryDie:0},
 };
 const state=normalizeWorkshopPlay({inventory:{added:[],removed:[],overrides}},catalogs);
 const converted={'legacy-full':{inventoryDie:8},'legacy-empty':{inventoryDie:0},'current-partial':{inventoryDie:6},'current-empty':{inventoryDie:0}};
 assert.deepEqual(state.inventory.overrides,converted);
 assert.deepEqual(normalizeWorkshopPlay(state,catalogs).inventory.overrides,converted);
});
