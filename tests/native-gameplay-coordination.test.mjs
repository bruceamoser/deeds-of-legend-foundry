import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const ID='heroes-of-legend';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

/** Run the real selected-GM queue and registry; resource handlers and document
 * transport are small fixtures, not alternative damage/recovery rules. */
async function fixture({realDamage=false}={}) {
  const gm={id:'gm',isGM:true},owner={id:'owner',isGM:false},other={id:'other',isGM:false},observer={id:'observer',isGM:false};
  const users=[gm,owner,other,observer];users.activeGM={id:'gm',isSelf:true};
  const flags={nativeWorkshop:{revision:0,portable:{draft:{play:{hp:20,sp:10}}}}};
  const messages=new Map(),hooks=new Map(),events=[];
  let failNextResourceAck=false,resourceWrites=0;
  const actor={uuid:'Actor.coordination',type:'character',flags:{[ID]:flags},system:{health:{value:20},sp:{value:10}},
    testUserPermission:user=>user.isGM||['owner','other'].includes(user.id),getFlag:(_,key)=>flags[key],
    async update(changes) {
      for(const[path,value]of Object.entries(changes)) {
        const parts=path.split('.');let at=this;
        for(const part of parts.slice(0,-1))at=at[part]??={};
        const key=parts.at(-1);if(key.startsWith('-='))delete at[key.slice(2)];else at[key]=structuredClone(value);
      }
      if(Object.hasOwn(changes,'system.health.value')) {
        resourceWrites++;
        if(failNextResourceAck){failNextResourceAck=false;throw new Error('Resource acknowledgement lost after write');}
      }
      return this;
    }};
  const game={user:gm,users,messages,socket:{id:'gm-socket'},settings:{get:()=>({userId:'gm',clientId:'gm-socket'})}};
  const context=vm.createContext({Map,Set,Promise,JSON,Date,Number,Error,Uint8Array,TextEncoder,structuredClone,crypto:webcrypto,setTimeout,
    game,Hooks:{on:(name,fn)=>hooks.set(name,fn),once(){}},fromUuid:async uuid=>uuid===actor.uuid?actor:null});
  const authority=new vm.SourceTextModule(await readFile(new URL('../src/services/authority.mjs',import.meta.url),'utf8'),{context});
  await authority.link(()=>{});await authority.evaluate();
  const state={
    loadNativeWorkshopState:async()=>({revision:flags.nativeWorkshop.revision,character:structuredClone(flags.nativeWorkshop.portable)}),
    loadNativeWorkshopDraft:async()=>null,
    async saveNativeWorkshopState(_actor,saved,options) {
      events.push('workshop:start');await delay(2);
      // This adapter fixture changes only SP; real three-way resource merge has
      // separate native-workshop-state coverage.
      const sp=saved.character.draft.play.sp;
      await authority.namespace.writeAuthorityDocument(actor,{'system.sp.value':sp,
        [`flags.${ID}.nativeWorkshop`]:{revision:options.expectedRevision+1,portable:{draft:{play:{hp:actor.system.health.value,sp}}}},
        [`flags.${ID}.nativeWorkshopOperations.${options.operationReceipt.id}`]:options.operationReceipt});
      events.push('workshop:end');
    },commitNativeWorkshopCharacter:async()=>{},saveNativeWorkshopIdentity:async()=>{},saveNativeWorkshopDraft:async()=>{},
  };
  const registry=new vm.SourceTextModule(await readFile(new URL('../src/services/native-workshop-coordinator.mjs',import.meta.url),'utf8'),{context});
  await registry.link(async spec=>{
    const exports=spec==='./authority.mjs'?authority.namespace:state;
    return new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context});
  });await registry.evaluate();
  const api=registry.namespace;
  function message(id,kind,payload,author=owner,expectedRevision=flags.nativeWorkshop.revision) {
    const action={actorUuid:actor.uuid,kind,payload,options:{},expectedRevision};
    const data={id,author,flags:{[ID]:{nativeWorkshopRequest:action,actionExecution:{userId:author.id,clientId:'owner-socket',shared:true,executorUserId:gm.id,executorClientId:'gm-socket'}}}};
    data.getFlag=(_,key)=>data.flags[ID][key];
    data.update=async changes=>{for(const[path,value]of Object.entries(changes))data.flags[ID][path.split('.').at(-1)]=structuredClone(value);};
    messages.set(id,data);return data;
  }
  function registerResource(kind,sign) {
    api.registerNativeGameplayHandler(kind,async(target,payload,{author,operationId,write,executeNested})=>{
      assert(target.testUserPermission(author,'OWNER'));
      events.push(`${kind}:start`);await delay(2);
      const old=flags.fixtureEvents?.[operationId],source=JSON.stringify(payload);
      if(old&&old.source!==source)throw new Error('The saved resource operation changed.');
      const result=old?.result??{before:target.system.health.value,after:target.system.health.value+sign*payload.amount,operationId};
      if(!old)await write({'system.health.value':result.after,[`flags.${ID}.fixtureEvents.${operationId}`]:{source,result}},result);
      if(payload.child&&!flags.fixtureChildren?.[operationId]) {
        await executeNested('condition',{key:'slowed',rating:1,options:{operationId:`${operationId}-child`}});
      }
      events.push(`${kind}:end`);return {...result,child:Boolean(payload.child)};
    });
  }
  api.registerNativeGameplayHandler('condition',async(target,payload,{author,operationId,write})=>{
    const result={applied:true,authorId:author.id,operationId};
    await write({[`flags.${ID}.fixtureChildren.${operationId}`]:result},result);events.push('child:applied');return result;
  });
  let actualDamage;
  if(realDamage){
    const exportsFor=spec=>spec==='./native-workshop-coordinator.mjs'?api:spec==='../rules/conditions.mjs'?{CONDITION_KINDS:{slowed:'rated'}}:spec==='./damage.mjs'?{
      damageBasis:target=>({hp:target.system.health.value,revision:0}),
      damagePreview:(_actor,basis,draft)=>{const total=draft.components.reduce((sum,component)=>sum+component.amount,0);return {after:Math.max(0,basis.hp-total),event:{total,components:draft.components}};},
    }:{updateOwnedDocument:async()=>{throw Error('Unexpected uncoordinated write');}};
    actualDamage=new vm.SourceTextModule(await readFile(new URL('../src/services/explicit-damage.mjs',import.meta.url),'utf8'),{context});
    await actualDamage.link(async spec=>{const exports=exportsFor(spec);return new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context});});await actualDamage.evaluate();
  }else registerResource('damage',-1);
  registerResource('recovery',1);
  function enableTransport({loseChatAck=false}={}) {
    api.registerNativeWorkshopRequests();
    context.ChatMessage={create:async data=>{
      const id=`transport-${messages.size}`,author=game.user;
      const entry={...data,id,author,getFlag:(_,key)=>entry.flags[ID][key],update:async changes=>{
        if(loseChatAck)throw new Error('Private chat acknowledgement lost');
        for(const[path,value]of Object.entries(changes))entry.flags[ID][path.split('.').at(-1)]=structuredClone(value);
      }};messages.set(id,entry);
      setTimeout(()=>{game.user=gm;hooks.get('createChatMessage')?.(entry);},0);return entry;
    }};
  }
  return {api,actualDamage:actualDamage?.namespace,authority:authority.namespace,actor,flags,messages,message,enableTransport,game,gm,owner,other,observer,events,
    loseNextResourceAck:()=>{failNextResourceAck=true;},get resourceWrites(){return resourceWrites;}};
}

