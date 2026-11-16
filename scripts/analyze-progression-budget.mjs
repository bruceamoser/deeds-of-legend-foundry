/** Analysis only: proposed seven-step nonmagical branch prices, never live rules. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const forge = JSON.parse(readFileSync(new URL('../docs/rewrite-299-budget-input.json', import.meta.url)));
const builds = JSON.parse(readFileSync(new URL('../Build-Offs/hol-builds.json', import.meta.url))).builds;
const attributes = ['brawn', 'agility', 'fortitude', 'guile', 'knowledge', 'reason'];
const mental = stats => stats.guile + stats.knowledge + stats.reason;
const award = level => level < 2 ? 0 : 4 + level;
const laterDp = level => Array.from({ length: level - 1 }, (_, i) => award(i + 2)).reduce((a,b)=>a+b,0);
const totalDp = (starting, level) => starting + laterDp(level);
const gates = [1, 1, 1, 3, 3, 3, 7];
const base = [1, 2, 2, 3];
const proposals = [
  { id:'A', advanced:[2,2,3] },
  { id:'B', advanced:[2,3,4] },
  { id:'C', advanced:[3,3,5] },
  { id:'D', advanced:[4,4,5] },
].map(p=>({...p,costs:[...base,...p.advanced]}));
const assignments=[];
function enumerate(values=[]){
  if(values.length===6){if(values.reduce((a,b)=>a+b,0)===3)assignments.push(Object.fromEntries(attributes.map((key,i)=>[key,values[i]])));return;}
  for(let value=-2;value<=2;value++)enumerate([...values,value]);
}
enumerate();
const distribution = [...new Set(assignments.map(mental))].sort((a,b)=>a-b).map(sum=>({mentalSum:sum,startingDp:8+sum,assignments:assignments.filter(a=>mental(a)===sum).length,level3:totalDp(8+sum,3),level7:totalDp(8+sum,7)}));
const classRanges=forge.classes.map(cls=>{
  const allowed=assignments.filter(a=>cls.minimumAttributes.every(key=>a[key]>=0));
  const sums=allowed.map(mental);
  const costs=Object.values(cls.disciplineCosts);
  return {id:cls.id,name:cls.name,minimumAttributes:cls.minimumAttributes,assignments:allowed.length,mentalMin:Math.min(...sums),mentalMax:Math.max(...sums),startingMin:8+Math.min(...sums),startingMax:8+Math.max(...sums),entryCosts:Object.fromEntries([1,2,3].map(cost=>[cost,costs.filter(n=>n===cost).length]))};
});
const nodes=new Map(forge.nodes.map(n=>[n.id,n]));
const nonmagical=forge.disciplines.filter(d=>d.paths.every(p=>nodes.get(p.steps[0]).kind==='technique'));
/** Cheapest ways to complete exactly N branches, with every existing build choice kept.
 * Entry cost is charged once per additional discipline; four branches per discipline.
 * This is a budget ceiling, not a proposed character or an assessment of its usefulness.
 */
function completionCeiling(build,proposal,level){
  const count=gates.filter(g=>g<=level).length;
  const full=proposal.costs.slice(0,count).reduce((a,b)=>a+b,0);
  const learned=new Set(build.purchases.map(p=>p.id));
  const studied=new Set([build.culture.discipline,build.background.discipline,build.classDiscipline,...build.purchases.filter(p=>p.kind==='discipline').map(p=>p.id)]);
  const cls=forge.classes.find(c=>c.id===build.class.id);
  let best=[0];
  for(const discipline of nonmagical){
    const remaining=discipline.paths.map(path=>full-path.steps.reduce((sum,id)=>sum+(learned.has(id)?nodes.get(id).dp:0),0)).sort((a,b)=>a-b);
    const options=[0];let spend=studied.has(discipline.id)?0:cls.disciplineCosts[discipline.id];
    for(const cost of remaining){spend+=cost;options.push(spend);}
    const next=Array(best.length+4).fill(Infinity);
    for(let completed=0;completed<best.length;completed++)for(let add=0;add<=4;add++)next[completed+add]=Math.min(next[completed+add],best[completed]+options[add]);
    best=next;
  }
  const available=totalDp(build.development.total,level)-build.development.spent;
  const completed=best.reduce((result,cost,index)=>cost<=available?index:result,0);
  return {completed,additionalSpent:best[completed],available,remaining:available-best[completed]};
}
const buildBudgets=builds.map(b=>({id:b.id,name:b.name,class:b.class.name,mentalSum:mental(b.attributes),starting:b.development.total,level3:totalDp(b.development.total,3),level7:totalDp(b.development.total,7),creationSpent:b.development.spent,creationSaved:b.development.current,additionalAvailableAt3:totalDp(b.development.total,3)-b.development.spent,additionalAvailableAt7:totalDp(b.development.total,7)-b.development.spent,completionCeilings:Object.fromEntries(proposals.map(p=>[p.id,{level3:completionCeiling(b,p,3),level7:completionCeiling(b,p,7)}]))}));
const costComparison=proposals.map(p=>({id:p.id,costs:p.costs,cumulative:p.costs.map((_,i)=>p.costs.slice(0,i+1).reduce((a,b)=>a+b,0)),level1:5,level3:p.costs.slice(0,6).reduce((a,b)=>a+b,0),level7:p.costs.reduce((a,b)=>a+b,0),freshCompleteBranchCounts:{level3:[Math.floor(18/p.costs.slice(0,6).reduce((a,b)=>a+b,0)),Math.floor(27/p.costs.slice(0,6).reduce((a,b)=>a+b,0))],level7:[Math.floor(56/p.costs.reduce((a,b)=>a+b,0)),Math.floor(65/p.costs.reduce((a,b)=>a+b,0))]}}));
assert.deepEqual(distribution.map(d=>d.mentalSum),[-3,-2,-1,0,1,2,3,4,5,6]);
assert.equal(assignments.length,distribution.reduce((sum,d)=>sum+d.assignments,0));
assert.equal(laterDp(3),13);assert.equal(laterDp(7),51);
assert.deepEqual(costComparison.map(p=>[p.level3,p.level7]),[[12,15],[13,17],[14,19],[16,21]]);
assert.ok(forge.classes.every(c=>forge.disciplines.every(d=>[1,2,3].includes(c.disciplineCosts[d.id]))));
assert.equal(assignments.length,1246);
assert.equal(nonmagical.length,11);assert.ok(nonmagical.every(d=>d.paths.length===4));
assert.equal(buildBudgets.length,13);
for(const b of builds){assert.equal(b.development.total,8+mental(b.attributes),'Build-Off fixture unexpectedly includes a DP trait: update this analysis explicitly.');assert.equal(b.development.total,b.development.spent+b.development.current);}
assert.equal(classRanges.find(c=>c.id==='class-unbalanced').startingMax,13);
assert.equal(classRanges.find(c=>c.id==='class-shepherd').startingMin,6);
const odd=classRanges.find(c=>c.id==='class-odd');assert.deepEqual(odd.entryCosts,{1:0,2:19,3:0});
for(const b of buildBudgets)for(const p of proposals){const r=b.completionCeilings[p.id];assert.ok(r.level7.completed>=r.level3.completed);assert.ok(r.level3.remaining>=0&&r.level7.remaining>=0);}
// Hand-checked examples: credit learned depth and charge a new discipline once.
assert.deepEqual(buildBudgets.find(b=>b.id==='barbarian').completionCeilings.B.level3,
  {completed:1,additionalSpent:8,available:13,remaining:5});
