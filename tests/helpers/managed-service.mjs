import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as authority from '../../src/services/authority.mjs';
/** Test the actual private managed executor with a local authority transport.
 * Cross-client routing and queue behavior are tested separately against authority. */
export async function managedService(relative){
 const handlers=new Map(),url=new URL(relative,import.meta.url);
 const globals=Object.fromEntries(['game','foundry','CONST','ChatMessage','ui','fromUuid','fromUuidSync','Hooks','canvas'].map(key=>[key,globalThis[key]]));
 const context=vm.createContext({...globals,ChatMessage:new Proxy({},{get:(_,key)=>globalThis.ChatMessage?.[key]}),ui:new Proxy({},{get:(_,key)=>globalThis.ui?.[key]}),structuredClone,Map,Promise,JSON});
 const transport={registerNativeGameplayHandler:(kind,handler)=>handlers.set(kind,handler),coordinateNativeGameplay:async(actor,{kind,operationId,payload})=>{
  const execution={author:globals.game.user,operationId,write:changes=>actor.update(changes)};
  execution.executeNested=(kind,payload)=>handlers.get(kind)(actor,payload,{...execution,operationId:payload.options?.operationId??operationId});
  return handlers.get(kind)(actor,payload,execution);
 }};
 const mod=new vm.SourceTextModule(await readFile(url,'utf8'),{context});
 await mod.link(async spec=>{const exports=spec==='./native-workshop-coordinator.mjs'?transport:spec==='./authority.mjs'?{...authority,writeAuthorityDocument:(actor,changes)=>actor.update(changes)}:await import(new URL(spec,url));return new vm.SyntheticModule(Object.keys(exports),function(){for(const[key,value]of Object.entries(exports))this.setExport(key,value);},{context});});
 await mod.evaluate();return mod.namespace;
}
