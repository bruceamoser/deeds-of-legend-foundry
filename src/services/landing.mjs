const ID = "heroes-of-legend";
const ART = `systems/${ID}/assets/landing/cover-ruins.png`;
const CREST = `systems/${ID}/assets/marks/crest.webp`;
const LEVEL = "holLandingLevel0";
const LANDING_NAME = "Deeds of Legend · The gathering";
const LANDING_TITLE = "DEEDS\nOF LEGEND";
export const LANDING_ID = "holLandingScene0";

/** Native, editable scene documents. No campaign scene is activated or replaced. */
export function landingSceneSource() {
  const text = (name, value, x, y, width, height, size, color = "#f1e6ce", family = "HOL Cinzel") => ({
    name, text: value, x, y, shape: {type: "r", width, height}, fontFamily: family,
    fontSize: size, textColor: color, textAlpha: 1, fillType: 0, strokeWidth: 0,
    locked: true, levels: [LEVEL],
  });
  return {
    _id: LANDING_ID, name: LANDING_NAME, navName: "The gathering",
    active: false, navigation: true, width: 1920, height: 1080, padding: 0,
    grid: {type: 0, size: 100, distance: 1, units: "sq"}, tokenVision: false,
    initial: {x: 960, y: 540, scale: 0.65}, initialLevel: LEVEL,
    levels: [{_id: LEVEL, name: "The gathering", background: {color: "#15221c"}}],
    ownership: {default: 2},
    tiles: [
      {name: "The ruined arch · Player’s Book cover", texture: {src: ART, anchorX: 0, anchorY: 0}, x: 0, y: 0, width: 834, height: 1080, locked: true, levels: [LEVEL]},
      {name: "Deeds of Legend crest", texture: {src: CREST, anchorX: 0, anchorY: 0}, x: 1225, y: 125, width: 240, height: 240, locked: true, levels: [LEVEL]},
    ],
    drawings: [
      text("Title", LANDING_TITLE, 920, 385, 850, 200, 76),
      text("Gathering", "THE GATHERING", 920, 625, 850, 60, 29, "#b39253"),
      text("Welcome", "A shared tale. A dangerous world.\nYour legend begins at the table.", 920, 725, 850, 130, 36, "#f1e6ce", "HOL Garamond"),
      {name: "Gold rule", x: 1085, y: 590, shape: {type: "r", width: 520, height: 2}, fillType: 1, fillColor: "#b39253", fillAlpha: 1, strokeWidth: 0, locked: true, levels: [LEVEL]},
    ],
    flags: {[ID]: {landing: {version: 1, sourceCommit: "295e858c1b6fee044a0261bf9f437636efeff2bf"}}},
  };
}
let creating;
export async function createLandingScene() {
  if (!game.user.isGM) throw new Error("Only the Dungeon Architect can create the landing scene.");
  const existing = game.scenes.find(scene => scene.getFlag(ID, "landing"));
  if (existing) return existing;
  if (creating) return creating;
  creating = (async () => {
    if (game.scenes.get(LANDING_ID)) throw new Error("An existing scene uses the landing scene ID. It has been preserved.");
    try { return await Scene.create(landingSceneSource(), {keepId: true, keepEmbeddedIds: true}); }
    catch (error) {
      const concurrent = game.scenes.get(LANDING_ID);
      if (concurrent?.getFlag(ID, "landing")) return concurrent;
      throw error;
    }
  })();
  try { return await creating; } finally { creating = null; }
}

const refreshing = new Set();

/** Update the stock legacy title without replacing any placed scene documents. */
export async function refreshLandingBranding() {
  const active = () => game.user.isGM && game.users.activeGM?.isSelf;
  if (!active()) return;
  for (const scene of game.scenes) {
    if (!active()) return;
    if (!scene.getFlag(ID, "landing") || refreshing.has(scene.id)) continue;
    refreshing.add(scene.id);
    try {
      const titles = scene.drawings.filter(drawing => drawing.name === "Title" && drawing.text === "HEROES\nOF LEGEND");
      if (titles.length === 1)
        await scene.updateEmbeddedDocuments("Drawing", [{_id: titles[0].id, text: LANDING_TITLE}]);
      if (active() && scene.name === "Heroes of Legend · The gathering")
        await scene.update({name: LANDING_NAME});
    } catch (error) {
      console.error(`${ID} | Landing title refresh failed for ${scene.id}`, error);
    } finally {
      refreshing.delete(scene.id);
    }
  }
}
