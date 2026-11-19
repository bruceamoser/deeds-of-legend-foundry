import * as turnBudget from '../src/services/turn-budget.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as encounter from '../src/rules/encounter.mjs';
async function fixture({faces=[4,4,4],gm=false}={}) {
 const flags={},messages=new Map();let draws=0,conditionSettlements=0,serial=0,worldTime=0;
 const player={id:'player',isGM:gm},owned={type:'character',effects:[],items:[],system:{health:{value:12},attributes:{agility:{effective:0},brawn:{effective:0}}},getFlag:(_,key)=>({forgeMovement:{speedBase:6},nativeWorkshop:{portable:{format:'heroes-of-legend-character',schemaVersion:7,draft:{traitIds:[]}}}})[key],hasPlayerOwner:true,testUserPermission:user=>user.id==='player'||user.isGM},foe={type:'creature',effects:[],system:{health:{value:8},speed:5},getFlag:()=>null,hasPlayerOwner:false,testUserPermission:user=>user.isGM};
 const roster=[{id:'hero',actor:owned,name:'Hero',getFlag:()=>null},{id:'foe',actor:foe,name:'Foe',getFlag:()=>null}];roster.get=id=>roster.find(row=>row.id===id);roster.has=id=>Boolean(roster.get(id));
 const combat={uuid:'Combat.test',id:'test',documentName:'Combat',combatants:roster,turns:roster,getFlag:(_,key)=>flags[key]};
 const game={user:player,messages,users:[player]};
 const ctx=vm.createContext({Map,Set,Promise,JSON,Number,Error,structuredClone,game,fromUuid:async()=>combat,foundry:{data:{operators:{ForcedReplacement:{create:value=>value}}},utils:{escapeHTML:s=>s},dice:{Roll:class{constructor(formula){this.formula=formula;this.dice=[{faces:6,results:faces.map(result=>({result,active:true}))}];}async evaluate(){draws++;return this;}}}}});
 const exports={...encounter,...turnBudget,expireStaleBenefits:async()=>{},settleSummonExpiry:async()=>{},summonState:()=>null,settleTurnConditions:async()=>{conditionSettlements++;return {name:'Hero',events:[],changes:[]};},turnEndContent:()=> 'Finished',ensureAuthorityReady:async()=>{},shouldProcessRequest:()=>true,isCreationAuthority:()=>true,enqueueCharacterOperation:run=>run(),writeAuthorityDocument:async(document,changes,options={})=>{worldTime+=options.worldTime?.delta??0;for(const[path,value]of Object.entries(changes)){if(!path.startsWith('flags.'))continue;const keys=path.split('.').slice(2);let valueAt=flags;for(const key of keys.slice(0,-1))valueAt=valueAt[key]??={};valueAt[keys.at(-1)]=structuredClone(value);}},createActionMessage:async data=>{const message={...data,id:`message${++serial}`,author:{...game.user},getFlag:(_,key)=>data.flags?.['heroes-of-legend']?.[key],update:async change=>Object.assign(message,change)};messages.set(message.id,message);return message;}};
 const mod=new vm.SourceTextModule(await readFile(new URL('../src/services/combat.mjs',import.meta.url),'utf8'),{context:ctx});
 await mod.link(async()=>new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context:ctx}));await mod.evaluate();
 const action=async(kind,payload)=>{const message=await mod.namespace.requestCombat(combat,kind,payload);await mod.namespace.resolveCombatRequest(message.id);return message;};
 return {api:mod.namespace,combat,flags,messages,action,game,get draws(){return draws;},get worldTime(){return worldTime;},get conditionSettlements(){return conditionSettlements;}};
}
test('native opening rolls once, persists verified dice, alternates and replays without rolling again',async()=>{
 const f=await fixture();const message=await f.action('start');assert.equal(f.draws,1);assert.equal(f.worldTime,0);assert.equal(f.flags.encounter.startingSide,'players');assert.equal(f.flags.encounter.nextSide,'players');assert.equal(f.flags.encounter.budgets.hero.remaining.reaction,1);assert.match(f.flags.encounter.budgets.hero.turnId,/initial/);
 await f.api.resolveCombatRequest(message.id);assert.equal(f.draws,1);assert.equal(f.flags.encounter.revision,1);
 await assert.rejects(f.action('choose',{id:'foe'}),/own|current side/);
 await f.action('choose',{id:'hero'});assert.equal(f.flags.encounter.budgets.hero.turnId,'test_1');assert.equal(f.flags.encounter.budgets.hero.speed,6);await f.action('finish');assert.equal(f.flags.encounter.nextSide,'opposition');assert.equal(f.conditionSettlements,1);assert.equal(f.worldTime,0);
 f.game.user.isGM=true;await f.action('choose',{id:'foe'});await f.action('finish');assert.equal(f.flags.encounter.round,2);assert.equal(f.flags.encounter.nextSide,'players');assert.equal(f.worldTime,6);const finish=[...f.messages.values()].at(-1);await f.api.resolveCombatRequest(finish.id);assert.equal(f.worldTime,6);
});
test('DA ambush skips dice while players cannot designate a starting side',async()=>{
 const f=await fixture();await assert.rejects(f.action('ambush',{side:'opposition'}),/Only the DA/);assert.equal(f.draws,0);assert.equal(f.flags.encounter,undefined);
 f.game.user.isGM=true;await f.action('ambush',{side:'opposition'});assert.equal(f.draws,0);assert.equal(f.flags.encounter.startingSide,'opposition');assert.deepEqual(f.flags.encounter.opening,{ambushSide:'opposition'});
 await assert.rejects(f.action('start'),/already started/);assert.equal(f.draws,0);
});
test('opening rejects altered or modified native dice and choosing cannot silently skip initiative',async()=>{
 const f=await fixture();await assert.rejects(f.action('choose',{id:'hero'}),/opening roll/);assert.equal(f.flags.encounter,undefined);
 const message=await f.api.requestCombat(f.combat,'start');message.rolls[0].formula='4d6kh3';await assert.rejects(f.api.resolveCombatRequest(message.id),/unmodified/);assert.equal(f.flags.encounter,undefined);
});
test('native roster reconciliation retains alternating state and handles removed participants',()=>{
 const roster=[{id:'hero',side:'players'},{id:'foe',side:'opposition'}];let state=encounter.startEncounter(roster,[4,4,4]);state=encounter.finishTurn(encounter.chooseParticipant(state,'hero'));
 const reconciled=encounter.reconcileTurnRoster(state,roster);assert.equal(reconciled.nextSide,'opposition');assert.equal(reconciled.roster[0].eligibleRound,1);
 const removed=encounter.reconcileTurnRoster(state,[roster[0]]);assert.equal(removed.round,2);assert.equal(removed.nextSide,'players');
});