test('damage, Workshop SP and recovery from different owners share the actual selected-GM queue',async()=>{
  const f=await fixture();
  f.message('damage-request','gameplay',{kind:'damage',operationId:'damage-one',payload:{amount:4}},f.owner);
  f.message('workshop-request','save',{saved:{character:{draft:{play:{hp:20,sp:7}}}}},f.other);
  f.message('recovery-request','gameplay',{kind:'recovery',operationId:'heal-one',payload:{amount:2}},f.other);
  await Promise.all(['damage-request','workshop-request','recovery-request'].map(id=>f.api.resolveNativeWorkshopRequest(id)));
  assert.deepEqual(f.events,['damage:start','damage:end','workshop:start','workshop:end','recovery:start','recovery:end']);
  assert.equal(f.actor.system.health.value,18);assert.equal(f.actor.system.sp.value,7);assert.equal(f.flags.nativeWorkshop.revision,1);
  await assert.rejects(f.authority.writeAuthorityDocument(f.actor,{'system.sp.value':0}),/No action is being applied/);
});

test('repeated message and same native operation identity do not apply resources twice',async()=>{
  const f=await fixture();
  f.message('first','gameplay',{kind:'damage',operationId:'once-only',payload:{amount:4}},f.owner);
  await f.api.resolveNativeWorkshopRequest('first');await f.api.resolveNativeWorkshopRequest('first');
  f.message('explicit-retry','gameplay',{kind:'damage',operationId:'once-only',payload:{amount:4}},f.owner);
  await f.api.resolveNativeWorkshopRequest('explicit-retry');
  assert.equal(f.actor.system.health.value,16);assert.equal(f.resourceWrites,1);
  f.messages.get('first').flags[ID].nativeWorkshopRequest.payload.payload.amount=9;
  await assert.rejects(f.api.resolveNativeWorkshopRequest('first'),/completed Workshop action changed/);
  assert.equal(f.resourceWrites,1);
});

