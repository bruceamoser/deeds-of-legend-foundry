import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeForgeArmorSources} from '../src/rules/native-armor.mjs';
import {damageEvent} from '../src/rules/damage.mjs';
test('current native armor requires matching training and worn physical equipment',()=>{
 const gear=['light','medium','heavy'].map((name,i)=>({catalogId:`item-ordinary-${name}-armor`,instanceId:name,worn:true,carried:true,quantity:1}));
 assert.deepEqual(nativeForgeArmorSources([],gear),[]);
 for(const [rank,expected]of [[1,1],[2,1],[3,2],[4,3]]){
  const abilities=Array.from({length:rank},(_,i)=>({catalogId:`armor:harness:${i+1}`}));
  const sources=nativeForgeArmorSources(abilities,gear);
  assert.equal(Math.max(...sources.map(s=>s.value)),expected);
  assert.equal(damageEvent({components:[{type:'physical',amount:5}],resistances:sources}).total,5-expected);
 }
 assert.deepEqual(nativeForgeArmorSources([{catalogId:'armor:harness:4'}],[{...gear[2],worn:false}]),[]);
 assert.deepEqual(nativeForgeArmorSources([{catalogId:'armor:harness:4'}],[{...gear[2],carried:false}]),[]);
 assert.deepEqual(nativeForgeArmorSources([{catalogId:'armor:harness:4'}],[{...gear[2],quantity:0}]),[]);
});
