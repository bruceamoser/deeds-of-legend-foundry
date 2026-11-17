import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createContext,SourceTextModule,SyntheticModule} from "node:vm";
import {workshopCatalogs} from "../src/rules/workshop-forge-catalog.mjs";
import {applyForgePlaytest} from "../src/rules/forge-playtest-catalog.mjs";
import {nativeWorkshopLearnedItems,nativeWorkshopEquipmentItems} from "../src/services/native-workshop-state.mjs";
import {currentNativeCharacterChanges} from "../src/rules/native-character-state.mjs";
import {ancestryTokenFootprint} from "../src/rules/ancestry-token.mjs";
import {validateContributions} from "../src/rules/conditions.mjs";
import {PORTABLE_FORMAT,MAX_CHARACTER_BYTES,readPortableCharacter,writePortableCharacter} from "../src/rules/portable-character.mjs";
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),"utf8"));
const [choices,inventory,wounds,forge,references]=await Promise.all(["choices","inventory","wounds","forge","forge-references"].map(name=>read(`../static/data/${name}.json`)));
const current=applyForgePlaytest(forge,references),catalogs=workshopCatalogs(choices,inventory,wounds,current.forge,current.references),languages={definitions:catalogs.languages};
const example=await read("../Build-Offs/revised/builds/wizard-level-3.hol.json");
let nextId=0;
const expandObject=changes=>{const output={};for(const[key,value]of Object.entries(changes)){const path=key.split('.');let target=output;for(const part of path.slice(0,-1))target=target[part]??={};target[path.at(-1)]=value;}return output;};
async function load(path,exports,globals={}){const context=createContext({structuredClone,TextEncoder,Date,...globals});const module=new SourceTextModule(await readFile(new URL(path,import.meta.url),"utf8"),{context});await module.link(async()=>{const dep=new SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context});await dep.link(()=>{});await dep.evaluate();return dep;});await module.evaluate();return module.namespace;}
const importer=await load("../src/services/portable-actor-import.mjs",{nativeWorkshopLearnedItems,nativeWorkshopEquipmentItems,currentNativeCharacterChanges,ancestryTokenFootprint,readPortableCharacter,writePortableCharacter,MAX_CHARACTER_BYTES,validateContributions,loadWorkshopCatalogs:async()=>catalogs,getCampaignLanguageConfiguration:()=>languages},{foundry:{utils:{randomID:()=>String(++nextId).padStart(16,'0'),expandObject}}});
const portable=()=>structuredClone(example);
test("current schema7 imports preserve HP/SP/play and native learned identities without retired wound state",()=>{
 const input=portable();input.draft.play={...input.draft.play,hp:2,sp:1,gritSpent:1,conditions:[{id:"slowed",key:"slowed",rating:1,persistence:"temporary",source:"Spell"}]};
 input._id="untrusted";input.ownership={default:3};
 const result=importer.buildPortableActorSource(input,catalogs,languages);
 assert.equal(result.system.health.value,2);assert.equal(result.system.sp.value,1);assert.equal(result.system.grit.spent,1);
 assert.equal(result.flags["heroes-of-legend"].nativeWorkshop.portable.schemaVersion,7);
 assert.equal(result.effects[0].flags["heroes-of-legend"].condition.key,"slowed");
 assert.equal(result.flags["heroes-of-legend"].wounds,undefined);assert.equal(result.flags["heroes-of-legend"].survival,undefined);
 assert.ok(result.items.some(item=>item.flags["heroes-of-legend"].spell));
 assert.equal(result._id,undefined);assert.equal(result.ownership,undefined);
 assert.equal(new Set(result.items.map(item=>item._id)).size,result.items.length);
});
test("pre-Forge characters reject before native allocation and legacy catalog cannot construct a PC",()=>{
 const before=nextId;
 for(const schemaVersion of [1,2,3])assert.throws(()=>importer.buildPortableActorSource({...portable(),schemaVersion},catalogs,languages),/no longer playable/);
 assert.throws(()=>importer.buildPortableActorSource(portable(),{choices:choices.records,inventory},languages),/current Workshop rules/);
 assert.equal(nextId,before);
});
test("incomplete current choices reject before native allocation",()=>{
 const input=portable();input.draft.name="";const before=nextId;
 assert.throws(()=>importer.buildPortableActorSource(input,catalogs,languages),/unresolved choices/);assert.equal(nextId,before);
});
async function actorApi() {
  const calls = [];
  class NativeActor {
    static async fromImport(source, context) { calls.push(["native-fromImport", source, context]); return source; }
    static fromSource(source, context) { calls.push(["fromSource", context]); return source; }
    async importFromJSON(json) {
      calls.push(["native-importFromJSON"]);
      const data = await this.constructor.fromImport(JSON.parse(json));
      // Native V14 removes preserveOnImport fields before its replacement update.
      for (const key of ["_id", "sort", "ownership", "folder"]) delete data[key];
      Object.assign(this, data); calls.push(["update"]); return this;
    }
  }
  const { HOLActor } = await load("../src/documents/actor.mjs", {
    ConditionPanel: class {}, PORTABLE_FORMAT, MAX_CHARACTER_BYTES,
    portableActorSource: importer.portableActorSource,
  }, { foundry: { documents: { Actor: NativeActor } }, game: { user: {} } });
  const actor = new HOLActor();
  Object.assign(actor, { type: "character", name: "Prior hero", ownership: { owner: 3 }, _id: "destination", testUserPermission: () => true });
  return { HOLActor, actor, calls };
}

