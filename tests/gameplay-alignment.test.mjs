import test from "node:test";
import assert from "node:assert/strict";
import {damageEvent} from "../src/rules/damage.mjs";
import {conditionEndPlan} from "../src/rules/conditions.mjs";
import {effectiveAttribute} from "../src/rules/effective-attributes.mjs";
import {coverRollSources} from "../src/rules/situational-adjustment.mjs";
import {sourceRollPlan} from "../src/rules/roll-sources.mjs";
import {startEncounter,chooseParticipant,finishTurn} from "../src/rules/encounter.mjs";
import {planOrdinaryMovement} from "../src/rules/movement-plan.mjs";
import {forcedMovementPlan,validateForcedDirection} from "../src/rules/forced-movement.mjs";
test("damage immunity removes components before weakness/minimum and leaves mixed surviving components",()=>{
 const defenses={immunities:["fire"],weaknesses:[{type:"fire",value:3}],resistances:[{type:"physical",value:3}]};
 const immune=damageEvent({...defenses,components:[{type:"fire",amount:2}]});assert.equal(immune.total,0);assert.deepEqual(immune.woundTypes,[]);
 const mixed=damageEvent({...defenses,components:[{type:"fire",amount:2},{type:"physical",amount:1}]});assert.equal(mixed.total,1);assert.deepEqual(mixed.woundTypes,["physical"]);
 assert.equal(damageEvent({...defenses,isAttack:false,components:[{type:"physical",amount:1}]}).total,0);
 for(const type of ["poison","force"])assert.equal(damageEvent({components:[{type,amount:1}]}).total,1);
});
test("Burning immune or fully resisted ticks still decay",()=>{
 const contributions=[{id:"burn",key:"burning",rating:2,persistence:"temporary",source:"flame"}];
 for(const defenses of [{immunities:["fire"]},{resistances:[{type:"fire",value:3}]}]){
  const plan=conditionEndPlan(contributions,{turnId:"turn",...defenses});assert.equal(plan.events[0].damage.total,0);assert.equal(plan.contributions[0].rating,1);
 }
});
test("item attributes combine best bonus/worst penalty; curses suppress bonus and exact sets stay exact",()=>{
 const bonus={kind:"modifier",value:2},penalty={kind:"modifier",value:-1};
 assert.equal(effectiveAttribute(1,[bonus,penalty]),2);
 assert.equal(effectiveAttribute(1,[bonus,{...penalty,cursed:true}]),0);
 assert.equal(effectiveAttribute(1,[bonus,penalty,{kind:"set",value:3}]),3);
 assert.equal(effectiveAttribute(1,[bonus,penalty]),2);
 assert.equal(effectiveAttribute(1,[{kind:"set",value:3},{kind:"curse-override",value:-2}]),-2);
 assert.throws(()=>effectiveAttribute(1,[{kind:"set",value:3},{kind:"set",value:4}]),/Only one/);
});
test("cover changes only the rolling side and cancels/caps normally",()=>{
 for(const [cover,amount]of [["partial",1],["heavy",3]])for(const mode of ["attack","defense"]){const [source]=coverRollSources({mode,cover});assert.equal(source.amount,amount);assert.equal(source.kind,mode==="attack"?"bane":"boon");}
 assert.equal(sourceRollPlan(0,[...coverRollSources({mode:"attack",cover:"heavy"}),{id:"other",kind:"boon",amount:1,label:"Other"}]).net,-2);
});
test("ambush skips opening dice; warning restores normal opening and sides alternate",()=>{
 const roster=[{id:"hero",side:"players"},{id:"foe",side:"opposition"}];
 let state=startEncounter(roster,null,{ambushSide:"opposition"});assert.deepEqual(state.opening,{ambushSide:"opposition"});state=finishTurn(chooseParticipant(state,"foe"));assert.equal(state.nextSide,"players");state=finishTurn(chooseParticipant(state,"hero"));assert.equal(state.nextSide,"opposition");
 assert.equal(startEncounter(roster,[4,4,4],{ambushSide:"opposition",warned:true}).startingSide,"players");
 assert.throws(()=>startEncounter(roster,null,{ambushSide:"opposition",warned:true}),/Opening roll/);
});
test("prone diagonal difficult occupied traversal costs three and needs a free endpoint",()=>{
 const path=[{x:0,y:0},{x:1,y:1},{x:2,y:1}],squares=path.map((p,i)=>({...p,terrain:i===1?"difficult":"normal",occupant:i===1?"prone":"none",access:"walk",footprintLegal:true,supported:true,routeLegal:true}));
 const plan=planOrdinaryMovement({prone:true,movement:5,path,squares});assert.equal(plan.spent,5);assert.deepEqual(plan.steps.map(s=>s.cost),[3,2]);
 assert.throws(()=>planOrdinaryMovement({prone:true,movement:5,path:path.slice(0,2),squares}),/endpoint/);
});
test("forced directions and elevation respect Push/Pull/Slide",()=>{
 const path=[{x:1,y:0},{x:2,y:0}];assert.equal(validateForcedDirection({kind:"push",source:{x:0,y:0},path}).length,2);
 assert.throws(()=>validateForcedDirection({kind:"pull",source:{x:0,y:0},path}),/directly/);
 assert.equal(validateForcedDirection({kind:"slide",path:[{x:0,y:0,z:0},{x:0,y:0,z:1}]}).length,2);
 assert.throws(()=>validateForcedDirection({kind:"push",source:{x:0,y:0},path:[{x:1,y:0},{x:2,y:0,z:1}]}),/elevation/);
});
test("collision group charges contact once, damages before Stability and stops/bounces at barriers",()=>{
 const original={id:"first",kind:"creature",stability:1,resistances:[{type:"physical",value:3}]};
 const plan=forcedMovementPlan({allowance:7,original,contacts:[{travelCost:1,target:{id:"second",kind:"creature",stability:2}},{target:{id:"second",kind:"creature",stability:2}},{target:{id:"third",kind:"creature",stability:0}},{target:{id:"wall",kind:"barrier",hp:1}}]});
 assert.deepEqual(plan.impacts.map(i=>i.rawDamage),[5,3,4]);assert.equal(plan.impacts[0].results[0].damage.total,2);assert.equal(plan.impacts[1].results[0].damage.total,0);assert.equal(plan.stopped,true);assert.equal(plan.bounce.id,"first");assert.equal(plan.bounce.additionalDamage,0);assert.equal(plan.bounce.blockedMeansStay,true);
});
test("movable objects survive together, break out, and objects without HP require a DA result",()=>{
 const plan=forcedMovementPlan({allowance:3,original:{id:"hero",kind:"creature"},contacts:[{target:{id:"box",kind:"object",hp:4}},{target:{id:"other",kind:"creature"}},{target:{id:"statue",kind:"object"}}]});
 assert(!plan.members.includes("box"));assert(plan.members.includes("statue"));assert.equal(plan.impacts[2].results.at(-1).requiresObjectRuling,true);
});
