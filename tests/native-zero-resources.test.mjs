import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { defenseBenefits } from "../src/services/benefits.mjs";
import { previewPotionUse, requestPotionUse } from "../src/services/potions.mjs";
const ID = "heroes-of-legend";
const inventory = JSON.parse(await readFile(new URL("../static/data/inventory.json", import.meta.url)));
const choices = JSON.parse(await readFile(new URL("../static/data/choices.json", import.meta.url)));

test("an active Shield Block or High Guard loses its benefit when the exact shield stack reaches zero", () => {
  const previous = globalThis.game;
  const shield = { type:"equipment", uuid:"Actor.hero.Item.shield", system:{catalogId:"item-ordinary-shield",held:true,quantity:1} };
  const benefit = {current:true,key:"shield-block",shieldItemUuid:shield.uuid,sourceId:"ability-shield-block",anchor:{combatId:"combat",participantId:"hero",turnId:"turn"}};
  const effect = {active:true,uuid:"Actor.hero.ActiveEffect.block",getFlag:()=>benefit};
  const actor = {items:[shield],effects:[effect]};
  try {
    globalThis.game = {combats:new Map([["combat",{getFlag:()=>({budgets:{hero:{turnId:"turn"}}})}]])};
    for (const [sourceId, amount] of [["ability-shield-block",1]]) {
      benefit.sourceId=sourceId;shield.system.quantity=1;
      assert.equal(defenseBenefits(actor,{incomingAttack:true})[0].amount,amount);
      shield.system.quantity=0;
      assert.deepEqual(defenseBenefits(actor,{incomingAttack:true}),[]);
      assert.equal(effect.active,true,"inventory corrections must not delete the benefit record");
    }
  } finally { globalThis.game=previous; }
});

test("zero-quantity healing bottles cannot be declared through preview or the public request service", async () => {
  const previous = {game:globalThis.game,fetch:globalThis.fetch,fromUuid:globalThis.fromUuid,ChatMessage:globalThis.ChatMessage};
  const references=JSON.parse(await readFile(new URL("../static/data/forge-references.json",import.meta.url),"utf8"));
  const record=references.equipment.find(entry=>entry.id==="item-lesser-healing-bottle");
  const actor={documentName:"Actor",id:"hero",uuid:"Actor.hero",type:"character",items:[],effects:[],system:{health:{value:5,max:12},grit:{available:1}},getFlag:(_,key)=>key==='nativeWorkshop'?{portable:{format:'heroes-of-legend-character',schemaVersion:7,draft:{}}}:undefined,testUserPermission:()=>true,getActiveTokens:()=>[]};
  const bottle={documentName:"Item",id:"bottle",uuid:"Actor.hero.Item.bottle",name:record.name,type:"equipment",actor,system:{catalogId:record.id,quantity:0,inventoryDie:4,hands:0,held:false,worn:false},getFlag:()=>record.source};
  actor.items.push(bottle);const combats=[];combats.contents=combats;let writes=0;
  try {
    globalThis.game={user:{id:"owner",isGM:false},combats,settings:{get:()=>"authority"}};
    globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(new URL(`../static/data/${String(url).split("/").at(-1)}`,import.meta.url),"utf8"))});
    globalThis.fromUuid=async uuid=>uuid===bottle.uuid?bottle:uuid===actor.uuid?actor:null;
    globalThis.ChatMessage={create:async()=>{writes++;}};
    const blocked=await previewPotionUse({sourceItemUuid:bottle.uuid});
    assert.equal(blocked.canDeclare,false);assert.match(blocked.sourceError,/no quantity remaining/);
    await assert.rejects(requestPotionUse({sourceItemUuid:bottle.uuid}),/no quantity remaining/);
    assert.equal(writes,0,"an empty stack must not create an operation or apply healing");
    bottle.system.quantity=1;
    const available=await previewPotionUse({sourceItemUuid:bottle.uuid});
    assert.equal(available.canDeclare,true,available.sourceError);
    assert.equal(actor.system.health.value,5,"preview remains read-only");
    const action={documentName:'Item',id:'use-potion',uuid:'Actor.hero.Item.use-potion',name:'Use a Healing Potion',type:'ability',actor,system:{},getFlag:(_,key)=>({catalogId:'ability-use-a-healing-potion',grantKind:'nativeWorkshop',workshopRecord:{nodeId:'ability-use-a-healing-potion'}})[key]};
    actor.items.push(action);globalThis.fromUuid=async uuid=>uuid===action.uuid?action:uuid===bottle.uuid?bottle:uuid===actor.uuid?actor:null;
    const fromAction=await previewPotionUse({sourceItemUuid:action.uuid,bottleItemUuid:bottle.uuid});assert.equal(fromAction.canDeclare,true,fromAction.sourceError);
    action.getFlag=(_,key)=>key==='catalogId'?'ability-use-a-healing-potion':null;
    const unbound=await previewPotionUse({sourceItemUuid:action.uuid,bottleItemUuid:bottle.uuid});assert.equal(unbound.canDeclare,false);assert.match(unbound.sourceError,/action source changed/);

  } finally { Object.assign(globalThis,previous); }
});