test('joining initializes only the missing initial reaction and never refills existing or returning budgets',async()=>{
 const f=await fixture({gm:true});await f.action('ambush',{side:'players'});f.flags.encounter.budgets.hero.remaining.reaction=0;
 const actor={...f.combat.combatants.get('hero').actor};f.combat.combatants.push({id:'joiner',actor,name:'Joiner',getFlag:()=>null});
 await f.action('roster',{id:'joiner',mode:'join'});assert.equal(f.flags.encounter.budgets.joiner.remaining.reaction,1);assert.equal(f.flags.encounter.budgets.hero.remaining.reaction,0);
 f.flags.encounter.budgets.joiner.remaining.reaction=0;await f.action('roster',{id:'joiner',mode:'withdraw'});await f.action('roster',{id:'joiner',mode:'join'});assert.equal(f.flags.encounter.budgets.joiner.remaining.reaction,0);
});

test('the active owner can cancel an unused turn without spending a turn or changing prior budgets',async()=>{
 const f=await fixture();const hero=f.combat.combatants.get('hero');hero.token={x:0,y:0,elevation:0};
 await f.action('start');
 const initial=structuredClone(f.flags.encounter.budgets.hero);
 await f.action('choose',{id:'hero'});
 assert(f.api.canCancelParticipantTurn(f.combat,f.flags.encounter));
 hero.token.x=100;
 assert(!f.api.canCancelParticipantTurn(f.combat,f.flags.encounter));
 await assert.rejects(f.action('cancel'),/unused turn/);
 hero.token.x=0;
 f.game.user.id='observer';
 await assert.rejects(f.action('cancel'),/you own/);
 f.game.user.id='player';
 const cancelled=await f.action('cancel');
 assert.equal(f.flags.encounter.current,null);
 assert.equal(f.flags.encounter.round,1);
 assert.equal(f.flags.encounter.nextSide,'players');
 assert.equal(f.flags.encounter.acted.length,0);
 assert.deepEqual(f.flags.encounter.budgets.hero,initial);
 assert.equal(f.conditionSettlements,0);assert.equal(f.worldTime,0);
 await f.api.resolveCombatRequest(cancelled.id);
 await f.action('choose',{id:'hero'});
 assert.equal(f.flags.encounter.budgets.hero.turnId,'test_2');
 f.flags.encounter.revision++;
 await assert.rejects(f.action('cancel'),/unused turn/);
});
