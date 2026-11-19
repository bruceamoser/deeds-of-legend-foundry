import { equipmentBonuses, resourceClamp } from "../rules/equipment-bonuses.mjs";
import { nativeWorkshopInventoryId, nativeEquipmentHands, NATIVE_INVENTORY_PREFIX } from "../rules/native-item-identity.mjs";
import { currentWorkshopLearnedItems } from "../rules/current-workshop-items.mjs";
import { validateEquipmentAttributeArrangement } from "../rules/effective-attributes.mjs";
import { normalizeForgeRecovery } from "../rules/forge-recovery.mjs";
import { validateContributions } from "../rules/conditions.mjs";
import { forgeVitals } from "../rules/forge-vitals.mjs";
import { loadWorkshopCatalogs } from "./catalog.mjs";
import { getCampaignLanguageConfiguration } from "./languages.mjs";
import { readPortableCharacter, writePortableCharacter } from "../rules/portable-character.mjs";
import { currentNativeCharacterChanges } from "../rules/native-character-state.mjs";
import { abilityItemSource, equipmentItemSource, escapeItemHtml } from "../rules/item-construction.mjs";
import { ORDINARY_RANGED_WEAPON } from "../rules/equipment-identity.mjs";
import { selectedRangedAmmunition } from "./ranged-ammunition.mjs";
import { LEARNED_GEAR_PREFIX, provisionSalePrice } from "../rules/training-equipment.mjs";

