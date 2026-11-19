import {nativeWorkshopInventoryId,nativeItemForWorkshopInstance} from "../src/rules/native-item-identity.mjs";
import test from "node:test";
import vm from "node:vm";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { workshopCatalogs } from "../src/rules/workshop-forge-catalog.mjs";
import { applyForgePlaytest } from "../src/rules/forge-playtest-catalog.mjs";
import { readPortableCharacter } from "../src/rules/portable-character.mjs";
import { nativeWorkshopLearnedItems, nativeWorkshopEquipmentItems, loadNativeWorkshopState, saveNativeWorkshopState, commitNativeWorkshopCharacter, saveNativeWorkshopIdentity, mergeNativeWorkshopPlay } from "../src/services/native-workshop-state.mjs";
import { currentNativeCharacterChanges } from "../src/rules/native-character-state.mjs";
import { refundForgePurchases } from "../src/rules/forge.mjs";
import { LEARNED_GEAR_PREFIX } from "../src/rules/training-equipment.mjs";
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const [choices,inventory,wounds,forge,references] = await Promise.all(["choices","inventory","wounds","forge","forge-references"].map(name => read(`../static/data/${name}.json`)));
const current = applyForgePlaytest(forge,references);
const catalogs = workshopCatalogs(choices,inventory,wounds,current.forge,current.references);
const portable = await read("../Build-Offs/revised/builds/wizard-level-3.hol.json");
const {draft, preview} = readPortableCharacter(portable,catalogs,catalogs.languages);
test("current native learned Items contain all learned spells with stable identities", () => {
  assert.equal(preview.valid,true);
  const items = nativeWorkshopLearnedItems(preview,catalogs);
  assert.ok(preview.state.learning.spells.length);
  for (const spell of preview.state.learning.spells) assert.ok(items.some(item => item.flags["heroes-of-legend"].catalogId === spell.id));
  assert.ok(items.every(item => item.flags["heroes-of-legend"].grantKind === "nativeWorkshop"));
});
test("construction edits preserve spent native resources", () => {
  const changes = currentNativeCharacterChanges(draft,preview,{preserveResources:{health:{value:2},sp:{value:1},grit:{spent:1}}});
  assert.equal(changes["system.health.value"],2);
  assert.equal(changes["system.sp.value"],1);
  assert.equal(changes["system.grit.spent"],1);
  assert.equal(changes["system.sp.max"],preview.limits.maxSp);
  assert.equal(Object.hasOwn(changes,"flags.heroes-of-legend.wounds"),false);
});
test("native state rejects nonowners and stale saves before writing", async () => {
  globalThis.game = {user:{id:"test"}};
  const actor = {type:"character",uuid:"Actor.test",testUserPermission:()=>false};
  await assert.rejects(loadNativeWorkshopState(actor),/observe/);
  actor.testUserPermission=()=>true;
  actor.getFlag=(namespace,key)=>key==="nativeWorkshop" ? {revision:2,portable} : null;
  await assert.rejects(saveNativeWorkshopState(actor,{character:portable},{expectedRevision:1}),/changed/);
});


