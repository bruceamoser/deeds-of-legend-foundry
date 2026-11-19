import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseForge } from './content/forge.mjs';
import { applyForgePlaytest } from '../src/rules/forge-playtest-catalog.mjs';
import { workshopCatalogs } from '../src/rules/workshop-forge-catalog.mjs';
import { workshopCharacter, actionTiming } from '../src/rules/workshop-character.mjs';
import { writePortableCharacter, readPortableCharacter } from '../src/rules/portable-character.mjs';
import { FORGE_ADVANCEMENT_BASE_DP, FORGE_STARTING_DP } from '../src/rules/forge-character.mjs';
import { forgeEligibility } from '../src/rules/forge.mjs';
const data = name => JSON.parse(readFileSync(new URL(`../static/data/${name}.json`, import.meta.url)));
const output = new URL('../Build-Offs/revised/', import.meta.url);
const working = process.argv.includes('--working-tree');
const bookRoot = process.env.HOL_BOOK_REPOSITORY;
let graph=data('forge'), refs=data('forge-references');
if(working){
 assert(bookRoot,'Working-tree validation requires HOL_BOOK_REPOSITORY');
 const commit=execFileSync('git',['-C',bookRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 graph=parseForge(p=>readFileSync(`${bookRoot}/${p}`,'utf8'),d=>readdirSync(`${bookRoot}/${d}`).filter(p=>p.endsWith('.md')).map(p=>`${d}/${p}`),commit);
 refs=structuredClone(refs);
 for(const id of Object.keys(refs.records).filter(id=>id.startsWith('trait-'))){
  const path=`design/ancestries/${id}.md`,markdown=readFileSync(`${bookRoot}/${path}`,'utf8');
  refs.records[id]={markdown,source:{path,sha256:createHash('sha256').update(markdown).digest('hex')}};
 }
}
assert.equal(graph.rulesRevision,299,'Import the reviewed rewrite before generating current Build-Offs');
const {forge,references}=applyForgePlaytest(graph,refs);
const catalogs=workshopCatalogs(data('choices'),data('inventory'),data('wounds'),forge,references);
const nodeById=new Map(forge.nodes.map(n=>[n.id,n]));
const baseline=JSON.parse(readFileSync(new URL('../Build-Offs/hol-builds.json',import.meta.url))).builds;
const dnd=JSON.parse(readFileSync(new URL('../Build-Offs/dnd-builds.json',import.meta.url))).builds;
const sequence=(path,from,to)=>Array.from({length:to-from+1},(_,i)=>`${path}:${from+i}`);
const plans={
 barbarian:{one:['arms:bladework:1','arms:bladework:2','arms:impact:1','athletics:leaping:1','athletics:balance:1'],three:['arms:bladework:6'],seven:['arms:bladework:7','athletics:leaping:7','arms:impact:4'],primary:'arms:bladework',resolved:'Rage now explicitly supplies physical resistance. The same paid weapon path grows into a substantial level-7 sweep.',remaining:'This is a dangerous berserker rather than a copy of daily Rage uses. Rage and light armor use the highest resistance, not additive protection.'},
 bard:{one:['emotion:0','emotion:1','perception:0','thought:0','influence:negotiation:1','influence:negotiation:2','influence:leadership:1','guard:shelter:1'],three:['influence:negotiation:6','emotion:3'],seven:['influence:negotiation:7','dreams:6','emotion:3','perception:3','thought:2','guard:shelter:4'],primary:'influence:negotiation',resolved:'Musical Aid and commanded attacks coexist with emotion/perception utility. Negotiation develops one technique instead of accumulating three unrelated social buttons.',remaining:'Bardic Inspiration remains an immediate coordinated contribution rather than a banked die. Social objectives still depend on the DA and the situation.'},
 cleric:{one:['restoration:0','protection:0','sanctuary:0','medicine:first-aid:1','armor','armor:harness:1'],three:['restoration:3','medicine:first-aid:4','protection:1'],seven:['medicine:first-aid:7','restoration:6','restoration:3','protection:3','sanctuary:3','spellcraft','spellcraft:soul-capacity:3'],primary:'medicine:first-aid',resolved:'Repeatable Mend, explicit shared first-aid recovery, defensive prayers and developed treatment make a complete support identity.',remaining:'There is no separate Channel Divinity pool or Turn Undead feature in these selections. Burning SP on healing competes directly with other paid spells.'},
 druid:{signature:'signature-shepherd-borrowed-shape',one:['growth:0','growth:1','transformation:0','water:0','earth:0','wilderness:animal-handling:1','wilderness:tracking:1'],three:['growth:3','transformation:2','wilderness:animal-handling:3'],seven:['wilderness:animal-handling:7','growth:6','growth:3','transformation:3','water:3','spellcraft','spellcraft:soul-capacity:2'],primary:'wilderness:animal-handling',resolved:'Borrowed Shape supplies an actual early beast form. Its later adaptations and Great Shape cover aquatic, climbing and flying fantasies without resetting HP.',remaining:'Only one transformation per scene and retained personal HP give different attrition from 5e Wild Shape. Shape prevents casting; decide when to be a beast and when to use the books.'},
 fighter:{one:['arms:bladework:1','arms:bladework:2','armor:harness:1','guard:interception:1','guard:shelter:1','arms:dueling:1'],three:['arms:bladework:6','armor:harness:3'],seven:['arms:bladework:7','guard:interception:7','armor:harness:4','guard:shelter:3'],primary:'arms:bladework',resolved:'Measured Guard develops its counter and then an additional constrained Reaction. Main attack, Maneuver preparation, defense and armor investment remain distinct.',remaining:'No Second Wind pool or exact Action Surge is selected. Heavy-armor training is reached at level 3 or later, but this continuing character keeps its purchased light suit until it buys another.'},
 monk:{one:['arms:unarmed:1','arms:unarmed:2','arms:unarmed:3','athletics:balance:1','athletics:leaping:1'],three:['arms:unarmed:6','athletics:balance:3'],seven:['arms:unarmed:7','athletics:balance:7','athletics:leaping:4','subterfuge:stealth:1'],primary:'arms:unarmed',resolved:'A complete shared unarmed branch now supplies real unarmed attacks and their own development. The staff is used only for the selected weapon-required guard, not to pretend weapon attacks are punches.',remaining:'The character is not a Focus-point monk. Measured Guard still needs the readied staff; with empty hands, use the learned Athletics response or basic defense instead.'},
 paladin:{signature:'signature-protector-oathstrike',one:['armor:harness:1','arms:bladework:1','arms:bladework:2','restoration:0','arms:dueling:1','arms:impact:1'],three:['arms:bladework:6','armor:harness:3'],seven:['arms:bladework:7','armor:harness:6','restoration:3','wards','protection:1'],primary:'arms:bladework',resolved:'Oathstrike supplies a declared, SP-paid radiant rider on the real learned weapon attack. Its later control and threshold create an avenging guardian rather than a generic weapon buff.',remaining:'The rider needs an enemy that harmed an ally this scene. Healing here comes from the restoration book; choosing the healing signature instead would trade away early Oathstrike.'},
 ranger:{one:['marksmanship:precision:1','marksmanship:precision:2','marksmanship:readiness:1','wilderness:tracking:1','wilderness:provisioning:1','water:0','earth:0'],three:['marksmanship:precision:6','wilderness:tracking:3'],seven:['marksmanship:precision:7','wilderness:tracking:7','water:3','earth:1','marksmanship:readiness:2'],primary:'marksmanship:precision',resolved:'Tracking and a disciplined bow line both gain substantive high-level destinations. Level-7 Mark the Quarry retains a tangible, removable mark instead of an impossible hit gate.',remaining:'This hunter line chooses archery over the animal-companion line. It does not get both identities for one signature selection.'},
 rogue:{one:['subterfuge:stealth:1','subterfuge:stealth:2','subterfuge:stealth:3','subterfuge:locks:1','subterfuge:traps:1','subterfuge:sleight:1','athletics:leaping:1'],three:['subterfuge:stealth:6','subterfuge:locks:3'],seven:['subterfuge:stealth:7','subterfuge:locks:7','athletics:leaping:4','subterfuge:sleight:3'],primary:'subterfuge:stealth',resolved:'Opportunistic attack gains an additive slowing effect and a later interruption; infiltration develops separately rather than inflating the damage action list.',remaining:'Blade in the Back is its own attack rather than bonus Sneak Attack dice. The build still pays for mundane intrusion and mobility instead of receiving all skills automatically.'},
 sorcerer:{one:['flame:0','flame:1','air:0','emotion:0','spellcraft:soul-capacity:1','spellcraft:soul-capacity:2','spellcraft:recovery:1','water:0'],three:['flame:3','spellcraft:soul-capacity:4','air:1'],seven:['spellcraft:soul-capacity:7','flame:6','flame:3','air:3','emotion:3','spellcraft:recovery:4'],primary:'spellcraft:soul-capacity',resolved:'Bent Trajectory remains a shaping identity, with real later spell duplication bounded to instantaneous targets. Reserves and recovery can now grow through the full training tail.',remaining:'The charismatic ability array still gives less SP than a Knowledge-focused arcanist. Shaping is one line, not a free menu of all metamagic; learned Meteor Swarm still requires its SP and actual casting circumstances.'},
 warlock:{signature:'signature-odd-the-bargain',one:['spirits:0','binding:0','perception:0','calling:0','spellcraft:soul-capacity:1','spellcraft:soul-capacity:2','spellcraft:recovery:1'],three:['spellcraft:soul-capacity:5','binding:2'],seven:['spellcraft:soul-capacity:7','binding:3','spirits:3','calling:3','spellcraft:recovery:4','perception:2'],primary:'spellcraft:soul-capacity',resolved:'The Bargain adds an explicit patron/compact and reliable Pact Bolt; its line adds a declared slowing mode and a personal death reprieve.',remaining:'No renewable short-rest Pact Magic pool: recovery remains once between overnight rests. The patron has fictional presence without authority to take away the player’s choices.'},
 wizard:{one:['telekinesis:0','telekinesis:1','shaping:0','animation:0','imbuement:0','detection:0','scholarship:investigation:1','spellcraft','spellcraft:soul-capacity:1','spellcraft:recovery:1'],three:['telekinesis:3','spellcraft:soul-capacity:4','shaping:1'],seven:['spellcraft:soul-capacity:7','telekinesis:3','shaping:3','detection:3','spellcraft:recovery:4','animation:2'],primary:'spellcraft:soul-capacity',resolved:'Study the Pattern now gives usable, bounded information; its later cancellation insight and ward accompany growing books and reserve capacity.',remaining:'Fixed book sections differ from learning or copying arbitrary individual 5e spells. Cancellation insight still needs an actual cancellation ability; this selection is not a universal Counterspell license.'},
 artificer:{signature:'signature-intellect-make-it-last',one:['force','telekinesis:0','shaping:0','imbuement:0','craft:repairs:1','craft:mixtures:1','detection:0','craft:safeguards:1'],three:['craft:repairs:6','imbuement:2'],seven:['craft:repairs:7','imbuement:3','shaping:3','telekinesis:3','craft:workshop:4','detection:2'],primary:'craft:repairs',resolved:'Make It Last now creates a persistent bound item, then two and three with reviewed properties. This directly addresses the previous inability to represent enduring magical inventions.',remaining:'The small curated properties are not the full 5e replication catalog. Each binding needs its actual ordinary item and tools; these drafts supply tools, while a chosen lamp/shield would need a separate purchased item.'},
};
const deepSignature=(draft,level)=>{
 const first=forge.signatureDevelopment.signatures.find(x=>x.id===draft.signatureId);
 return (forge.signatureDevelopment.signatures.find(x=>first.lineId&&x.lineId===first.lineId&&x.level===level) ?? forge.signatureDevelopment.signatures.find(x=>x.classId===first.classId&&x.level===level)).id;
};
const sourcePrefix=working?'Working-tree authoring verification; regenerate after the reviewed source is pinned.':'Pinned authored source';
const all=[];
mkdirSync(new URL('builds/',output),{recursive:true});
for(const b of baseline){
 const plan=plans[b.id];assert(plan,b.id);
 const draft=structuredClone(JSON.parse(readFileSync(new URL(`../Build-Offs/builds/${b.id}.hol.json`,import.meta.url))).draft);
 draft.purchases={0:[],1:[]};draft.acquisitions={};delete draft.progression;delete draft.play;
 if(plan.signature)draft.signatureId=`ability-${plan.signature}`;
 for(const kind of ['culture','background']){
  const origin=forge.origins.find(x=>x.id===draft[kind].id);
  draft[kind].pair=origin.pairs.findIndex(x=>x.disciplineId===b[kind].discipline);assert(draft[kind].pair>=0,`${b.id}/${kind}`);
 }
 if(b.id==='cleric'){
  const removed=draft.shopping.find(x=>x.id==='item-ordinary-melee-weapon');
  draft.shopping=draft.shopping.filter(x=>x!==removed);if(removed)delete draft.loadout[removed.instanceId];
  draft.shopping.push({id:'item-first-aid-supplies',quantity:1,hands:0,instanceId:'shop-cleric-first-aid'});
  draft.loadout['shop-cleric-first-aid']={carried:true,worn:false,held:false};
 }
 const deferred=[];
 function buy(goal,level){
  const n=nodeById.get(goal);assert(n,`Unknown build goal ${b.id}: ${goal}`);
  let preview=workshopCharacter(draft,catalogs);
  if(preview.state.learned.includes(goal))return true;
  for(const req of n.requires)if(!buy(req,level))return false;
  preview=workshopCharacter(draft,catalogs);
  const eligible=forgeEligibility(forge,preview.state,goal);
  if(!eligible.eligible){deferred.push({level,id:goal,reason:eligible.reasons.join(' ')});return false;}
  (level===1?draft.purchases[1]:draft.progression.levels[level].purchases).push({id:goal});
  if(['craft:workshop:1','craft:workshop:2'].includes(goal)){
   const recipes=goal.endsWith(':1')?['recipe-bound-torches','recipe-twisted-cord']:['recipe-travel-food','recipe-wooden-brace'];
   (level===1?draft.acquisitions:draft.progression.levels[level].acquisitions)[goal]={recipes};
  }
  return true;
 }
 const snapshots=[];
 for(let level=1;level<=7;level++){
  if(level>1){draft.progression??={level,levels:{}};draft.progression.level=level;draft.progression.levels[level]={purchases:[],signatures:{},acquisitions:{}};if([3,7].includes(level))draft.progression.levels[level].signatures[level]=deepSignature(draft,level);}
  const goals=level===1?plan.one:level===3?plan.three:level===7?plan.seven:[];
  for(const goal of goals){
   buy(goal,level);
  }
  const h=workshopCharacter(draft,catalogs);assert(h.valid,`${b.id}/${level}: ${JSON.stringify(h.errors)}`);assert(h.inventory.remainingCoins>=0,`${b.id} coins`);
  if(![1,3,7].includes(level))continue;
  const serialized=writePortableCharacter(draft,catalogs,{ready:true});
  const roundtrip=readPortableCharacter(JSON.parse(serialized),catalogs);assert(roundtrip.preview.valid,`${b.id}/${level} roundtrip`);assert.deepEqual(roundtrip.preview.development,h.development);
  const purchased=[...h.ledger,...h.advancementLedger].filter(x=>x.kind==='purchase').map(x=>{const n=nodeById.get(x.id??x.sourceId);return{id:n.id,name:n.name,paidDp:-x.delta,level:x.level??1,requiredLevel:n.level};});
  assert.equal(purchased.reduce((s,x)=>s+x.paidDp,0),h.development.spent);
  const known=[...h.state.learning.abilities.map(a=>catalogs.choices.find(c=>c.id===a.id)??a),...h.state.signatureComponents];
  const actionCounts=Object.fromEntries(['Main Action','Maneuver','Reaction','Passive','Other'].map(k=>[k,known.filter(x=>actionTiming(x).includes(k)).length]));
  const spells=h.state.learning.spells;
  const reserve=h.limits.maxSp,recovery=h.state.learning.recoverySp;
  const snapshot={id:b.id,name:b.name,level,sourceCommit:forge.sourceCommit,workingTree:working,draft:structuredClone(draft),attributes:draft.attributes,resources:{...h.limits,speed:h.summary.speed,remainingCoins:h.inventory.remainingCoins,gritGranted:h.state.gritGranted},development:h.development,purchases:purchased,signatureChoices:h.state.signatureChoices,signatureComponents:h.state.signatureComponents,abilities:h.state.learning.abilities,spellIds:spells.map(s=>s.id),spells:spells.map(({id,name,action,sp,duration,effect})=>({id,name,action,sp,duration,effect})),actionCounts,spellCounts:{total:spells.length,free:spells.filter(s=>s.sp===0).length,paid:spells.filter(s=>s.sp>0).length},castingBudget:{maxSp:reserve,oncePerRestRecovery:recovery,castsAtCost:Object.fromEntries([1,2,3,5].map(c=>[c,Math.floor(reserve/c)])),castsAfterRecovery:Object.fromEntries([1,2,3,5].map(c=>[c,Math.floor((reserve+recovery)/c)])),note:'Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately.'},primaryPath:plan.primary,primaryLearned:h.state.learned.filter(id=>id.startsWith(plan.primary+':')),resolved:plan.resolved,remaining:plan.remaining,deferred:deferred.filter(x=>x.level<=level)};
  snapshots.push(snapshot);all.push(snapshot);
  writeFileSync(new URL(`builds/${b.id}-level-${level}.hol.json`,output),serialized+'\n');
 }
 const final=snapshots.at(-1);assert(final.primaryLearned.includes(`${plan.primary}:7`),`${b.id}: primary seven-step path incomplete`);
 assert.equal(final.purchases.filter(p=>p.id.startsWith(plan.primary+':')).reduce((sum,p)=>sum+p.paidDp,0),21);
 const dd=dnd.find(x=>x.id===b.id);
 let doc=`# ${b.name}: ${b.id} after the rewrite\n\n${sourcePrefix} \`${forge.sourceCommit}\`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../${b.id}.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.\n\n## What the rewrite changes\n\n${plan.resolved}\n\n${plan.remaining}\n\n## At a glance\n\n| Measure | HoL 1 | HoL 3 | HoL 7 |\n|---|---|---|---|\n`;
 for(const [label,get] of [['HP',x=>x.resources.maxHp],['SP',x=>x.resources.maxSp],['DP spent / total',x=>`${x.development.spent} / ${x.development.total}`],['Unspent DP',x=>x.development.current],['Learned action choices (Main / Maneuver / Reaction)',x=>`${x.actionCounts['Main Action']} / ${x.actionCounts.Maneuver} / ${x.actionCounts.Reaction}`],['Known book spells (free / paid)',x=>`${x.spellCounts.total} (${x.spellCounts.free} / ${x.spellCounts.paid})`],['Shared reserve: casts at 2 SP',x=>x.castingBudget.castsAtCost[2]],['Shared reserve: casts at 5 SP',x=>x.castingBudget.castsAtCost[5]],['Extra SP from one recovery rest',x=>x.castingBudget.oncePerRestRecovery]])doc+=`| ${label} | ${snapshots.map(get).join(' | ')} |\n`;
 doc+=`\n## Character choices\n\nAncestry: **${b.ancestry.name}**; class: **${b.class.name}**. Attributes: ${Object.entries(draft.attributes).map(([k,v])=>`${k} ${v>=0?'+':''}${v}`).join(', ')}. Traits: ${draft.traitIds.map(id=>catalogs.choices.find(x=>x.id===id)?.name??id).join('; ')}.\n\nStarting disciplines: ${b.culture.discipline} from culture, ${b.background.discipline} from background, and ${draft.classDisciplines[0]} from class. Each is a distinct free field of study; later discipline entry is paid at its class price.\n\nEquipment: ${draft.shopping.map(x=>{const item=catalogs.inventory.equipment.find(i=>i.id===x.id);return `${item.name}${draft.loadout?.[x.instanceId]?.held?' (held)':''}${draft.loadout?.[x.instanceId]?.worn?' (worn)':''}`}).join('; ')}. ${snapshots[0].resources.remainingCoins} starting coins remain. ${b.id==='cleric'?'The cleric trades the old backup mace for actual first-aid supplies; Sacred Flame supplies the ranged attack.':''}${b.id==='artificer'?'The artificer can bind the actual craft tools as the returning tool, paying the ritual’s 1 SP when performed. Other item properties require their actual item.':''}\n`;
 doc+=`\nThe D&D baseline has **${dd.hp} HP** and **AC ${typeof dd.ac==='object'?JSON.stringify(dd.ac):dd.ac}** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.\n\nStarting DP is **${FORGE_STARTING_DP} + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. From level 2 onward, each level grants **${FORGE_ADVANCEMENT_BASE_DP} + new level** DP, plus any applicable ancestry benefits. The completed \`${plan.primary}\` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.\n`;
 for(const x of snapshots){
  doc+=`\n## Level ${x.level}\n\n[Import this ready character](builds/${b.id}-level-${x.level}.hol.json). ${x.development.current} DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.\n\n| Learned purchase | DP paid | Character level |\n|---|---:|---:|\n`;
  for(const p of x.purchases)doc+=`| ${p.name} (\`${p.id}\`) | ${p.paidDp} | ${p.level} |\n`;
  doc+='\n**Signature choices:** '+Object.entries(x.signatureChoices).map(([l,id])=>`level ${l}: ${forge.signatures.find(s=>s.id===id).name}`).join('; ')+'.\n';
  for(const c of x.signatureComponents)doc+=`\n<details><summary>${c.name}: complete signature component</summary>\n\n${c.effect}\n\n</details>\n`;
  doc+='\n**Useful actions and improvements:**\n\n';
  for(const a of x.abilities){const improvements=workshopCharacter(x.draft,catalogs).state.learning.improvements.get(a.id)??[];doc+=`- **${a.name}:** ${a.effect.replaceAll('\n',' ')}${improvements.length?' '+improvements.map(v=>v.effect.replaceAll('\n',' ')).join(' '):''}\n`;}
  doc+='\n**Known book spells:** '+(x.spells.length?x.spells.map(s=>`${s.name} (${s.action}; SP ${s.sp})`).join('; '):'None')+'.\n';
  doc+=`\n**Spell output:** ${x.castingBudget.note} At costs 1/2/3/5 SP, the full reserve funds ${Object.values(x.castingBudget.castsAtCost).join('/')} casts respectively; with the learned once-per-rest recovery it funds ${Object.values(x.castingBudget.castsAfterRecovery).join('/')}. Zero-SP spells remain limited by actions and circumstances.\n`;
 }
 doc+='\n## Deferred choices\n\n'+(deferred.length?deferred.map(d=>`- Level ${d.level}: ${nodeById.get(d.id)?.name??d.id} — ${d.reason}`).join('\n'):'Every planned choice was affordable when scheduled.')+'\n';
 doc+='\n## Playtest questions\n\n- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?\n- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?\n- Which spell, positional restriction or equipment requirement was forgotten during play?\n- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?\n';
 writeFileSync(new URL(`${b.id}.md`,output),doc);
 console.log(`${b.id}: levels 1/3/7 valid; DP ${snapshots.map(x=>x.development.spent+'/'+x.development.total).join(', ')}; spells ${snapshots.map(x=>x.spells.length).join('/')}`);
}
assert.equal(all.length,39);
writeFileSync(new URL('builds.json',output),JSON.stringify({rulesRevision:299,spellbookProgressionRevision:310,sourceCommit:forge.sourceCommit,workingTree:working,builds:all},null,2)+'\n');
writeFileSync(new URL('README.md',output),`# Revised trope Build-Offs\n\n${sourcePrefix} \`${forge.sourceCommit}\`. Thirteen continuing characters are validated at HoL levels 1, 3 and 7: **39 ready portable characters**. The earlier [Build-Offs](../README.md) remain unchanged historical comparison material.\n\n`+baseline.map(b=>`- [${b.id}: ${b.name}](${b.id}.md)`).join('\n')+`\n\nRun \`node scripts/generate-revised-build-offs.mjs\` under Node 24 after the pinned Forge import. \`--working-tree\` with \`HOL_BOOK_REPOSITORY\` is authoring-only validation and must be regenerated after pinning. Every run verifies legal purchases, three starting disciplines through the shared engine, resource and inventory budgets, ready export/import, exact purchase ledger totals and a complete 21-DP primary path at level 7. Spellbooks use the same seven-step cost and gate sequence, with one spell at each of the final three steps. These checks establish internal legality, not empirical balance or fun.\n`);
