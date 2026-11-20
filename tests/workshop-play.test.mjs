import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  favoriteSectionKey,
  itemArrangement,
  normalizeWorkshopPlay,
} from "../src/rules/workshop-play.mjs";
import {
  workshopCharacter,
  emptyLevelDraft,
} from "../src/rules/workshop-character.mjs";
import {
  readPortableCharacter,
  writePortableCharacter,
} from "../src/rules/portable-character.mjs";
const read = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url)));
const choices = await read("../static/data/choices.json"),
  inventory = await read("../static/data/inventory.json"),
  heroes = await read("./fixtures/reference-heroes.json");
const catalogs = {
  choices: choices.records,
  inventory,
  commit: choices.sourceCommit,
};
const borin = () => structuredClone(heroes.characters[0].draft);

test("held and worn imply carried; clearing carried clears both without item-type restrictions", () => {
  const both = { held: true, worn: true, carried: true };
  const stored = itemArrangement(both, "carried", false);
  assert.deepEqual(stored, { held: false, worn: false, carried: false });
  assert.deepEqual(itemArrangement(stored, "held", true), {
    held: true,
    worn: false,
    carried: true,
  });
  assert.deepEqual(itemArrangement(stored, "worn", true), {
    held: false,
    worn: true,
    carried: true,
  });
  assert.deepEqual(itemArrangement(both, "worn", false), {
    held: true,
    worn: false,
    carried: true,
  });
});

test("play inventory changes affect Bulk and defenses but never rewrite or rerun grants", () => {
  const d = borin(),
    original = workshopCharacter(d, catalogs);
  const armor = original.inventory.items.find(
    (i) => i.catalogId === "item-ordinary-light-armor",
  );
  d.play = {
    inventory: {
      added: [
        { id: "item-rope-coil", instanceId: "inventory-rope", quantity: 3 },
      ],
      removed: [armor.instanceId],
    },
  };
  d.loadout = {
    [armor.instanceId]: { worn: true },
    "inventory-rope": { held: true, worn: true },
  };
  let p = workshopCharacter(d, catalogs);
  assert.equal(p.inventory.bulk, original.inventory.bulk + 2);
  assert(!p.inventory.items.some((i) => i.instanceId === armor.instanceId));
  assert.equal(p.resistances.physical ?? 0, 0);
  assert.deepEqual(p.creation.inventory, original.creation.inventory);
  assert.equal(p.inventory.remainingCoins, original.inventory.remainingCoins);
  d.progression = { level: 2, levels: {} };
  p = workshopCharacter(d, catalogs);
  assert(!p.inventory.items.some((i) => i.instanceId === armor.instanceId));
  assert.equal(
    p.inventory.items.filter((i) => i.instanceId === "inventory-rope").length,
    1,
  );
  d.loadout["inventory-rope"] = itemArrangement(
    d.loadout["inventory-rope"],
    "carried",
    false,
  );
  assert.equal(
    workshopCharacter(d, catalogs).inventory.bulk,
    original.inventory.bulk - 1,
  );
});

test("play languages and conditions round trip without altering creation identity", () => {
  const d = borin(),
    original = workshopCharacter(d, catalogs);
  d.play = {
    languages: {
      added: [
        {
          id: "river-sign",
          name: "River Sign",
          form: "signed",
          written: false,
        },
      ],
      removed: ["common"],
    },
    conditions: [
      {
        id: "burn-1",
        key: "burning",
        rating: 2,
        persistence: "starred",
        source: "sheet",
      },
      {
        id: "prone-1",
        key: "prone",
        rating: 1,
        persistence: "binary",
        source: "sheet",
      },
    ],
  };
  const text = writePortableCharacter(d, catalogs, { ready: true });
  assert.equal(JSON.parse(text).schemaVersion, 3);
  const { draft, preview: p } = readPortableCharacter(text, catalogs);
  assert(!p.play.languages.some((l) => l.id === "common"));
  const lang = p.play.languages.find((l) => l.id === "river-sign");
  assert(lang.permissions.sign);
  assert.equal(lang.permissions.speak, false);
  assert.equal(lang.permissions.read, false);
  assert.equal(lang.permissions.write, false);
  assert.equal(p.play.conditionSummary.burning.rating, 2);
  assert.equal(p.play.conditionSummary.prone.active, true);
  assert.deepEqual(
    p.creation.summary.languages,
    original.creation.summary.languages,
  );
  assert.deepEqual(draft.play.conditions, d.play.conditions);
  assert.equal(writePortableCharacter(draft, catalogs, { ready: true }), text);
});