test("fresh authority module first save of an imported hero preserves all gear after external loot",async()=>{
  const moduleUrl=new URL("../src/services/native-workshop-state.mjs",import.meta.url);
  const context=vm.createContext({structuredClone,crypto,console,game:{user:{id:"gm"}}});
  const module=new vm.SourceTextModule(await readFile(moduleUrl,"utf8"),{context});
  await module.link(async spec=>{
    const exports=spec==="./catalog.mjs"?{loadWorkshopCatalogs:async()=>catalogs}:spec==="./languages.mjs"?{getCampaignLanguageConfiguration:()=>({definitions:catalogs.languages})}:await import(new URL(spec,moduleUrl));
    return new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context});
  });await module.evaluate();
  const flags={nativeWorkshop:{revision:1,portable:structuredClone(portable),inventoryInstances:preview.inventory.items.map(item=>item.instanceId),view:{mode:"sheet"}}};
  const gear=nativeWorkshopEquipmentItems(preview,catalogs).map((source,index)=>({...source,id:`imported-${index}`,getFlag:(scope,key)=>source.flags?.[scope]?.[key]}));
  const ids=gear.map(item=>item.id);
  gear.push({id:"dropped-loot",name:"Looted Sword",type:"equipment",system:{...structuredClone(gear[1].system),catalogId:"item-ordinary-melee-weapon",quantity:1},getFlag:()=>undefined});
  gear.push({id:"custom-gear",name:"Custom Gear",type:"equipment",system:{catalogId:"",bulk:3,quantity:2,carried:true},getFlag:()=>undefined});
  const actor={type:"character",uuid:"Actor.fresh-authority",items:gear,effects:[],system:{health:{value:preview.limits.maxHp},sp:{value:preview.limits.maxSp},grit:{spent:0},recovery:{}},testUserPermission:()=>true,getFlag:(scope,key)=>flags[key],
    async update(changes){for(const[key,value]of Object.entries(changes)){assert.ok(key.startsWith("flags.heroes-of-legend."));const path=key.split(".").slice(2);let target=flags;for(const part of path.slice(0,-1))target=target[part]??={};target[path.at(-1)]=structuredClone(value);}},
    async deleteEmbeddedDocuments(){assert.fail("A tab/favorite save must not delete imported equipment");},
    async createEmbeddedDocuments(){assert.fail("A tab/favorite save must not duplicate native equipment");},
    async updateEmbeddedDocuments(type,patches){for(const patch of patches){const item=gear.find(item=>item.id===patch._id);for(const[key,value]of Object.entries(patch))if(key.startsWith("system."))item.system[key.slice(7)]=value;else if(key!=="_id")item[key]=value;}},
  };
  const input=structuredClone(portable),basePlay=structuredClone(input.draft.play??{});
  input.draft.play??={};input.draft.play.favorites={abilities:[],items:[]};
  // Deliberately no prior state load or commit in this fresh authority module.
  const saved=await module.namespace.saveNativeWorkshopState(actor,{character:input,mode:"sheet",tab:"Inventory"},{expectedRevision:1,basePlay});
  assert.ok(ids.every(id=>actor.items.some(item=>item.id===id)));assert.equal(actor.items.length,ids.length+2);
  assert.equal(saved.character.draft.play.inventory.removed.length,0);
  assert.ok(saved.character.draft.play.inventory.added.some(item=>item.instanceId===nativeWorkshopInventoryId(gear.find(item=>item.id==="dropped-loot"))));
  assert.ok(saved.nativeItems.some(item=>item.id==="custom-gear"));
});

