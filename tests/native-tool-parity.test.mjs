import test from "node:test";
import assert from "node:assert/strict";
import {recoveryPreview} from "../src/services/recovery.mjs";
import {spendParticipantBudget} from "../src/services/turn-budget.mjs";
import {startTurn} from "../src/rules/actions.mjs";
test("native tracker manual spend uses existing action arithmetic and preserves source state",()=>{
 const actor={effects:[],system:{health:{value:10}}};
 const combat={combatants:new Map([["hero",{actor}]])};
 const state={current:"hero",revision:1,round:1,history:[],budgets:{hero:startTurn({turnId:"test",speed:6})}};
 const spent=spendParticipantBudget(combat,state,{id:"hero",category:"main"},{},"main1");assert.equal(spent.budgets.hero.remaining.main,0);assert.equal(state.budgets.hero.remaining.main,1);
 const moved=spendParticipantBudget(combat,spent,{id:"hero",category:"movement"},{},"move1");assert.equal(moved.budgets.hero.movementSpent,1);assert.equal(moved.revision,3);
 const replay=spendParticipantBudget(combat,moved,{id:"hero",category:"movement"},{},"move1");assert.equal(replay.budgets.hero.movementSpent,1);
 assert.throws(()=>spendParticipantBudget(combat,state,{id:"other",category:"main"},{},"bad"),/active participant/);
 assert.throws(()=>spendParticipantBudget(combat,state,{id:"hero",category:"free"},{},"bad"),/Choose Main/);
});
test("encounter presentation follows the next side and preserves hidden actors",async()=>{
 const previousFoundry=globalThis.foundry,previousGame=globalThis.game,previousUI=globalThis.ui;
 globalThis.foundry={applications:{api:{ApplicationV2:class{},HandlebarsApplicationMixin:base=>base}}};globalThis.game={user:{isGM:false}};
 try{
  const {EncounterPanel}=await import("../src/applications/encounter.mjs");
  const {RecoveryPanel}=await import("../src/applications/recovery.mjs");const recovery=Object.create(RecoveryPanel.prototype);recovery.element={querySelector:selector=>({"[name=kind]":{value:"correct"},"[name=hp]":{value:"  "},"[name=amount]":{value:"6"}}[selector]??null)};assert.ok(Number.isNaN(recovery.draft().hp));assert.equal(recovery.draft().amount,6);
  const combatants=[{id:"visible",name:"Visible",actor:{system:{health:{value:0}},testUserPermission:()=>true},getFlag:()=>"opposition"},{id:"private",name:"Private",actor:{system:{health:{value:17}},testUserPermission:()=>false},getFlag:()=>"players"},{id:"hidden",name:"Hidden",hidden:true,getFlag:()=>"players"}];
  const state={round:1,nextSide:"players",startingSide:"players",roster:[{id:"visible",side:"players",eligibleRound:1},{id:"private",side:"players",eligibleRound:1},{id:"hidden",side:"players",eligibleRound:1}],acted:[]};
  const collection={get:id=>combatants.find(c=>c.id===id),filter:predicate=>combatants.filter(predicate),map:callback=>combatants.map(callback)};
  const app=Object.create(EncounterPanel.prototype);app.combat={combatants:collection,getFlag:()=>state};
  const context=await app._prepareContext();assert.deepEqual(context.participants.map(p=>p.id),["visible","private"]);assert.equal(context.currentName,"Players choose next");assert.equal(context.canFinish,false);assert.equal(context.budgets,undefined);
  state.current="visible";const active=await app._prepareContext();assert.equal(active.currentName,"Visible’s turn");assert(active.participants.every(participant=>!participant.canChoose));

 }finally{globalThis.foundry=previousFoundry;globalThis.game=previousGame;globalThis.ui=previousUI;}
});
test("default combat sides follow document type even for shared creatures and DA heroes",async()=>{
 const {combatSide}=await import("../src/services/combat.mjs");
 const hero={actor:{type:"character",hasPlayerOwner:false},getFlag:()=>undefined};
 const creature={actor:{type:"creature",hasPlayerOwner:true},getFlag:()=>undefined};
 assert.equal(combatSide(hero),"players");
 assert.equal(combatSide(creature),"opposition");
 assert.equal(combatSide({...creature,getFlag:()=>"players"}),"players");
});