const ID = "heroes-of-legend";
const attribute = (value, fallback) => ["brawn", "fortitude", "agility", "guile", "knowledge", "reason"].includes(value?.toLowerCase()) ? value.toLowerCase() : fallback;
const queues = new Map();
const flag = actor => actor.getFlag(ID, "nativeWorkshop");
function readable(actor) {
  if (actor?.type !== "character" || actor.pack || actor.isToken) throw new Error("Use a linked world character for the Workshop.");
  if (!actor.testUserPermission(game.user, "OBSERVER")) throw new Error("You must be able to observe the character.");
}
function owner(actor) {
  if (actor?.type !== "character" || actor.pack || actor.isToken) throw new Error("Use a linked world character for the Workshop.");
  if (!actor.testUserPermission(game.user, "OWNER")) throw new Error("You must own the character.");
}
function serialize(actor, operation) {
  const key = actor.uuid ?? actor.id;
  const before = queues.get(key) ?? Promise.resolve();
  const task = before.catch(() => {}).then(operation);
  queues.set(key, task);
  return task.finally(() => { if (queues.get(key) === task) queues.delete(key); });
}
function revision(actor, expected) {
  const current = flag(actor)?.revision ?? 0;
  if (!Number.isSafeInteger(expected) || expected !== current) throw new Error("This character changed in another window. Reload it before saving.");
  return current + 1;
}
async function normalize(portable, ready = false) {
  const catalogs = await loadWorkshopCatalogs();
  const languages = getCampaignLanguageConfiguration().definitions;
  const { draft, preview } = readPortableCharacter(portable, catalogs, languages);
  if (ready && !preview.valid) {
    const problem = preview.errors[0];
    throw new Error(problem?.text || problem?.reasons?.map(reason => reason.text).join(" ")
      || "Review the unresolved choices before saving this character.");
  }
  return { portable: JSON.parse(writePortableCharacter(draft, catalogs, { ready, languages })), draft, preview, catalogs };
}
function overlay(actor, portable, catalogs) {
  const result = structuredClone(portable);
  result.draft.play ??= {};
  Object.assign(result.draft.play, {
    hp: actor.system.health.value, sp: actor.system.sp?.value ?? 0,
    gritSpent: actor.system.grit.spent,
    recovery: structuredClone(actor.system.recovery ?? result.draft.play.recovery ?? {}),
    conditions: nativeConditions(actor),
  });
  const nativeVitals = actor.getFlag(ID, "forgeVitals") ?? {};
  Object.assign(result.draft.play, structuredClone(nativeVitals));
  if (nativeVitals.immediateDeathRolls?.length) result.draft.play.immediateDeathRoll = true;
  result.draft.loadout ??= {};
  const inventory = result.draft.play.inventory ??= { added: [], removed: [] };
  inventory.overrides ??= {};
  inventory.ammunition = {};
  inventory.added=inventory.added.filter(item=>!item.instanceId.startsWith(NATIVE_INVENTORY_PREFIX));
  for(const instanceId of Object.keys(inventory.overrides))if(instanceId.startsWith(NATIVE_INVENTORY_PREFIX))delete inventory.overrides[instanceId];
  const instances = new Set();
  for (const item of actor.items ?? []) {
    if (item.type !== "equipment") continue;
    const definition=catalogs.inventory.equipment.find(record=>record.id===item.system?.catalogId);
    if(!definition)continue;
    const instanceId = nativeWorkshopInventoryId(item);
    if (!instanceId) continue;
    instances.add(instanceId);
    if(instanceId.startsWith(NATIVE_INVENTORY_PREFIX)) {
      inventory.added.push({id:item.system.catalogId,instanceId,quantity:Math.max(1,item.system.quantity)});
      inventory.removed=inventory.removed.filter(id=>id!==instanceId);
    }
    inventory.overrides[instanceId] = { quantity: item.system.quantity, ...(item.name && item.name !== definition?.name ? {name:item.name} : {}), ...((definition?.inventoryDie || item.system.inventoryDie > 0) ? {inventoryDie:item.system.inventoryDie} : {}) };
    if (item.system.catalogId === ORDINARY_RANGED_WEAPON) {
      const ammo = selectedRangedAmmunition(actor, item);
      if (ammo) inventory.ammunition[instanceId] = nativeWorkshopInventoryId(ammo);
    }
    // Match the portable loadout order so an unchanged item compares equal in the save merge.
    result.draft.loadout[instanceId] = { carried: item.system.carried, worn: item.system.worn, held: item.system.held };
  }
  for (const instanceId of flag(actor)?.inventoryInstances ?? []) if (!instances.has(instanceId) && !inventory.removed.includes(instanceId)) inventory.removed.push(instanceId);
  return result;
}
/** Returns schema-7 portable data plus a revision; native resources are authoritative. */
export async function loadNativeWorkshopState(actor) {
  readable(actor);
  const catalogs = await loadWorkshopCatalogs();
  const saved = flag(actor);
  if (!saved?.portable) {
    const draft = actor.getFlag(ID, "nativeWorkshopDraft");
    if (draft) return { ...(saved?.view ?? {}), character: structuredClone(draft), revision: saved?.revision ?? 0, mode: saved?.view?.mode ?? "creation" };
    throw new Error("This older character needs explicit recreation in the current Workshop. Its native contents have been preserved.");
  }
  const draft = actor.getFlag(ID, "nativeWorkshopDraft");
  const normalized = await normalize(saved.view?.mode && saved.view.mode !== "sheet" && draft ? draft : overlay(actor, saved.portable,catalogs));
  return { ...(saved.view ?? {}), nativeItems: nativeItemsOverview(actor,catalogs), character: normalized.portable, revision: saved.revision, mode: saved.view?.mode ?? "sheet" };
}
/** Saves play state only. Changes to construction require explicit commit. */
export function saveNativeWorkshopState(actor, savedState, { expectedRevision, resolvedImmediateDeathRoll, basePlay, baseLoadout, operationReceipt } = {}) {
  const portable = savedState.character ?? savedState;
  owner(actor);
  return serialize(actor, async () => {
    await recoverNativeWorkshopTransaction(actor);
    const next = revision(actor, expectedRevision);
    const saved = flag(actor) ?? { revision: 0 };
    if (!saved.portable && (!savedState.mode || savedState.mode === "sheet")) throw new Error("Create this character in the current Workshop first.");
    if (savedState.mode && savedState.mode !== "sheet") {
      const draft = await normalize(portable);
      revision(actor, expectedRevision);
      await actor.update({ [`flags.${ID}.nativeWorkshopDraft`]: draft.portable, [`flags.${ID}.nativeWorkshop`]: { ...saved, revision: next, view: Object.fromEntries(Object.entries(savedState).filter(([key]) => !["character", "revision"].includes(key))) }, ...operationChanges(operationReceipt) });
      return { ...savedState, character: draft.portable, revision: next };
    }
    const candidate = structuredClone(saved.portable);
    const catalogs=await loadWorkshopCatalogs();
    const live=overlay(actor,saved.portable,catalogs);
    candidate.draft.play = mergeNativeWorkshopPlay(basePlay ?? live.draft.play,portable.draft?.play ?? {},live.draft.play);

    candidate.draft.loadout = mergeNativeWorkshopPlay(baseLoadout ?? live.draft.loadout,portable.draft?.loadout ?? {},live.draft.loadout);
    candidate.draft.basicActions = structuredClone(portable.draft?.basicActions ?? saved.portable.draft.basicActions ?? {});
    const state = await normalize(candidate, true);
    revision(actor, expectedRevision);
    const sold = (state.draft.play?.inventory?.sold ?? []).filter(id => !live.draft.play.inventory.sold?.includes(id));
    let proceeds = 0;
    if (sold.length) {
      const previous = await normalize(live, true);
      for (const id of sold) {
        const price = provisionSalePrice(previous.preview.inventory.items.find(item => item.instanceId === id));
        if (!price) throw new Error("Only a complete starting provision can be sold for the printed market price.");
        proceeds += price;
      }
    }
    const inputPlay=structuredClone(portable.draft?.play ?? {});
    const basisPlay=structuredClone(basePlay ?? live.draft.play);
    const changedKeys=new Set([...new Set([...Object.keys(basisPlay),...Object.keys(inputPlay)])].filter(key=>!equalState(inputPlay[key],basisPlay[key])));
    await applyWorkshopTransaction(actor, nativeWorkshopEquipmentItems(state.preview,state.catalogs), () => {
      owner(actor);revision(actor,expectedRevision);
      const finalPlay=mergeNativeWorkshopPlay(basisPlay,inputPlay,overlay(actor,saved.portable,catalogs).draft.play);
      const gear = equipmentBonuses(actor.items);
      const limits = { ...state.preview.limits, maxHp: state.preview.limits.maxHp + gear.hp, maxSp: state.preview.limits.maxSp + gear.sp };
      const vitals=forgeVitals(finalPlay,limits);
      const portable=structuredClone(state.portable);
      portable.draft.play=finalPlay;
      delete portable.draft.play.immediateDeathRolls;
      const changes={...operationChanges(operationReceipt),
        [`flags.${ID}.nativeWorkshop`]: {revision:next,portable,inventoryInstances:state.preview.inventory.items.map(item=>item.instanceId),view:Object.fromEntries(Object.entries(savedState).filter(([key])=>!["character","revision"].includes(key)))},
      };
      if(changedKeys.has("hp"))changes["system.health.value"]=vitals.hp;
      if(changedKeys.has("sp"))changes["system.sp.value"]=vitals.sp;
      if(changedKeys.has("gritSpent"))changes["system.grit.spent"]=Math.min(state.preview.limits.gritGranted,vitals.gritSpent);
      if(changedKeys.has("recovery"))changes["system.recovery"]=normalizeForgeRecovery(finalPlay.recovery);
      if(changedKeys.has("conditions")) {
        changes.effects=nativeConditionSources(actor,finalPlay.conditions??[]);
        changes[`flags.${ID}.conditionRevision`]=(actor.getFlag(ID,"conditionRevision")??0)+1;
      }
      if (proceeds) {
        const balance = actor.getFlag(ID,"development")?.coins;
        changes[`flags.${ID}.development.coins`] = Number.isSafeInteger(balance)
          ? balance + proceeds : state.preview.inventory.remainingCoins;
      }
      for(const[key,value]of Object.entries(deathState(vitals)))if(changedKeys.has(key))changes[`flags.${ID}.forgeVitals.${key}`]=value;
      if(resolvedImmediateDeathRoll)changes[`flags.${ID}.forgeVitals.immediateDeathRolls`]=(actor.getFlag(ID,"forgeVitals")?.immediateDeathRolls??[]).filter(id=>id!==resolvedImmediateDeathRoll);
      return changes;
    }, next, {catalogs:state.catalogs,equipmentOnly:true,removedInstances:new Set((inputPlay.inventory?.removed??[]).filter(id=>!(basisPlay.inventory?.removed??[]).includes(id)))});
    return { ...savedState, ...(await loadNativeWorkshopState(actor)) };
  });
}
/** Draft saves never teach abilities or change committed live resources. */
export function saveNativeWorkshopDraft(actor, portable,{expectedRevision,operationReceipt}={}) {
  owner(actor);
  return serialize(actor,async()=>{
    await recoverNativeWorkshopTransaction(actor);
    const next=expectedRevision===undefined?undefined:revision(actor,expectedRevision);
    const state=await normalize(portable);
    owner(actor);
    if(next!==undefined)revision(actor,expectedRevision);
    await actor.update({[`flags.${ID}.nativeWorkshopDraft`]:state.portable,...operationChanges(operationReceipt),...(next===undefined?{}:{[`flags.${ID}.nativeWorkshop`]:{...flag(actor),revision:next}})});
    return state.portable;
  });
}
export async function loadNativeWorkshopDraft(actor) {
  readable(actor);
  return structuredClone(actor.getFlag(ID, "nativeWorkshopDraft") ?? null);
}