test("explicit commit repairs obsolete choices and preserves live state across draft saves", async t => {
  globalThis.fetch = async url => ({ok:true,json:async()=>({choices,inventory,wounds,forge,"forge-references":references})[url.split("/").at(-1).replace(".json","")]});
  globalThis.game = {user:{id:"owner"},settings:{get:()=>({schemaVersion:1,definitions:catalogs.languages})}};
  const flags = {};
  const actor = {type:"character",uuid:"Actor.lifecycle",items:[],system:{health:{value:12},sp:{value:0},grit:{spent:0}},img:"custom-portrait.png",effects:[{id:"custom-effect"}],
    testUserPermission:()=>true,getFlag:(namespace,key)=>flags[key],
    async update(changes) {
      for (const [key,value] of Object.entries(changes)) {
        if(key.startsWith("flags.heroes-of-legend.")) {const path=key.slice("flags.heroes-of-legend.".length).split(".");let target=flags;for(const part of path.slice(0,-1))target=target[part]??={};target[path.at(-1)]=structuredClone(value); }
        else { const path=key.split("."); let target=this; for(const part of path.slice(0,-1)) target=target[part]??={}; target[path.at(-1)]=structuredClone(value); }
      }
    },
    async createEmbeddedDocuments(type,sources) { for(const [index,source] of sources.entries()) this.items.push({...source,id:source._id ?? `item-${this.items.length}-${index}`,getFlag:(namespace,key)=>source.flags?.[namespace]?.[key]}); },
    async updateEmbeddedDocuments(type,sources){for(const source of sources){const item=this.items.find(item=>item.id===source._id); for(const [key,value] of Object.entries(source)){if(key.startsWith("system."))item.system[key.slice(7)]=value;else if(key!=="_id") item[key]=structuredClone(value);}}},async deleteEmbeddedDocuments(type,ids){this.items=this.items.filter(item=>!ids.includes(item.id));},
  };
  const construction=structuredClone(portable);
  const waterId="shop-starter-water-flask";
  const waterPurchase=construction.draft.shopping.find(item=>item.id==="item-water-flask");
  const originalWaterId=waterPurchase.instanceId;
  if (originalWaterId !== waterId) {
    waterPurchase.instanceId=waterId;
    construction.draft.loadout[waterId]=construction.draft.loadout[originalWaterId];
    delete construction.draft.loadout[originalWaterId];
  }
  const draftSave = await saveNativeWorkshopState(actor,{character:construction,mode:"creation"},{expectedRevision:0});
  assert.equal(draftSave.revision,1);
  assert.equal(actor.items.length,0);
  await commitNativeWorkshopCharacter(actor,construction,{expectedRevision:1});
  assert.ok(actor.items.length);
  actor.system.health.value=2; actor.system.sp.value=1; actor.system.grit.spent=1;
  const customized=actor.items.find(item=>item.type==="ability");
  customized.name="Custom ability";customized.img="custom.png";customized.system.description="<p>Custom rules</p>";
  actor.items.push({id:"arbitrary",type:"equipment",getFlag:()=>undefined});
  // The character already owns this grant, even if the technique that
  // supplied it is absent from the edited progression.
  const learnedGearId=`${LEARNED_GEAR_PREFIX}ordinary-light-armor`;
  const [trainingGear]=nativeWorkshopEquipmentItems({inventory:{items:[{catalogId:"item-ordinary-light-armor",instanceId:learnedGearId,quantity:1}]}},catalogs);
  await actor.createEmbeddedDocuments("Item",[{...trainingGear,_id:"training-gear",name:"Inherited brigandine"}]);
  const before = await loadNativeWorkshopState(actor);
  assert.equal(before.character.draft.play.hp,2);
  assert.equal(before.character.draft.play.sp,1);
  await assert.rejects(saveNativeWorkshopState(actor,before,{expectedRevision:1}),/changed/);
  const editing=structuredClone(before);
  const spellbooks=readPortableCharacter(editing.character,catalogs).preview.state.learning.spells;
  const removed=refundForgePurchases(catalogs.forge,editing.character.draft,"telekinesis:0");
  const spellIds=spellbooks.filter(spell=>removed.some(entry=>catalogs.forge.nodes.find(node=>node.id===entry.id)?.spellIds?.includes(spell.id))).map(spell=>spell.id);
  assert.ok(spellIds.length);
  await saveNativeWorkshopState(actor,{...editing,mode:"advancement",editingLevel:1},{expectedRevision:2});
  assert.equal(actor.system.health.value,2);
  assert(actor.items.some(item=>spellIds.includes(item.getFlag("heroes-of-legend","catalogId"))), "draft changes leave live Items intact");
  const reopened=await loadNativeWorkshopState(actor);
  assert.equal(reopened.mode,"advancement");
  assert.equal(reopened.editingLevel,1);
  assert(!reopened.character.draft.purchases[1].some(entry=>entry.id==="telekinesis:0"));
  await t.test("repairing an invalid committed class discipline still requires retaining the level", async () => {
    // Simulate an earlier rules catalog that allowed the committed choice.
    const prior = flags.nativeWorkshop.portable;
    prior.draft.classDisciplines = ["fencing"];
    const obsolete = readPortableCharacter(prior,catalogs,catalogs.languages).preview;
    assert.equal(obsolete.valid,false);
    assert.equal(obsolete.state.level,3);
    assert.ok(obsolete.errors.some(error=>error.code==="class-disciplines"));
    assert.equal(readPortableCharacter(reopened.character,catalogs,catalogs.languages).preview.valid,true);

    await assert.rejects(commitNativeWorkshopCharacter(actor,prior,{expectedRevision:3}),
      /Choose one discipline from your class/);
    const novice = await read("../Build-Offs/revised/builds/wizard-level-1.hol.json");
    await assert.rejects(commitNativeWorkshopCharacter(actor,novice,{expectedRevision:3}),/cannot lose levels/);
    assert.equal(flags.nativeWorkshop.revision,3);
    assert.equal(actor.system.health.value,2);
    assert.equal(actor.system.sp.value,1);
  });
  const committed=await commitNativeWorkshopCharacter(actor,reopened.character,{expectedRevision:3,tab:"Development"});
  assert.equal(committed.mode,"sheet");
  assert.equal(committed.tab,"Development");
  assert.deepEqual(committed.character.draft.classDisciplines,["force"]);
  assert.equal(committed.character.draft.progression.level,3);
  assert.equal(flags.nativeWorkshopDraft,null);
  assert(!actor.items.some(item=>spellIds.includes(item.getFlag("heroes-of-legend","catalogId"))));
  assert.equal(actor.items.find(item=>item.id==="training-gear")?.name,"Inherited brigandine");
  assert(committed.character.draft.play.inventory.added.some(item=>item.instanceId===learnedGearId));
  assert.equal(actor.system.health.value,2);
  assert.equal(actor.system.sp.value,1);
  assert.ok(actor.items.some(item=>item.id==="arbitrary"));
  assert.equal(actor.img,"custom-portrait.png");
  assert.equal(actor.effects.length,1);
  assert.equal(customized.name,"Custom ability");assert.equal(customized.img,"custom.png");assert.equal(customized.system.description,"<p>Custom rules</p>");
  actor.testUserPermission=(user,permission)=>permission==="OBSERVER";
  assert.ok((await loadNativeWorkshopState(actor)).character);
  assert.throws(()=>saveNativeWorkshopState(actor,before,{expectedRevision:4}),/own/);
  actor.testUserPermission=()=>true;
  const equipment=actor.items.find(item=>item.type==="equipment" && item.getFlag("heroes-of-legend","grantKind")==="nativeWorkshop");
  equipment.system.hands=1;
  equipment.flags["heroes-of-legend"].torch={lit:true};
  equipment.system.quantity=3;
  equipment.system.carried=false;equipment.system.held=false;equipment.system.worn=false;
  let current=await loadNativeWorkshopState(actor);
  const instance=equipment.getFlag("heroes-of-legend","acquisitionInstance");
  assert.equal(current.character.draft.play.inventory.overrides[instance].quantity,3);
  assert.equal(current.character.draft.loadout[instance].carried,false);
  assert.equal(Object.hasOwn(current.character.draft.play.inventory.overrides[instance],"inventoryDie"),false);
  current.character.draft.play.hp=0;current.character.draft.play.dying=true;
  current.character.draft.play.failedDeathRolls=2;current.character.draft.play.successfulDeathRolls=1;
  current.character.draft.play.inventory.overrides[instance].quantity=4;
  current.character.draft.loadout[instance]={carried:true,held:true,worn:false};
  await saveNativeWorkshopState(actor,current,{expectedRevision:4});
  assert.equal(equipment.system.quantity,4);
  assert.equal(equipment.system.hands,1);
  assert.equal(equipment.system.held,true);
  current=await loadNativeWorkshopState(actor);
  assert.equal(current.character.draft.play.failedDeathRolls,2);
  assert.equal(current.character.draft.play.successfulDeathRolls,1);
  assert.equal(current.character.draft.play.dying,true);
  const snapshot=equipment.system.quantity;
  current.character.draft.play.inventory.overrides[instance].quantity=9;
  const update=actor.update;
  let failed=false;
  actor.update=async function(changes){if(changes["flags.heroes-of-legend.nativeWorkshop"] && !failed){failed=true;throw new Error("simulated actor failure");} return update.call(this,changes);};
  await assert.rejects(saveNativeWorkshopState(actor,current,{expectedRevision:5}),/simulated actor failure/);
  assert.equal(equipment.system.quantity,snapshot);
  assert.equal(flags.nativeWorkshop.revision,5);
  assert.equal(flags.nativeWorkshopPending,null);
  assert.ok(actor.items.some(item=>item.id==="arbitrary"));
  actor.update=update;
  current=await loadNativeWorkshopState(actor);
  current.character.draft.play.inventory.added.push({instanceId:"inventory-transaction-new",id:inventory.equipment[0].id,quantity:1});
  const count=actor.items.length;
  const create=actor.createEmbeddedDocuments;
  actor.createEmbeddedDocuments=async function(type,sources,options){await create.call(this,type,sources,options);throw new Error("partial create failure");};
  await assert.rejects(saveNativeWorkshopState(actor,current,{expectedRevision:5}),/partial create failure/);
  assert.equal(actor.items.length,count);
  assert.equal(flags.nativeWorkshop.revision,5);
  assert.equal(flags.nativeWorkshopPending,null);
  actor.createEmbeddedDocuments=create;
  flags.forgeVitals.immediateDeathRolls=["event-one","event-two"];
  current=await loadNativeWorkshopState(actor);
  assert.equal(current.character.draft.play.immediateDeathRoll,true);
  current.character.draft.play.immediateDeathRoll=false;
  await saveNativeWorkshopState(actor,current,{expectedRevision:5,resolvedImmediateDeathRoll:"event-one"});
  assert.deepEqual(flags.forgeVitals.immediateDeathRolls,["event-two"]);
  current=await loadNativeWorkshopState(actor);
  assert.equal(current.character.draft.play.immediateDeathRoll,true);
  const originalClass=flags.nativeWorkshop.portable.draft.classId;
  current.character.draft.name="Renamed Hero";
  current.character.draft.profile={...current.character.draft.profile,story:"A revised story."};
  current.character.draft.classId="class-protector";
  const identity=await saveNativeWorkshopIdentity(actor,current.character,{expectedRevision:6});
  assert.equal(actor.name,"Renamed Hero");
  assert.equal(actor.system.biography,"A revised story.");
  assert.equal(identity.character.draft.classId,originalClass);
  assert.deepEqual(flags.forgeVitals.immediateDeathRolls,["event-two"]);
  actor.system.health.value=5;
  current=await loadNativeWorkshopState(actor);
  const baseline=structuredClone(current.character.draft.play);
  actor.system.health.value=2;
  current.character.draft.play.favorites={abilities:[],items:[instance]};
  const merged=await saveNativeWorkshopState(actor,current,{expectedRevision:7,basePlay:baseline});
  assert.equal(actor.system.health.value,2);assert.equal(merged.character.draft.play.hp,2);
  const stale=structuredClone(merged);stale.character.draft.play.hp=4;
  await assert.rejects(saveNativeWorkshopState(actor,stale,{expectedRevision:8,basePlay:baseline}),/hp changed elsewhere/);
  const conditionBase=structuredClone(merged.character.draft.play);
  merged.character.draft.play.conditions=[{id:"sheet-burning",key:"burning",source:"Spell",rating:1,persistence:"temporary",order:1}];
  merged.character.draft.play.recovery={unavailableHp:3,debtUsed:true};
  await saveNativeWorkshopState(actor,merged,{expectedRevision:8,basePlay:conditionBase});
  assert.equal(actor.system.recovery.unavailableHp,3);
  let live=await loadNativeWorkshopState(actor);
  assert.equal(live.character.draft.play.conditions[0].rating,1);
  const externalBase=structuredClone(live.character.draft.play);
  const effect=actor.effects.find(effect=>effect.flags?.["heroes-of-legend"]?.condition);
  effect.flags["heroes-of-legend"].condition.rating=2;
  live.character.draft.play.favorites={abilities:[],items:[]};
  await saveNativeWorkshopState(actor,live,{expectedRevision:9,basePlay:externalBase});
  assert.equal((await loadNativeWorkshopState(actor)).character.draft.play.conditions[0].rating,2);
  assert.ok(actor.effects.some(effect=>effect.id==="custom-effect"));
  const weapon=actor.items.find(item=>item.type==="equipment"&&item.system.catalogId==="item-ordinary-melee-weapon");
  assert.ok(weapon);
  const weaponId=weapon.getFlag("heroes-of-legend","acquisitionInstance");
  live=await loadNativeWorkshopState(actor);
  const renameBase=structuredClone(live.character.draft.play);
  live.character.draft.play.inventory.overrides[weaponId].name="Grandfather's Sword";
  await saveNativeWorkshopState(actor,live,{expectedRevision:10,basePlay:renameBase});
  assert.equal(weapon.name,"Grandfather's Sword");assert.equal(weapon.system.catalogId,"item-ordinary-melee-weapon");
  assert.equal((await loadNativeWorkshopState(actor)).character.draft.play.inventory.overrides[weaponId].name,"Grandfather's Sword");
  await assert.rejects(commitNativeWorkshopCharacter(actor,await read("../Build-Offs/revised/builds/wizard-level-1.hol.json"),{expectedRevision:11}),/cannot lose levels/);
  assert.equal(actor.system.grit.spent,1);
  const lighting=actor.items.find(item=>item.type==="equipment"&&item.system.catalogId==="item-lighting-bundle");assert.ok(lighting);
  const beforeLight=await loadNativeWorkshopState(actor),lightBase=structuredClone(beforeLight.character.draft.play),loadoutBase=structuredClone(beforeLight.character.draft.loadout);
  lighting.system.hands=1;lighting.system.held=true;lighting.flags["heroes-of-legend"].torch={lit:true};
  beforeLight.character.draft.play.favorites={abilities:[],items:[]};
  await saveNativeWorkshopState(actor,beforeLight,{expectedRevision:11,basePlay:lightBase,baseLoadout:loadoutBase});
  assert.equal(lighting.system.hands,1);assert.equal(lighting.system.held,true);assert.equal(lighting.flags["heroes-of-legend"].torch.lit,true);
  const beforeLoot=await loadNativeWorkshopState(actor);
  const priorBulk=readPortableCharacter(beforeLoot.character,catalogs,catalogs.languages).preview.inventory.bulk;
  const external={_id:"external-loot",name:"Looted Saber",img:"loot.png",type:"equipment",system:{...structuredClone(weapon.system),quantity:3,carried:true,held:false,worn:false,description:"<p>User-authored loot</p>"},flags:{"heroes-of-legend":{grantKind:"crafting"}}};
  await actor.createEmbeddedDocuments("Item",[external,{_id:"unknown-custom",name:"Unique Relic",type:"equipment",system:{catalogId:"",quantity:1,bulk:7,carried:true,held:false,worn:false},flags:{}},{_id:"custom-ability",name:"Custom Gift",type:"ability",system:{description:"<p>Custom ability text</p>"},flags:{}}]);
  let lootState=await loadNativeWorkshopState(actor);
  const loot=actor.items.find(item=>item.id==="external-loot"),lootId=nativeWorkshopInventoryId(loot);
  assert.equal(nativeItemForWorkshopInstance(actor,lootId),loot);
  assert.ok(lootState.character.draft.play.inventory.added.some(item=>item.instanceId===lootId));
  const previewLoot=readPortableCharacter(lootState.character,catalogs,catalogs.languages).preview;
  assert.equal(previewLoot.inventory.bulk,priorBulk+3*catalogs.inventory.equipment.find(record=>record.id===weapon.system.catalogId).bulk);
  assert.ok(lootState.nativeItems.some(item=>item.id==="unknown-custom"&&!item.knownCatalog));
  assert.ok(lootState.nativeItems.some(item=>item.id==="custom-ability"));
  assert.ok(!previewLoot.state.abilities.includes("custom-ability"));
  const originalManaged=actor.items.filter(item=>item.type==="equipment"&&item.getFlag("heroes-of-legend","grantKind")==="nativeWorkshop").map(item=>item.id);
  const committedPortable=structuredClone(flags.nativeWorkshop.portable);
  const malicious=structuredClone(lootState);
  // A malformed/stale UI snapshot must never retire gear merely because its
  // normalized inventory no longer contains the committed construction grants.
  malicious.character.draft.play.inventory.removed=[...malicious.character.draft.play.inventory.removed,...originalManaged.map(id=>nativeWorkshopInventoryId(actor.items.find(item=>item.id===id)))];
  flags.nativeWorkshop.portable.draft.play.inventory.removed=structuredClone(malicious.character.draft.play.inventory.removed);
  await assert.rejects(saveNativeWorkshopState(actor,malicious,{expectedRevision:12,basePlay:malicious.character.draft.play}),/Owned equipment is missing/);
  assert.deepEqual(flags.nativeWorkshop.portable.draft.play.inventory.removed,malicious.character.draft.play.inventory.removed);
  flags.nativeWorkshop.portable=committedPortable;
  assert.ok(originalManaged.every(id=>actor.items.some(item=>item.id===id)));
  const lootBase=structuredClone(lootState.character.draft.play),lootLoadout=structuredClone(lootState.character.draft.loadout);
  lootState.character.draft.play.inventory.overrides[lootId]={quantity:4,name:"Named Loot"};lootState.character.draft.loadout[lootId]={carried:false,held:false,worn:false};
  await saveNativeWorkshopState(actor,lootState,{expectedRevision:12,basePlay:lootBase,baseLoadout:lootLoadout});
  assert.equal(loot.system.quantity,4);assert.equal(loot.system.carried,false);assert.equal(loot.name,"Named Loot");assert.equal(loot.system.description,"<p>User-authored loot</p>");assert.equal(loot.img,"loot.png");assert.equal(loot.getFlag("heroes-of-legend","grantKind"),"crafting");
  const beforeCommitCount=actor.items.length;
  await commitNativeWorkshopCharacter(actor,committed.character,{expectedRevision:13});
  assert.equal(actor.items.length,beforeCommitCount);assert.equal(actor.items.filter(item=>item.id==="external-loot").length,1);assert.equal(loot.system.quantity,4);assert.equal(loot.getFlag("heroes-of-legend","grantKind"),"crafting");
  assert.ok(actor.items.some(item=>item.id==="unknown-custom"));assert.ok(actor.items.some(item=>item.id==="custom-ability"));
  actor.items=actor.items.filter(item=>item.id!=="external-loot");
  const afterDelete=await loadNativeWorkshopState(actor);
  assert.ok(!afterDelete.character.draft.play.inventory.added.some(item=>item.instanceId===lootId));
  const afterDeleteBase=structuredClone(afterDelete.character.draft.play);
  afterDelete.character.draft.play.favorites={abilities:[],items:[]};
  await saveNativeWorkshopState(actor,afterDelete,{expectedRevision:14,basePlay:afterDeleteBase});
  assert.ok(!actor.items.some(item=>item.id==="external-loot"));
  await t.test("damage arriving during awaited Item writes survives a favorites save",async()=>{
    actor.system.health.value=8;
    const state=await loadNativeWorkshopState(actor),basePlay=structuredClone(state.character.draft.play);
    const instance=weapon.getFlag("heroes-of-legend","acquisitionInstance");
    state.character.draft.play.inventory.overrides[instance].quantity=weapon.system.quantity+1;
    const updateItems=actor.updateEmbeddedDocuments;
    actor.updateEmbeddedDocuments=async function(...args){await updateItems.apply(this,args);this.system.health.value=2;};
    try {
      const saved=await saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay});
      assert.equal(actor.system.health.value,2);assert.equal(saved.character.draft.play.hp,2);
    } finally {actor.updateEmbeddedDocuments=updateItems;}
  });
  await t.test("a conflicting HP edit arriving during Item writes rejects without healing or rolling back external HP",async()=>{
    actor.system.health.value=8;
    const state=await loadNativeWorkshopState(actor),basePlay=structuredClone(state.character.draft.play),beforeQuantity=weapon.system.quantity;
    const instance=weapon.getFlag("heroes-of-legend","acquisitionInstance");
    state.character.draft.play.hp=7;state.character.draft.play.inventory.overrides[instance].quantity=beforeQuantity+1;
    const updateItems=actor.updateEmbeddedDocuments;let injected=false;
    actor.updateEmbeddedDocuments=async function(...args){await updateItems.apply(this,args);if(!injected){this.system.health.value=2;injected=true;}};
    try {
      await assert.rejects(saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay}),/hp changed elsewhere/);
      assert.equal(actor.system.health.value,2);assert.equal(weapon.system.quantity,beforeQuantity);
    } finally {actor.updateEmbeddedDocuments=updateItems;}
  });
  await t.test("equipment conflict after journal reservation preserves the external edit",async()=>{
    const state=await loadNativeWorkshopState(actor),basePlay=structuredClone(state.character.draft.play);
    const instance=weapon.getFlag("heroes-of-legend","acquisitionInstance");state.character.draft.play.inventory.overrides[instance].quantity=weapon.system.quantity+1;
    const updateActor=actor.update;let injected=false;
    actor.update=async function(changes){await updateActor.call(this,changes);if(changes["flags.heroes-of-legend.nativeWorkshopPending"]&&!injected){weapon.system.quantity=99;injected=true;}};
    try {
      await assert.rejects(saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay}),/Equipment changed elsewhere/);
      assert.equal(weapon.system.quantity,99);
    } finally {actor.update=updateActor;}
  });
  await t.test("only an explicit newly removed acquisition retires managed gear",async()=>{
    const state=await loadNativeWorkshopState(actor),basePlay=structuredClone(state.character.draft.play);
    const victim=actor.items.find(item=>item.type==="equipment"&&item.getFlag("heroes-of-legend","grantKind")==="nativeWorkshop"&&item.id!==weapon.id&&item.id!==lighting.id);
    const keepIds=actor.items.filter(item=>item.id!==victim.id).map(item=>item.id);
    state.character.draft.play.inventory.removed.push(nativeWorkshopInventoryId(victim));
    await saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay});
    assert.ok(!actor.items.some(item=>item.id===victim.id));assert.ok(keepIds.every(id=>actor.items.some(item=>item.id===id)));
  });
  await t.test("dropping a play-added stack explicitly retires the embedded item",async()=>{
    let state=await loadNativeWorkshopState(actor),basePlay=structuredClone(state.character.draft.play);
    const instanceId="inventory-play-added-bundle";
    state.character.draft.play.inventory.added.push({id:"item-food-bundle",instanceId,quantity:1});
    state=await saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay});
    const embedded=actor.items.find(item=>nativeWorkshopInventoryId(item)===instanceId);
    assert.ok(embedded);
    basePlay=structuredClone(state.character.draft.play);
    state.character.draft.play.inventory.added=state.character.draft.play.inventory.added.filter(item=>item.instanceId!==instanceId);
    await assert.rejects(saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay}),/Owned equipment is missing/);
    state.character.draft.play.inventory.removed.push(instanceId);
    await saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay});
    assert.ok(!actor.items.includes(embedded));
  });
  await t.test("removing a sheet condition explicitly retires its embedded source",async()=>{
    const state=await loadNativeWorkshopState(actor),basePlay=structuredClone(state.character.draft.play);
    assert.equal(basePlay.conditions.length,1);
    state.character.draft.play.conditions=[];
    const saved=await saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay});
    assert.deepEqual(saved.character.draft.play.conditions,[]);
    const removed=actor.effects.find(effect=>effect.flags?.["heroes-of-legend"]?.condition);
    assert.ok(removed.flags["heroes-of-legend"].retired);
    assert.equal(removed.disabled,true);
    assert.deepEqual(removed.statuses,[]);
    assert.ok(actor.effects.some(effect=>effect.id==="custom-effect"));
  });
  await t.test("holding two catalog loot weapons initializes their nonzero hand counts without changing custom arrangements",async()=>{
    const source={name:"Catalog Sword",type:"equipment",system:{...structuredClone(weapon.system),quantity:1,hands:0,held:false,carried:true,worn:false},flags:{}};
    await actor.createEmbeddedDocuments("Item",[{...source,_id:"zero-hands-one"},{...source,_id:"zero-hands-two"}]);
    const first=actor.items.find(item=>item.id==="zero-hands-one"),second=actor.items.find(item=>item.id==="zero-hands-two");
    let state=await loadNativeWorkshopState(actor);const basePlay=structuredClone(state.character.draft.play),baseLoadout=structuredClone(state.character.draft.loadout);
    for(const item of [first,second])state.character.draft.loadout[nativeWorkshopInventoryId(item)]={carried:true,held:true,worn:false};
    await saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay,baseLoadout});
    assert.equal(first.system.hands,1);assert.equal(second.system.hands,1);
    first.system.hands=2;state=await loadNativeWorkshopState(actor);
    await saveNativeWorkshopState(actor,state,{expectedRevision:flags.nativeWorkshop.revision,basePlay:structuredClone(state.character.draft.play),baseLoadout:structuredClone(state.character.draft.loadout)});
    assert.equal(first.system.hands,2);assert.equal(lighting.system.hands,1);
  });
  await t.test("a returned starting flask credits the purse and preserves other gear", async()=>{
    const flask=actor.items.find(item=>nativeWorkshopInventoryId(item)===waterId);
    assert.ok(flask);
    const prepare=async()=>{
      const state=await loadNativeWorkshopState(actor);
      return {state, basePlay:structuredClone(state.character.draft.play),baseLoadout:structuredClone(state.character.draft.loadout)};
    };
    for (const inventoryDie of [0,4,8]) {
      const {state,basePlay,baseLoadout}=await prepare();
      state.character.draft.play.inventory.overrides[waterId].inventoryDie=inventoryDie;
      await saveNativeWorkshopState(actor,state,{expectedRevision:state.revision,basePlay,baseLoadout});
      assert.equal(flask.system.inventoryDie,inventoryDie);
    }
    const {state,basePlay,baseLoadout}=await prepare();
    flags.development.coins-=3; // A later native market purchase was paid from the live purse.
    const coins=flags.development.coins;
    const retained=actor.items.filter(item=>item!==flask).map(item=>item.id);
    state.character.draft.play.inventory.removed.push(waterId);
    state.character.draft.play.inventory.sold=[waterId];
    delete state.character.draft.loadout[waterId];
    const sold=await saveNativeWorkshopState(actor,state,{expectedRevision:state.revision,basePlay,baseLoadout});
    assert.equal(flags.development.coins,coins+1);
    assert.ok(!actor.items.some(item=>item.id===flask.id));
    assert.ok(retained.every(id=>actor.items.some(item=>item.id===id)));
    assert.deepEqual(sold.character.draft.play.inventory.sold,[waterId]);
  });
});