test("portable play controls reject malformed item, language and condition state", () => {
  for (const play of [
    {
      inventory: {
        added: [{ id: "unknown", instanceId: "inventory-test", quantity: 1 }],
        removed: [],
      },
    },
    {
      inventory: {
        added: [
          { id: "item-rope-coil", instanceId: "inventory-test", quantity: -1 },
        ],
        removed: [],
      },
    },
    { inventory: { added: [], removed: ['x" onclick="bad'] } },
    {
      languages: {
        added: [{ id: "custom", name: "", form: "signed", written: true }],
        removed: [],
      },
    },
    {
      conditions: [
        {
          id: "prone",
          key: "prone",
          rating: 2,
          persistence: "binary",
          source: "sheet",
        },
      ],
    },
    {
      conditions: [
        {
          id: "burn",
          key: "burning",
          rating: 0,
          persistence: "starred",
          source: "sheet",
        },
      ],
    },
    {
      conditions: [
        {
          id: "bad",
          key: "nonexistent",
          rating: 1,
          persistence: "binary",
          source: "sheet",
        },
      ],
    },
  ])
    assert.throws(() => normalizeWorkshopPlay(play, catalogs));
  for (const version of [1, 2]) {
    const value = JSON.parse(writePortableCharacter(borin(), catalogs));
    value.schemaVersion = version;
    assert(readPortableCharacter(value, catalogs).preview.valid);
  }
});

test("unselected signatures do not block spending; choosing an earlier signature resolves carried errors", () => {
  const d = borin();
  d.progression = {
    level: 4,
    levels: {
      3: {
        ...emptyLevelDraft(),
        purchases: [{ id: "ability-conditioned-body" }],
      },
    },
  };
  const pending = workshopCharacter(d, catalogs);
  assert(pending.state.abilities.includes("ability-conditioned-body"));
  assert(pending.errors.some((e) => e.code === "signature"));
  const signature = catalogs.choices.find((r) => r.id === d.classId)
    .signatures[3][0];
  // New UI records the choice at its actual tier, even when the hero is already level 4.
  d.progression.levels[3].signatures[3] = signature;
  const completed = workshopCharacter(d, catalogs);
  assert.deepEqual(completed.errors, []);
  assert.equal(completed.development.current, pending.development.current);
  assert.equal(
    completed.state.abilities.filter((id) => id === signature).length,
    1,
  );
  // Older version-2 plans may instead record the delayed signature at level 4.
  delete d.progression.levels[3].signatures[3];
  d.progression.levels[4] = {
    ...emptyLevelDraft(),
    signatures: { 3: signature },
  };
  assert.deepEqual(workshopCharacter(d, catalogs).errors, []);
});

test("memorized message persists with a strict 50 word editing bound", () => {
  const message = Array(50).fill("word").join(" ");
  assert.equal(
    normalizeWorkshopPlay({ memorizedMessage: message }, catalogs)
      .memorizedMessage,
    message,
  );
  assert.throws(() =>
    normalizeWorkshopPlay({ memorizedMessage: message + " extra" }, catalogs),
  );
});

test("instrument acquired in play supports later Party Piece learning without a second purchase", () => {
  const d = borin();
  d.progression = {level: 2, levels: {2: {
    ...emptyLevelDraft(),
    purchases: [{id: "ability-a-party-piece"}],
    acquisitions: {"ability-a-party-piece": {instrument: "flute"}},
  }}};
  const missing = workshopCharacter(d, catalogs);
  assert(missing.errors.some(e => e.id === "ability-a-party-piece" && e.equipment));
  d.play = {inventory: {added: [{id: "item-musical-instrument", instanceId: "inventory-flute", quantity: 1}], removed: []}};
  d.loadout = {"inventory-flute": {held: true, carried: true}};
  const ready = workshopCharacter(d, catalogs);
  assert.equal(ready.valid, true, JSON.stringify(ready.errors));
  assert.deepEqual(ready.state.instruments, [{abilityId: "ability-a-party-piece", instrument: "flute"}]);
  const instruments = ready.inventory.items.filter(i => i.catalogId === "item-musical-instrument");
  assert.equal(instruments.length, 1);
  assert.equal(instruments[0].instanceId, "inventory-flute");
  assert.equal(instruments[0].held, true);
  d.play.inventory.removed = ["inventory-flute"];
  const removed = workshopCharacter(d, catalogs);
  assert(removed.errors.some(e => e.id === "ability-a-party-piece" && e.equipment));
});

test("favorite sections save portable keys and repair the labels older sheets saved", () => {
  const groups = ["Main Action", "Maneuver", "Reaction", "Movement", "Passive"];
  const old = Object.fromEntries(groups.map(group => [`favorites-${group}`, true]));
  const keys = Object.fromEntries(groups.map(group => [favoriteSectionKey(group), true]));
  assert.deepEqual(normalizeWorkshopPlay({collapsed: old}, catalogs).collapsed, keys);
  keys["favorites-main-action"] = false;
  assert.deepEqual(normalizeWorkshopPlay({collapsed: {...old, ...keys}}, catalogs).collapsed, keys);
  assert.throws(() => normalizeWorkshopPlay({collapsed: {"unknown label": true}}, catalogs),
    /malformed play controls/);
});
