import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {test} from "node:test";

// The browser module gets its rules import when the Workshop is staged.
const source = (await readFile(new URL("../web/forge-view.mjs", import.meta.url), "utf8"))
  .replace('"./rules/forge.mjs"', JSON.stringify(new URL("../src/rules/forge.mjs", import.meta.url).href))
  .replace('"./rules-view.mjs"', JSON.stringify(new URL("../web/rules-view.mjs", import.meta.url).href));
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

const currentGraph = JSON.parse(await readFile(new URL("../static/data/forge.json", import.meta.url), "utf8"));
test("every real spellbook has the same seven-node geometry and sequential path as a martial branch", () => {
  const before=JSON.stringify(currentGraph);
  const {positions,edges}=atlasLayout(currentGraph);
  const arms=currentGraph.disciplines.find(d=>d.id==="arms");
  const offset=(id,root)=>({x:(positions.get(id).x-positions.get(root).x)||0,y:(positions.get(id).y-positions.get(root).y)||0});
  let books=0;
  for(const discipline of currentGraph.disciplines) for(const [index,path] of discipline.paths.entries()) {
    if(!path.bookId) continue;
    books++;
    assert.equal(path.steps.length,7);
    assert.deepEqual(path.steps.map(id=>offset(id,discipline.id)),arms.paths[index].steps.map(id=>offset(id,"arms")));
    for(const [step,id] of path.steps.entries()) {
      const previous=path.steps[step-1]??discipline.id;
      assert.equal(edges.filter(edge=>edge.to===id).length,1);
      assert.equal(edges.find(edge=>edge.to===id).from,previous);
      assert.deepEqual(currentGraph.nodes.find(node=>node.id===id).requires,[previous]);
    }
  }
  assert.equal(books,29);
  assert.equal(edges.length,currentGraph.disciplines.flatMap(d=>d.paths).reduce((total,path)=>total+path.steps.length,0));
  assert.equal(JSON.stringify(currentGraph),before,"layout never changes the learning graph");
});

test("a book shows its next single advanced spell and its complete seven-step plan", () => {
  const graph=currentGraph, learned=["elements","flame:0","flame:1","flame:2","flame:3"];
  const state={learned,level:3,dp:4};
  const html=renderForge(graph,state,{...options(graph,learned,3),openPaths:["elements:flame"]});
  const fifth=graph.nodes.find(node=>node.id==="flame:4"),last=graph.nodes.find(node=>node.id==="flame:6");
  assert.match(html,/4\/7 learned/);
  assert(html.includes(`Learn ${fifth.name} for 4 DP`));
  assert(html.includes(last.name));
  const atlas=renderForge(graph,state,{...options(graph,learned,3),view:"atlas",discipline:"elements",selected:"flame:4"});
  assert.match(atlas,/data-id="flame:4" class="forge-node is-available/);
  assert.match(atlas,/data-id="flame:5" class="forge-node is-later/);
  assert.match(atlas,/data-id="flame:6" class="forge-node is-later/);
  assert.doesNotMatch(atlas,/forge-mastery-stem|Other master spells|separate choice/);
});