test("baseline merging preserves external changes and accepts idempotent queued resource edits",()=>{
 assert.deepEqual(mergeNativeWorkshopPlay({hp:10,sp:3},{hp:10,sp:2},{hp:5,sp:3}),{hp:5,sp:2});
 assert.equal(mergeNativeWorkshopPlay(10,5,5),5);
 assert.throws(()=>mergeNativeWorkshopPlay(10,8,5),/changed elsewhere/);
});
test("level HP gains apply only to positive HP and do not refill SP or lifetime Grit",()=>{
 for(const hp of [0,2,preview.limits.maxHp]){
  const changes=currentNativeCharacterChanges(draft,preview,{preserveResources:{health:{value:hp},sp:{value:1},grit:{spent:2}},previousLevel:1,level:3,hpPerLevel:4});
  assert.equal(changes["system.health.value"],hp===0?0:Math.min(preview.limits.maxHp,hp+8));
  assert.equal(changes["system.sp.value"],1);assert.equal(changes["system.grit.spent"],2);
  const replay=currentNativeCharacterChanges(draft,preview,{preserveResources:{health:{value:changes["system.health.value"]},sp:{value:1},grit:{spent:2}},previousLevel:3,level:3,hpPerLevel:4});
  assert.equal(replay["system.health.value"],changes["system.health.value"]);
 }
});