test("ordinary Foundry JSON retains its native migration path and construction context", async () => {
  const { HOLActor, actor, calls } = await actorApi();
  const source = { name: "Native actor", type: "character", _stats: { coreVersion: "14.367" } };
  const context = { strict: false };
  await HOLActor.fromImport(source, context);
  assert.equal(calls[0][0], "native-fromImport"); assert.equal(calls[0][2], context);
  await actor.importFromJSON(JSON.stringify(source));
  assert.equal(actor.name, "Native actor");
});

test("portable import rejects unauthorized, noncharacter, token and oversized inputs before mutation", async () => {
  for (const changes of [{ testUserPermission: () => false }, { type: "creature" }, { isToken: true }, { pack: "pack" }]) {
    const { actor, calls } = await actorApi(); Object.assign(actor, changes);
    await assert.rejects(actor.importFromJSON(JSON.stringify(portable())), /own|world character/);
    assert.equal(calls.length, 0);
  }
  const { actor, calls } = await actorApi();
  const oversized = portable(); oversized.padding = "x".repeat(MAX_CHARACTER_BYTES);
  await assert.rejects(actor.importFromJSON(JSON.stringify(oversized)), /too large/);
  assert.equal(calls.length, 0);
});



test("current portable Import Data replaces a destination and preserves native identity/ownership",async()=>{
 const {actor,calls}=await actorApi();actor.items=[{name:"Prior content"}];
 await actor.importFromJSON(JSON.stringify(portable()));
 assert.equal(actor.name,example.draft.name);assert.equal(actor._id,"destination");assert.equal(actor.ownership.owner,3);
 assert.ok(!actor.items.some(item=>item.name==="Prior content"));
 assert.equal(actor.flags["heroes-of-legend"].nativeWorkshop.portable.schemaVersion,7);
 assert.equal(calls.filter(([kind])=>kind==="update").length,1);
});
test("a prior Workshop file uses current-only portable normalization",async()=>{
 const earlier=await read("../Build-Offs/revised/builds/wizard-level-1.hol.json");earlier.schemaVersion=6;
 const result=importer.buildPortableActorSource(earlier,catalogs,languages);
 assert.equal(result.flags["heroes-of-legend"].nativeWorkshop.portable.schemaVersion,7);
 assert.equal(result.flags["heroes-of-legend"].nativeWorkshop.portable.sourceCommit,catalogs.commit);
});
