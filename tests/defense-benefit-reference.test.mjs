import {startTurn,declareAction} from '../src/rules/actions.mjs';
import {benefitCurrent,expireStaleBenefits} from '../src/services/benefits.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';
test('current Defend persists its removable benefit through managed authority and posts actual Item reference',async()=>{
 let serial=0,combat;const posted=[],handlers=new Map(),flags={},ID='heroes-of-legend',user={id:'owner'};
 const actor={type:'character',uuid:'Actor.hero',items:[],effects:[],getFlag:(_,key)=>flags[key],testUserPermission:()=>true,toObject:()=>({effects:structuredClone(actor.effects)})};actor.items.get=id=>actor.items.find(item=>item.id===id);
 const item={id:'defend',type:'ability',actor,name:'Defend',img:'defend.webp',getFlag:(_,key)=>({catalogId:'ability-defend',workshopRecord:{nodeId:'ability-defend'},grantKind:'nativeWorkshop'})[key]};actor.items.push(item);
 const combats=[];const context=createContext({structuredClone,fromUuid:async()=>combat,game:{user,combats},foundry:{utils:{randomID:()=>`id${++serial}`}}});
 async function synthetic(exports){const dependency=new SyntheticModule(Object.keys(exports),function(){for(const [key,value]of Object.entries(exports))this.setExport(key,value)},{context});await dependency.link(()=>{});await dependency.evaluate();return dependency;}
 const source=await readFile(new URL('../src/services/abilities.mjs',import.meta.url),'utf8');
 const imports=new Map();for(const [,names,path]of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g))imports.set(path,{...imports.get(path),...Object.fromEntries(names.split(',').map(s=>s.trim()).filter(Boolean).map(name=>[name,()=>{}]))});
 imports.set('../rules/ability-roll.mjs',{abilityCatalogRecord:()=>({}),abilityRollConfiguration:()=>({category:'main'})});
 imports.set('./catalog.mjs',{loadWorkshopCatalogs:async()=>({choices:[{id:'cast-main',action:'Main Action'},{id:'ritual',action:'1 minute'},{id:'ability-sustain-spell',action:'Maneuver'}],forge:{spells:[]}})});
 imports.set('../rules/actions.mjs',{declareAction});imports.set('./authority.mjs',{writeAuthorityDocument:async(document,changes)=>document.update(changes)});
 imports.set('./native-workshop-coordinator.mjs',{nativeWorkshopRoll:(_actor,id)=>flags.nativeWorkshopRolls?.[id],workshopRollClaimChanges:(_actor,claim)=>claim?{[`flags.${ID}.nativeWorkshopRolls.${claim.id}`]:claim}:{},registerNativeGameplayHandler:(kind,handler)=>handlers.set(kind,handler),coordinateNativeGameplay:async(_actor,{kind,payload,operationId})=>handlers.get(kind)(actor,payload,{author:user,operationId,write:async changes=>{for(const[path,value]of Object.entries(changes)){if(path==='effects')actor.effects=structuredClone(value);else{const key=path.split('.').slice(2);let target=flags;for(const part of key.slice(0,-1))target=target[part]??={};target[key.at(-1)]=structuredClone(value);}}}})});
 const module=new SourceTextModule(source,{context,importModuleDynamically:async path=>{assert.equal(path,'./reference-play.mjs');return synthetic({postAbilityReference:async(...args)=>{posted.push(args);return {id:'message'};}})}});
 await module.link(path=>synthetic(imports.get(path)));await module.evaluate();
 await module.namespace.activateDefenseBenefit(item);assert.equal(actor.effects.length,1);assert.equal(actor.effects[0].flags[ID].benefit.key,'defend');assert.equal(actor.effects[0].flags[ID].benefit.current,true);assert.equal(actor.effects[0].flags[ID].benefit.manual,true);assert.equal(posted[0][0],item);
 let state={current:'hero',revision:0,budgets:{hero:startTurn({turnId:'turn1',speed:6})}};
 combat={id:'combat',uuid:'Combat.combat',combatants:[{id:'hero',actor}],getFlag:()=>state,update:async changes=>{state=changes[`flags.${ID}.encounter`];}};combats.push(combat);
 await module.namespace.activateDefenseBenefit(item);assert.equal(state.budgets.hero.remaining.maneuver,0);
 const effect=actor.effects.find(effect=>effect.flags[ID].benefit.key==='defend');assert.equal(effect.flags[ID].benefit.anchor.turnId,'turn1');
 globalThis.game={combats:{get:()=>combat}};const native={...effect,id:effect._id,active:true,getFlag:(_,key)=>effect.flags[ID][key]};assert.equal(benefitCurrent(native),true);state.budgets.hero.turnId='turn2';assert.equal(benefitCurrent(native),false);
 let expiredWrites=0;const expiryActor={effects:[native],updateEmbeddedDocuments:async(_type,updates)=>{expiredWrites++;assert.equal(updates[0]._id,native._id);native.disabled=true;native.active=false;}};
 await expireStaleBenefits({id:'combat',combatants:[{actor:expiryActor}],getFlag:()=>state});assert.equal(native.disabled,true);await expireStaleBenefits({id:'combat',combatants:[{actor:expiryActor}],getFlag:()=>state});assert.equal(expiredWrites,1);state.budgets.hero.turnId='turn1';
 const attack={...item,id:'melee',getFlag:(_,key)=>({catalogId:'ability-basic-melee',workshopRecord:{nodeId:'ability-basic-melee'},grantKind:'nativeWorkshop'})[key]};actor.items.push(attack);
 await module.namespace.prepareNativeBasicAttack(actor,'melee','attack1');assert.equal(state.budgets.hero.remaining.main,0);assert.equal(flags.nativeWorkshopRolls.attack1.id,'attack1');
 await module.namespace.prepareNativeBasicAttack(actor,'melee','attack1');assert.equal(state.budgets.hero.remaining.main,0);
 await module.namespace.prepareNativeBasicAttack(actor,'melee','attack2');assert.equal(state.budgets.hero.remaining.main,0);
 const cast=id=>({...item,id,getFlag:(_,key)=>({catalogId:id,workshopRecord:{nodeId:id},grantKind:'nativeWorkshop'})[key]});actor.items.push(cast('cast-main'),cast('ritual'),cast('ability-sustain-spell'));
 state={...state,budgets:{hero:startTurn({turnId:'turn3',speed:6})}};
 await module.namespace.prepareNativeActionCost(actor,'cast-main','cast1','cast');assert.equal(state.budgets.hero.remaining.main,0);assert.equal(state.budgets.hero.remaining.maneuver,1);assert.equal(flags.nativeWorkshopRolls.cast1.id,'cast1');
 await module.namespace.prepareNativeActionCost(actor,'cast-main','cast1','cast');assert.equal(state.budgets.hero.remaining.main,0);
 await module.namespace.prepareNativeActionCost(actor,'ability-sustain-spell','sustain1','sustain');assert.equal(state.budgets.hero.remaining.maneuver,0);
 const beforeRitual=JSON.stringify(state);await module.namespace.prepareNativeActionCost(actor,'ritual','ritual1','cast');assert.equal(JSON.stringify(state),beforeRitual);


});
