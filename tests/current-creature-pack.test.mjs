import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {generateCurrentCreaturePack} from "../scripts/generate-current-creature-pack.mjs";
test("current creature publication keeps stable identities and uses pinned HP and CV",async()=>{
 const documents=await generateCurrentCreaturePack({check:true});
 const overrides=JSON.parse(await readFile(new URL("../static/data/forge-creatures.json",import.meta.url)));
 assert.equal(documents.length,192);
 const current = new Map(overrides.creatures.map(record => [record.id, record]));
 for(const document of documents){
  const id=document.flags["heroes-of-legend"].catalogId;
  const old=JSON.parse(await readFile(new URL(`../content/packs/creatures/${id}.json`,import.meta.url)));
  assert.equal(document._id,old._id);assert.equal(document.img,old.img);
  const record = current.get(id);
  assert.equal(document.system.health.baseMax, record?.hp.max ?? old.system.health.baseMax, id);
  assert.equal(document.system.cv, record?.cv ?? old.system.cv, id);
  assert.equal(document.flags["heroes-of-legend"].sourceCommit,overrides.sourceCommit);
  for(const template of document.flags["heroes-of-legend"].monsterAbilityTemplates)assert.equal(template.source.commit,overrides.sourceCommit);
 }
 const dragon = documents.find(document => document.name === "Red Dragon");
 const breath = dragon.system.actions.entries.find(action => action.name === "Furnace breath");
 assert.deepEqual(breath.outcomes, {weak: "14 + Burning 2", standard: "10 + Burning 1", strong: "6"});
});
