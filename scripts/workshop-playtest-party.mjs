import { readPortableCharacter, PORTABLE_FORMAT, WORKSHOP_PLAYTEST_VERSION, portableVersion } from "../src/rules/portable-character.mjs";

// These six example heroes show different ways to use a single level-1 pool.
// Keep identity, signatures and gear from the book's examples.
const plans = {
  "Borin Bridgekeeper": [0, 0, "guard", [
    "armor:harness:1", "arms:impact:1", "arms:impact:2", "arms:impact:3",
    "guard:interception:1", "guard:shelter:1",
  ]],
  "Lira Ashbow": [0, 0, "athletics", [
    "marksmanship:pinning:1", "marksmanship:pinning:2", "marksmanship:pinning:3",
    "athletics:climbing:1", "wilderness:foraging:1", "wilderness:tracking:1",
  ]],
  "Mara Reedheart": [0, 0, "medicine", [
    "restoration:0", "restoration:1", "medicine:first-aid:1", "medicine:first-aid:2",
    "wilderness:foraging:1", "spellcraft", "spellcraft:soul-capacity:1",
  ]],
  "Oren Brass": [0, 0, "divination", [
    "craft:supplies:1", "craft:supplies:2", "craft:supplies:3",
    "craft:repairs:1", "scholarship:lore:1", "scholarship:investigation:1", "detection:0",
  ]],
  "Pip Copperwink": [1, 0, "athletics", [
    "subterfuge:stealth:1", "subterfuge:stealth:2", "subterfuge:locks:1",
    "subterfuge:sleight:1", "arms:bladework:1", "athletics:climbing:1", "athletics:leaping:1",
  ]],
  "Vaelis Emberglass": [1, 1, "spellcraft", [
    "flame:0", "flame:1", "air:0", "air:1", "water:0",
    "spellcraft:soul-capacity:1", "spellcraft:mind-capacity:1", "spellcraft:recovery:1", "farseeing:0",
  ]],
};

export function workshopPlaytestParty(party, catalogs) {
  if (catalogs.forge.rulesRevision === 299) return party.map(hero => {
    const result = readPortableCharacter({format: PORTABLE_FORMAT, schemaVersion: portableVersion(catalogs), draft: hero.draft}, catalogs);
    if (!result.preview.valid) throw new Error(`Invalid current example ${hero.id}: ${JSON.stringify(result.preview.errors)}`);
    return {...hero, draft: result.draft};
  });
  return party.map((hero) => {
    const [culture, background, discipline, learning] = plans[hero.draft.name];
    const draft = structuredClone(hero.draft);
    draft.culture.pair = culture;
    draft.background.pair = background;
    draft.classDisciplines = [discipline];
    draft.purchases = { 0: [], 1: learning.map((id) => ({ id })) };
    const result = readPortableCharacter({
      format: PORTABLE_FORMAT, schemaVersion: WORKSHOP_PLAYTEST_VERSION, draft,
    }, catalogs, catalogs.languages);
    if (!result.preview.valid) {
      throw new Error(`Invalid Workshop build for ${draft.name}: ${JSON.stringify(result.preview.errors)}`);
    }
    return { ...hero, draft: result.draft };
  });
}
