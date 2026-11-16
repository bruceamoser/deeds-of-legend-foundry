import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {forgeEligibility, forgeLearning, learnForgeEntry} from "../src/rules/forge.mjs";
import {readPortableCharacter, writePortableCharacter, portableVersion} from "../src/rules/portable-character.mjs";
import {workshopCatalogs} from "../src/rules/workshop-forge-catalog.mjs";
import {workshopCharacter} from "../src/rules/workshop-character.mjs";
const read=name=>JSON.parse(readFileSync(new URL(`../static/data/${name}.json`,import.meta.url)));
const graph=read("forge");
const catalogs=workshopCatalogs(...["choices","inventory","wounds","forge","forge-references"].map(read));

test("all 29 books have equally priced seven-step paths and one spell at each advanced purchase",()=>{
  assert.equal(graph.spellbookProgressionRevision,310);
  assert.equal(graph.books.length,29);
  assert.equal(graph.spells.length,319);
  assert.equal(graph.nodes.some(n=>n.kind==="spell-mastery"),false);
  for(const book of graph.books){
    const path=graph.disciplines.flatMap(d=>d.paths).find(p=>p.bookId===book.id);
    const nodes=path.steps.map(id=>graph.nodes.find(n=>n.id===id));
    assert.equal(nodes.length,7,book.name);
    assert.deepEqual(nodes.map(n=>n.dp),[1,2,2,3,4,4,5],book.name);
    assert.deepEqual(nodes.map(n=>n.level),[1,1,1,3,3,3,7],book.name);
    assert.deepEqual(nodes.map(n=>n.spellIds.length),[2,2,2,2,1,1,1],book.name);
    assert.deepEqual(nodes.map(n=>n.shape),["circle","circle","circle","triangle","triangle","triangle","diamond"],book.name);
    assert.deepEqual(nodes.flatMap(n=>n.spellIds),book.spellIds,book.name);
    let state={level:1,dp:21,learned:[book.disciplineId]};
    for(const [index,node] of nodes.entries()){
      assert.deepEqual(node.requires,[nodes[index-1]?.id??book.disciplineId]);
      if(index===3||index===6){
        assert.equal(forgeEligibility(graph,state,node.id).eligible,false,`${book.id}: gate before ${node.section}`);
        state.level=node.level;
      }
      for(const future of nodes.slice(index+1))assert.equal(forgeEligibility(graph,state,future.id).eligible,false,`${book.id}: sequential learning`);
      const result=learnForgeEntry(graph,state,node.id);assert(result.eligible,node.id);state=result.state;
      assert.equal(forgeLearning(graph,state.learned).spells.length,[2,4,6,8,9,10,11][index],node.id);
    }
    assert.equal(state.dp,0,`${book.id}: 21 DP total`);
  }
});

test("old fourth sections and independent masteries refund once without changing live character state",()=>{
  const draft=structuredClone(read("forge-party").party[5].draft);
  const cls=graph.classes.find(c=>c.id===draft.classId);
  draft.progression={level:7,levels:{
    3:{purchases:[{id:"flame:2"},{id:"flame:3"}],acquisitions:{},signatures:{3:cls.signatures[3][0]}},
    7:{purchases:[{id:"mastery:meteor-swarm"}],acquisitions:{},signatures:{7:cls.signatures[7][0]}},
  }};
  draft.play={hp:7,sp:2,gritSpent:1,scars:["A pale scar."],favorites:{abilities:["spell:flame:1"],items:[]}};
  draft.profile={story:"Keep this character's story."};
  const old={format:"heroes-of-legend-character",schemaVersion:6,sourceCommit:"previous",draft};
  const before=structuredClone(old);
  const priorGraph=structuredClone(graph);
  priorGraph.nodes.find(n=>n.id==="flame:3").spellIds=priorGraph.books.find(b=>b.id==="flame").spellIds.slice(6);
  priorGraph.nodes.push({id:"mastery:meteor-swarm",name:"Meteor Swarm",kind:"spell-mastery",bookId:"flame",disciplineId:"elements",pathId:"elements:flame",level:7,dp:4,requires:["flame:3"],spellIds:[]});
  const priorCatalogs=workshopCatalogs(read("choices"),read("inventory"),read("wounds"),priorGraph,read("forge-references"));
  const prior=workshopCharacter(draft,priorCatalogs);
  assert(prior.valid,JSON.stringify(prior.errors));
  const migrated=readPortableCharacter(old,catalogs);
  assert(migrated.preview.valid,JSON.stringify(migrated.preview.errors));
  assert.equal(migrated.preview.development.current,prior.development.current+7,"3 DP for IV and 4 DP for the old mastery return to the ledger");
  assert.deepEqual(old,before,"input is not mutated");
  assert.deepEqual(migrated.draft.purchases,draft.purchases);
  assert.deepEqual(migrated.draft.progression.levels[3].purchases,[{id:"flame:2"}]);
  assert.deepEqual(migrated.draft.progression.levels[7].purchases,[]);
  assert.deepEqual(new Set(migrated.draft.learningReview),new Set(["flame:3","mastery:meteor-swarm"]));
  assert.equal(migrated.draft.play.hp,7);assert.equal(migrated.draft.play.sp,2);assert.equal(migrated.draft.play.gritSpent,1);
  assert.deepEqual(migrated.draft.play.scars,draft.play.scars);
  assert.deepEqual(migrated.draft.play.favorites,draft.play.favorites);
  assert.deepEqual(migrated.draft.shopping,draft.shopping);
  assert.deepEqual(migrated.draft.loadout,draft.loadout);
  assert.deepEqual(migrated.draft.profile,draft.profile);
  assert.equal(migrated.preview.state.learning.spells.filter(s=>s.bookId==="flame").length,6);
  const available=migrated.preview.development.current;
  migrated.draft.progression.levels[7].purchases=[{id:"flame:3"},{id:"flame:4"},{id:"flame:5"},{id:"flame:6"}];
  const learned=workshopCharacter(migrated.draft,catalogs);
  assert.equal(learned.development.current,available-16);
  assert.equal(learned.state.learning.spells.filter(s=>s.bookId==="flame").length,11);
  const text=writePortableCharacter(migrated.draft,catalogs);
  assert.equal(JSON.parse(text).schemaVersion,7);
  assert.equal(portableVersion(catalogs),7);
  const restored=readPortableCharacter(text,catalogs);
  assert.deepEqual(restored.draft.progression,migrated.draft.progression,"new purchases survive reload");
  assert.equal(restored.preview.development.current,learned.development.current);
  assert.equal(restored.preview.state.learning.spells.filter(s=>s.bookId==="flame").length,11);
});
