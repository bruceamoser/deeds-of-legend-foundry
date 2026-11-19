import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {rollCard,resourceCard} from '../src/rules/chat-cards.mjs';
import {inventoryCheck} from '../src/rules/inventory.mjs';
import {spellAttackOutcomes,resolvedAttackEffects} from '../src/rules/attack-outcomes.mjs';
import {classifyRoll} from '../src/rules/roll.mjs';
import {workshopRollOutcome} from '../src/rules/workshop-outcomes.mjs';
const source=(await readFile(new URL('../src/sheets/workshop-character.mjs',import.meta.url),'utf8')).replace(/^import .*\n/gm,'').replaceAll('export ','')+'\nglobalThis.Sheet=WorkshopCharacterSheet;';
function fixture(overrides={}) {
  const calls=[];let nextOperation=0;const operations=new Map();
  class Base {
    constructor(){this.isEditable=true;const flags={};this.actor={testUserPermission:()=>true,items:[],getFlag:(namespace,key)=>flags[key],update:async changes=>{for(const [path,value]of Object.entries(changes)){const key=path.split('.').at(-1);if(key.startsWith('-='))delete flags[key.slice(2)];else flags[key]=value;}}};}
    async _prepareContext(){return {};}
    _replaceHTML(){calls.push('replace');}
    async _preClose(){}
    async close(options){await this.beforeClose?.();await this._preClose(options);calls.push('close');}
  }
  class Roll {
    constructor(formula){this.formula=formula;calls.push(formula);this.dice=[{results:[2,4,5,6].map((result,index)=>({result,active:formula.includes('kl3')?index<3:index>0}))}];}
    async evaluate(options){calls.push(options);return this;}
    async toMessage(data,options){calls.push({data,options});}
  }
  const context={foundry:{utils:{randomID:()=>`operation-${++nextOperation}`},applications:{api:{HandlebarsApplicationMixin:cls=>cls},sheets:{ActorSheetV2:Base}},dice:{Roll}},
    game:{user:{id:'owner'},settings:{get:()=> 'blind'}},ChatMessage:{getSpeaker:()=>({actor:'hero'})},
    queueMicrotask,structuredClone,CharacterSheet:Base,classifyRoll,spellAttackOutcomes,resolvedAttackEffects,rollCard,resourceCard,inventoryCheck,workshopRollOutcome,ui:{notifications:{info(){},error(){}}},
    nativeWorkshopRoll:(_actor,id)=>operations.get(id),
    claimNativeWorkshopOperation:async(_actor,operation)=>{operations.set(operation.id,operation);return operation;},
    updateNativeWorkshopOperation:async(_actor,operation)=>operations.set(operation.id,operation),
    completeNativeWorkshopOperation:async(_actor,id)=>operations.set(id,{...operations.get(id),status:'complete'}),
    interruptNativeWorkshopOperation:async(_actor,id)=>operations.set(id,{...operations.get(id),status:'interrupted'}),
    saveNativeWorkshopState:async(actor,state,options)=>{calls.push(options);return {...state,revision:options.expectedRevision+1};},
    saveNativeWorkshopIdentity:async()=>({character:{draft:{}},revision:4,mode:"sheet"}),
    commitNativeWorkshopCharacter:async()=>({character:{draft:{}},revision:5,mode:'sheet'}),...overrides};
  vm.runInNewContext(source,context);
  return {sheet:new context.Sheet(),calls,context,operations};
}
test('native Workshop dice use retained Foundry dice and V14 message visibility',async()=>{
  const {sheet,calls}=fixture();
  const faces=await sheet.rollDice({count:4,sides:6,kind:'attribute',net:-1,attribute:2});
  assert.deepEqual(Array.from(faces),[2,4,5,6]);assert.equal(sheet.preparedRollId,undefined);assert.equal(calls[0],'4d6kl3+2');
  assert.equal(calls[1].allowInteractive,false);
  assert.equal(calls[2].options.messageMode,'blind');
  assert.match(calls[2].data.content,/hol-chat-verdict standard/);assert.match(calls[2].data.content,/<strong>13<\/strong>/);
});
test('native Workshop chat shows the selected utility outcome and keeps the full rules',async()=>{
  const entangle={id:'spell:growth:2',name:'Entangle',effect:'Apply Slowed 1/2/3 to creatures in the area when cast.'};
  const {sheet,calls}=fixture({loadWorkshopCatalogs:async()=>({choices:[],forge:{spells:[entangle],nodes:[]}})});
  await sheet.rollDice({count:4,sides:6,kind:'attribute',net:-1,attribute:2,activeRoll:{id:entangle.id,cast:true}});
  const posted=calls.find(call=>call.data).data;
  assert.match(posted.content,/Apply Slowed 2 to creatures in the area when cast/);
  assert.match(posted.content,/Apply Slowed 1\/2\/3 to creatures in the area when cast/);
  assert.equal(posted.flags['heroes-of-legend'].roll,undefined);
});
test('native observers cannot save, commit or roll',async()=>{
  const {sheet,calls}=fixture();sheet.isEditable=false;
  await assert.rejects(sheet.saveState({}),/owner/);
  await assert.rejects(sheet.commitState({}),/owner/);
  await assert.rejects(sheet.rollDice({}),/owner/);
  assert.equal(calls.length,0);
});
test('native acknowledged saves advance revision; explicit commit returns sheet',async()=>{
  const {sheet}=fixture();sheet.revision=2;
  await sheet.saveState({mode:'builder'});assert.equal(sheet.revision,3);assert.equal(sheet.writing,0);
  let state;sheet.controller={setState:value=>{state=value;}};
  await sheet.commitState({});assert.equal(sheet.revision,5);assert.equal(state.mode,'sheet');assert.equal(state.tab,'Main');
});
test('the shadow Workshop portrait uses inherited Actor editImage and saves only img',async()=>{
  let observer,selected,changes;
  class MutationObserver {
    constructor(callback){observer=this;this.callback=callback;}
    observe(image,options){this.image=image;this.options=options;}
    disconnect(){this.disconnected=true;}
  }
  const {sheet}=fixture({MutationObserver,updateOwnedDocument:async(actor,update)=>{changes=update;}});
  sheet.actor.img='old.webp';
  const image={getAttribute:name=>name==='src'?selected:null,dataset:{edit:'img'}};
  sheet.options={actions:{editImage(_event,target){
    assert.equal(this,sheet);assert.equal(target,image);
    selected='chosen.webp';observer.callback();
  }}};
  await sheet.editWorkshopPortrait(image);
  assert.deepEqual(Object.keys(changes),['img']);assert.equal(changes.img,'chosen.webp');
  assert.equal(observer.disconnected,true);
});
test('native frame preserves controller on document rerender and flushes before disposal',async()=>{
  const {sheet,calls}=fixture();sheet.element={querySelector:()=>({})};
  sheet.controller={flush:async()=>{calls.push('flush');},dispose:()=>{calls.push('dispose');}};
  sheet._replaceHTML({},null,{});assert.equal(calls.length,0);
  await sheet.close();assert.deepEqual(calls,['flush','dispose','close']);
});
test('a native render queued by an acknowledged draft save keeps its controller until teardown',async()=>{
  const {sheet,calls}=fixture();
  const controller={settle:async()=>{calls.push('save');},dispose:()=>{calls.push('dispose');}};
  sheet.controller=controller;
  sheet.element={querySelector:()=>({})};
  sheet.beforeClose=()=>{
    assert.equal(sheet.controller,controller);
    sheet._replaceHTML({},null,{});
    calls.push('render');
  };
  await sheet.close();
  assert.equal(sheet.controller,null);
  assert.deepEqual(calls,['save','render','dispose','close']);
});
test('a rejected Workshop save is reported and the native sheet still closes',async()=>{
  const {sheet,calls}=fixture({ui:{notifications:{error:message=>calls.push(message)}}});
  sheet.controller={
    settle:async()=>{throw new Error('Owned equipment is missing from this sheet save.');},
    dispose:()=>calls.push('dispose'),
  };
  await sheet.close();
  assert.equal(sheet.controller,null);
  assert.deepEqual(calls,['Owned equipment is missing from this sheet save.','dispose','close']);
});
test('older actors receive an invalid-current-rules entry without modifying documents',async()=>{
  const {sheet}=fixture();sheet.actor.items=[{id:'existing'}];
  const context=await sheet._prepareContext({});assert.equal(context.legacy,true);assert.equal(context.workshopReady,false);
});
test('native same-revision updates refresh live resources and read-only permission',async()=>{
  const loaded={revision:3,mode:'sheet',character:{draft:{play:{hp:2}}}};
  const {sheet}=fixture({loadNativeWorkshopState:async()=>loaded});
  sheet.revision=3;sheet.host={committed:true};sheet.isEditable=false;
  sheet.actor.getFlag=(_namespace,key)=>key==='nativeWorkshop' ? {portable:loaded.character} : undefined;
  sheet.element={querySelector:()=>({})};let refreshed;
  sheet.controller={getState:()=>({mode:'sheet',character:{draft:{play:{hp:9}}}}),setState:state=>{refreshed=state;}};
  // Supply the lifecycle hook provided by Foundry's base class in this fixture.
  Object.getPrototypeOf(Object.getPrototypeOf(sheet))._onRender=async()=>{};
  await sheet._onRender({},{});
  assert.equal(refreshed.character.draft.play.hp,2);assert.equal(sheet.host.readOnly,true);
});
test('native own pending writes keep the mounted draft',async()=>{
  let loads=0;
  const {sheet}=fixture({loadNativeWorkshopState:async()=>{loads++;}});
  sheet.host={};sheet.writing=1;sheet.element={querySelector:()=>({})};
  sheet.controller={setState:()=>assert.fail('must not replace draft during own write')};
  Object.getPrototypeOf(Object.getPrototypeOf(sheet))._onRender=async()=>{};
  await sheet._onRender({},{});assert.equal(loads,0);
});
test('identity completion uses identity service without construction commit',async()=>{
  let identities=0;
  const {sheet}=fixture({saveNativeWorkshopIdentity:async()=>{identities++;return {revision:7,character:{draft:{name:'Renamed'}}};},commitNativeWorkshopCharacter:()=>assert.fail('identity cannot rebuild character')});
  let refreshed;sheet.controller={setState:state=>{refreshed=state;}};
  await sheet.saveIdentity({draft:{name:'Renamed'}});
  assert.equal(identities,1);assert.equal(sheet.revision,7);assert.equal(refreshed.character.draft.name,'Renamed');
});
test('failed native chat acknowledgment keeps the dice and leaves a fresh roll available',async()=>{
  const {sheet,calls,context,operations}=fixture();
  const deliver=context.foundry.dice.Roll.prototype.toMessage;
  context.foundry.dice.Roll.prototype.toMessage=async()=>{throw new Error('lost chat acknowledgment');};
  await assert.rejects(sheet.rollDice({count:4,sides:6,kind:'attribute',net:1,attribute:2}),/lost chat/);
  const marker=operations.get('operation-1');
  assert.equal(marker.status,'interrupted');assert.deepEqual(Array.from(marker.faces),[2,4,5,6]);
  assert.equal(calls.filter(call=>typeof call==='string' && /d6/.test(call)).length,1);
  context.foundry.dice.Roll.prototype.toMessage=deliver;
  await sheet.rollDice({count:4,sides:6,kind:'attribute',net:1,attribute:2});
  assert.equal(operations.get('operation-2').status,'complete');
});
test('failed death-state save retains its dice and permits a later save',async()=>{
  let fail=true;
  const {sheet,operations}=fixture({saveNativeWorkshopState:async()=>{
    if(fail)throw new Error('lost state acknowledgment');
    return {revision:1};
  }});
  await sheet.rollDice({count:4,sides:6,kind:'death',net:1,attribute:0});
  await assert.rejects(sheet.saveState({mode:'sheet'}),/lost state/);
  assert.equal(operations.get('operation-1').status,'interrupted');
  assert.equal(sheet.preparedRollId,undefined);
  fail=false;
  await sheet.saveState({mode:'builder'});
  assert.equal(sheet.revision,1);
});
test('native saves retain the immutable enqueue-time play basis',async()=>{
  const {sheet,calls}=fixture();const basis={basePlay:{hp:4,sp:7}};
  sheet.basePlay={hp:2,sp:7};await sheet.saveState({mode:'sheet'},basis);
  assert.equal(calls[0].basePlay.hp,4);assert.equal(calls[0].basePlay.sp,7);
});

