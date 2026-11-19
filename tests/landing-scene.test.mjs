import test from "node:test";
import assert from "node:assert/strict";
import {createLandingScene, refreshLandingBranding, landingSceneSource, LANDING_ID} from "../src/services/landing.mjs";

test("landing setup preserves existing edits and refuses a colliding unrelated scene", async () => {
  const edited = {id: LANDING_ID, name: "Our campaign", getFlag: () => ({version: 1})};
  globalThis.game = {user: {isGM: true}, scenes: {find: () => edited}};
  globalThis.Scene = {create: () => {throw Error("Must not create");}};
  assert.equal(await createLandingScene(), edited);
  game.scenes = {find: () => null, get: () => ({getFlag: () => null})};
  await assert.rejects(createLandingScene(), /preserved/);
  game.user.isGM = false;
  await assert.rejects(createLandingScene(), /Dungeon Architect/);
});

test("landing creation is shared across repeated clicks and never activates a campaign scene", async () => {
  let count = 0, release;
  globalThis.game = {user: {isGM: true}, scenes: {find: () => null, get: () => null}};
  const created = {id: LANDING_ID};
  globalThis.Scene = {async create(data, options) {
    count++; assert.equal(data.active, false); assert.equal(options.keepId, true);
    await new Promise(resolve => {release = resolve;}); return created;
  }};
  const first = createLandingScene(), second = createLandingScene();
  release();
  assert.deepEqual(await Promise.all([first, second]), [created, created]);
  assert.equal(count, 1);
  const source = landingSceneSource();
  assert.ok(source.tiles.every(tile => tile.levels[0] === source.initialLevel));
  assert.ok(source.drawings.every(drawing => drawing.levels[0] === source.initialLevel));
  assert.equal(source.ownership.default, 2);
});

test("active GM refreshes stock landing text in place and leaves other scene data alone", async () => {
  const updates = [];
  const oldTitle = {id: "drawing", name: "Title", text: "HEROES\nOF LEGEND", x: 123};
  const makeScene = (id, name, flagged, drawings) => ({
    id, name, drawings, tokens: [{id: "placed"}], getFlag: () => flagged,
    async updateEmbeddedDocuments(type, changes) {
      updates.push([id, type, changes]);
      for (const {_id, text} of changes) this.drawings.find(drawing => drawing.id === _id).text = text;
    },
    async update(changes) {updates.push([id, changes]); Object.assign(this, changes);},
  });
  const stock = makeScene("stock", "Heroes of Legend · The gathering", true, [{...oldTitle}]);
  const custom = makeScene("custom", "Our gathering", true, [{...oldTitle, text: "MY CAMPAIGN"}]);
  const unrelated = makeScene("unrelated", "Heroes of Legend · The gathering", false, [{...oldTitle}]);
  globalThis.game = {user: {isGM: true}, users: {activeGM: {isSelf: false}}, scenes: [stock, custom, unrelated]};
  await refreshLandingBranding();
  assert.deepEqual(updates, []);
  game.users.activeGM.isSelf = true;
  await Promise.all([refreshLandingBranding(), refreshLandingBranding()]);
  await refreshLandingBranding();
  assert.deepEqual(updates, [
    ["stock", "Drawing", [{_id: "drawing", text: "DEEDS\nOF LEGEND"}]],
    ["stock", {name: "Deeds of Legend · The gathering"}],
  ]);
  assert.equal(stock.drawings[0].x, 123);
  assert.deepEqual(stock.tokens, [{id: "placed"}]);
  assert.equal(custom.drawings[0].text, "MY CAMPAIGN");
  assert.equal(unrelated.drawings[0].text, oldTitle.text);
});

test("a failed scene title update can retry without rewriting the migrated drawing", async t => {
  t.mock.method(console, "error", () => {});
  let drawings = 0, scenes = 0;
  const title = {id: "drawing", name: "Title", text: "HEROES\nOF LEGEND"};
  const scene = {
    id: "retry", name: "Heroes of Legend · The gathering", drawings: [title], getFlag: () => true,
    async updateEmbeddedDocuments(_type, [change]) {drawings++; title.text = change.text;},
    async update(changes) {if (++scenes === 1) throw Error("temporary failure"); Object.assign(this, changes);},
  };
  globalThis.game = {user: {isGM: true}, users: {activeGM: {isSelf: true}}, scenes: [scene]};
  await refreshLandingBranding();
  await refreshLandingBranding();
  assert.equal(drawings, 1);
  assert.equal(scenes, 2);
  assert.equal(scene.name, "Deeds of Legend · The gathering");
});
