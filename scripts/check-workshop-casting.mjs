import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile, mkdir} from "node:fs/promises";
import {resolve, extname, sep} from "node:path";
import {chromium, expect} from "@playwright/test";
import {workshopCatalogs} from "../src/rules/workshop-forge-catalog.mjs";
import {writePortableCharacter} from "../src/rules/portable-character.mjs";
import {workshopCharacter} from "../src/rules/workshop-character.mjs";
import {spellActionLabel} from "../src/rules/forge-casting.mjs";

const read = async path => JSON.parse(await readFile(path,"utf8"));
const catalogs = workshopCatalogs(...await Promise.all(["choices","inventory","wounds","forge","forge-references"].map(n=>read(`static/data/${n}.json`))));
const fixture = async name => (await read(`Build-Offs/revised/builds/${name}-level-7.hol.json`)).draft;
const root=resolve("dist/workshop"), prefix="/heroes-of-legend-foundry/";
const types={".html":"text/html",".mjs":"text/javascript",".json":"application/json",".css":"text/css",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{try{const p=new URL(req.url,"http://localhost").pathname;if(!p.startsWith(prefix))throw Error();const file=resolve(root,p.slice(prefix.length)||"index.html");if(!file.startsWith(root+sep))throw Error();res.setHeader("Content-Type",types[extname(file)]??"application/octet-stream");res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser;
try {
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1000,height:800}});
  page.setDefaultTimeout(8000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const base=`http://127.0.0.1:${server.address().port}${prefix}`;
  await page.goto(base);
  const action=(name)=>page.locator(`[data-action="${name}"]`);
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft.play);
  const load=async draft=>{
    draft.play={hp:10,sp:8};
    assert(workshopCharacter(draft,catalogs).valid,`${draft.name} fixture must be legal`);
    const character=JSON.parse(writePortableCharacter(draft,catalogs,{ready:true}));
    await page.evaluate(character=>localStorage.setItem("hol.workshop.v1",JSON.stringify({character,mode:"sheet",tab:"Abilities"})),character);
    await page.reload();await expect(page.getByRole("heading",{name:draft.name,exact:true})).toBeVisible();
  };
  const cast=async id=>{
    await page.getByRole("tab",{name:"Abilities",exact:true}).click();
    const row=page.locator(`[data-action-row="${id}"]`);
    await row.locator('[data-action="cast-spell"]').click();
  };
  const finishRoll=async()=>{const roll=action("roll-sheet");if(await roll.isVisible()){await roll.click();await expect(roll).toBeDisabled();}};
  const close=async()=>{await page.keyboard.press("Escape");};

  const sorcerer = await fixture("sorcerer");
  await load(sorcerer);
  await page.getByRole("tab",{name:"Spellbooks",exact:true}).click();
  await page.getByLabel("Spell timing",{exact:true}).selectOption("Ritual");
  const boil = page.locator('[data-action-row="spell:flame:2"]');
  await expect(boil.locator(".timing-cell")).toHaveText("Main Action · Ritual · 1 minute");
  const boilButton = boil.getByRole("button",{name:"Cast Boil Liquid",exact:true});
  await expect(boilButton).toHaveText("Cast");
  const favoriteBoil = boil.locator('[data-action="favorite"]');
  if (await favoriteBoil.getAttribute("aria-pressed") !== "true") await favoriteBoil.click();
  await page.getByRole("tab",{name:"Main",exact:true}).click();
  await expect(boil.locator("xpath=ancestor::details[1]").locator(":scope > summary")).toContainText("Main Action");
  await boilButton.click();
  const choosePayment = page.getByRole("button",{name:"Pay printed SP · 1 SP",exact:true});
  if (await choosePayment.isVisible()) await choosePayment.click();
  await expect(page.getByRole("dialog")).toContainText("Finish the printed casting time");
  assert.equal((await state()).sp,7);
  await close();

  for(const [name,id] of [["paladin","ability-signature-protector-healing-hands"],["druid","ability-signature-shepherd-borrowed-shape"]]){
    const draft=await fixture(name);
    if(name==="paladin"){draft.signatureId=id;draft.progression.levels[3].signatures={3:"ability-signature-protector-restoring-hands"};draft.progression.levels[7].signatures={7:"ability-signature-protector-sheltering-hands"};}
    await load(draft);await cast(id);await finishRoll();
    await expect(page.getByLabel("Current SP",{exact:true})).toHaveValue("7");
    assert.equal((await state()).sp,7,`${name} signature spends exactly1SP`);await close();
  }
  const shepherd=await fixture("druid");
  shepherd.progression.levels[3].signatures={3:"ability-signature-shepherd-bring-them-near"};
  await load(shepherd);await cast("ability-signature-shepherd-bring-them-near");
  assert.equal((await state()).sp,8);
  assert.equal((await state()).sustain.spellId,"ability-signature-shepherd-bring-them-near");
  await page.getByRole("tab",{name:"Main",exact:true}).click();
  await expect(page.getByRole("region",{name:"Sustained Spell"})).toContainText("The Fold");
  await page.reload();
  await expect(page.getByRole("region",{name:"Sustained Spell"})).toContainText("The Fold");
  await action("sustain-spell").click();
  assert.equal((await state()).sp,8);
  assert.equal((await state()).sustain.maintainedTurn,1);
  const nature=await fixture("druid");
  nature.purchases={0:[],1:[]}; nature.acquisitions={};
  for(const level of Object.values(nature.progression.levels)){level.purchases=[];level.acquisitions={};}
  const natureGrants=workshopCharacter(nature,catalogs).state.learned;
  nature.progression.levels[7].purchases=[
    ...["life"].filter(id=>!natureGrants.includes(id)),
    ...["growth","transformation"].flatMap(book=>[0,1,2,3,4,5].map(step=>`${book}:${step}`)),
  ].map(id=>({id}));
  await load(nature);
  await page.getByRole("tab",{name:"Spellbooks",exact:true}).click();
  for(const name of ["Goodberry","Plant Growth","Shapechange"]){
    const spell=catalogs.forge.spells.find(spell=>spell.name===name);
    const row=page.locator(`[data-action-row="${spell.id}"]`);
    const book=row.locator("xpath=ancestor::details[1]");
    if(await book.getAttribute("open") === null) await book.locator(":scope > summary").click();
    await expect(row.locator(".timing-cell")).toHaveText(spellActionLabel(spell));
    await row.getByRole("button",{name:`Expand ${name}`,exact:true}).click();
    await expect(page.locator(`[data-detail-id="${spell.id}"]`)).toContainText(spell.effect);
  }
  await page.getByRole("button",{name:"Favorite Plant Growth",exact:true}).click();
  await mkdir("test-results/workshop-sync",{recursive:true});
  await page.screenshot({path:"test-results/workshop-sync/spellbook-inline.png",fullPage:true});
  const beforePlant=await page.evaluate(()=>JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft);
  await page.locator('[data-action-row="spell:growth:6"] [data-action="cast-spell"]').click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("Casting recorded: Plant Growth · 3 SP spent.", {exact:true})).toBeVisible();
  assert.equal((await state()).sp,5,"Plant Growth spends 3 SP once");
  assert(!((await state()).sustain),"Plant Growth has no Sustain obligation");
  await close(); await page.reload();
  const afterPlant=await page.evaluate(()=>JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft);
  assert.equal(afterPlant.play.sp,5);
  assert.deepEqual(afterPlant.progression,beforePlant.progression);
  assert.deepEqual(afterPlant.play.favorites,beforePlant.play.favorites);
  const artisan=await fixture("artificer");
  // Keep the actual legal origins/signatures/equipment, exchanging learned purchases
  // for both capacity paths. All purchases are validated with the real ledger.
  artisan.purchases={0:[],1:[]};artisan.acquisitions={};
  for(const level of Object.values(artisan.progression.levels)){level.purchases=[];level.acquisitions={};}
  artisan.progression.levels[7].purchases=["spellcraft",...['soul-capacity','mind-capacity'].flatMap(path=>Array.from({length:7},(_,i)=>`spellcraft:${path}:${i+1}`))].map(id=>({id}));
  await load(artisan);
  const ritual="ability-signature-intellect-make-it-last";
  await cast(ritual);
  await expect(page.getByRole("dialog")).toContainText("Choose how to pay");
  await page.locator('[data-payment="normal"]').click();
  await expect(page.getByRole("dialog")).toContainText("Finish the printed casting time");
  assert.equal((await state()).sp,7);
  assert.equal(Boolean((await state()).soulWellspringUsed),false);
  assert.equal(Boolean((await state()).mindPalaceUsed),false);
  await close();
  await cast(ritual);await page.locator('[data-payment="mind"]').click();
  assert.equal((await state()).sp,7);assert.equal((await state()).mindPalaceUsed,true);
  await close();await page.reload();
  assert.equal((await state()).mindPalaceUsed,true);
  await cast(ritual);await expect(page.locator('[data-payment="mind"]')).toHaveCount(0);
  await page.locator('[data-payment="soul"]').click();
  assert.equal((await state()).sp,7);assert.equal((await state()).soulWellspringUsed,true);
  await close();await page.reload();
  assert.equal((await state()).soulWellspringUsed,true);
  await action("hero-recovery").click();await action("complete-hero-rest").click();
  assert.equal((await state()).mindPalaceUsed,false);assert.equal((await state()).soulWellspringUsed,false);
  await close();await cast(ritual);
  await expect(page.locator('[data-payment="mind"]')).toBeVisible();
  await expect(page.locator('[data-payment="soul"]')).toBeVisible();
  await close();
  await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem("hol.workshop.v1"));saved.mode="builder";saved.step=6;localStorage.setItem("hol.workshop.v1",JSON.stringify(saved));});
  await page.reload();
  const formula=page.locator("details").filter({has:page.locator("summary",{hasText:"How maximum SP is calculated"})});
  await formula.locator("summary").click();
  await expect(formula).toContainText("Maximum SP = 2 × level + ancestry SP + 2 × positive class mental attribute + Spellcraft bonuses + other SP bonuses.");
  await formula.scrollIntoViewIfNeeded();
  await page.screenshot({path:"test-results/workshop-sync/maximum-sp-formula.png"});
  assert.deepEqual(errors,[]);
  console.log("Workshop casting browser checks passed: signature costs, ritual timing, optional payments, persistence and rest.");
} finally {await browser?.close();await new Promise(done=>server.close(done));}