test('open native sheet refreshes imported name and story',async()=>{
  const loaded={revision:4,mode:'sheet',character:{draft:{name:'Imported hero',profile:{story:'Imported story'},play:{hp:2}}}};
  const {sheet}=fixture({loadNativeWorkshopState:async()=>loaded});
  sheet.revision=3;sheet.host={committed:true};sheet.element={querySelector:()=>({})};let refreshed;
  sheet.actor.getFlag=(_namespace,key)=>key==='nativeWorkshop' ? {portable:loaded.character} : undefined;
  sheet.controller={getState:()=>({mode:'sheet',tab:'Character',editing:false,character:{draft:{name:'Previous hero',profile:{story:'Previous story'},play:{hp:9}}}}),setState:state=>{refreshed=state;}};
  Object.getPrototypeOf(Object.getPrototypeOf(sheet))._onRender=async()=>{};
  await sheet._onRender({},{});
  assert.equal(refreshed.character.draft.name,'Imported hero');
  assert.equal(refreshed.character.draft.profile.story,'Imported story');
  assert.equal(refreshed.character.draft.play.hp,2);
  assert.equal(refreshed.tab,'Character');assert.equal(refreshed.editing,false);
});
test('an import takes over a blank mounted Workshop immediately',async()=>{
  const loaded={revision:1,mode:'sheet',character:{draft:{name:'Imported hero',play:{hp:2}}}};
  const {sheet}=fixture({loadNativeWorkshopState:async()=>loaded});
  sheet.host={committed:false};sheet.element={querySelector:()=>({})};let refreshed;
  sheet.actor.getFlag=(_namespace,key)=>key==='nativeWorkshop' ? {portable:loaded.character} : undefined;
  sheet.controller={getState:()=>({mode:'builder',character:{draft:{name:'New hero'}}}),setState:state=>{refreshed=state;}};
  Object.getPrototypeOf(Object.getPrototypeOf(sheet))._onRender=async()=>{};
  await sheet._onRender({},{});
  assert.equal(refreshed.character.draft.name,'Imported hero');
  assert.equal(refreshed.mode,'sheet');
  assert.equal(sheet.host.committed,true);
});

test('new hero entry creates a blank Actor without copying invalid character data',async()=>{
  let created;const {sheet,context}=fixture({Actor:{create:async source=>{created=source;return {sheet:{render:async()=>{}}};}}});
  sheet.actor.name='Invalid old hero';sheet.actor.img='old-portrait.webp';
  await context.Sheet.recreateWorkshop.call(sheet);
  assert.equal(created.name,'New hero');assert.equal(created.type,'character');
  assert.deepEqual(Object.keys(created).sort(),['name','type']);
});

test('cast budget rejection leaves no Workshop roll receipt', async()=>{
  const {sheet}=fixture({prepareNativeActionCost:async()=>{throw new Error('Spend a Main Action on your turn.');}});
  await assert.rejects(sheet.beginRollOperation('cast',true,'spell:flame:3'),/Spend a Main Action/);
  assert.equal(sheet.preparedRollId,undefined);
  assert.equal(sheet.preparedRollId,undefined);
});
