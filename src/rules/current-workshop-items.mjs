import {signatureSpellCost,isForgeSpell} from "./forge-casting.mjs";
import {forgeSignatureRecord} from "./forge-signatures.mjs";
import { escapeItemHtml } from "./item-construction.mjs";
import { workshopWeaponLabel } from "./workshop-ability.mjs";
const ID="heroes-of-legend";
const attr=(value,fallback)=>["brawn","fortitude","agility","guile","knowledge","reason"].includes(value?.toLowerCase())?value.toLowerCase():fallback;
const inline=text=>escapeItemHtml(String(text??'')).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
function signatureReferenceHTML(record,sp) {
  const rules=record.reference.rules;
  const details=[...(rules.details??[])];
  if(Number.isSafeInteger(sp)&&!details.some(detail=>detail.label==='SP'))details.push({label:'SP',value:String(sp)});
  const body=(rules.body??[]).map(block=>(block.text?`<p>${inline(block.text).replaceAll('\n','<br>')}</p>`:'')
    +(block.outcomes?`<table class="hol-reference-outcomes">${block.outcomes.map(outcome=>`<tr><th>${inline(outcome.label)}</th><td>${inline(outcome.text)}</td></tr>`).join('')}</table>`:'')
    +(block.items?`<ul>${block.items.map(item=>`<li>${inline(item)}</li>`).join('')}</ul>`:'')).join('');
  return `<dl class="hol-reference-details">${details.map(detail=>`<div><dt>${inline(detail.label)}</dt><dd>${inline(detail.value)}</dd></div>`).join('')}</dl>${body}${(rules.notes??[]).map(note=>`<p>${inline(typeof note==='string'?note:note.text)}</p>`).join('')}`;
}
export function currentWorkshopItemSource(record,catalogs,{spell=false}={}) {
  record=forgeSignatureRecord(catalogs.forge,record);
  const node=catalogs.forge.nodes.find(node=>node.id===record.id || (spell && node.spellIds?.includes(record.id)));
  const detail=record.reference?.rules?.details??[];
  const printedAction=record.actionText??record.action??detail.find(entry=>entry.label==="Action")?.value??record.effect?.match(/^(?:Main Action|Maneuver|Reaction|Passive|Movement|Ritual)/i)?.[0]??"Passive";
  const effect=record.effect??record.reference?.rules?.body?.map(block=>block.text??"").join("\n\n")??record.referenceMarkdown??"";
  const attribute=record.attribute??detail.find(entry=>entry.label==="Attribute")?.value??effect.match(/^(?:Main Action|Maneuver|Reaction) · (Brawn|Fortitude|Agility|Guile|Knowledge|Reason)/i)?.[1];
  const ownSp=record.signatureComponent ? signatureSpellCost({effect}) : record.sp;
  const isSpell=spell || Boolean(record.signatureComponent && isForgeSpell(record));
  const attributeKey=record.attributeChoices?.[0] ?? attr(attribute,null);
  const action=/ritual/i.test(printedAction)?"ritual":/Main Action/i.test(printedAction)?"main":/Maneuver/i.test(printedAction)?"maneuver":/Reaction/i.test(printedAction)?"reaction":/Movement/i.test(printedAction)?"movement":/Passive/i.test(printedAction)?"passive":"other";
  const metadata={kind:isSpell?"spell":node?.kind??record.kind,nodeId:record.id,level:node?.level??record.minLevel??record.level??1,cost:node?.dp??record.dp??0,action:printedAction,sp:record.signatureComponent?(Number.isSafeInteger(ownSp)?ownSp:null):record.sp??null,range:record.target??record.range??null,duration:record.duration??null,attribute:attribute??null,defenseAttribute:record.defenseAttribute??null,effect,improves:node?.improves??null,requires:node?.requires??[],bookId:record.bookId??null,...(record.signatureComponent?{magic:record.magic??null}:{})};
  if (record.attributeChoices) metadata.attributeChoices = record.attributeChoices;
  if (record.weaponRequirement) metadata.weaponRequirement = record.weaponRequirement;
  const fields={Action:printedAction,...(isSpell || (record.signatureComponent && Number.isSafeInteger(ownSp))?{SP:String(ownSp??0)}:{}),Attribute:attribute,Defense:record.defenseAttribute,Range:metadata.range,Duration:metadata.duration,...(record.weaponRequirement?{Equipment:`Wield a ${workshopWeaponLabel(record.weaponRequirement)}.`}:{}),...(record.holdAttribute?{"Hold attribute":record.holdAttribute}:{}),...(record.escapeAttribute?{"Escape attribute":record.escapeAttribute}:{})};
  const html=record.signatureComponent ? signatureReferenceHTML(record,ownSp) : `<dl class="hol-reference-details">${Object.entries(fields).filter(([,value])=>value).map(([key,value])=>`<div><dt>${escapeItemHtml(key)}</dt><dd>${escapeItemHtml(String(value))}</dd></div>`).join("")}</dl>${effect.split(/\n\s*\n/).map(text=>`<p>${escapeItemHtml(text).replaceAll("\n","<br>")}</p>`).join("")}`;
  const damage=effect.match(/(?:deal(?:s)?|for) (\d+)\/(\d+)\/(\d+) ([a-z-]+) damage/i);
  return {name:record.name,type:"ability",system:{schemaVersion:1,description:html,activity:{action,rollMode:action==="passive"||(record.signatureComponent?!attributeKey:!attribute)?"none":"attribute",attribute:attributeKey??"knowledge",defenseAttribute:attr(record.defenseAttribute,"agility")},outcomes:{weak:damage?`${damage[1]} ${damage[4]} damage`:"",standard:damage?`${damage[2]} ${damage[4]} damage`:"",strong:damage?`${damage[3]} ${damage[4]} damage`:""}},flags:{[ID]:{catalogId:record.id,sourceCommit:catalogs.commit,grantKind:"nativeWorkshop",workshopRecord:metadata,...(isSpell?{spell:structuredClone(record)}:{})}}};
}
export function currentWorkshopLearnedItems(preview,catalogs) {
  const ids=new Set([...preview.state.abilities,...catalogs.choices.filter(record=>record.universal).map(record=>record.id)]);
  return [...[...ids].map(id=>{const record=catalogs.choices.find(record=>record.id===id);if(!record)throw new Error(`Current learned ability unavailable: ${id}`);return currentWorkshopItemSource(record,catalogs);}),...preview.state.learning.spells.map(record=>currentWorkshopItemSource(record,catalogs,{spell:true}))];
}
