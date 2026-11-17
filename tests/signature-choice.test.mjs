import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {advancementPreview,signatureChoicePreview} from '../src/rules/advancement.mjs';
import {DEFAULT_LANGUAGES} from '../src/rules/languages.mjs';
const source=JSON.parse(await readFile(new URL('../static/data/choices.json',import.meta.url))),choices=source.records,inventory=JSON.parse(await readFile(new URL('../static/data/inventory.json',import.meta.url))),ID='heroes-of-legend';
const state=()=>({level:7,stage:'advancement',dp:12,classId:'class-intellect',ranks:{},abilities:[],recipes:[],purchases:[],capabilities:[],compatibleRecipes:[],gritGranted:2,gritSpent:1,items:[],acquisitionReceipts:[],pendingSignatures:[3,7],languages:[],creation:{},revision:4});
const intellect=(level)=>choices.find(choice=>choice.id==='class-intellect').signatures[level][0];
test('direct signature preview resolves only the requested tier and preserves DP, pending tiers and input',()=>{
 for(const level of [3,7]){const current=state(),before=structuredClone(current),result=signatureChoicePreview(current,{level,id:intellect(level)},choices,inventory,DEFAULT_LANGUAGES);assert(result.valid);assert.deepEqual(result.state.pendingSignatures,[3,7].filter(tier=>tier!==level));assert.deepEqual(result.state.abilities,[intellect(level)]);assert.equal(result.state.dp,current.dp);assert.equal(result.state.gritSpent,1);assert.deepEqual(current,before);assert.equal(result.ledger.length,1);}
});
test('direct signature selection validates earned tier, class and acquisition choices',()=>{
 assert(!signatureChoicePreview({...state(),level:3},{level:7,id:intellect(7)},choices,inventory).valid);
 assert(signatureChoicePreview({...state(),pendingSignatures:[3]},{level:7,id:intellect(7)},choices,inventory).valid);
 assert(!signatureChoicePreview(state(),{level:3,id:'ability-signature-blade-sweeping-entry'},choices,inventory).valid);
 const current={...state(),classId:'class-blade',pendingSignatures:[3]},id='ability-signature-blade-return-stroke';
 assert(!signatureChoicePreview(current,{level:3,id},choices,inventory).valid);
 const chosen=signatureChoicePreview(current,{level:3,id,selection:{meleeHands:2}},choices,inventory);assert(chosen.valid);assert.equal(chosen.state.items[0].catalogId,'item-ordinary-melee-weapon');assert.equal(chosen.state.items[0].hands,2);
});