assert.deepEqual(buildBudgets.find(b=>b.id==='sorcerer').completionCeilings.B.level7,
  {completed:2,additionalSpent:36,available:51,remaining:15});
assert.equal(buildBudgets.find(b=>b.id==='sorcerer').completionCeilings.B.level3.completed,0);
assert.equal(buildBudgets.find(b=>b.id==='cleric').additionalAvailableAt3,14);
const pureMagical=forge.disciplines.filter(d=>d.paths.every(p=>nodes.get(p.steps[0]).kind==='section'));
assert.equal(pureMagical.length,7);
assert.ok(pureMagical.every(d=>d.paths.length===4&&d.paths.every(p=>nodes.get(p.steps[0]).spellIds.length===2)));
const magicalBreadth={firstSectionCost:1,spellsPerFirstSection:2,threePureMagicalStartingDisciplines:{books:12,dpForEveryFirstSection:12,spellEntries:24},arcanistFourteenthPointExample:{freeDisciplines:['elements','invocation','force'],additionalDiscipline:'spellcraft',entryCost:forge.classes.find(c=>c.id==='class-arcanist').disciplineCosts.spellcraft,channelingFirstSectionCost:nodes.get('channeling:0').dp,totalDp:14,spellEntries:26},fullBookCost:8,spellsPerFullBook:11};
assert.equal(magicalBreadth.arcanistFourteenthPointExample.entryCost,1);
assert.equal(magicalBreadth.arcanistFourteenthPointExample.channelingFirstSectionCost,1);
const result={status:'November 16: Bruce selected D, costs 1/2/2/3/4/4/5. A/B/C remain comparison cases; source and app integration underway.',inputs:{attributeBounds:[-2,2],attributeTotal:3,startingFormula:'8 + Guile + Knowledge + Reason',laterAward:'4 + new level',freeStartingDisciplines:3,additionalEntry:'Current complete class-price matrix, 1/2/3 DP',nonmagicalGates:gates,unchangedFirstFourPrices:base,magicalFourSectionPrices:[1,2,2,3],interDisciplineIntersections:'Removed by user direction; no combination-node DP included.',traits:'No trait bonuses in the general range. Current Build-Off characters have no DP-granting traits.',scope:'No new ability effects assumed; level3/7 completion is purely financial and preserves all current Build-Off purchases.'},assignments:assignments.length,distribution,classRanges,costComparison,magicalBreadth,buildBudgets};
const output=new URL('../docs/rewrite-299-dp-budget.json',import.meta.url);
const serialized=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(readFileSync(output,'utf8'),serialized,'Regenerate analysis artifact after reviewing input changes.');
else writeFileSync(output,serialized);
console.log(`PASS: ${assignments.length} legal attribute assignments; ${classRanges.length} class ranges; ${builds.length} build budgets; four seven-node cost curves, including approved D.`);
console.table(distribution);
console.table(buildBudgets.map(b=>({build:b.id,L1:b.starting,L3:b.level3,L7:b.level7,available3:b.additionalAvailableAt3,available7:b.additionalAvailableAt7,A3:b.completionCeilings.A.level3.completed,B3:b.completionCeilings.B.level3.completed,C3:b.completionCeilings.C.level3.completed,D3:b.completionCeilings.D.level3.completed,A7:b.completionCeilings.A.level7.completed,B7:b.completionCeilings.B.level7.completed,C7:b.completionCeilings.C.level7.completed,D7:b.completionCeilings.D.level7.completed})));
