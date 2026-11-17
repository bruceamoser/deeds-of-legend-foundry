import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {canonicalDamageType,DAMAGE_TYPE_LABELS} from '../src/rules/damage.mjs';
import {CONDITION_KINDS} from '../src/rules/conditions.mjs';
async function fixture(){
 class CreatureSheetBase {static editPortrait(){}async _processSubmitData(_event,_form,data){return {data};}}
 const context=vm.createContext({CreatureSheetBase,canonicalDamageType,DAMAGE_TYPE_LABELS,CONDITION_KINDS,viewPortrait(){},toggleCardEdit(){}});
 const source=(await readFile(new URL('../src/sheets/creature.mjs',import.meta.url),'utf8')).replace(/^import[\s\S]*?;\n/gm,'').replace('export class CreatureSheet','class CreatureSheet')+'\nglobalThis.Sheet=CreatureSheet;';vm.runInContext(source,context);return Object.create(context.Sheet.prototype);
}
test('native creature submit reads editor controls after Foundry filters custom non-schema form fields',async()=>{
 const sheet=await fixture(),values={damageImmunityText:' Fire, Cold, fire ',conditionImmunityText:' Poisoned, Burning '};const form={querySelector:selector=>({value:values[selector.match(/name="([^"]+)/)[1]]})};
 const result=await sheet._processSubmitData(null,form,{name:'Fixture',system:{health:{value:8}}},{});assert.deepEqual(Array.from(result.data['system.damageImmunities']),['fire','cold']);assert.deepEqual(Array.from(result.data['system.immunities']),['poisoned','burning']);assert.equal(result.data.damageImmunityText,undefined);assert.equal(result.data.conditionImmunityText,undefined);assert.equal(result.data.system.health.value,8);
});
test('clearing immunity controls removes explicit entries; invalid named types refuse the write',async()=>{
 const sheet=await fixture();const form=value=>({querySelector:selector=>({value:selector.includes('damageImmunityText')?value:''})});
 const cleared=await sheet._processSubmitData(null,form(''),{system:{}},{});assert.equal(cleared.data['system.damageImmunities'].length,0);assert.equal(cleared.data['system.immunities'].length,0);await assert.rejects(sheet._processSubmitData(null,form('Mana'),{system:{}},{}),/Unknown damage type/);
});
