import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { applyForgePlaytest } from '../src/rules/forge-playtest-catalog.mjs';
import { workshopCatalogs } from '../src/rules/workshop-forge-catalog.mjs';
import { readPortableCharacter, writePortableCharacter } from '../src/rules/portable-character.mjs';
const data = name => JSON.parse(readFileSync(new URL(`../static/data/${name}.json`, import.meta.url)));
const { forge, references } = applyForgePlaytest(data('forge'), data('forge-references'));
const catalogs = workshopCatalogs(data('choices'), data('inventory'), data('wounds'), forge, references);
const base = new URL('../Build-Offs/', import.meta.url);
const summary = JSON.parse(readFileSync(new URL('hol-builds.json', base)));
const expected = ['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
assert.deepEqual(summary.builds.map(b => b.id).sort(), expected);
assert.deepEqual(readdirSync(new URL('builds/', base)).filter(f=>f.endsWith('.hol.json')).sort(), expected.map(id=>`${id}.hol.json`));
for (const build of summary.builds) {
  const payload = JSON.parse(readFileSync(new URL(`builds/${build.id}.hol.json`, base)));
  const { draft, preview } = readPortableCharacter(payload, catalogs);
  assert.equal(preview.valid, true, `${build.id}: ${JSON.stringify(preview.errors)}`);
  assert.equal(preview.development.level, 1);
  assert.equal(Object.values(draft.attributes).reduce((a,b)=>a+b,0),3);
  assert.ok(Object.values(draft.attributes).every(n=>Number.isInteger(n)&&n>=-2&&n<=2));
  const starting = [forge.origins.find(o=>o.id===draft.culture.id).pairs[draft.culture.pair].disciplineId,
    forge.origins.find(o=>o.id===draft.background.id).pairs[draft.background.pair].disciplineId,
    ...draft.classDisciplines];
  assert.equal(new Set(starting).size, 3);
  assert.equal(starting.length, 3);
  assert.equal(preview.inventory.overBudget,0);
  assert.ok(preview.inventory.remainingCoins>=0);
  assert.equal(preview.inventory.coinOverride,false);
  assert.deepEqual(preview.development,build.development);
  assert.deepEqual(preview.limits,build.limits);
  assert.deepEqual(preview.state.learning.spells.map(s=>s.id),build.spells.map(s=>s.id));
  assert.equal(build.purchases.reduce((sum,p)=>sum+p.paidDp,0),build.development.spent);
  assert.ok(build.purchases.every(p=>p.level<3));
  assert.ok(build.equipment.filter(e=>e.held).reduce((sum,e)=>sum+e.hands,0)<=2);
  assert.ok(build.equipment.some(e=>e.id==='item-water-flask'));
  assert.ok(build.equipment.some(e=>e.id==='item-food-bundle'));
  if(build.equipment.some(e=>e.id==='item-ordinary-ranged-weapon'))
    assert.ok(build.equipment.some(e=>e.id==='item-ammunition-bundle'));
  if(build.equipment.some(e=>e.worn&&e.id==='item-ordinary-light-armor'))
    assert.ok(preview.state.learned.includes('armor:harness:1'));
  const roundtrip=readPortableCharacter(JSON.parse(writePortableCharacter(draft,catalogs,{ready:true})),catalogs);
  assert.equal(roundtrip.preview.valid,true);
  assert.deepEqual(roundtrip.preview.development,preview.development);
  console.log(`${build.id}: valid HoL1; ${build.development.spent}/${build.development.total} DP, ${build.limits.maxHp} HP, ${build.limits.maxSp} SP, ${preview.inventory.remainingCoins} coins left`);
}
console.log('PASS: all 13 current-rule builds, budgets, equipment, summaries, and ready export/import.');

const dnd = JSON.parse(readFileSync(new URL('dnd-builds.json',base)));
assert.equal(dnd.level,2);
assert.deepEqual(dnd.builds.map(b=>b.id).sort(),expected);
const hd={barbarian:12,fighter:10,paladin:10,ranger:10,wizard:6,sorcerer:6};
const mental={bard:'cha',cleric:'wis',druid:'wis',paladin:'cha',ranger:'wis',sorcerer:'cha',warlock:'cha',wizard:'int',artificer:'int'};
const spellCounts={bard:[2,5],cleric:[3,5],druid:[3,5],paladin:[0,3],ranger:[0,3],sorcerer:[4,4],warlock:[2,3],wizard:[3,5],artificer:[2,3]};
const bgAllowed={Soldier:['str','dex','con'],Acolyte:['int','wis','cha'],Sage:['con','int','wis'],Criminal:['dex','con','int']};
for(const d of dnd.builds){
  assert.equal(d.level,2);
  assert.equal(d.name,summary.builds.find(h=>h.id===d.id).name);
  assert.deepEqual(Object.values(d.abilityScores.before).sort((a,b)=>a-b),[8,10,12,13,14,15]);
  assert.equal(Object.values(d.abilityScores.boosts).reduce((a,b)=>a+b,0),3);
  for(const [attr,boost] of Object.entries(d.abilityScores.boosts)){
    assert.ok(bgAllowed[d.background].includes(attr));
    assert.ok(boost>=1&&boost<=2);
  }
  for(const [attr,value] of Object.entries(d.abilityScores.before))
    assert.equal(d.abilityScores.final[attr],value+(d.abilityScores.boosts[attr]??0));
  const die=hd[d.id]??8, con=Math.floor((d.abilityScores.final.con-10)/2);
  assert.equal(d.hp,die+(die/2+1)+2*con+(d.species==='Dwarf'?2:0),d.id+' HP');
  assert.equal(d.proficiencyBonus,2);
  assert.ok(d.equipment.goldRemaining>=0);
  assert.equal(Math.round((d.equipment.initialGold-d.equipment.additions.reduce((sum,e)=>sum+e.gp,0))*100),Math.round(d.equipment.goldRemaining*100),d.id+' coins');
  if(mental[d.id]){
    assert.equal(d.spells.saveDc,10+Math.floor((d.abilityScores.final[mental[d.id]]-10)/2),d.id+' spell DC');
    assert.equal(d.spells.cantrips.length,spellCounts[d.id][0]);
    assert.equal(d.spells.prepared.length,spellCounts[d.id][1]);
  }
  if(['bard','cleric','druid','sorcerer','wizard'].includes(d.id))assert.equal(d.spells.slots['1'],3);
  if(['paladin','ranger','artificer'].includes(d.id))assert.equal(d.spells.slots['1'],2);
  if(d.id==='warlock')assert.equal(d.spells.slots['Pact level 1'],2);
  const doc=readFileSync(new URL(`${d.id}.md`,base),'utf8');
  assert.ok(doc.includes(d.name)&&doc.includes('D&D level 2'));
  assert.ok(doc.includes(`builds/${d.id}.hol.json`));
  assert.doesNotMatch(doc,/undefined|\[object Object\]/);
}
const traits=readFileSync(new URL('ancestry-trait-review.md',base),'utf8');
const signatures=readFileSync(new URL('class-signature-review.md',base),'utf8');
for(const id of catalogs.choices.filter(x=>x.kind==='ancestry').flatMap(x=>x.traits))assert.ok(traits.includes(id),id);
for(const signature of forge.signatures)assert.ok(signatures.includes(signature.id),signature.id);
console.log('PASS: thirteen D&D standard arrays, boosts, HP, spell counts/DCs, coin budgets, paired documents, and full trait/signature audit coverage.');
