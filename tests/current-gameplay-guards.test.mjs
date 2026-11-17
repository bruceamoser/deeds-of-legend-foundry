import test from 'node:test';
import assert from 'node:assert/strict';
import {damageBasis} from '../src/services/damage.mjs';
import {recoveryPreview} from '../src/services/recovery.mjs';
import {rollBasis} from '../src/services/roll-preparation.mjs';
import {actorMovement} from '../src/services/turn-budget.mjs';
import {itemAbilityDefinition,reviewedDefenseAbilityOptions} from '../src/services/abilities.mjs';
const ID='heroes-of-legend';
const portable={format:'heroes-of-legend-character',schemaVersion:7,draft:{traitIds:[]}};
test('raw old character gameplay rejects without modifying stored data; creatures retain simple HP',()=>{
 const old={type:'character',flags:{survival:{wounds:3}},getFlag:(_,key)=>old.flags[key]};const before=structuredClone(old.flags);
 for(const call of [()=>damageBasis(old),()=>recoveryPreview(old,{},{}),()=>rollBasis(old,'brawn'),()=>actorMovement(old),()=>itemAbilityDefinition({actor:old})])assert.throws(call,/invalid for current play/);
 assert.deepEqual(old.flags,before);
 const creature={type:'creature',uuid:'Actor.creature',items:[],system:{health:{value:2,max:10},armor:1},getFlag:()=>undefined};
 assert.equal(recoveryPreview(creature,damageBasis(creature),{kind:'heal',amount:3}).after,5);
});
test('current native defense options use current owned identities and require actual held shield',()=>{
 globalThis.game={user:{id:'owner'}};
 const actor={type:'character',documentName:'Actor',items:[],effects:[],getFlag:(_,key)=>key==='nativeWorkshop'?{portable}:null,testUserPermission:()=>true};
 const card=id=>({id,uuid:`Actor.hero.Item.${id}`,type:'ability',name:id,actor,getFlag:(_,key)=>({catalogId:id,workshopRecord:{nodeId:id},grantKind:'nativeWorkshop'})[key]});
 actor.items.push(card('ability-defend'),card('ability-shield-block'),{...card('ability-high-guard'),getFlag:()=>null});
 const options=()=>reviewedDefenseAbilityOptions(actor).options;
 assert.equal(options().length,2);assert.equal(options()[0].available,true);assert.equal(options()[1].available,false);
 actor.items.push({type:'equipment',uuid:'Actor.hero.Item.shield',system:{catalogId:'item-ordinary-shield',quantity:1,carried:true,held:true}});
 assert.equal(options()[1].available,true);actor.testUserPermission=()=>false;assert(options().every(option=>!option.available));
});
test('current native movement uses current committed base, actual burden and trained armor',()=>{
 const flags={nativeWorkshop:{portable},forgeMovement:{speedBase:6},forgeLearned:['armor:harness:1','armor:harness:3']};
 const actor={type:'character',getFlag:(_,key)=>flags[key],items:[{type:'equipment',system:{catalogId:'item-ordinary-medium-armor',bulk:4,quantity:1,worn:true,carried:true}}],system:{attributes:{brawn:{effective:-2},agility:{effective:1}}}};
 const movement=actorMovement(actor);assert.equal(movement.armorBulkRelief,1);assert.equal(movement.speed,8);assert.equal(movement.capacity,4);
 actor.items.push({type:'equipment',system:{catalogId:'custom',bulk:4,quantity:1,carried:true}});assert.equal(actorMovement(actor).speed,5);
});
