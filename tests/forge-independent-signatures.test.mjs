import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {forgeSignatureLearning,forgeSignatureComponent} from '../src/rules/forge-signatures.mjs';
import {workshopCatalogs} from '../src/rules/workshop-forge-catalog.mjs';
import {currentWorkshopItemSource,currentWorkshopLearnedItems} from '../src/rules/current-workshop-items.mjs';
import {normalizeSignatureDevelopment} from '../scripts/content/forge.mjs';
const read=async name=>JSON.parse(await readFile(new URL(`../static/data/${name}.json`,import.meta.url),'utf8'));
const [graph,choices,inventory,wounds,references]=await Promise.all(['forge','choices','inventory','wounds','forge-references'].map(read));
const catalogs=workshopCatalogs(choices,inventory,wounds,graph,references);
const entries=graph.signatureDevelopment.signatures;

test('all 90 choices grant exactly themselves with no foundation or conditional earlier grants',()=>{
 assert.equal(entries.length,90);
 for(const entry of entries) {
  const selected=forgeSignatureLearning(graph,{[entry.level]:entry.id});
  assert.deepEqual(selected.abilityIds,[entry.id],entry.id);
  assert.deepEqual(selected.components.map(component=>component.id),[entry.id],entry.id);
  assert.equal(selected.components[0].effect,entry.rulesMarkdown,entry.id);
 }
 for(const cls of graph.classes)for(const tier of [1,3,7])assert.equal(cls.signatures[tier].length,3);
});
test('late choice does not grant earlier choices and switching preserves distinct explicit selections',()=>{
 const late=entries.find(entry=>entry.level===7);
 const first=entries.find(entry=>entry.classId===late.classId&&entry.level===1);
 const middle=entries.find(entry=>entry.classId===late.classId&&entry.level===3);
 const alternate=entries.find(entry=>entry.classId===late.classId&&entry.level===7&&entry.id!==late.id);
 assert.deepEqual(forgeSignatureLearning(graph,{7:late.id}).abilityIds,[late.id]);
 const three={1:first.id,3:middle.id,7:late.id};
 assert.deepEqual(forgeSignatureLearning(graph,three).abilityIds,Object.values(three));
 const switched=forgeSignatureLearning(graph,{...three,7:alternate.id});
 assert.deepEqual(switched.abilityIds,[first.id,middle.id,alternate.id]);
 assert(!switched.abilityIds.includes(late.id));
});
test('optional synergy text remains on its own standalone card without granting its named partner',()=>{
 const rules='**Action:** Passive\n\nWorks alone. If you also know Earlier Choice, gain its optional synergy.';
 const synthetic={signatureDevelopment:{schemaVersion:2,signatures:[{id:'late',name:'Late',classId:'class-test',level:7,lineId:'theme',rulesMarkdown:rules},{id:'early',name:'Earlier Choice',classId:'class-test',level:1,lineId:'theme',rulesMarkdown:'**Action:** Passive\n\nEarlier only.'}]}};
 const result=forgeSignatureLearning(synthetic,{7:'late'});
 assert.deepEqual(result.abilityIds,['late']);assert.equal(result.components[0].effect,rules);
 assert.equal(forgeSignatureLearning(synthetic,{1:'early',7:'late'}).components.length,2);
});
test('all 90 learned native Items and compendium constructors contain only their own rules',()=>{
 for(const entry of entries) {
  const own=forgeSignatureComponent(graph,entry.id);
  const record=catalogs.choices.find(record=>record.id===entry.id);
  const item=currentWorkshopItemSource(record,catalogs);
  assert.equal(item.flags['heroes-of-legend'].workshopRecord.effect,own.effect,entry.id);
  const learned=currentWorkshopLearnedItems({state:{abilities:[entry.id],learning:{spells:[]}}},catalogs);
  assert.deepEqual(learned.filter(item=>item.flags['heroes-of-legend'].catalogId.startsWith('ability-signature-')).map(item=>item.flags['heroes-of-legend'].catalogId),[entry.id]);
  assert.equal(learned.find(item=>item.flags['heroes-of-legend'].catalogId===entry.id).flags['heroes-of-legend'].workshopRecord.effect,own.effect);
 }
});
test('schema 2 imports direct own rules and rejects former bundle fields',()=>{
 const source={schemaVersion:2,choiceLevels:[1,3,7],signatures:[{id:'signature-test',name:'Standalone',classId:'class-test',level:7,lineId:'theme',rulesMarkdown:'**Action:** Passive\n\nWorks independently.'}]};
 const normalized=normalizeSignatureDevelopment(source);
 assert.equal(normalized.signatures[0].rulesMarkdown,source.signatures[0].rulesMarkdown);
 for(const key of ['components','foundationId','includes','conditionalIncludes','upgradeFrom'])assert.throws(()=>normalizeSignatureDevelopment({...source,signatures:[{...source.signatures[0],[key]:[]}]}),new RegExp(key));
});
test('runtime and importer require current schema 2 without a missing-metadata ID fallback',()=>{
 const old={schemaVersion:1,choiceLevels:[1,3,7],signatures:[]};
 assert.throws(()=>normalizeSignatureDevelopment(old),/schema 2/);
 assert.throws(()=>forgeSignatureLearning({signatureDevelopment:old},{7:'unearned'}),/schema 2/);
 assert.throws(()=>forgeSignatureLearning({}, {7:'unearned'}),/schema 2/);
 assert.deepEqual(forgeSignatureLearning({signatureDevelopment:{schemaVersion:2,signatures:[]}},{7:'unearned'}).abilityIds,[]);
 const current=normalizeSignatureDevelopment(graph.signatureDevelopment);
 assert.equal(current.signatures.length,90);
 assert(current.signatures.every(entry=>typeof entry.rulesMarkdown==='string' && !Object.hasOwn(entry,'components') && !Object.hasOwn(entry,'foundationId')));
});
test('standalone prose-cost signatures override stale composite SP and cast at their own price',async()=>{
 const {signatureSpellCost,forgeCastPayment,isForgeRitual}=await import('../src/rules/forge-casting.mjs');
 const cases=[
  ['Restoring Hands','Main Action','Reason','This is a spell costing 1 SP.',1],
  ['Sheltering Hands','Main Action','Reason','This is a spell costing 1 SP.',1],
  ['Shape of the Wild','Main Action','None','This is a spell costing 1 SP.',1],
  ['Great Shape','Main Action','None','This is a spell costing 1 SP.',1],
  ['Mend','Main Action','Reason','pay 1 SP before rolling. This is a spell; use its printed 1 SP cost.',1],
  ['Triage','Main Action','Reason','Pay 2 SP before rolling. This is a spell.',2],
  ['Make It Last','Ritual — 1 hour','None','**Magic:** Bound-item spell · **SP:** 1\nPay 1 SP and bind one item.',1],
 ];
 for(const [name,action,attribute,procedure,cost]of cases){
  const id='ability-signature-test';
  const ownGraph={nodes:[],signatureDevelopment:{schemaVersion:2,signatures:[{id,name,classId:'class-test',level:7,rulesMarkdown:`**Action:** ${action} · **Attribute:** ${attribute}\n\n${procedure}`} ]}};
  const component=forgeSignatureComponent(ownGraph,id);
  assert.equal(signatureSpellCost(component),cost,name);
  assert.equal(forgeCastPayment({hp:10,sp:10},{maxHp:20,maxSp:20,gritGranted:1},{learned:[]},component).sp,10-cost,name);
  const item=currentWorkshopItemSource({id,name,sp:99,action:'Variable',effect:'Stale composite'},{forge:ownGraph,commit:'fixture'});
  assert.equal(item.flags['heroes-of-legend'].workshopRecord.sp,cost,name);
  assert.equal(item.flags['heroes-of-legend'].workshopRecord.kind,'spell',name);
  assert.equal(isForgeRitual(component),action.startsWith('Ritual'),name);
  assert.equal(item.system.activity.rollMode,attribute==='None'?'none':'attribute',name);
 }
});
test('ordinary SP restoration never inherits a composite spell classification or cost',()=>{
 const id='ability-signature-restoration';
 const ownGraph={nodes:[],signatureDevelopment:{schemaVersion:2,signatures:[{id,name:'Ordinary benefit',classId:'class-test',level:7,rulesMarkdown:'**Action:** Passive · **Attribute:** None\n\nRestore 2 SP when its printed condition occurs.'}]}};
 const item=currentWorkshopItemSource({id,name:'Ordinary benefit',sp:4,magic:'Spell',effect:'Old composite'},{forge:ownGraph,commit:'fixture'});
 assert.equal(item.flags['heroes-of-legend'].workshopRecord.sp,null);
 assert.equal(item.flags['heroes-of-legend'].workshopRecord.kind,'ability');
 assert.equal(item.flags['heroes-of-legend'].spell,undefined);
});
test('ordinary non-signature zero-SP metadata does not become a signature spell',()=>{
 const item=currentWorkshopItemSource({id:'ordinary',name:'Ordinary action',kind:'ability',action:'Main Action',attribute:'Knowledge',sp:0,effect:'Ordinary printed procedure.'},{forge:{nodes:[],signatureDevelopment:{schemaVersion:2,signatures:[]}},commit:'fixture'});
 assert.equal(item.flags['heroes-of-legend'].workshopRecord.kind,'ability');
 assert.equal(item.flags['heroes-of-legend'].workshopRecord.sp,0);
 assert.equal(item.flags['heroes-of-legend'].spell,undefined);
});
test('paid magical weapon modifiers preserve SP without becoming spells or separate attacks',async()=>{
 const {signatureSpellCost,isForgeModifier,isForgeSpell,forgeCastOptions,forgeCastPayment}=await import('../src/rules/forge-casting.mjs');
 for(const [name,metadata]of [['Oathstrike','**Magic:** Magical weapon modifier · **SP:** 1'],['Rebuking Light','']]) {
  const id='ability-signature-modifier';
  const rules=`**Action:** Passive modifier to a melee weapon attack · **Attribute:** Use that attack’s attribute\n\n${metadata}\n\nDeclare this magical weapon modifier and pay 1 SP before the qualifying attack. It is not a separate spell casting and requires no free hand beyond the weapon’s requirements.`;
  const ownGraph={nodes:[],signatureDevelopment:{schemaVersion:2,signatures:[{id,name,classId:'class-test',level:7,rulesMarkdown:rules}]}};
  const own=forgeSignatureComponent(ownGraph,id);assert.equal(signatureSpellCost(own),1,name);
  assert(isForgeModifier(own));assert.equal(isForgeSpell(own),false);
  assert.deepEqual(forgeCastOptions({sp:5},{learned:['spellcraft:soul-capacity:7','spellcraft:mind-capacity:7']},own),[{id:'normal',label:'Pay printed SP',cost:1}]);
  assert.equal(forgeCastPayment({hp:10,sp:5},{maxHp:20,maxSp:10,gritGranted:1},{learned:[]},own).sp,4);
  const item=currentWorkshopItemSource({id,name,sp:99,magic:'Spell'},{forge:ownGraph,commit:'fixture'});
  assert.equal(item.flags['heroes-of-legend'].workshopRecord.sp,1);assert.equal(item.flags['heroes-of-legend'].workshopRecord.kind,'ability');
  assert.equal(item.flags['heroes-of-legend'].spell,undefined);assert.equal(item.system.activity.rollMode,'none');
 }
});
