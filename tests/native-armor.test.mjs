import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeForgeArmorSources,untrainedArmorPenalty} from '../src/rules/native-armor.mjs';
import {effectiveActorAttributeValue} from '../src/rules/effective-attributes.mjs';
import {damageEvent} from '../src/rules/damage.mjs';

const gear = ['light', 'medium', 'heavy'].map(name => ({
  catalogId: `item-ordinary-${name}-armor`, instanceId: name, worn: true, carried: true, quantity: 1,
}));

test('worn armor provides its own resistance regardless of training', () => {
  for (const [index, expected] of [[0, 1], [1, 2], [2, 3]]) {
    const sources = nativeForgeArmorSources([gear[index]]);
    assert.equal(sources[0].value, expected);
    assert.equal(damageEvent({components: [{type:'physical', amount:5}], resistances:sources}).total, 5 - expected);
  }
  for (const omitted of [{worn:false}, {carried:false}, {quantity:0}])
    assert.deepEqual(nativeForgeArmorSources([{...gear[2], ...omitted}]), []);
});

test('untrained armor penalizes Agility by its highest worn resistance and keeps the base', () => {
  assert.equal(untrainedArmorPenalty([], gear), 3);
  assert.equal(untrainedArmorPenalty(['armor:harness:1', 'armor:harness:3'], gear.slice(0, 2)), 0);
  assert.equal(untrainedArmorPenalty(['armor:harness:1'], gear.slice(0, 2)), 2);
  const actor = { type: 'character', getFlag: () => [], items: gear.map(system => ({ type:'equipment', system })) };
  assert.equal(effectiveActorAttributeValue(2, actor, 'agility'), -1);
  assert.equal(effectiveActorAttributeValue(2, actor, 'brawn'), 2);
});
