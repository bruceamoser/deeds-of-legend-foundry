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
  "mastery:starfall-volley", "spellcraft:soul-capacity:1",
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
  await page.evaluate(character=>localStorage.setItem("hol.workshop.v1",JSON.stringify({character,mode:"sheet",tab:"Development"})),character);
  await page.reload();
  await page.locator('[data-action="advance"]').click();
  await page.locator('[data-action="forge-view"][data-id="atlas"]').click();
  const atlas=page.getByRole("dialog",{name:"Discipline atlas",exact:true});
  const select=id=>atlas.locator(`.forge-map [data-action="forge-select"][data-id="${id}"]`).click();
  const action=(name,id)=>atlas.locator(`[data-action="${name}"][data-id="${id}"]`);
  const inspector=atlas.locator("#forge-selection");
  await mkdir("test-results/spell-atlas",{recursive:true});
  for(const [discipline,book,count] of [["elements","flame",2],["life","restoration",4],["invocation","passage",3],["spellcraft",null,0]]){
    await action("forge-filter","all").click();
    await select(discipline);await action("forge-filter",discipline).click();
    if(book){
      await select(`${book}:3`);
      await expect(inspector).toContainText("Master spells · Level 7");
      await expect(inspector).toContainText("Each master spell is a separate choice");
      await expect(atlas.locator(`[data-mastery-stem="${book}:3"]`)).toHaveCount(1);
      await expect(atlas.locator(`.forge-branch[data-from="${book}:3"][data-to]`)).toHaveCount(count);
      const masterIds=catalogs.forge.books.find(b=>b.id===book).masteryIds;
      const boxes=await Promise.all(masterIds.map(id=>atlas.locator(`.forge-map [data-id="${id}"]`).boundingBox()));
      for(const [i,a] of boxes.entries())for(const b of boxes.slice(i+1))
        assert(a.x+a.width<=b.x || b.x+b.width<=a.x || a.y+a.height<=b.y || b.y+b.height<=a.y,`${book} mastery buttons do not overlap`);
    } else await expect(atlas.locator(".forge-mastery-stem")).toHaveCount(0);
    await page.mouse.move(1,1);
    await page.screenshot({path:`test-results/spell-atlas/${discipline}.png`});
  }
  await action("forge-filter","all").click();await select("elements");await action("forge-filter","elements").click();
  await select("mastery:meteor-swarm");
  await expect(inspector).toContainText("Other master spells");
  await expect(action("forge-learn","mastery:meteor-swarm")).toBeEnabled();
  await action("forge-learn","mastery:meteor-swarm").click();
  await expect(atlas.locator('.forge-map [data-id="mastery:meteor-swarm"]')).toHaveClass(/is-learned/);
  await expect(atlas.locator('[data-mastery-stem="flame:3"]')).toHaveClass(/is-learned/);
  await action("forge-filter","all").click();await select("life");await action("forge-filter","life").click();
  for(const id of catalogs.forge.books.find(b=>b.id==="restoration").masteryIds){
    await select(id);await expect(action("forge-learn",id)).toBeEnabled();
  }
  await page.setViewportSize({width:900,height:800});
  await select("restoration:3");await page.mouse.move(1,1);
  await page.screenshot({path:"test-results/spell-atlas/life-900.png"});
  await page.setViewportSize({width:390,height:800});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"narrow atlas stays within the screen");
  await page.screenshot({path:"test-results/spell-atlas/life-390.png"});
  await page.keyboard.press("Escape");await page.reload();
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft);
  assert(restored.progression.levels[7].purchases.some(p=>p.id==="mastery:meteor-swarm"));
  assert.deepEqual(errors,[]);
  console.log("PASS spell atlas: shared tails for 1–4 independent masters, real Elements/Life/Invocation/Spellcraft layouts, level shapes, learning and reload, 1000/900/390px.");
} finally {await browser.close();await new Promise(done=>server.close(done));}
