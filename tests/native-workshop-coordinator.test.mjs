import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const ID='heroes-of-legend';
async function fixture(){
 const flags={nativeWorkshop:{revision:0,portable:{draft:{play:{sp:10}}}}},messages=new Map(),gm={id:'gm',isGM:true},owner={id:'owner'},other={id:'other'},observer={id:'observer'};let writes=0,calls=0;
 const users=[gm,owner,other,observer];users.activeGM={id:'gm',isSelf:true};
 const game={user:gm,users,messages,socket:{id:'gm-socket'},settings:{get:()=>({userId:'gm',clientId:'gm-socket'})}};
 const actor={uuid:'Actor.hero',type:'character',system:{sp:{value:10}},getFlag:(_,key)=>flags[key],testUserPermission:user=>user.id!=='observer',update:async changes=>{writes++;for(const[path,value]of Object.entries(changes)){const parts=path.split('.').slice(2);let at=flags;for(const key of parts.slice(0,-1))at=at[key]??={};const last=parts.at(-1);if(last.startsWith('-='))delete at[last.slice(2)];else at[last]=structuredClone(value);}}};
 const handlers=new Map(),hooks={on(name,fn){handlers.set(name,fn);},once(){}},context=vm.createContext({Map,Set,Promise,JSON,Date,Number,Error,Uint8Array,TextEncoder,structuredClone,crypto,setTimeout,game,Hooks:hooks,fromUuid:async()=>actor});
 const authority=new vm.SourceTextModule(await readFile(new URL('../src/services/authority.mjs',import.meta.url),'utf8'),{context});await authority.link(()=>{});await authority.evaluate();
 const state={loadNativeWorkshopState:async()=>({revision:flags.nativeWorkshop.revision,character:flags.nativeWorkshop.portable}),loadNativeWorkshopDraft:async()=>flags.nativeWorkshopDraft,
 saveNativeWorkshopState:async(_actor,saved,options)=>{calls++;await new Promise(resolve=>setTimeout(resolve,5));assert.equal(flags.nativeWorkshop.revision,options.expectedRevision);flags.nativeWorkshop={revision:options.expectedRevision+1,portable:saved.character};actor.system.sp.value=saved.character.draft.play.sp;flags.nativeWorkshopOperations??={};flags.nativeWorkshopOperations[options.operationReceipt.id]=structuredClone(options.operationReceipt);},
 commitNativeWorkshopCharacter:async()=>{},saveNativeWorkshopIdentity:async()=>{},saveNativeWorkshopDraft:async()=>{}};
 const module=new vm.SourceTextModule(await readFile(new URL('../src/services/native-workshop-coordinator.mjs',import.meta.url),'utf8'),{context});await module.link(async spec=>{const exports=spec==='./authority.mjs'?authority.namespace:state;return new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context});});await module.evaluate();
 const message=(id,kind,payload={},author=owner,revision=flags.nativeWorkshop.revision,options={})=>{const action={actorUuid:actor.uuid,kind,payload,options,expectedRevision:revision};const entry={id,author,getFlag:(_,key)=>key==='nativeWorkshopRequest'?action:key==='actionExecution'?{userId:author.id,clientId:'client',shared:true,executorUserId:'gm',executorClientId:'gm-socket'}:null,update:async()=>{}};messages.set(id,entry);return {entry,action};};
 const enableRequests=({process=true,failAck=false}={})=>{module.namespace.registerNativeWorkshopRequests();context.ChatMessage={create:async data=>{const id=`auto${messages.size}`,message={id,author:gm,...data,getFlag:(_,key)=>message.flags?.[ID]?.[key],update:async changes=>{if(failAck)throw Error('Chat acknowledgement lost');for(const[path,value]of Object.entries(changes))message.flags[ID][path.split('.').at(-1)]=value;}};messages.set(id,message);if(process)setTimeout(()=>handlers.get('createChatMessage')?.(message),0);return message;}};};
 return {enableRequests,context,messages,api:module.namespace,authority:authority.namespace,actor,flags,game,gm,owner,other,observer,message,get calls(){return calls;},get writes(){return writes;}};
}
test('one actual GM authority queue rejects a stale simultaneous second client save instead of losing SP costs',async()=>{
 const f=await fixture();f.message('first','save',{saved:{character:{draft:{play:{sp:7}}}}},f.owner,0);f.message('second','save',{saved:{character:{draft:{play:{sp:7}}}}},f.other,0);
 const results=await Promise.allSettled([f.api.resolveNativeWorkshopRequest('first'),f.api.resolveNativeWorkshopRequest('second')]);assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');assert.match(results[1].reason.message,/changed in another window/);assert.equal(f.actor.system.sp.value,7);assert.equal(f.calls,1);assert.equal(f.flags.nativeWorkshop.revision,1);
 await f.api.resolveNativeWorkshopRequest('first');assert.equal(f.calls,1);
});
test('an interrupted roll keeps its dice and cannot stop another roll or a character save',async()=>{
 const f=await fixture();
 f.flags.nativeWorkshopPendingRoll={id:'old',status:'evaluated',kind:'cast',faces:[4,5,6],authorId:f.owner.id};
 f.message('save','save',{saved:{character:{draft:{play:{sp:7}}}}},f.owner);
 await f.api.resolveNativeWorkshopRequest('save');
 assert.equal(f.actor.system.sp.value,7);
 assert.equal(f.flags.nativeWorkshopPendingRoll,undefined);
 assert.deepEqual(f.flags.nativeWorkshopRolls.old,{id:'old',status:'interrupted',interruptedPhase:'evaluated',kind:'cast',faces:[4,5,6],authorId:f.owner.id});
 f.message('claim1','claim-roll',{operation:{id:'roll1',status:'prepared',kind:'cast'}},f.owner);
 f.message('claim2','claim-roll',{operation:{id:'roll2',status:'prepared',kind:'spell'}},f.other);
 await Promise.all([f.api.resolveNativeWorkshopRequest('claim1'),f.api.resolveNativeWorkshopRequest('claim2')]);
 f.message('foreign','roll-phase',{operation:{id:'roll1',status:'evaluating'}},f.other);
 await assert.rejects(f.api.resolveNativeWorkshopRequest('foreign'),/owner who started/);
 f.message('phase','roll-phase',{operation:{id:'roll1',status:'evaluating'}},f.owner);
 await f.api.resolveNativeWorkshopRequest('phase');
 f.message('evaluation','roll-phase',{operation:{id:'roll1',status:'evaluated',faces:[1,2,3]}},f.owner);
 await f.api.resolveNativeWorkshopRequest('evaluation');
 f.message('interrupt','interrupt-roll',{id:'roll1'},f.owner);
 await f.api.resolveNativeWorkshopRequest('interrupt');
 f.message('replay','claim-roll',{operation:{id:'roll1',status:'prepared',kind:'cast'}},f.owner);
 await assert.rejects(f.api.resolveNativeWorkshopRequest('replay'),/already been started/);
 assert.deepEqual(f.flags.nativeWorkshopRolls.roll1.faces,[1,2,3]);
 assert.equal(f.flags.nativeWorkshopRolls.roll1.status,'interrupted');
 assert.equal(f.flags.nativeWorkshopRolls.roll2.status,'prepared');
 f.message('finish','complete-roll',{id:'roll2'},f.other);
 await f.api.resolveNativeWorkshopRequest('finish');
 assert.equal(f.flags.nativeWorkshopRolls.roll2.status,'complete');
});
test('observer, changed completed request and wrong executor cannot mutate the actor',async()=>{
 const f=await fixture();f.message('observer','claim-roll',{operation:{id:'roll1',status:'prepared'}},f.observer);await assert.rejects(f.api.resolveNativeWorkshopRequest('observer'),/Only the owner/);assert.equal(f.writes,0);
 const request=f.message('owner','claim-roll',{operation:{id:'roll1',status:'prepared'}},f.owner);await f.api.resolveNativeWorkshopRequest('owner');request.action.payload.operation.id='changed';await assert.rejects(f.api.resolveNativeWorkshopRequest('owner'),/completed Workshop action changed/);assert.equal(f.writes,1);
 f.game.socket.id='different-gm-tab';f.message('wrongtab','claim-roll',{operation:{id:'roll2',status:'prepared'}},f.owner);assert.equal((await f.api.resolveNativeWorkshopRequest('wrongtab')).status,'not-authority');assert.equal(f.writes,1);
});
test('GM submissions opt into the same selected relay instead of a second GM tab local queue',async()=>{
 const f=await fixture();f.game.socket.id='other-gm-tab';let created;
 // Actual authority implementation supplies the saved selected executor.
 f.game.messages={};const context=vm.createContext({game:f.game,ChatMessage:{create:async data=>(created=data)}});const module=new vm.SourceTextModule(await readFile(new URL('../src/services/authority.mjs',import.meta.url),'utf8'),{context});await module.link(()=>{});await module.evaluate();await module.namespace.createActionMessage({flags:{}},{shared:true,coordinated:true});assert.equal(created.flags[ID].actionExecution.shared,true);assert.equal(created.flags[ID].actionExecution.executorClientId,'gm-socket');assert.equal(created.flags[ID].actionExecution.clientId,'other-gm-tab');
});