export function nativeWorkshopLearnedItems(preview,catalogs) {
  return currentWorkshopLearnedItems(preview,catalogs);
}
/** Explicit construction commit only; arbitrary native Items, effects and portrait survive. */
export function commitNativeWorkshopCharacter(actor, portable, { expectedRevision = 0, operationReceipt, tab } = {}) {
  owner(actor);
  return serialize(actor, async () => {
    await recoverNativeWorkshopTransaction(actor);
    const next = revision(actor, expectedRevision);
    const existing = flag(actor);
    if (!existing?.portable && (actor.getFlag(ID, "creationReceipt") || actor.items.size || actor.items.length)) throw new Error("Recreate this older hero as a new character; existing native contents cannot be silently replaced.");
    const state = await normalize(portable, true);
    owner(actor);
    revision(actor, expectedRevision);
    // Read the previous level even when the current rules reject an old choice.
    // The replacement above must still pass the full Review.
    const previousLevel=existing?.portable ? (await normalize(existing.portable)).preview.state.level : 0;
    if(existing?.portable && state.preview.state.level < previousLevel) throw new Error("A committed character cannot lose levels. Recreate the hero explicitly for a level correction.");
    const desired = nativeWorkshopLearnedItems(state.preview, state.catalogs);
    const carried = existing?.portable ? overlay(actor,state.portable,state.catalogs) : null;
    if (carried) {
      const inventory = carried.draft.play.inventory;
      for (const item of actor.items) {
        if (item.type !== "equipment") continue;
        const instanceId = nativeWorkshopInventoryId(item);
        if (!instanceId?.startsWith(LEARNED_GEAR_PREFIX) || inventory.added.some(entry => entry.instanceId === instanceId)) continue;
        inventory.added.push({ id: item.system.catalogId, instanceId, quantity: Math.max(1,item.system.quantity) });
      }
    }
    const equipmentState = carried ? await normalize(carried,true) : state;
    desired.push(...nativeWorkshopEquipmentItems(equipmentState.preview,state.catalogs));
    await applyWorkshopTransaction(actor, desired, () => {
      owner(actor);revision(actor,expectedRevision);
      const bonuses = equipmentBonuses(actor.items);
      const changes=currentNativeCharacterChanges(state.draft,state.preview,{preserveResources:existing?.portable?actor.system:undefined,equipmentBonuses:bonuses,previousLevel,level:state.preview.state.level,hpPerLevel:state.catalogs.choices.find(record=>record.id===state.draft.ancestryId).hp+state.catalogs.choices.find(record=>record.id===state.draft.classId).hp});
      const portable=carried?overlay(actor,equipmentState.portable,state.catalogs):structuredClone(state.portable);
      portable.draft.play??={};
      Object.assign(portable.draft.play,{hp:changes["system.health.value"],sp:changes["system.sp.value"],gritSpent:changes["system.grit.spent"]});
      delete portable.draft.play.immediateDeathRolls;
      if(existing?.portable) {
        // Development is not a resource correction. Only earned HP gain or a
        // genuinely reduced maximum requires changing a live resource field.
        if(state.preview.state.level===previousLevel && actor.system.health.value<=state.preview.limits.maxHp+bonuses.hp)delete changes["system.health.value"];
        if((actor.system.sp?.value??0)<=state.preview.limits.maxSp+bonuses.sp)delete changes["system.sp.value"];
        delete changes["system.grit.spent"];delete changes["system.recovery"];delete changes[`flags.${ID}.forgeVitals`];
      } else changes.effects=nativeConditionSources(actor,state.draft.play?.conditions??[]);
      return {...changes,...operationChanges(operationReceipt),
        [`flags.${ID}.forgeLearned`]:state.preview.state.learned,
        "prototypeToken.name":state.draft.name.trim(),"prototypeToken.actorLink":true,
        [`flags.${ID}.nativeWorkshop`]:{revision:next,portable,inventoryInstances:equipmentState.preview.inventory.items.map(item=>item.instanceId),view:{mode:"sheet",tab:tab==="Development"?"Development":"Main",step:0,editingLevel:null}},
        [`flags.${ID}.nativeWorkshopDraft`]:null,
        [`flags.${ID}.creationReceipt`]:{status:"complete",revision:next,sourceCommit:state.catalogs.commit,currentWorkshop:true},
        [`flags.${ID}.development`]:{...state.preview.state,creation:state.draft,languages:state.preview.play.languages,sourceCommit:state.catalogs.commit,coins:state.preview.inventory.remainingCoins},
      };
    },next,{catalogs:state.catalogs});
    return loadNativeWorkshopState(actor);
  });
}

