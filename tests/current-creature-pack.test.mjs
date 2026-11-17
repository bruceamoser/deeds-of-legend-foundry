import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {generateCurrentCreaturePack} from "../scripts/generate-current-creature-pack.mjs";
test("current creature publication changes reference prose and preserves numerical native profiles",async()=>{
 const documents=await generateCurrentCreaturePack({check:true});
 const overrides=JSON.parse(await readFile(new URL("../static/data/forge-creatures.json",import.meta.url)));
 assert.equal(documents.length,192);
 for(const document of documents){
  const id=document.flags["heroes-of-legend"].catalogId;
  const old=JSON.parse(await readFile(new URL(`../content/packs/creatures/${id}.json`,import.meta.url)));
  assert.equal(document._id,old._id);assert.equal(document.img,old.img);
  const {actions,details,...stats}=document.system;
  const {actions:oldActions,details:oldDetails,...oldStats}=old.system;
  assert.deepEqual(stats,oldStats,id);
  assert.equal(document.flags["heroes-of-legend"].sourceCommit,overrides.sourceCommit);
  for(const template of document.flags["heroes-of-legend"].monsterAbilityTemplates)assert.equal(template.source.commit,overrides.sourceCommit);
 }
});
