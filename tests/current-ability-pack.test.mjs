import test from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {compilePack,extractPack} from "@foundryvtt/foundryvtt-cli";
import {currentAbilityPack,generateCurrentAbilityPack} from "../scripts/generate-current-ability-pack.mjs";
import {stableFoundryId} from "../scripts/content/item-packs.mjs";
const documents=await currentAbilityPack();
const byId=new Map(documents.map(item=>[item.flags["heroes-of-legend"].catalogId,item]));
test("authored current compendium contains current stable identities and full printed spell procedures",async()=>{
 await generateCurrentAbilityPack({check:true});
 const forge=JSON.parse(await readFile(new URL("../static/data/forge.json",import.meta.url)));
 assert.equal(new Set(documents.map(item=>item._id)).size,documents.length);
 for(const item of documents){assert.equal(item._id,stableFoundryId(item.flags["heroes-of-legend"].catalogId));assert.equal(item.flags["heroes-of-legend"].sourceCommit,forge.sourceCommit);}
 for(const spell of forge.spells){const item=byId.get(spell.id);assert.ok(item,spell.id);assert.deepEqual(item.flags["heroes-of-legend"].spell,spell);assert.equal(item.flags["heroes-of-legend"].workshopRecord.sp,spell.sp);assert.ok(item.system.description.includes(spell.duration.replaceAll("&","&amp;")));}
 const growth=forge.spells.find(spell=>spell.name==="Plant Growth");
 assert.equal(byId.get(growth.id).system.activity.action,"main");assert.equal(byId.get(growth.id).flags["heroes-of-legend"].workshopRecord.sp,3);
 const ritual=documents.find(item=>item.flags["heroes-of-legend"].spell && /ritual/i.test(item.flags["heroes-of-legend"].spell.action));assert.ok(ritual);assert.equal(ritual.system.activity.action,"ritual");
 const mastery=byId.get("spell-mastery:meteor-swarm");assert.equal(mastery.flags["heroes-of-legend"].workshopRecord.level,7);assert.equal(mastery.flags["heroes-of-legend"].workshopRecord.cost,5);
 const manifest=JSON.parse(await readFile(new URL("../static/system.json",import.meta.url)));assert.ok(!manifest.packs.some(pack=>pack.name==="wounds"));
});
test("current ability pack compiles and extracts as valid native Items",async t=>{
 const dir=await mkdtemp(join(tmpdir(),"hol-current-items-"));t.after(()=>rm(dir,{recursive:true,force:true}));
 await compilePack(fileURLToPath(new URL("../content/current-packs/abilities/",import.meta.url)),join(dir,"pack"));
 await extractPack(join(dir,"pack"),join(dir,"extracted"));
 const example=documents.find(item=>item.flags["heroes-of-legend"].spell?.name==="Plant Growth");
 const extracted=await Promise.all((await readdir(join(dir,"extracted"))).map(async file=>JSON.parse(await readFile(join(dir,"extracted",file)))));
 assert.equal(extracted.length,documents.length);
 assert.deepEqual(extracted.find(item=>item._id===example._id),example);
});

test("current native ability and spell descriptions format authored Markdown", () => {
 for (const { name, system } of documents) {
  assert.doesNotMatch(system.description, /\*\*[^*]+\*\*|\[[^\]]+\]\(\.?\.?\/|<p>\s*[-*] /, name);
 }
 assert.match(byId.get("ability-basic-melee").system.description, /<ul>/);
 assert.match(byId.get("ability-command-a-summon").system.description, /See the summoning rules for the tether/);
});
