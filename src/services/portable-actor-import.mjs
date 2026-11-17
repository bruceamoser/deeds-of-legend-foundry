import { nativeWorkshopLearnedItems, nativeWorkshopEquipmentItems } from "./native-workshop-state.mjs";
import { currentNativeCharacterChanges } from "../rules/native-character-state.mjs";
import { ancestryTokenFootprint } from "../rules/ancestry-token.mjs";
import { readPortableCharacter, writePortableCharacter, MAX_CHARACTER_BYTES } from "../rules/portable-character.mjs";
import { validateContributions } from "../rules/conditions.mjs";
import { loadWorkshopCatalogs } from "./catalog.mjs";
import { getCampaignLanguageConfiguration } from "./languages.mjs";
const ID="heroes-of-legend";
const CURRENT_RULES_MESSAGE="This older character format is no longer playable. Recreate the hero in the current Character Workshop and import its current character file.";
function currentPortable(source) {
  if(typeof source==="string" && new TextEncoder().encode(source).length>MAX_CHARACTER_BYTES)throw new Error("Character file is too large.");
  const value=typeof source==="string"?JSON.parse(source):source;
  if(![4,5,6,7].includes(value?.schemaVersion))throw new Error(CURRENT_RULES_MESSAGE);
  return value;
}
/** Current Workshop imports replace contents; retired PC rules have no native import path. */
export function buildPortableActorSource(source,catalogs,languages) {
  if(catalogs.forge?.rulesRevision!==299)throw new Error("Native character import requires the installed current Workshop rules.");
  const value=currentPortable(source);
  const {draft,preview}=readPortableCharacter(value,catalogs,languages.definitions);
  if(!preview.valid)throw new Error("Finish the character's unresolved choices in the current workshop before importing it into an Actor.");
  const portable=JSON.parse(writePortableCharacter(draft,catalogs,{ready:true,languages:languages.definitions}));
  const items=[...nativeWorkshopLearnedItems(preview,catalogs),...nativeWorkshopEquipmentItems(preview,catalogs)].map(item=>({_id:foundry.utils.randomID(),...item}));
  validateContributions(draft.play?.conditions??[]);
  const effects=(draft.play?.conditions??[]).map(condition=>{
    const id=foundry.utils.randomID();
    return {_id:id,name:`${condition.key} ${condition.rating}`,img:"icons/svg/aura.svg",disabled:false,statuses:[`hol.${condition.key}`],flags:{[ID]:{condition:{...condition,id},workshopConditionId:condition.id}}};
  });
  return foundry.utils.expandObject({
    ...currentNativeCharacterChanges(draft,preview),type:"character",
    prototypeToken:{name:draft.name.trim(),actorLink:true,...ancestryTokenFootprint(draft.ancestryId)},items,effects,
    [`flags.${ID}.forgeLearned`]:preview.state.learned,
    [`flags.${ID}.nativeWorkshop`]:{revision:1,portable,inventoryInstances:preview.inventory.items.map(item=>item.instanceId),view:{mode:"sheet"}},
    [`flags.${ID}.creationReceipt`]:{status:"complete",revision:1,sourceCommit:catalogs.commit,currentWorkshop:true},
    [`flags.${ID}.development`]:{...preview.state,creation:draft,languages:preview.play.languages,sourceCommit:catalogs.commit,coins:preview.inventory.remainingCoins},
  });
}
export async function portableActorSource(source) {
  currentPortable(source);
  return buildPortableActorSource(source,await loadWorkshopCatalogs(),getCampaignLanguageConfiguration());
}
