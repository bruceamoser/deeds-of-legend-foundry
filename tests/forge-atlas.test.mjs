import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {test} from "node:test";

// The browser module gets its rules import when the Workshop is staged.
const source = (await readFile(new URL("../web/forge-view.mjs", import.meta.url), "utf8"))
  .replace('"./rules/forge.mjs"', JSON.stringify(new URL("../src/rules/forge.mjs", import.meta.url).href));
const {atlasLayout, renderForge} = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
function fixture() {
  const graph = {disciplines:[], nodes:[], books:[], spells:[], classes:[]};
  const discipline = {id:"arms", name:"Arms", paths:[]};
  graph.disciplines.push(discipline);
  graph.nodes.push({id:"arms", name:"Arms", kind:"discipline", requires:[], dp:1, level:1});
  for (let branch = 0; branch < 4; branch++) {
    const path = {id:`arms:path-${branch}`, name:`Path ${branch}`, steps:[]};
    discipline.paths.push(path);
    for (let step = 1; step <= 7; step++) {
      const id = `${path.id}:${step}`;
      graph.nodes.push({id, name:`Technique ${branch}-${step}`, kind:"ability", disciplineId:"arms", pathId:path.id,
        level:step < 4 ? 1 : step < 7 ? 3 : 7, dp:[1,2,2,3,4,4,5][step-1], requires:[path.steps.at(-1) ?? "arms"], effect:`Mechanic ${branch}-${step}.`});
      path.steps.push(id);
    }
  }
  return graph;
}
function options(graph, learned, level=1) {
  return {eligibility:id => {const node=graph.nodes.find(n=>n.id===id);return {eligible:!learned.includes(id)&&node.level<=level&&node.requires.every(r=>learned.includes(r)),cost:node.dp,reasons:[]};}};
}

test("seven-step atlas keeps four inner nodes and attaches advanced tails only to their own fourth step", () => {
  const graph=fixture(), {positions,edges}=atlasLayout(graph);
  assert.equal(positions.size,29);
  assert.equal(new Set([...positions.values()].map(p=>`${p.x},${p.y}`)).size,29);
  for(const path of graph.disciplines[0].paths) {
    assert.equal(edges.find(e=>e.to===path.steps[4]).from,path.steps[3]);
    assert.equal(edges.find(e=>e.to===path.steps[6]).from,path.steps[5]);
    assert.match(edges.find(e=>e.to===path.steps[3]).draw,/ A /);
    assert.match(edges.find(e=>e.to===path.steps[4]).draw,/ Q /);
  }
  const center=positions.get("arms"), roots=graph.disciplines[0].paths.map(p=>positions.get(p.steps[0]));
  assert(roots[0].y<center.y);assert(roots[1].x<center.x);assert(roots[2].x>center.x);assert(roots[3].y>center.y);
});

test("atlas shows gate shapes and distinct learned, available and future states without intersections", () => {
  const graph=fixture(), learned=["arms","arms:path-0:1"];
  const html=renderForge(graph,{learned,level:1,dp:20},{...options(graph,learned),view:"atlas",discipline:"arms"});
  assert.match(html,/forge-level-1/);assert.match(html,/forge-level-3/);assert.match(html,/forge-level-7/);
  assert.match(html,/is-learned forge-map-step/);assert.match(html,/is-available forge-map-step/);assert.match(html,/is-later forge-map-step/);
  assert.match(html,/○ Level 1 · △ Level 3 · ◇ Level 7/);
  assert.doesNotMatch(html,/forge-cross|forge-map-combination|Combined abilities/);
});

test("available-next list advances after learning and expands all seven steps for planning", () => {
  const graph=fixture(), learned=["arms","arms:path-0:1"];
  const html=renderForge(graph,{learned,level:1,dp:20},{...options(graph,learned),openPaths:["arms:path-0"]});
  assert.match(html,/Path 0 — Technique 0-2 — 2 DP/);
  assert.match(html,/1\/7 learned/);
  assert.match(html,/Technique 0-7/);assert.match(html,/Level 7/);
  assert.doesNotMatch(html,/Path 1 — Technique 1-2/);
});

test("independent advanced spells attach to book IV and are all available without learning each other", () => {
  const graph=fixture(), path=graph.disciplines[0].paths[0];
  path.steps=path.steps.slice(0,4);path.bookId="book";
  graph.books.push({id:"book",name:"Book",masteryIds:["spell-mastery:first","spell-mastery:second"]});
  for(const [index,id] of graph.books[0].masteryIds.entries()) graph.nodes.push({id,name:`Advanced ${index+1}`,kind:"spell-mastery",disciplineId:"arms",pathId:path.id,level:7,dp:4,requires:[path.steps.at(-1)],effect:"A powerful spell."});
  const {positions,edges}=atlasLayout(graph);
  for(const id of graph.books[0].masteryIds) {assert(positions.has(id));assert.equal(edges.find(e=>e.to===id).from,path.steps.at(-1));}
  const learned=["arms",...path.steps];
  const html=renderForge(graph,{learned,level:7,dp:20},options(graph,learned,7));
  assert.match(html,/Learn Advanced 1 for 4 DP/);assert.match(html,/Learn Advanced 2 for 4 DP/);
});