test('observer submissions and wrong GM socket cannot dispatch a managed handler',async()=>{
  const f=await fixture();f.game.user=f.observer;
  await assert.rejects(f.api.coordinateNativeGameplay(f.actor,{kind:'damage',operationId:'blocked',payload:{amount:4}}),/actor you own/);
  assert.equal(f.messages.size,0);
  f.game.user=f.gm;f.message('forged-observer','gameplay',{kind:'damage',operationId:'forged',payload:{amount:4}},f.observer);
  await assert.rejects(f.api.resolveNativeWorkshopRequest('forged-observer'),/actor you own/);
  f.message('wrong-socket','gameplay',{kind:'damage',operationId:'wrong-tab',payload:{amount:4}},f.owner);f.game.socket.id='other-gm-socket';
  assert.equal((await f.api.resolveNativeWorkshopRequest('wrong-socket')).status,'not-authority');
  assert.equal(f.resourceWrites,0);assert.deepEqual(f.events,[]);
});

test('actual damage child conditions retain the author and finish without nested queue deadlock',{timeout:1000},async()=>{
  const f=await fixture({realDamage:true});
  f.message('parent','gameplay',{kind:'damage',operationId:'with-child',payload:{components:[{type:'physical',amount:3}],options:{operationId:'with-child',conditions:[{key:'slowed',rating:1}]}}},f.owner);
  const result=await f.api.resolveNativeWorkshopRequest('parent');
  assert.equal(result.conditions.length,1);assert.equal(f.actor.system.health.value,17);
  assert.equal(f.flags.fixtureChildren['with-child-0'].authorId,f.owner.id);
  assert.equal(f.flags.nativeWorkshopOperations.parent.status,'complete');
  assert.deepEqual(f.events,['child:applied']);
});

test('public GM damage clicked during awaited authority work queues a new durable request',{timeout:2000},async()=>{
  const f=await fixture({realDamage:true});f.enableTransport();
  let release,started;const began=new Promise(resolve=>started=resolve),gate=new Promise(resolve=>release=resolve);
  f.api.registerNativeGameplayHandler('held',async(_actor,_payload,{write})=>{started();await gate;await write({'system.sp.value':9},{held:true});return {held:true};});
  f.message('held-parent','gameplay',{kind:'held',operationId:'held-one',payload:{}},f.owner);
  const parent=f.api.resolveNativeWorkshopRequest('held-parent');await began;
  const click=f.actualDamage.applyOwnedDamage(f.actor,[{type:'physical',amount:2}],{operationId:'gm-click'});
  await delay(10);
  assert.equal(f.messages.size,2);assert.equal(f.actor.system.health.value,20);assert.equal(f.resourceWrites,0);
  release();await Promise.all([parent,click]);
  assert.equal(f.actor.system.health.value,18);assert.equal(f.actor.system.sp.value,9);
  assert.equal(f.resourceWrites,1);
});

test('lost resource acknowledgement blocks unrelated writes until explicit same-operation recovery',async()=>{
  const f=await fixture();f.loseNextResourceAck();
  f.message('interrupted','gameplay',{kind:'damage',operationId:'interrupted-hit',payload:{amount:4,child:true}},f.owner);
  await assert.rejects(f.api.resolveNativeWorkshopRequest('interrupted'),/acknowledgement lost/);
  assert.equal(f.actor.system.health.value,16);assert.equal(f.flags.nativeWorkshopOperations.interrupted.status,'applying');
  f.message('blocked-save','save',{saved:{character:{draft:{play:{sp:7}}}}},f.owner);
  await assert.rejects(f.api.resolveNativeWorkshopRequest('blocked-save'),/needs reconciliation/);
  await assert.rejects(f.authority.enqueueCharacterOperation(()=>f.authority.writeAuthorityDocument(f.actor,{'system.sp.value':3})),/needs reconciliation/);
  f.enableTransport();f.game.user=f.owner;
  const resumed=await f.api.reconcileNativeGameplayOperation(f.actor);
  assert.equal(resumed.after,16);assert.equal(resumed.child,true);assert.equal(f.resourceWrites,1);
  assert.equal(f.flags.nativeWorkshopOperations.interrupted.status,'complete');
  assert(Object.values(f.flags.nativeWorkshopOperations).every(receipt=>receipt.status!=='applying'));
  f.message('after-reconciliation','save',{saved:{character:{draft:{play:{sp:7}}}}},f.owner);
  await f.api.resolveNativeWorkshopRequest('after-reconciliation');
  assert.equal(f.actor.system.health.value,16);assert.equal(f.actor.system.sp.value,7);
});

test('lost private-chat acknowledgement returns the completed durable result without replay',async()=>{
  const f=await fixture();f.enableTransport({loseChatAck:true});f.game.user=f.owner;
  const result=await f.api.coordinateNativeGameplay(f.actor,{kind:'damage',operationId:'lost-chat',payload:{amount:2}});
  assert.equal(result.after,18);assert.equal(f.resourceWrites,1);assert.equal(f.messages.size,1);
  const receipt=Object.values(f.flags.nativeWorkshopOperations)[0];assert.equal(receipt.status,'complete');
  const message=[...f.messages.values()][0];assert(message.whisper.includes(f.owner.id));assert(message.whisper.includes(f.gm.id));
  assert.equal(message.getFlag(ID,'actionExecution').executorClientId,'gm-socket');
});
