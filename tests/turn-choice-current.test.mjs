import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {ACTION_CATEGORIES} from '../src/rules/actions.mjs';
async function fixture(conditions,selected){
 const sent=[];let prompts=0;
 const context=vm.createContext({Set,Math,game:{user:{id:'owner'}},foundry:{applications:{api:{DialogV2:{wait:async options=>{prompts++;assert.match(options.content,/retained/);return options.buttons[0].callback(null,null,{element:{querySelectorAll:()=>selected.map(value=>({value}))}});}}}}}});
 const exports={ACTION_CATEGORIES,actionConditions:()=>conditions,requestCombat:async(...args)=>{sent.push(args);return 'requested';}};
 const mod=new vm.SourceTextModule(await readFile(new URL('../src/dialogs/turn-choice.mjs',import.meta.url),'utf8'),{context});await mod.link(()=>new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context}));await mod.evaluate();
 const combat={combatants:new Map([['hero',{actor:{testUserPermission:()=>true}}]])};return {run:()=>mod.namespace.chooseCombatParticipant(combat,'hero'),sent,get prompts(){return prompts;}};
}
test('Dazed and Grappled retain the owner’s exact chosen action categories',async()=>{for(const [conditions,selected]of [[{dazed:1},['main','reaction']],[{grappled:2},['maneuver']]]){const f=await fixture(conditions,selected);assert.equal(await f.run(),'requested');assert.deepEqual(Array.from(f.sent[0][2].retained),selected);assert.equal(f.prompts,1);}});
test('invalid retained choices never submit a turn; unrestricted and rating-three turns need no arbitrary choice',async()=>{const invalid=await fixture({dazed:2},['main','reaction']);await assert.rejects(invalid.run(),/exactly 1/);assert.equal(invalid.sent.length,0);for(const conditions of [{},{grappled:3}]){const f=await fixture(conditions,[]);await f.run();assert.equal(f.prompts,0);if(conditions.grappled===3)assert.deepEqual(Array.from(f.sent[0][2].retained),[]);}});
