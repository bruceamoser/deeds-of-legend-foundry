/** Historical D&D comparison integrity plus the current revised HoL build suite. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
await import('./validate-revised-build-offs.mjs');
const base = new URL('../Build-Offs/', import.meta.url);
const summary = JSON.parse(readFileSync(new URL('hol-builds.json', base)));
const expected = ['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
assert.deepEqual(summary.builds.map(b=>b.id).sort(),expected);
for(const build of summary.builds) {
 const saved=JSON.parse(readFileSync(new URL(`builds/${build.id}.hol.json`,base)));
 assert.equal(saved.draft.name,build.name);
 assert.equal(build.purchases.reduce((sum,p)=>sum+p.paidDp,0),build.development.spent);
 assert.equal(build.development.spent+build.development.current,build.development.total);
}
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
console.log('PASS: historical D&D comparison arithmetic/document integrity; current HoL legality is tested in the revised suite above.');
