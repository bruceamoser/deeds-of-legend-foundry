import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { selectTestUser } from "./helpers/login.mjs";
import { workshopCatalogs } from "../src/rules/workshop-forge-catalog.mjs";
import { writePortableCharacter } from "../src/rules/portable-character.mjs";

const url = process.env.HOL_TEST_URL;
assert.equal(new URL(url).hostname, "localhost");
assert.equal(process.env.HOL_TEST_ALLOW_WRITES, "1");
assert.equal(process.env.HOL_TEST_ISOLATED_WORLD, "1");
const output = "test-results/fencing-tactics-native";
const read = async path => JSON.parse(await readFile(path, "utf8"));
const catalogs = workshopCatalogs(...await Promise.all(
  ["choices","inventory","wounds","forge","forge-references"].map(name => read(`static/data/${name}.json`)),
));
const { draft } = await read("Build-Offs/revised/builds/fighter-level-7.hol.json");
draft.name = "Runtime Fencing and Tactics";
draft.attributes = {brawn:0,fortitude:0,agility:2,guile:0,knowledge:1,reason:0};
draft.background = {id:"origin-background-company-runner",pair:0};
const techniques = ["fencing:pointwork:1","tactics:openings:1","tactics:coordination:1","arms:bladework:1"];
draft.purchases[1] = ["fencing", "armor:harness:1", ...techniques].map(id => ({id}));
draft.progression.levels[3].purchases = [1, 2, 3, 4].map(step => ({id:`arms:dueling:${step}`}));
draft.progression.levels[7].purchases = [5, 6, 7].map(step => ({id:`arms:dueling:${step}`}));
draft.play = {favorites:{abilities:[...techniques, "arms:dueling:7"],items:[]}};
const fixture = writePortableCharacter(draft, catalogs, {ready:true});
await mkdir(output, {recursive:true});
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1450,height:1000}});
const errors = [];
const checks = [];
page.on("pageerror", error => errors.push(error.message));
let id;
try {
  await page.goto(url + "/join");
  if (page.url().includes("/join")) {
    await selectTestUser(page, "Gamemaster");
    await page.locator("button[name=join]").click();
  }
  await page.waitForFunction(() => globalThis.game?.ready);
  assert.equal(await page.evaluate(() => game.world.id), "hol-native-325");
  assert.equal(await page.evaluate(() => game.system.version), (await read("static/system.json")).version);
  id = await page.evaluate(async () => (await Actor.create({name:"Runtime Fencing and Tactics",type:"character"})).id);
  await page.evaluate(async ({id,fixture}) => {
    foundry.nue.Tour.activeTour?.exit();
    const actor = game.actors.get(id);
    await actor.importFromJSON(fixture);
    await actor.sheet.render({force:true});
  }, {id,fixture});
  const sheet = page.locator(".hol-workshop-character");
  const dialog = sheet.locator("#reference");
  const attribute = dialog.locator("#sheet-roll-attribute");
  const technique = name => sheet.getByRole("button",{name:"Roll "+name,exact:true});

  async function roll(name, allowed, selected, printed) {
    const messages = page.locator(".chat-message").filter({hasText:name});
    const previousMessages = await messages.count();
    await technique(name).click();
    await expect(dialog).toBeVisible();
    assert.deepEqual(await attribute.locator("option").evaluateAll(opts => opts.map(opt=>opt.value)), allowed);
    await attribute.selectOption(selected);
    await dialog.getByRole("button",{name:"Roll",exact:true}).click();
    const signed = printed.split(" ").at(-1);
    await expect(dialog.locator("#recipe-roll-result p").first()).toHaveText(new RegExp(` ${signed.replace("+","[+]")}$`));
    await expect(dialog.locator("#recipe-roll-result")).toContainText(name);
    await page.evaluate(async id=>await game.actors.get(id).sheet.controller.settle(),id);
    await expect(messages).toHaveCount(previousMessages+1);
    const post = messages.last();
    await expect(post.locator(".hol-chat-bar")).toContainText(printed);
    await dialog.screenshot({path:output+"/"+name.toLowerCase().replaceAll(" ","-")+".png"});
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    checks.push(name+" rolled "+printed+" in the shared sheet and Foundry chat.");
  }

  await roll("Measured Cut I", ["brawn","agility"], "agility", "Agility +2");
  await roll("Duelist’s Boundary", ["brawn","agility"], "brawn", "Brawn +0");
  await roll("Direct Thrust I", ["agility"], "agility", "Agility +2");
  await roll("Exploit the Opening I", ["knowledge"], "knowledge", "Knowledge +1");
  await sheet.getByRole("button",{name:"Use Clear the Way I",exact:true}).click();
  await expect(sheet.locator(".inline-action-detail")).toContainText("1 Boon");
  checks.push("Clear the Way displays the actual ally cue and boon rule.");
  await page.evaluate(async id=>{
    const actor = game.actors.get(id);
    const weapon = actor.items.find(item=>item.system.catalogId==="item-ordinary-melee-weapon");
    await weapon.update({"system.held":false});
    await actor.sheet.render({force:true});
  },id);
  await expect(sheet.getByRole("button",{name:/Wield a suitable one-handed melee weapon to use Direct Thrust/})).toBeDisabled();
  await expect(sheet.getByRole("button",{name:/Wield a melee weapon to use Exploit the Opening/})).toBeDisabled();
  checks.push("Stowing the sword disables both weapon-dependent techniques.");
  const itemUseError = await page.evaluate(async id => {
    const actor = game.actors.get(id);
    const item = actor.items.find(item=>item.getFlag("heroes-of-legend","catalogId")==="fencing:pointwork:1");
    const {activateOwnedAbility} = await import("/systems/heroes-of-legend/services/abilities.mjs");
    try {await activateOwnedAbility(item); return null;}
    catch (error) {return error.message;}
  }, id);
  assert.match(itemUseError, /Wield a suitable one-handed melee weapon/);
  checks.push("Native owned ability activation also checks the held weapon.");
  assert.deepEqual(errors,[]);
  console.info(checks.join("\n"));
  await writeFile(output+"/evidence.json",JSON.stringify({checks,errors},null,2));
} finally {
  if (id) await page.evaluate(async id=>{
    const actor = game.actors.get(id);
    await actor?.sheet.close();
    await actor?.delete();
  },id);
  await browser.close();
}
