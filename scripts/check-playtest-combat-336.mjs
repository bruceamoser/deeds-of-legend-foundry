import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { selectTestUser } from "./helpers/login.mjs";

const url = process.env.HOL_TEST_URL;
if (url !== "http://localhost:30025" || process.env.HOL_TEST_ALLOW_WRITES !== "1" ||
    process.env.HOL_TEST_ISOLATED_WORLD !== "1" || process.env.HOL_NATIVE_RUNTIME_LEASE !== "gameplay")
  throw new Error("Requires the gameplay lease and isolated http://localhost:30025 Foundry world.");

const rolls = resolve("test-results/playtest-combat-336");
await mkdir(rolls,{recursive:true});
const builds = Object.fromEntries(await Promise.all(
  ["fighter","sorcerer","ranger"].map(async name=>[name,JSON.parse(await readFile(`Build-Offs/revised/builds/${name}-level-3.hol.json`))]),
));
const browser = await chromium.launch();
const evidence = {checks:[], errors:[]};
let gm, player, fixture;

function pass(check) { evidence.checks.push(check); console.info(check); }

async function join(name) {
  const page=await browser.newPage({viewport:{width:1500,height:1100}});
  page.setDefaultTimeout(15000);
  page.on("pageerror",error=>evidence.errors.push(`${name}: ${error.message}`));
  await page.goto(url+"/join");
  await selectTestUser(page,name);
  await page.locator("button[name=join]").click();
  await page.waitForFunction(()=>globalThis.game?.ready,null,{timeout:60000});
  await page.evaluate(()=>{
    foundry.nue.Tour.activeTour?.exit();
    globalThis.__playtest336Notifications=[];
    const original=ui.notifications.error.bind(ui.notifications);
    ui.notifications.error=(message,...args)=>{
      __playtest336Notifications.push(String(message));
      return original(message,...args);
    };
  });
  return page;
}
async function revealChat(page,id) {
  await page.evaluate(async id=>{
    await ui.sidebar.expand();
    await ui.sidebar.changeTab("chat","primary");
    await ui.chat.scrollBottom?.();
    document.querySelector(`[data-message-id="${id}"]`)?.scrollIntoView({block:"end"});
  },id);
  return page.locator(`[data-message-id="${id}"]`);
}
async function turn(kind,payload={}) {
  await gm.evaluate(async ({fixture,kind,payload})=>{
    const {requestCombat}=await import("/systems/heroes-of-legend/services/combat.mjs");
    await requestCombat(game.combats.get(fixture.combat),kind,payload);
  },{fixture,kind,payload});
}
async function snapshot(page,id) {
  return page.evaluate(id=>game.messages.get(id).getFlag("heroes-of-legend","roll"),id);
}
async function waitForRoll(page,actor,name) {
  const filter={actor,name};
  await page.waitForFunction(({actor,name})=>game.messages.some(message=>{
    const roll=message.getFlag("heroes-of-legend","roll");
    return roll?.actorUuid===`Actor.${actor}` && roll.ability?.name===name;
  }),filter);
  return page.evaluate(({actor,name})=>game.messages.find(message=>{
    const roll=message.getFlag("heroes-of-legend","roll");
    return roll?.actorUuid===`Actor.${actor}` && roll.ability?.name===name;
  }).id,filter);
}
async function closeSheet(page,actor) {
  await page.evaluate(async id=>{
    const document=game.actors.get(id);
    if(document?.sheet.rendered) await document.sheet.close();
  },actor);
}
async function openSheet(page,id) {
  await page.evaluate(async id=>{
    const sheet=game.actors.get(id).sheet;
    await sheet.render({force:true});
    await sheet.mountReady;
  },id);
}
async function fixedDice(page,faces,next) {
  await page.evaluate(faces=>{
    globalThis.__playtest336Dice=CONFIG.Dice.randomUniform;
    let index=0;
    CONFIG.Dice.randomUniform=()=>1-((faces[index++]??3)-0.5)/6;
  },faces);
  try {return await next();}
  finally {await page.evaluate(()=>{CONFIG.Dice.randomUniform=globalThis.__playtest336Dice;delete globalThis.__playtest336Dice;});}
}
const getHp=(page,id)=>page.evaluate(id=>game.actors.get(id).system.health.value,id);

