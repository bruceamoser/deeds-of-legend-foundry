import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {applyForgePlaytest} from '../src/rules/forge-playtest-catalog.mjs';
import {workshopCatalogs} from '../src/rules/workshop-forge-catalog.mjs';
import {readPortableCharacter,writePortableCharacter} from '../src/rules/portable-character.mjs';
import {forgeSignatureLearning} from '../src/rules/forge-signatures.mjs';
const data=name=>JSON.parse(readFileSync(new URL(`../static/data/${name}.json`,import.meta.url)));
const {forge,references}=applyForgePlaytest(data('forge'),data('forge-references'));
const catalogs=workshopCatalogs(data('choices'),data('inventory'),data('wounds'),forge,references);
const root=new URL('../Build-Offs/revised/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('builds.json',root)));
assert.equal(manifest.rulesRevision,299);assert.equal(manifest.workingTree,false);assert.equal(manifest.sourceCommit,forge.sourceCommit);
const expected=['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
assert.equal(manifest.builds.length,39);
assert.deepEqual([...new Set(manifest.builds.map(x=>x.id))].sort(),expected);
assert.equal(readdirSync(new URL('builds/',root)).filter(x=>x.endsWith('.hol.json')).length,39);
const nodes=new Map(forge.nodes.map(x=>[x.id,x]));let masteryCases=0;
for(const b of manifest.builds){
 const file=new URL(`builds/${b.id}-level-${b.level}.hol.json`,root);
 const payload=JSON.parse(readFileSync(file));assert.equal(payload.schemaVersion,7);
 const {draft,preview:h}=readPortableCharacter(payload,catalogs);
 assert(h.valid,`${b.id}/${b.level}: ${JSON.stringify(h.errors)}`);
 assert.equal(h.development.level,b.level);assert.deepEqual(h.development,b.development);assert.deepEqual(h.limits,{maxHp:b.resources.maxHp,maxSp:b.resources.maxSp,gritGranted:b.resources.gritGranted});
 assert.equal(Object.values(draft.attributes).reduce((a,v)=>a+v,0),3);
 assert(Object.values(draft.attributes).every(v=>Number.isInteger(v)&&v>=-2&&v<=2));
 const cls=forge.classes.find(x=>x.id===draft.classId),ancestry=forge.ancestries.find(x=>x.id===draft.ancestryId);
 const granted=[...draft.classDisciplines,...['culture','background'].map(k=>forge.origins.find(x=>x.id===draft[k].id).pairs[draft[k].pair].disciplineId)];
 assert.equal(granted.length,3);assert.equal(new Set(granted).size,3);
 const learned=new Set(granted);let spent=0;
 for(const p of b.purchases){
  const n=nodes.get(p.id);assert(n);assert(!learned.has(n.id),`${b.id}: duplicate ${n.id}`);
  assert(n.level<=p.level,`${b.id}: early level gate ${n.id}`);
  assert(n.requires.every(id=>learned.has(id)),`${b.id}: skipped prerequisite ${n.id}`);
  const price=n.kind==='discipline'?cls.disciplineCosts[n.id]:n.dp;assert.equal(price,p.paidDp);spent+=price;learned.add(n.id);
  if(n.kind==='section' && n.section==='VII'){assert.equal(p.level,7);assert.equal(n.dp,5);assert.equal(n.spellIds.length,1);assert.equal(n.requires.length,1);assert.equal(n.requires[0],`${n.bookId}:5`);masteryCases++;}
 }
 const bonus=draft.traitIds.includes('trait-human-far-walker')?1:0;
 let total=8+draft.attributes.guile+draft.attributes.knowledge+draft.attributes.reason+bonus;
 for(let level=2;level<=b.level;level++)total+=4+level+bonus;
 assert.equal(b.development.total,total);assert.equal(spent,b.development.spent);assert.equal(total-spent,b.development.current);
 const capacity=[...learned].reduce((sum,id)=>sum+(nodes.get(id)?.spCapacity??0),0);
 const sp=ancestry.spContribution+2+2*Math.max(0,draft.attributes[cls.spAttribute])+2*(b.level-1)+capacity;
 assert.equal(sp,b.resources.maxSp,`${b.id}/${b.level} independent SP formula`);
 assert.deepEqual(h.state.learning.spells.map(x=>x.id),b.spellIds);
 assert.equal(new Set(b.spellIds).size,b.spellIds.length);
 assert.equal(h.inventory.overBudget,0);assert(h.inventory.remainingCoins>=0);assert.equal(h.inventory.coinOverride,false);
 assert(draft.shopping.filter(x=>draft.loadout?.[x.instanceId]?.held).reduce((sum,x)=>sum+x.hands,0)<=2);
 const chosen=Object.entries(h.state.signatureChoices);
 assert.equal(chosen.length,b.level===1?1:b.level===3?2:3);
 for(const [level,id] of chosen)assert(cls.signatures[level].includes(id));
 assert.equal(new Set(h.state.signatureComponents.map(x=>x.id)).size,h.state.signatureComponents.length);
 if(b.level===7){assert(learned.has(`${b.primaryPath}:7`));assert.equal(b.purchases.filter(p=>p.id.startsWith(b.primaryPath+':')).reduce((sum,p)=>sum+p.paidDp,0),21);}
 const roundtrip=readPortableCharacter(JSON.parse(writePortableCharacter(draft,catalogs,{ready:true})),catalogs);
 assert(roundtrip.preview.valid);assert.deepEqual(roundtrip.preview.development,h.development);
 const doc=readFileSync(new URL(`${b.id}.md`,root),'utf8');assert(doc.includes(`builds/${b.id}-level-${b.level}.hol.json`));assert.doesNotMatch(doc,/undefined|NaN|\[object Object\]/);
}
assert(masteryCases>=4,'Exercise complete seven-section spellbooks as well as martial tails');
for(const choice of forge.signatureDevelopment.signatures){
 const independent=forgeSignatureLearning(forge,{[choice.level]:choice.id});
 assert.deepEqual(independent.abilityIds,[choice.id],`${choice.id}: only this selected ability is granted`);
}
console.log('PASS: 39 current portable builds, manual DP/SP arithmetic, prerequisites/gates, actual inventory,21-DP paths,4 spellmasteries, and90 independent signature choices.');