function deathState(play) {
  return Object.fromEntries(["dying", "dead", "failedDeathRolls", "successfulDeathRolls", "gritTrigger", "scars", "firstAidUsed", "firstAidPending", "spellcraftRecoveryUsed"].map(key=>[key,structuredClone(play[key])]));
}
export function nativeWorkshopEquipmentItems(preview,catalogs) {
  return preview.inventory.items.map(item=>({...equipmentItemSource(catalogs.inventory.equipment.find(record=>record.id===item.catalogId), {
    sourceCommit:catalogs.commit,grantKind:"nativeWorkshop",acquisitionInstance:item.instanceId,
    quantity:item.quantity,hands:item.hands??0,inventoryDie:item.inventoryDie??0,
    ammunitionInstanceId:item.ammunitionInstanceId,
    worn:item.worn??false,held:item.held??false,carried:item.carried??true,
  }), ...(item.name ? {name:item.name} : {})}));
}
const itemSource = item => ({ ...(item.toObject?.() ?? JSON.parse(JSON.stringify(item))), _id: item.id ?? item._id });
/** A durable rollback journal makes interrupted embedded writes recoverable on retry. */
export async function recoverNativeWorkshopTransaction(actor) {
  const pending = actor.getFlag(ID,"nativeWorkshopPending");
  if (!pending) return;
  owner(actor);
  if ((flag(actor)?.revision ?? 0) !== pending.nextRevision) {
    const current = new Map([...actor.items].map(item=>[item.id,item]));
    const extra = pending.createdIds.filter(id=>current.has(id));
    if (extra.length) await actor.deleteEmbeddedDocuments("Item",extra);
    const updates = pending.beforeItems.filter(item=>current.has(item._id)).flatMap(before=>{
      const attempted=pending.updates?.find(patch=>patch._id===before._id);
      if(!attempted)return [];
      const item=current.get(before._id),inverse={_id:before._id};
      for(const[key,value]of Object.entries(attempted))if(key!=="_id") {
        const now=key.startsWith("system.")?item.system[key.slice(7)]:item[key];
        if(equalState(now,value))inverse[key]=key.startsWith("system.")?before.system[key.slice(7)]:before[key];
      }
      return Object.keys(inverse).length>1?[inverse]:[];
    });
    const missing = pending.beforeItems.filter(item=>!current.has(item._id));
    if (updates.length) await actor.updateEmbeddedDocuments("Item",updates);
    if (missing.length) await actor.createEmbeddedDocuments("Item",missing,{keepId:true});
  }
  await actor.update({[`flags.${ID}.nativeWorkshopPending`]:null});
}
async function applyWorkshopTransaction(actor,desired,changes,nextRevision,{catalogs,equipmentOnly=false,removedInstances=new Set()}={}) {
  owner(actor);
  const owned = [...actor.items].filter(item=>managedWorkshopItem(item,catalogs) && (!equipmentOnly || item.type==="equipment"));
  const candidates=[...actor.items].filter(item=>owned.includes(item)||item.type==="equipment");
  const updates=[],creates=[],keep=new Set();
  for (const source of desired) {
    const identity = source.flags[ID];
    const match = candidates.find(item=>item.type===source.type && (source.type==="equipment" ? nativeWorkshopInventoryId(item)===identity.acquisitionInstance : item.getFlag(ID,"catalogId")===identity.catalogId));
    if (match) {
      keep.add(match.id);
      // Equipment document text and user edits remain native; synchronize play controls.
      if(source.type==="equipment") {
        const patch={_id:match.id};
        if(source.name!==match.name)patch.name=source.name;
        for(const key of ["quantity","inventoryDie","carried","held","worn"])if(source.system[key]!==undefined&&!equalState(source.system[key],match.system[key]))patch[`system.${key}`]=source.system[key];
        const hands=nativeEquipmentHands({...source,system:{...source.system,hands:match.system.hands}},catalogs.inventory.equipment.find(record=>record.id===match.system.catalogId));
        if(hands!==match.system.hands)patch["system.hands"]=hands;
        if(Object.keys(patch).length>1)updates.push(patch);
      }
    } else if(source.type==="equipment" && identity.acquisitionInstance?.startsWith(NATIVE_INVENTORY_PREFIX))throw new Error("This native equipment Item was removed. Reload the character before editing it.");
    else creates.push({_id:globalThis.foundry?.utils?.randomID?.() ?? crypto.randomUUID().replaceAll("-","").slice(0,16),...source});
  }
  const matchedIds=new Set(updates.map(update=>update._id));
  const projected=[...actor.items].filter(item=>!owned.includes(item)&&!matchedIds.has(item.id)).map(itemSource);
  for(const source of desired) {
    const match=candidates.find(item=>item.type===source.type && (source.type==="equipment" ? nativeWorkshopInventoryId(item)===source.flags[ID].acquisitionInstance : item.getFlag(ID,"catalogId")===source.flags[ID].catalogId));
    projected.push(match ? {...itemSource(match),system:{...match.system,...Object.fromEntries(["quantity","inventoryDie","carried","held","worn"].map(key=>[key,source.system[key]])),hands:nativeEquipmentHands({...source,system:{...source.system,hands:match.system.hands}},catalogs.inventory.equipment.find(record=>record.id===match.system.catalogId))}} : source);
  }
  validateEquipmentAttributeArrangement(projected);
  const retiring=owned.filter(item=>!keep.has(item.id));
  if(equipmentOnly && retiring.some(item=>!removedInstances.has(nativeWorkshopInventoryId(item))))throw new Error("Owned equipment is missing from this sheet save. Reload the character; no equipment has been removed.");
  const retired=retiring.map(item=>item.id);
  const finalChanges = () => {
    const next = typeof changes === "function" ? changes() : changes;
    const system = actor.toObject?.().system ?? actor.system;
    const gear = equipmentBonuses(actor.items);
    return { ...resourceClamp({ hp: system.health.value, sp: system.sp.value }, {
      maxHp: (next["system.health.baseMax"] ?? system.health.baseMax) + gear.hp,
      maxSp: (next["system.sp.max"] ?? system.sp.max) + gear.sp,
    }), ...next };
  };
  if(!updates.length&&!creates.length&&!retired.length)return actor.update(finalChanges());
  const pending={nextRevision,updates,beforeItems:candidates.filter(item=>retired.includes(item.id)||matchedIds.has(item.id)).map(itemSource),createdIds:creates.map(item=>item._id)};
  await actor.update({[`flags.${ID}.nativeWorkshopPending`]:pending});
  try {
    if(updates.length) {
      for(const patch of updates) {
        const current=[...actor.items].find(item=>item.id===patch._id),basis=pending.beforeItems.find(item=>item._id===patch._id);
        if(!current)throw new Error("Equipment changed elsewhere. Reload before saving.");
        for(const[key,value]of Object.entries(patch)) {
          if(key==="_id")continue;
          const now=key.startsWith("system.")?current.system[key.slice(7)]:current[key];
          const before=key.startsWith("system.")?basis.system[key.slice(7)]:basis[key];
          if(!equalState(now,before)&&!equalState(now,value))throw new Error("Equipment changed elsewhere. Reload before saving.");
        }
      }
      await actor.updateEmbeddedDocuments("Item",updates);
    }
    if(creates.length) await actor.createEmbeddedDocuments("Item",creates,{keepId:true});
    if(retired.length) await actor.deleteEmbeddedDocuments("Item",retired);
    await actor.update(finalChanges());
  } catch(error) {
    try { await recoverNativeWorkshopTransaction(actor); }
    catch(recoveryError) { throw new Error(`${error.message} The saved transaction needs owner recovery before another save: ${recoveryError.message}`,{cause:error}); }
    throw error;
  }
  await actor.update({[`flags.${ID}.nativeWorkshopPending`]:null});
}