try {
  gm=await join(process.env.HOL_TEST_USER??"Gamemaster");
  evidence.runtime=await gm.evaluate(()=>({world:game.world.id,build:game.release.build,system:game.system.version}));
  assert.equal(evidence.runtime.world,process.env.HOL_TEST_WORLD??"hol-native-325");
  assert.equal(evidence.runtime.build,370);

  fixture=await gm.evaluate(async builds=>{
    const ID="heroes-of-legend";
    // Clean only test documents from this run's interrupted predecessor.
    const orphan=game.scenes.find(scene=>scene.name==="Combat336 isolated encounter");
    if(orphan){
      const previous=game.scenes.find(scene=>scene.name==="The Gathering") ?? game.scenes.find(scene=>scene.id!==orphan.id);
      if(orphan.active && previous)await previous.activate();
      await Combat.deleteDocuments(game.combats.filter(combat=>combat.name==="Combat336").map(combat=>combat.id));
      await orphan.delete();
      const actors=game.actors.filter(actor=>/^Playtest336 (fighter|sorcerer|ranger|guard|adder)$/.test(actor.name)).map(actor=>actor.id);
      await ChatMessage.deleteDocuments(game.messages.filter(message=>actors.includes(message.speaker?.actor) || actors.some(id=>message.getFlag(ID,"nativeWorkshopRequest")?.actorUuid===`Actor.${id}`)).map(message=>message.id));
      await Actor.deleteDocuments(actors);
      await User.deleteDocuments(game.users.filter(user=>/^Combat336 owner [A-Za-z0-9]{5}$/.test(user.name)).map(user=>user.id));
    }
    const f=globalThis.__playtest336={actors:[],messages:[],previousScene:game.scenes.active?.id??null,ammoTracking:game.settings.get(ID,"trackConsumable-ammunition")};
    f.chat=Hooks.on("createChatMessage",message=>f.messages.push(message.id));
    const member=await User.create({name:`Combat336 owner ${foundry.utils.randomID(5)}`,role:CONST.USER_ROLES.PLAYER});
    f.user=member.id;
    f.ownerName=member.name;
    for(const [name,portable] of Object.entries(builds)) {
      portable.draft.name=`Playtest336 ${name}`;
      portable.draft.play={favorites:{abilities:name==="fighter"?["arms:bladework:1"]:name==="ranger"?["ability-basic-ranged"]:["spell:flame:3"],items:[]}};
      const actor=await Actor.create({name:portable.draft.name,type:"character",ownership:{[member.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER}});
      f.actors.push(actor.id);
      f[name]=actor.id;
      await actor.importFromJSON(JSON.stringify(portable));
    }
    await member.update({character:f.fighter});
    const pack=await game.packs.get(`${ID}.creatures`).getDocuments();
    for(const [key,sourceId] of [["guard","creature-barrow-guard"],["adder","creature-adder"]]) {
      const data=pack.find(actor=>actor.getFlag(ID,"catalogId")===sourceId).toObject();
      delete data._id;
      data.name=`Playtest336 ${key}`;
      if(key==="adder")data.ownership={[member.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER};
      const actor=await Actor.create(data);
      f.actors.push(actor.id);
      f[key]=actor.id;
    }
    const hero=game.actors.get(f.fighter);
    const weapon=hero.items.find(item=>item.system.catalogId==="item-ordinary-melee-weapon");
    await weapon.update({name:"Playtest336 Blade","system.held":true,"system.carried":true});
    f.melee=weapon.id;
    const ranger=game.actors.get(f.ranger);
    const bow=ranger.items.find(item=>item.system.catalogId==="item-ordinary-ranged-weapon");
    const ammo=ranger.items.find(item=>item.system.catalogId==="item-ammunition-bundle");
    await game.settings.set(ID,"trackConsumable-ammunition",true);
    await bow.update({name:"Playtest336 Bow","system.carried":true});
    f.bow=bow.id;
    f.ammo=ammo.id;
    f.ammoInstance=ammo.getFlag(ID,"acquisitionInstance");
    const tokenKeys=["fighter","sorcerer","guard","adder","ranger"];
    const scene=await Scene.create({name:"Combat336 isolated encounter",width:900,height:700,padding:0,grid:{type:1,size:100},
      tokens:tokenKeys.map((key,i)=>({name:game.actors.get(f[key]).name,actorId:f[key],actorLink:true,x:(i+1)*100,y:200}))});
    f.scene=scene.id;f.tokens={};
    for(const key of tokenKeys)f.tokens[key]=scene.tokens.find(token=>token.actorId===f[key]).id;
    await scene.activate();
    await scene.view();
    const combat=await Combat.create({name:"Combat336",active:false,scene:scene.id});
    f.combat=combat.id;
    const participants=await combat.createEmbeddedDocuments("Combatant",tokenKeys.map(key=>({actorId:f[key],tokenId:f.tokens[key],sceneId:scene.id})));
    f.participants=Object.fromEntries(tokenKeys.map(key=>[key,participants.find(participant=>participant.actorId===f[key]).id]));
    return f;
  },builds);
  player=await join(fixture.ownerName);
  for(const page of [gm,player])await page.waitForFunction(id=>canvas.ready&&canvas.scene?.id===id,fixture.scene,{timeout:60000});

  await gm.evaluate(async f=>(await import("/systems/heroes-of-legend/applications/encounter.mjs")).openEncounterPanel(game.combats.get(f.combat)),fixture);
  const groups=gm.locator(".hol-encounter-panel .hol-combat-group");
  for(const name of ["fighter","sorcerer","ranger"])
    await groups.filter({hasText:"Players"}).getByText(`Playtest336 ${name}`,{exact:true}).waitFor();
  for(const name of ["guard","adder"])
    await groups.filter({hasText:"Creatures"}).getByText(`Playtest336 ${name}`,{exact:true}).waitFor();
  await gm.locator(`.hol-encounter-panel [data-action="side"][data-id="${fixture.participants.adder}"]`).click({noWaitAfter:true});
  await gm.locator('.dialog [data-action="players"]').click();
  await groups.filter({hasText:"Players"}).getByText("Playtest336 adder",{exact:true}).waitFor();
  await gm.locator(`.hol-encounter-panel [data-action="side"][data-id="${fixture.participants.adder}"]`).click({noWaitAfter:true});
  await gm.locator('.dialog [data-action="default"]').click();
  await groups.filter({hasText:"Creatures"}).getByText("Playtest336 adder",{exact:true}).waitFor();
  await turn("ambush",{side:"players"});
  await gm.waitForFunction(f=>game.combats.get(f.combat).getFlag("heroes-of-legend","encounter")?.round===1,fixture);
  await turn("choose",{id:fixture.participants.fighter});
  await gm.waitForFunction(f=>game.combats.get(f.combat).getFlag("heroes-of-legend","encounter")?.current===f.participants.fighter,fixture);
  pass("Actor type and explicit DA side override");

  await openSheet(player,fixture.fighter);
  await player.evaluate(f=>{
    canvas.tokens.get(f.tokens.fighter).control({releaseOthers:true});
    canvas.tokens.get(f.tokens.adder).setTarget(true,{releaseOthers:true});
  },fixture);
  await player.locator('.hol-workshop-character [data-action="open-roll"][data-id="arms:bladework:1"]').click();
  const native=player.locator(".hol-roll-dialog");
  await native.waitFor();
  await native.locator('select[name="attributeKey"]').selectOption("brawn");
  assert.match(await native.locator(".hol-banner").innerText(),/Measured Cut I[\s\S]*Playtest336 Blade/);
  assert.equal(await native.locator("details[open]").count(),0);
  await fixedDice(player,[5,5,5,5,5,5],async()=>{
    await native.locator('[data-action="roll"]').click();
    await native.waitFor({state:"detached"});
  });
  const cut=await waitForRoll(player,fixture.fighter,"Measured Cut I");
  const cutResult=await snapshot(player,cut);
  assert.equal(cutResult.equipment.name,"Playtest336 Blade");
  assert.equal(cutResult.tier,"strong");
  assert.deepEqual(cutResult.resolvedEffects.components,[{type:"physical",amount:6}]);
  assert.deepEqual(cutResult.resolvedEffects.conditions,[{key:"bleeding",rating:1}]);
  const adderBefore=await getHp(gm,fixture.adder);
  await gm.evaluate(f=>canvas.tokens.get(f.tokens.adder).control({releaseOthers:true}),fixture);
  const cutChat=await revealChat(gm,cut);
  assert.equal(await cutChat.getByRole("button",{name:"Roll again",exact:true}).count(),0);
  await cutChat.getByRole("button",{name:"Apply Damage",exact:true}).click();
  await gm.waitForFunction(({f,hp})=>game.actors.get(f.adder).system.health.value<hp,{f:fixture,hp:adderBefore});
  await gm.waitForFunction(id=>game.actors.get(id).effects.some(effect=>effect.getFlag("heroes-of-legend","condition")?.key==="bleeding"),fixture.adder);
  const condition=await gm.evaluate(id=>game.actors.get(id).effects.find(effect=>effect.getFlag("heroes-of-legend","condition")?.key==="bleeding")?.getFlag("heroes-of-legend","condition"),fixture.adder);
  assert.equal(condition?.rating,1);
  await gm.evaluate(({f,hp})=>game.actors.get(f.adder).update({"system.health.value":hp}),{f:fixture,hp:adderBefore});
  await closeSheet(player,fixture.fighter);
  pass("Learned weapon name, damage and Bleeding; exact native dice and dialog closure");

  for(const {roller,defender,token,total,tier,amount} of [
    {roller:gm,defender:fixture.adder,token:fixture.tokens.adder,total:14,tier:"standard",amount:5},
    {roller:gm,defender:fixture.adder,token:fixture.tokens.adder,total:15,tier:"strong",amount:3},
    {roller:player,defender:fixture.fighter,token:fixture.tokens.fighter,total:15,tier:"strong",amount:3},
  ]) {
    const beforeDefense=await getHp(gm,defender);
    const oath=await gm.evaluate(async f=>{
      const {declareCreatureAction}=await import("/systems/heroes-of-legend/services/npc-attacks.mjs");
      const actor=game.actors.get(f.guard);
      return (await declareCreatureAction(actor,actor.system.actions.entries.find(action=>action.name==="Oath blade").id)).id;
    },fixture);
    await roller.evaluate(id=>canvas.tokens.get(id).control({releaseOthers:true}),token);
    const oathChat=await revealChat(roller,oath);
    await oathChat.getByRole("button",{name:"Defend",exact:true}).click();
    const defenseDialog=roller.locator(".hol-roll-dialog");
    await defenseDialog.waitFor();
    await defenseDialog.locator('[name="adjustment"]').fill("0");
    const dodge=Number(await defenseDialog.locator("[data-roll-value]").innerText());
    const diceTotal=total-dodge;
    const low=Math.floor(diceTotal/3);
    const faces=[low,low,diceTotal-2*low];
    assert(faces.every(face=>face>=1&&face<=6));
    await fixedDice(roller,[...faces,...faces],async()=>{
      await defenseDialog.locator('[data-action="roll"]').click();
      await defenseDialog.waitFor({state:"detached"});
    });
    const defense=await roller.evaluate(oath=>game.messages.find(message=>message.getFlag("heroes-of-legend","roll")?.attackMessageId===oath)?.id,oath);
    assert(defense);
    const defenseResult=await snapshot(roller,defense);
    assert.equal(defenseResult.total,total);assert.equal(defenseResult.tier,tier);
    assert.deepEqual(defenseResult.attackOutcome.components,[{type:"physical",amount}]);
    const defenseChat=await revealChat(roller,defense);
    if(tier==="standard")assert.match(await defenseChat.innerText(),/Push 1/);
    else assert.doesNotMatch(await defenseChat.innerText(),/Push 1/);
    assert.equal(await defenseChat.getByRole("button",{name:"Roll again",exact:true}).count(),0);
    await defenseChat.getByRole("button",{name:"Apply Damage",exact:true}).click();
    await gm.waitForFunction(id=>game.messages.some(message=>message.getFlag("heroes-of-legend","explicitDamageResult")?.sourceMessageId===id),defense);
    assert((await getHp(gm,defender))<beforeDefense);
    await gm.evaluate(({defender,hp})=>game.actors.get(defender).update({"system.health.value":hp}),{defender,hp:beforeDefense});
  }
  pass("DA and player defenses use the correct 14 Standard and 15 Strong cutoffs, Push and damage");

  await turn("finish");
  await gm.waitForFunction(f=>!game.combats.get(f.combat).getFlag("heroes-of-legend","encounter")?.current,fixture);
  await turn("choose",{id:fixture.participants.guard});
  await gm.waitForFunction(f=>game.combats.get(f.combat).getFlag("heroes-of-legend","encounter")?.current===f.participants.guard,fixture);
  await turn("finish");
  await gm.waitForFunction(f=>!game.combats.get(f.combat).getFlag("heroes-of-legend","encounter")?.current,fixture);
  await turn("choose",{id:fixture.participants.sorcerer});
  await gm.waitForFunction(f=>game.combats.get(f.combat).getFlag("heroes-of-legend","encounter")?.current===f.participants.sorcerer,fixture);
  await gm.evaluate(f=>game.actors.get(f.sorcerer).update({
    "flags.heroes-of-legend.nativeWorkshopPendingRoll":{id:"legacy-cast",status:"prepared",kind:"cast",authorId:Object.keys(game.actors.get(f.sorcerer).ownership).find(id=>id!=="default")},
  }),fixture);
  await openSheet(player,fixture.sorcerer);
  const before=await player.evaluate(id=>game.actors.get(id).system.sp.value,fixture.sorcerer);
  await player.locator('.hol-workshop-character [data-action="cast-spell"][data-id="spell:flame:3"]').click();
  const cast=player.locator(".hol-workshop-character #reference[open]");
  await cast.waitFor();
  assert.equal(await cast.locator("details[open]").count(),0);
  await cast.getByRole("button",{name:/Cast and roll/}).click();
  await cast.waitFor({state:"hidden"});
  const nativeCast=await waitForRoll(player,fixture.sorcerer,"Burning Hands");
  assert(nativeCast);
  const after=await player.evaluate(f=>{
    const actor=game.actors.get(f.sorcerer),encounter=game.combats.get(f.combat).getFlag("heroes-of-legend","encounter");
    return {sp:actor.system.sp.value,pending:Boolean(actor.getFlag("heroes-of-legend","nativeWorkshopPendingRoll")),
      phases:Object.values(actor.getFlag("heroes-of-legend","nativeWorkshopRolls") ?? {}).map(roll=>roll.status).sort(),
      main:encounter.budgets[f.participants.sorcerer].remaining.main};
  },fixture);
  assert.deepEqual(after,{sp:before-1,pending:false,phases:["complete","interrupted"],main:0});
  await closeSheet(player,fixture.sorcerer);
  pass("First paid spell cast spends one SP and Main Action without a stranded receipt");

  await gm.evaluate(f=>game.combats.get(f.combat).delete(),fixture);
  await openSheet(player,fixture.ranger);
  const rangerSheet=player.locator(".hol-workshop-character");
  await rangerSheet.getByRole("tab",{name:"Inventory",exact:true}).click();
  await rangerSheet.getByLabel("Ammunition for Playtest336 Bow",{exact:true}).selectOption(fixture.ammoInstance);
  await gm.waitForFunction(f=>game.actors.get(f.ranger).items.get(f.bow).getFlag("heroes-of-legend","ammunitionItemId")===f.ammo,fixture);
  await closeSheet(player,fixture.ranger);
  await openSheet(player,fixture.ranger);
  await rangerSheet.getByLabel("Ammunition for Playtest336 Bow",{exact:true}).waitFor();
  assert.equal(await rangerSheet.getByLabel("Ammunition for Playtest336 Bow",{exact:true}).inputValue(),fixture.ammoInstance);
  await rangerSheet.getByRole("tab",{name:"Main",exact:true}).click();
  await player.locator('.hol-workshop-character [data-action="open-roll"][data-id="ability-basic-ranged"]').click();
  await native.waitFor();
  await native.locator('select[name="rangedWeaponItemId"]').selectOption(fixture.bow);
  assert.match(await native.locator(".hol-banner").innerText(),/Playtest336 Bow/);
  await native.locator('[data-action="roll"]').click();
  await native.waitFor({state:"detached"});
  const ranged=await waitForRoll(player,fixture.ranger,"Basic Ranged");
  assert.equal((await snapshot(player,ranged)).equipment.name,"Playtest336 Bow");
  const supply=await gm.evaluate(({f,ranged})=>game.actors.get(f.ranger).getFlag("heroes-of-legend","supplyActions")?.[ranged],{f:fixture,ranged});
  assert.equal(supply.itemId,fixture.ammo);
  pass("Native Inventory saves ammunition on the bow, and firing checks that supply once");
  assert.deepEqual(evidence.errors,[]);
} catch(error) {
  evidence.failure=error.stack;
  evidence.notifications=await Promise.allSettled([gm,player].filter(Boolean).map(page=>page.evaluate(()=>__playtest336Notifications)));
  console.error(JSON.stringify(evidence.notifications));
  await Promise.allSettled([gm?.screenshot({path:resolve(rolls,"gm-failure.png")}),player?.screenshot({path:resolve(rolls,"player-failure.png")})]);
  throw error;
} finally {
  if(gm)await gm.evaluate(async()=>{
    const f=globalThis.__playtest336;
    if(!f)return;
    Hooks.off("createChatMessage",f.chat);
    if(f.combat)await game.combats.get(f.combat)?.delete();
    if(f.previousScene)await game.scenes.get(f.previousScene)?.activate();
    if(f.scene)await game.scenes.get(f.scene)?.delete();
    await Actor.deleteDocuments(f.actors);
    if(f.user)await game.users.get(f.user)?.delete();
    await ChatMessage.deleteDocuments(f.messages.filter(id=>game.messages.has(id)));
    await game.settings.set("heroes-of-legend","trackConsumable-ammunition",f.ammoTracking);
  }).catch(error=>evidence.errors.push(error.message));
  await writeFile(resolve(rolls,"evidence.json"),JSON.stringify(evidence,null,2)+"\n");
  await browser.close();
}
