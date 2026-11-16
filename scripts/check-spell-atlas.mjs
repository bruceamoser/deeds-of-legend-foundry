import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile, mkdir} from "node:fs/promises";
import {resolve, extname, sep} from "node:path";
import {chromium, expect} from "@playwright/test";
import {workshopCatalogs} from "../src/rules/workshop-forge-catalog.mjs";
import {workshopCharacter} from "../src/rules/workshop-character.mjs";
import {writePortableCharacter} from "../src/rules/portable-character.mjs";
const read=async path=>JSON.parse(await readFile(path,"utf8"));
const catalogs=workshopCatalogs(...await Promise.all(["choices","inventory","wounds","forge","forge-references"].map(n=>read(`static/data/${n}.json`))));
const draft=(await read("Build-Offs/revised/builds/wizard-level-7.hol.json")).draft;
draft.purchases={0:[],1:[]};draft.acquisitions={};
for(const level of Object.values(draft.progression.levels)){level.purchases=[];level.acquisitions={};}
const granted=workshopCharacter(draft,catalogs).state.learned;
draft.progression.levels[7].purchases=[
  ...["elements","life","invocation","spellcraft"].filter(id=>!granted.includes(id)),
  ...["flame","restoration","passage"].flatMap(book=>[0,1,2,3].map(step=>`${book}:${step}`)),
  "flame:4", "flame:5", "spellcraft:soul-capacity:1",
].map(id=>({id}));
assert(workshopCharacter(draft,catalogs).valid,"The atlas example is a legal current character");
const character=JSON.parse(writePortableCharacter(draft,catalogs,{ready:true}));
const root=resolve("dist/workshop"),prefix="/heroes-of-legend-foundry/";
const types={".html":"text/html",".mjs":"text/javascript",".json":"application/json",".css":"text/css",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{try{const p=new URL(req.url,"http://localhost").pathname;if(!p.startsWith(prefix))throw Error();const file=resolve(root,p.slice(prefix.length)||"index.html");if(!file.startsWith(root+sep))throw Error();res.setHeader("Content-Type",types[extname(file)]??"application/octet-stream");res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1000,height:800}});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  const base=process.env.HOL_WORKSHOP_URL??`http://127.0.0.1:${server.address().port}${prefix}`;
  await page.goto(base);
  const legacy=structuredClone(character);
  legacy.schemaVersion=6;
  legacy.draft.progression.levels[7].purchases=legacy.draft.progression.levels[7].purchases
    .filter(p=>!["flame:4","flame:5"].includes(p.id));
  legacy.draft.progression.levels[7].purchases.push({id:"mastery:meteor-swarm"});
  legacy.draft.play={hp:7,sp:2,gritSpent:1,favorites:{abilities:["spell:flame:1"],items:[]}};
  await page.evaluate(character=>localStorage.setItem("hol.workshop.v1",JSON.stringify({character,mode:"sheet",tab:"Development"})),legacy);
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("hol.workshop.v1")).character.schemaVersion)).toBe(7);
  const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft);
  const migratedIds=migrated.progression.levels[7].purchases.map(p=>p.id);
  assert(migratedIds.includes("flame:2"));
  assert(!migratedIds.includes("flame:3")&&!migratedIds.includes("mastery:meteor-swarm"));
  assert.equal(migrated.play.hp,7);assert.equal(migrated.play.sp,2);assert.equal(migrated.play.gritSpent,1);
  await page.evaluate(character=>localStorage.setItem("hol.workshop.v1",JSON.stringify({character,mode:"sheet",tab:"Development"})),character);
  await page.reload();
  await page.locator('[data-action="advance"]').click();
  await page.locator('[data-action="forge-view"][data-id="atlas"]').click();
  const atlas=page.getByRole("dialog",{name:"Discipline atlas",exact:true});
  const select=id=>atlas.locator(`.forge-map [data-action="forge-select"][data-id="${id}"]`).click();
  const action=(name,id)=>atlas.locator(`[data-action="${name}"][data-id="${id}"]`);
  const inspector=atlas.locator("#forge-selection");
  await mkdir("test-results/spell-atlas",{recursive:true});
  for(const [discipline,book] of [["elements","flame"],["life","restoration"],["invocation","passage"],["spellcraft","channeling"]]){
    await action("forge-filter","all").click();
    await select(discipline);await action("forge-filter",discipline).click();
    const entry=catalogs.forge.disciplines.find(d=>d.id===discipline);
    await expect(atlas.locator(".forge-map-step")).toHaveCount(28);
    await expect(atlas.locator(".forge-map-step.forge-level-1")).toHaveCount(12);
    await expect(atlas.locator(".forge-map-step.forge-level-3")).toHaveCount(12);
    await expect(atlas.locator(".forge-map-step.forge-level-7")).toHaveCount(4);
    await expect(atlas.locator(".forge-mastery-stem")).toHaveCount(0);
    for(const path of entry.paths) for(const [step,id] of path.steps.entries()) {
      const parent=path.steps[step-1]??discipline;
      await expect(atlas.locator(`.forge-branch[data-from="${parent}"][data-to="${id}"]`)).toHaveCount(1);
    }
    await select(`${book}:4`);
    await expect(inspector.locator(".forge-spell")).toHaveCount(1);
    if(discipline!=="elements") await expect(inspector.locator(".forge-meta")).toContainText("4 DP");
    await select(`${book}:6`);
    await expect(inspector.locator(".forge-spell")).toHaveCount(1);
    await expect(inspector.locator(".forge-meta")).toContainText("5 DP · Level 7");
    await page.mouse.move(1,1);
    await page.screenshot({path:`test-results/spell-atlas/${discipline}.png`});
  }
  await action("forge-filter","all").click();await select("elements");await action("forge-filter","elements").click();
  await select("flame:6");
  await expect(action("forge-learn","flame:6")).toBeEnabled();
  await action("forge-learn","flame:6").click();
  await expect(atlas.locator('.forge-map [data-id="flame:6"]')).toHaveClass(/is-learned/);
  await action("forge-filter","all").click();await select("life");await action("forge-filter","life").click();
  await select("restoration:5");
  await expect(action("forge-learn","restoration:5")).toBeDisabled();
  await select("restoration:4");
  await expect(action("forge-learn","restoration:4")).toBeEnabled();
  await action("forge-learn","restoration:4").click();
  await select("restoration:5");
  await expect(action("forge-learn","restoration:5")).toBeEnabled();
  await action("forge-learn","restoration:5").click();
  await select("restoration:6");
  await expect(action("forge-learn","restoration:6")).toBeEnabled();
  await page.setViewportSize({width:900,height:800});
  await select("restoration:3");await page.mouse.move(1,1);
  await page.screenshot({path:"test-results/spell-atlas/life-900.png"});
  await page.setViewportSize({width:390,height:800});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"narrow atlas stays within the screen");
  await page.screenshot({path:"test-results/spell-atlas/life-390.png"});
  await page.keyboard.press("Escape");await page.reload();
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft);
  assert(restored.progression.levels[7].purchases.some(p=>p.id==="flame:6"));
  assert.deepEqual(errors,[]);
  console.log("PASS spell atlas: equal seven-step paths, 4/4/5 DP single-spell advanced purchases, real Elements/Life/Invocation/Spellcraft layouts, legacy-save refund, sequential learning and reload, 1000/900/390px.");
} finally {await browser.close();await new Promise(done=>server.close(done));}