test('requester returns acknowledged actor state after lost private-chat acknowledgement without another write',async()=>{
 const f=await fixture();f.enableRequests({failAck:true});const result=await f.api.saveNativeWorkshopState(f.actor,{character:{draft:{play:{sp:7}}}},{expectedRevision:0});assert.equal(result.revision,1);assert.equal(f.calls,1);assert.equal(f.messages.size,1);const message=[...f.messages.values()][0];assert.deepEqual(Array.from(message.whisper),['gm']);assert.equal(message.getFlag(ID,'actionExecution').shared,true);
});
test('timed out requester retains its unresolved identity and refuses automatic resubmission',async()=>{
 const f=await fixture();f.enableRequests({process:false});let now=0;f.context.Date=class extends Date{static now(){return now+=30001;}};
 await assert.rejects(f.api.saveNativeWorkshopState(f.actor,{character:{draft:{play:{sp:7}}}},{expectedRevision:0}),/did not confirm this Workshop action/);assert.equal(f.messages.size,1);
 await assert.rejects(f.api.saveNativeWorkshopState(f.actor,{character:{draft:{play:{sp:7}}}},{expectedRevision:0}),/has not confirmed the previous change/);assert.equal(f.messages.size,1);assert.equal(f.calls,0);
});

test('an unacknowledged roll phase cannot block a fresh character save',async()=>{
 const f=await fixture();
 f.enableRequests({process:false});
 let now=0;
 f.context.Date=class extends Date{static now(){return now+=30001;}};
 await assert.rejects(f.api.claimNativeWorkshopOperation(f.actor,{id:'lost-claim',status:'prepared',kind:'cast'}),/did not confirm/);
 f.context.Date=Date;
 f.enableRequests();
 const result=await f.api.saveNativeWorkshopState(f.actor,{character:{draft:{play:{sp:7}}}},{expectedRevision:0});
 assert.equal(result.revision,1);
 assert.equal(f.calls,1);
 assert.equal(f.messages.size,2);
});