/** Sheet identity edits do not replay construction or acquisition grants. */
export function saveNativeWorkshopIdentity(actor,portable,{expectedRevision,operationReceipt}={}) {
  owner(actor);
  return serialize(actor,async()=>{
    await recoverNativeWorkshopTransaction(actor);
    const next=revision(actor,expectedRevision);
    const saved=flag(actor);
    if(!saved?.portable) throw new Error("Create this character in the current Workshop first.");
    const catalogs=await loadWorkshopCatalogs();
    const candidate=overlay(actor,saved.portable,catalogs);
    candidate.draft.name=portable.draft?.name;
    candidate.draft.profile={...candidate.draft.profile,story:portable.draft?.profile?.story??""};
    const state=await normalize(candidate,true);
    owner(actor);revision(actor,expectedRevision);
    await actor.update({...operationChanges(operationReceipt),name:state.draft.name.trim(),"prototypeToken.name":state.draft.name.trim(),"system.biography":state.draft.profile?.story??"",
      [`flags.${ID}.profile`]:state.draft.profile,
      [`flags.${ID}.nativeWorkshop`]:{...saved,revision:next,portable:state.portable},
    });
    return loadNativeWorkshopState(actor);
  });
}

function equalState(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length
      && a.every((value, index) => equalState(value, b[index]));
  const entries = Object.entries(a);
  return entries.length === Object.keys(b).length
    && entries.every(([key, value]) => Object.hasOwn(b, key) && equalState(value, b[key]));
}
/** Three-way merge: untouched controls follow live native changes; conflicting edits reject. */
export function mergeNativeWorkshopPlay(base,candidate,current,path="play") {
  if(equalState(candidate,base))return structuredClone(current);
  if(equalState(candidate,current)||equalState(current,base))return structuredClone(candidate);
  if((base===undefined || (base && typeof base==="object" && !Array.isArray(base))) && [candidate,current].every(value=>value && typeof value==="object" && !Array.isArray(value))) {
    base ??= {};
    return Object.fromEntries([...new Set([...Object.keys(base),...Object.keys(candidate),...Object.keys(current)])].map(key=>[key,mergeNativeWorkshopPlay(base[key],candidate[key],current[key],`${path}.${key}`)]).filter(([,value])=>value!==undefined));
  }
  throw new Error(`The character's ${path.replace(/^play\./,"")} changed elsewhere. Reload before changing it.`);
}
const effectFlag=(effect,key)=>effect.getFlag?.(ID,key) ?? effect.flags?.[ID]?.[key];
function nativeConditions(actor) {
  const result=[...(actor.effects ?? [])]
    .filter(effect=>(effect.active ?? !effect.disabled) && !effectFlag(effect,"retired") && effectFlag(effect,"condition"))
    .map(effect => {
      const { key, source, rating, persistence } = effectFlag(effect,"condition");
      const id = effectFlag(effect,"workshopConditionId") ?? effect.id ?? effect._id;
      return { id, key, source, rating, persistence };
    });
  return validateContributions(result);
}
function nativeConditionSources(actor,conditions) {
  validateContributions(conditions);
  const sources=[...(actor.effects ?? [])].map(effect=>effect.toObject?.() ?? JSON.parse(JSON.stringify(effect)));
  const active=new Map([...(actor.effects ?? [])].filter(effect=>effectFlag(effect,"condition") && !effectFlag(effect,"retired") && (effect.active ?? !effect.disabled)).map(effect=>[effectFlag(effect,"workshopConditionId") ?? effect.id ?? effect._id,effect]));
  const desired=new Set(conditions.map(condition=>condition.id));
  const retired=new Set([...active].filter(([id])=>!desired.has(id)).map(([,effect])=>effect.id ?? effect._id));
  // Foundry merges embedded Active Effects when an Actor is updated. Omission
  // leaves the old effect active, so retire it explicitly in the same save.
  for(const source of sources) {
    if(!retired.has(source._id ?? source.id))continue;
    source.disabled=true;
    source.statuses=[];
    source.showIcon=globalThis.CONST?.ACTIVE_EFFECT_SHOW_ICON?.NEVER ?? 0;
    source.flags[ID].retired={reason:"Removed condition"};
  }
  for(const condition of conditions) {
    const match=active.get(condition.id);
    const id=match?.id ?? match?._id ?? globalThis.foundry?.utils?.randomID?.() ?? crypto.randomUUID().replaceAll("-","").slice(0,16);
    const source=sources.find(source=>(source._id??source.id)===id);
    const flags={...(source?.flags??{}),[ID]:{...(source?.flags?.[ID]??{}),condition:{...condition,id},workshopConditionId:condition.id}};
    const data={_id:id,name:`${condition.key} ${condition.rating}${condition.persistence==="starred"?"*":""}`,img:"icons/svg/aura.svg",disabled:false,statuses:[`hol.${condition.key}`],flags};
    if(source)Object.assign(source,data);else sources.push(data);
  }
  return sources;
}
const operationChanges=receipt=>receipt?{[`flags.${ID}.nativeWorkshopOperations.${receipt.id}`]:receipt}:{};

