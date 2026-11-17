import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {isForgeModifier} from '../src/rules/forge-casting.mjs';
async function fixture(){
 const calls=[];const context=vm.createContext({foundry:{applications:{api:{HandlebarsApplicationMixin:Base=>Base},sheets:{ItemSheetV2:class{async _prepareContext(){return {};}}}}},isForgeModifier,game:{i18n:{localize:key=>key}},ATTRIBUTES:[],cardContext:()=>({}),itemCardContext:()=>({}),itemDisplayIcon:()=>null,abilityCatalogRecord:()=>null,loadWorkshopCatalogs:async()=>({choices:[]}),toggleCardEdit(){},isPotionAbility:()=>false,activateOwnedAbility:async item=>calls.push(['custom',item.id]),ui:{notifications:{error:error=>{throw Error(error);}}}});
 const source=(await readFile(new URL('../src/sheets/ability.mjs',import.meta.url),'utf8')).replace(/^import[\s\S]*?;\n/gm,'').replace('export class AbilitySheet','class AbilitySheet')+'\nglobalThis.Sheet=AbilitySheet;';vm.runInContext(source,context);
 const actor={getFlag:()=>({portable:{}}),sheet:{render:async()=>{},useWorkshopAbility:async id=>calls.push(['workshop',id])}};return {Sheet:context.Sheet,actor,calls};
}
test('custom native abilities use their owned card procedure without teaching Forge entries',async()=>{
 const f=await fixture(),item={id:'custom-item',actor:f.actor,getFlag:()=>undefined};await f.Sheet.useAbility.call({item});assert.deepEqual(f.calls,[['custom','custom-item']]);
});
test('current spell Items retain Workshop learning and SP validation even when dragged from a compendium',async()=>{
 const f=await fixture(),item={id:'spell-item',actor:f.actor,getFlag:(_scope,key)=>key==='spell'?{sp:3}:key==='catalogId'?'spell-example':undefined};await f.Sheet.useAbility.call({item});assert.deepEqual(f.calls,[['workshop','spell-example']]);
});

test('owned paid weapon modifiers expose Use while ordinary passive cards stay read-only',async()=>{
 const f=await fixture();
 for(const [record,owner,expected] of [[{magic:'Magical weapon modifier',sp:1},true,true],[{magic:'Magical weapon modifier',sp:1},false,false],[{sp:1},true,false]]){
  const sheet=new f.Sheet();sheet.item={actor:{isOwner:owner,getFlag:()=>[]},isOwner:owner,system:{activity:{action:'passive'},description:''},getFlag:(_,key)=>key==='workshopRecord'?record:undefined,toObject:()=>({})};
  assert.equal((await sheet._prepareContext({})).canUse,expected);
 }
});
