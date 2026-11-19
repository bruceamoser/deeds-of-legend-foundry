import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {chromium, expect} from "@playwright/test";
import {selectTestUser} from "./helpers/login.mjs";

const url = process.env.HOL_TEST_URL;
assert.equal(url, "http://localhost:30025");
assert.equal(process.env.HOL_TEST_ALLOW_WRITES, "1");
assert.equal(process.env.HOL_TEST_ISOLATED_WORLD, "1");
assert.equal(process.env.HOL_NATIVE_RUNTIME_LEASE, "workshop");
const expectedVersion = JSON.parse(await readFile("static/system.json")).version;
const portable = JSON.parse(await readFile("Build-Offs/revised/builds/sorcerer-level-1.hol.json"));
portable.draft.name = "Playtest349 casting and use";
const spellsAndAbilities = ["spell:flame:2", "athletics:balance:1", "athletics:swimming:1"];
portable.draft.purchases[1] = ["flame:0", "athletics", ...spellsAndAbilities.slice(1)].map(id => ({id}));
portable.draft.play = {favorites:{abilities:spellsAndAbilities,items:[]}};
const browser = await chromium.launch();
let gm, player, fixture;
async function join(name) {
  const page = await browser.newPage({viewport:{width:1350,height:960}});
  await page.addInitScript(() => localStorage.setItem("core.noCanvas", "true"));
  page.setDefaultTimeout(12000);
  await page.goto(url + "/join");
  await selectTestUser(page,name);
  await page.locator('button[name="join"]').click();
  await page.waitForFunction(() => globalThis.game?.ready);
  await page.evaluate(() => foundry.nue.Tour.activeTour?.exit());
  return page;
}
try {
  gm = await join("Gamemaster");
  assert.deepEqual(await gm.evaluate(() => [game.world.id,game.system.version,game.release.build]),
    ["hol-native-325",expectedVersion,370]);
  fixture = await gm.evaluate(async portable => {
    const f = globalThis.__playtest349Uses = {};
    const user = await User.create({name:"Playtest349 owner " + foundry.utils.randomID(5),role:CONST.USER_ROLES.PLAYER});
    f.user = user.id;
    f.name = user.name;
    const actor = await Actor.create({
      name:portable.draft.name,type:"character",ownership:{[user.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER},
    });
    f.actor = actor.id;
    await actor.importFromJSON(JSON.stringify(portable));
    await user.update({character:actor.id});
    return f;
  }, portable);
  player = await join(fixture.name);
  const errors = [];
  player.on("pageerror",error=>errors.push(error.message));
  await player.evaluate(async id=>{
    const actor = game.actors.get(id);
    await actor.sheet.render({force:true});
    await actor.sheet.mountReady;
  },fixture.actor);
  const sheet = player.locator(".hol-workshop-character");
  const sp = () => gm.evaluate(id=>game.actors.get(id).system.sp.value,fixture.actor);
  const before = await sp();
  const posts = () => gm.evaluate(id=>game.messages.filter(message=>message.speaker?.actor===id
    && message.getFlag("heroes-of-legend","abilityReference")).map(message=>({
      name:message.getFlag("heroes-of-legend","abilityReference").name,content:message.content,
      roll:message.isRoll,author:message.author.id,
    })),fixture.actor);

  const boil = sheet.locator('[data-action-row="spell:flame:2"]');
  await expect(boil.locator("xpath=ancestor::details[1]").locator(":scope > summary")).toContainText("Main Action");
  const cast = boil.getByRole("button",{name:"Cast Boil Liquid",exact:true});
  await expect(cast).toHaveText("Cast");
  await cast.click();
  const dialog = sheet.getByRole("dialog",{name:"Boil Liquid"});
  await expect(dialog).toContainText("Finish the printed casting time");
  await expect.poll(sp).toBe(before-1);
  await expect.poll(async()=>(await posts()).map(post=>post.name)).toEqual(["Boil Liquid"]);
  assert.match((await posts())[0].content,/Bring its liquid to a rolling boil/);
  await dialog.getByRole("button",{name:"Close",exact:true}).click();

  await sheet.locator('[data-action-row="athletics:balance:1"]').getByRole("button",{name:"Use Catch Your Balance I",exact:true}).click();
  await sheet.locator('[data-action-row="athletics:swimming:1"]').getByRole("button",{name:"Use Strong Swimmer I",exact:true}).click();
  await expect.poll(async()=>(await posts()).map(post=>post.name)).toEqual(["Boil Liquid","Catch Your Balance I","Strong Swimmer I"]);
  assert((await posts()).every(post=>!post.roll && post.author===fixture.user));
  assert.equal(await sp(),before-1);
  assert.deepEqual(errors,[]);
  console.info("Verified player Boil Liquid as Main Action and Cast, one SP paid, and single effect-only chat cards for the ritual, reaction and passive.");
} finally {
  await player?.close();
  await gm?.evaluate(async ()=>{
    const f = globalThis.__playtest349Uses;
    if(!f)return;
    const messages = game.messages.filter(message=>message.speaker?.actor===f.actor
      || message.getFlag("heroes-of-legend","nativeWorkshopRequest")?.actorUuid===`Actor.${f.actor}`).map(message=>message.id);
    if(messages.length)await ChatMessage.deleteDocuments(messages);
    await game.actors.get(f.actor)?.delete();
    await game.users.get(f.user)?.delete();
  });
  await browser.close();
}