function nativeItemsOverview(actor,catalogs) {
  return [...actor.items].filter(item=>!managedWorkshopItem(item,catalogs)).map(item=>({id:item.id,name:item.name,type:item.type,img:item.img??"",catalogId:item.system?.catalogId??item.getFlag?.(ID,"catalogId")??"",knownCatalog:Boolean(catalogs.inventory.equipment.some(record=>record.id===item.system?.catalogId)),quantity:item.system?.quantity??null,bulk:item.system?.bulk??0,catalogBulk:catalogs.inventory.equipment.find(record=>record.id===item.system?.catalogId)?.bulk??0,inventoryDie:item.system?.inventoryDie,carried:item.system?.carried!==false,held:Boolean(item.system?.held),worn:Boolean(item.system?.worn)}));
}

function managedWorkshopItem(item,catalogs) {
  if(item.getFlag?.(ID,"grantKind")!=="nativeWorkshop")return false;
  if(item.type==="equipment")return Boolean(item.getFlag(ID,"acquisitionInstance") === nativeWorkshopInventoryId(item) && catalogs.inventory.equipment.some(record=>record.id===item.system?.catalogId));
  if(item.type==="ability")return Boolean(catalogs.choices.some(record=>record.id===item.getFlag(ID,"catalogId")) || catalogs.forge.spells.some(record=>record.id===item.getFlag(ID,"catalogId")));
  return false;
}
