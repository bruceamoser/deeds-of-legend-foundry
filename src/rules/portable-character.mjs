import { reviseForgeLearning, reviseSmallTalents, reviseSpellbookLearning } from "./forge-rewrite.mjs";
import { normalizeWorkshopPlay } from "./workshop-play.mjs";
import { ATTRIBUTES } from "./character.mjs";
import { workshopCharacter } from "./workshop-character.mjs";
import { currentAncestryId } from "./ancestry.mjs";

export const PORTABLE_FORMAT = "heroes-of-legend-character";
export const PORTABLE_VERSION = 3;
export const FORGE_PORTABLE_VERSION = 4;
export const WORKSHOP_PLAYTEST_VERSION = 5;
export const WORKSHOP_REWRITE_VERSION = 6;
export const SPELLBOOK_PROGRESSION_VERSION = 7;
export const portableVersion = (catalogs) => catalogs.forge?.spellbookProgressionRevision === 310 ? SPELLBOOK_PROGRESSION_VERSION : catalogs.forge?.rulesRevision === 299 ? WORKSHOP_REWRITE_VERSION : catalogs.forge?.playtest
  ? WORKSHOP_PLAYTEST_VERSION
  : catalogs.forge ? FORGE_PORTABLE_VERSION : PORTABLE_VERSION;
export const MAX_CHARACTER_BYTES = 262144;
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
const string = (value, max = 200) =>
  typeof value === "string" && value.length <= max;
const strings = (value, max = 100) =>
  Array.isArray(value) && value.length <= max && value.every((v) => string(v));
const integer = (value) => Number.isSafeInteger(value);

const BEFORE_LIGHT_ARMOR_SOURCE = "9bc9b4fe3256e68880b92c45facf0f25b98a1ea3";
const OLD_ARMOR_KEY =
  "grant:ability-wear-medium-armor:item-ordinary-medium-armor";
const LIGHT_ARMOR_KEY =
  "grant:ability-wear-light-armor:item-ordinary-light-armor";

/** Normalize saved choices for the only supported rules catalog, without changing the input. */
export function currentCreationDraft(input, sourceCommit) {
  const draft = structuredClone(input);
  if (object(draft) && draft.ancestryId !== undefined)
    draft.ancestryId = currentAncestryId(draft.ancestryId);
  if (object(draft) && draft.borrowedAncestryId !== undefined)
    draft.borrowedAncestryId = currentAncestryId(draft.borrowedAncestryId);
  // Approved replacement of the retired concept; replay the ordinary current
  // purchase at its original stage/level, with no rank or resource grants.
  const retired = "ability-turn-the-crowd",
    replacement = "ability-a-common-tongue";
  const containers = [draft];
  if (object(draft?.progression?.levels))
    containers.push(
      ...Object.entries(draft.progression.levels)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, entry]) => entry),
    );
  const lists = containers
    .flatMap((entry, index) =>
      index === 0
        ? [entry?.purchases?.[0], entry?.purchases?.[1]]
        : [entry?.purchases],
    )
    .filter(Array.isArray);
  const hasRetiredPurchase = lists.some((list) =>
    list.some((entry) => entry?.id === retired),
  );
  let replacementSeen = false;
  for (const list of lists) {
    for (let index = 0; index < list.length; index++) {
      const entry = list[index];
      if (entry?.id === retired) entry.id = replacement;
      if (!hasRetiredPurchase || entry?.id !== replacement) continue;
      if (replacementSeen) list.splice(index--, 1);
      else replacementSeen = true;
    }
  }
  for (const entry of containers) {
    if (
      !object(entry?.acquisitions) ||
      !Object.hasOwn(entry.acquisitions, retired)
    )
      continue;
    if (!Object.hasOwn(entry.acquisitions, replacement))
      entry.acquisitions[replacement] = entry.acquisitions[retired];
    delete entry.acquisitions[retired];
  }
  for (const kind of ["culture", "background"])
    if (object(draft?.[kind])) delete draft[kind].retainedFrom;
  if (
    sourceCommit === BEFORE_LIGHT_ARMOR_SOURCE &&
    draft?.culture?.id === "origin-culture-walled-communities" &&
    draft.culture.pair === 0
  ) {
    if (Object.hasOwn(draft.loadout ?? {}, OLD_ARMOR_KEY)) {
      draft.loadout ??= {};
      draft.loadout[LIGHT_ARMOR_KEY] = draft.loadout[OLD_ARMOR_KEY];
      delete draft.loadout[OLD_ARMOR_KEY];
    }
    if (Array.isArray(draft.play?.inventory?.removed))
      draft.play.inventory.removed = draft.play.inventory.removed.map((id) =>
        id === OLD_ARMOR_KEY ? LIGHT_ARMOR_KEY : id,
      );
  }
  return draft;
}

const legacyRoots = {
  "discipline-mind": "mentalism",
  "discipline-calling": "invocation",
  "discipline-flame": "elements",
  "discipline-frost": "elements",
  "discipline-storm": "elements",
};
const legacyRoot = (id) =>
  typeof id === "string"
    ? (legacyRoots[id] ?? id.replace(/^discipline-/, ""))
    : id;
const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function migrateForgeChoices(draft, { forge, legacyChoices = [] }) {
  if (!object(draft)) return draft;
  const oldById = new Map(legacyChoices.map((record) => [record.id, record]));
  for (const kind of ["culture", "background"]) {
    const choice = draft[kind];
    if (!object(choice) || !Number.isSafeInteger(choice.pair)) continue;
    const old = oldById.get(choice.id);
    const current = forge.origins.find((origin) => origin.id === choice.id);
    const previousId = old?.pairs?.[choice.pair]?.abilityId;
    if (!previousId || !current) continue;
    const prefix = old.source.path.split("/").at(-1) + ":";
    const oldName = oldById.get(previousId)?.name;
    const exact = oldName && forge.originRedirects[prefix + oldName];
    const oldSlug = previousId.replace(/^ability-/, "");
    const alias = Object.entries(forge.originRedirects).find(
      ([key]) =>
        key.startsWith(prefix) && slug(key.slice(prefix.length)) === oldSlug,
    )?.[1];
    const entryId =
      exact?.entryId ?? alias?.entryId ?? forge.redirects[previousId];
    const disciplineId = exact?.disciplineId ?? alias?.disciplineId ?? legacyRoot(old?.pairs?.[choice.pair]?.disciplineId);
    choice.pair = (current.bookPairs ?? current.pairs).findIndex((pair) => forge.rulesRevision === 299
      ? pair.disciplineId === disciplineId : pair.entryId === entryId);
  }

  const roots = new Set(forge.disciplines.map(({ id }) => id));
  const allowed =
    forge.classes.find((record) => record.id === draft.classId)
      ?.disciplineIds ?? [];
  if (Array.isArray(draft.classDisciplines)) {
    const used = new Set();
    draft.classDisciplines = draft.classDisciplines.map((id) => {
      const target = legacyRoot(id);
      if (!roots.has(target) || used.has(target)) return id;
      used.add(target);
      return target;
    });
  }

  const redirect = (id) =>
    typeof id === "string" && Object.hasOwn(forge.redirects, id)
      ? forge.redirects[id]
      : id;
  const purchase = (entry) => {
    if (!object(entry) || typeof entry.id !== "string") return entry;
    const { id, rank } = entry;
    const root = legacyRoot(id);
    if (rank === 1 && roots.has(root)) return { id: root };
    const target = redirect(id);
    return target === id ? entry : { ...entry, id: target };
  };
  const acquisitions = (container) => {
    if (!object(container.acquisitions)) return;
    const entries = Object.entries(container.acquisitions);
    // A selection already recorded for the new entry takes precedence.
    for (const [id, value] of entries) {
      const target = redirect(id);
      if (target !== id && !Object.hasOwn(container.acquisitions, target)) {
        container.acquisitions[target] = value;
      }
    }
  };
  for (const stage of [0, 1])
    if (Array.isArray(draft.purchases?.[stage]))
      draft.purchases[stage] = draft.purchases[stage].map(purchase);
  acquisitions(draft);
  for (const level of Object.values(draft.progression?.levels ?? {})) {
    if (!object(level)) continue;
    if (Array.isArray(level.purchases))
      level.purchases = level.purchases.map(purchase);
    acquisitions(level);
  }
  if (Array.isArray(draft.play?.favorites?.abilities))
    draft.play.favorites.abilities =
      draft.play.favorites.abilities.map(redirect);
  return draft;
}

/** Keep prior learning as a reviewable plan under the new, smaller budget. */
function migrateWorkshopPlaytest(draft, forge) {
  if (!object(draft) || !object(draft.purchases) ||
      !Array.isArray(draft.purchases[0]) || !Array.isArray(draft.purchases[1]) ||
      !Array.isArray(draft.classDisciplines)) return;
  const origins = ["culture", "background"].map((kind) => ({
    choice: draft[kind],
    entry: forge.origins.find((record) => record.kind === kind && record.id === draft[kind]?.id),
  }));
  const cls = forge.classes.find((record) => record.id === draft.classId);
  const oldRoots = [...draft.classDisciplines];
  const originalOriginEntries = [];
  for (const { choice, entry } of origins) {
    const pair = (entry?.bookPairs ?? entry?.pairs)?.[choice?.pair];
    if (!pair) continue;
    oldRoots.unshift(pair.disciplineId);
    if (pair.entryId) originalOriginEntries.push(pair.entryId);
  }
  const [culture, background] = origins;
  // Retain origin indices where possible. When an old build doubled up,
  // prefer the closest distinct choices and leave the old learning in the plan.
  const ranked = ({ choice, entry }) => entry?.pairs.map((_, index) => index)
    .sort((a, b) => Number(b === choice?.pair) - Number(a === choice?.pair)) ?? [];
  const classes = [...new Set([...draft.classDisciplines, ...(cls?.disciplineIds ?? [])])]
    .filter((id) => cls?.disciplineIds.includes(id));
  let triple;
  if (culture.choice?.pair >= 0 && background.choice?.pair >= 0 && draft.classDisciplines.length) {
    const possibilities = [];
    for (const first of ranked(culture)) for (const second of ranked(background)) for (const discipline of classes) {
      const roots = [culture.entry.pairs[first].disciplineId, background.entry.pairs[second].disciplineId, discipline];
      if (new Set(roots).size === 3) possibilities.push({ first, second, discipline, roots });
    }
    triple = possibilities[0];
  }
  if (triple) {
    culture.choice.pair = triple.first;
    background.choice.pair = triple.second;
    draft.classDisciplines = [triple.discipline];
  } else draft.classDisciplines = classes.slice(0, Number(draft.classDisciplines.length > 0));
  const granted = new Set(triple?.roots ?? [
    culture.entry?.pairs[culture.choice?.pair]?.disciplineId,
    background.entry?.pairs[background.choice?.pair]?.disciplineId,
    ...draft.classDisciplines,
  ]);
  const known = new Set(forge.disciplines.map(({ id }) => id));
  const desired = [
    ...oldRoots.filter((id) => known.has(id)).map((id) => ({ id })),
    ...originalOriginEntries.map((id) => ({ id })),
    ...draft.purchases[0],
    ...draft.purchases[1],
  ];
  const seen = new Set(granted);
  draft.purchases = { 0: [], 1: desired.filter((entry) => {
    if (!object(entry)) return true; // The bounded parser reports malformed input.
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  }) };
}

/** Import choices, never trusted derived statistics, executable content or Actor IDs. */
export function readPortableCharacter(input, catalogs, languages) {
  if (
    typeof input === "string" &&
    new TextEncoder().encode(input).length > MAX_CHARACTER_BYTES
  )
    throw new Error("Character file is too large.");
  const value = typeof input === "string" ? JSON.parse(input) : input;
  if (
    !object(value) ||
    value.format !== PORTABLE_FORMAT ||
    ![1, 2, PORTABLE_VERSION, FORGE_PORTABLE_VERSION, WORKSHOP_PLAYTEST_VERSION, WORKSHOP_REWRITE_VERSION, SPELLBOOK_PROGRESSION_VERSION].includes(
      value.schemaVersion,
    )
  )
    throw new Error("Choose a supported Heroes of Legend character JSON file.");
  if (!catalogs.forge && value.schemaVersion >= FORGE_PORTABLE_VERSION)
    throw new Error(
      "Open this character in the current Character Workshop. This Foundry version uses the earlier character format.",
    );
  const schemaVersion = portableVersion(catalogs);
  const d = currentCreationDraft(value.draft, value.sourceCommit);
  if (catalogs.forge && value.schemaVersion < FORGE_PORTABLE_VERSION)
    migrateForgeChoices(d, catalogs);
  if ((catalogs.forge?.playtest || catalogs.forge?.rulesRevision === 299) && value.schemaVersion < WORKSHOP_PLAYTEST_VERSION)
    migrateWorkshopPlaytest(d, catalogs.forge);
  if (catalogs.forge?.rulesRevision === 299 && value.schemaVersion < WORKSHOP_REWRITE_VERSION) reviseForgeLearning(d, catalogs.forge);
  if (catalogs.forge?.spellbookProgressionRevision === 310 && value.schemaVersion < SPELLBOOK_PROGRESSION_VERSION) reviseSpellbookLearning(d, catalogs.forge);
  if (catalogs.forge?.rulesRevision === 299) reviseSmallTalents(d, catalogs.forge);
  const fail = () => {
    throw new Error("The character file contains malformed creation choices.");
  };
  if (
    !object(d) ||
    !string(d.name) ||
    !object(d.attributes) ||
    !ATTRIBUTES.every(
      (key) => integer(d.attributes[key]) && Math.abs(d.attributes[key]) <= 2,
    ) ||
    !strings(d.traitIds) ||
    !strings(d.classDisciplines) ||
    !object(d.languages) ||
    !string(d.languages.home) ||
    !strings(d.languages.extraSpoken) ||
    !object(d.purchases) ||
    !object(d.acquisitions) ||
    !Array.isArray(d.shopping) ||
    d.shopping.length > 200
  )
    fail();
  const draft = {
    name: d.name,
    attributes: Object.fromEntries(
      ATTRIBUTES.map((key) => [key, d.attributes[key]]),
    ),
    traitIds: [...d.traitIds],
    classDisciplines: [...d.classDisciplines],
    languages: {
      home: d.languages.home,
      extraSpoken: [...d.languages.extraSpoken],
    },
    purchases: {},
    acquisitions: {},
    shopping: [],
  };
  for (const key of [
    "ancestryId",
    "borrowedAncestryId",
    "borrowedTraitId",
    "classId",
    "signatureId",
    "rememberedCommunity",
  ])
    if (d[key] !== undefined) {
      if (!string(d[key])) fail();
      draft[key] = d[key];
    }
  if (d.languages.ancestry !== undefined) {
    if (!string(d.languages.ancestry)) fail();
    draft.languages.ancestry = d.languages.ancestry;
  }
  for (const key of ["culture", "background"])
    if (d[key] !== undefined) {
      if (!object(d[key]) || !string(d[key].id) || !integer(d[key].pair))
        fail();
      draft[key] = { id: d[key].id, pair: d[key].pair };
    }
  for (const stage of [0, 1]) {
    if (!Array.isArray(d.purchases[stage]) || d.purchases[stage].length > 200)
      fail();
    draft.purchases[stage] = d.purchases[stage].map((p) => {
      if (
        !object(p) ||
        !string(p.id) ||
        (p.recipeIds !== undefined && !strings(p.recipeIds, 2)) ||
        (p.rank !== undefined && (!integer(p.rank) || p.rank < 1 || p.rank > 3))
      )
        fail();
      return {
        id: p.id,
        ...(p.rank !== undefined ? { rank: p.rank } : {}),
        ...(p.recipeIds ? { recipeIds: [...p.recipeIds] } : {}),
      };
    });
  }
  if (Object.keys(d.acquisitions).length > 400) fail();
  for (const [id, entry] of Object.entries(d.acquisitions)) {
    const keyPattern = catalogs.forge
      ? /^[a-z0-9:-]{1,200}$/
      : /^ability-[a-z0-9-]+$/;
    if (!keyPattern.test(id) || !object(entry)) fail();
    const result = {};
    for (const key of ["languageId", "specialty", "instrument"]) {
      if (entry[key] !== undefined) {
        if (
          !string(entry[key]) ||
          entry[key].length > (key === "languageId" ? 64 : 120)
        )
          fail();
        result[key] = entry[key];
      }
    }
    if (entry.weapon !== undefined) {
      if (!string(entry.weapon)) fail();
      result.weapon = entry.weapon;
    }
    if (entry.meleeHands !== undefined) {
      if (!integer(entry.meleeHands)) fail();
      result.meleeHands = entry.meleeHands;
    }
    if (entry.recipes !== undefined) {
      if (!strings(entry.recipes)) fail();
      result.recipes = [...entry.recipes];
    }
    draft.acquisitions[id] = result;
  }
  draft.shopping = d.shopping.map((p) => {
    if (
      !object(p) ||
      !string(p.id) ||
      !integer(p.quantity) ||
      p.quantity < 1 ||
      p.quantity > 10000 ||
      !integer(p.hands ?? 0)
    )
      fail();
    if (
      p.instanceId !== undefined &&
      !/^shop-[a-z0-9-]{1,80}$/.test(p.instanceId)
    )
      fail();
    return {
      id: p.id,
      quantity: p.quantity,
      hands: p.hands ?? 0,
      ...(p.instanceId ? { instanceId: p.instanceId } : {}),
    };
  });
  if (d.coinOverride !== undefined) {
    if (typeof d.coinOverride !== "boolean") fail();
    draft.coinOverride = d.coinOverride;
  }
  for (const key of ["loadout", "basicActions"]) {
    if (d[key] === undefined) continue;
    if (!object(d[key]) || Object.keys(d[key]).length > 500) fail();
    draft[key] = {};
    for (const [id, entry] of Object.entries(d[key])) {
      if (!/^[a-z0-9:-]{1,200}$/.test(id)) fail();
      if (key === "basicActions") {
        if (!id.startsWith("ability-") || typeof entry !== "boolean") fail();
        draft[key][id] = entry;
      } else {
        if (!object(entry)) fail();
        draft[key][id] = {};
        for (const prop of ["carried", "worn", "held"])
          if (entry[prop] !== undefined) {
            if (typeof entry[prop] !== "boolean") fail();
            draft[key][id][prop] = entry[prop];
          }
      }
    }
  }
  if (d.progression !== undefined) {
    if (
      !object(d.progression) ||
      !integer(d.progression.level) ||
      d.progression.level < 1 ||
      d.progression.level > 100 ||
      !object(d.progression.levels)
    )
      fail();
    draft.progression = { level: d.progression.level, levels: {} };
    for (const [level, entry] of Object.entries(d.progression.levels)) {
      if (
        !/^(?:[2-9]|[1-9]\d|100)$/.test(level) ||
        Number(level) < 2 ||
        Number(level) > 100 ||
        !object(entry)
      )
        fail();
      // Reuse the same bounded purchase/acquisition parser for every level.
      const nested = readPortableCharacter(
        {
          format: PORTABLE_FORMAT,
          schemaVersion,
          sourceCommit: catalogs.commit,
          draft: {
            ...draft,
            progression: undefined,
            purchases: { 0: [], 1: entry.purchases },
            acquisitions: entry.acquisitions ?? {},
          },
        },
        catalogs,
        languages,
      ).draft;
      const signatures = {};
      if (entry.signatures !== undefined && !object(entry.signatures)) fail();
      for (const [tier, id] of Object.entries(entry.signatures ?? {})) {
        if (!["3", "7"].includes(tier) || !string(id)) fail();
        signatures[tier] = id;
      }
      draft.progression.levels[level] = {
        purchases: nested.purchases[1],
        acquisitions: nested.acquisitions,
        signatures,
      };
    }
  }
  if (d.play !== undefined)
    draft.play = normalizeWorkshopPlay(d.play, catalogs, {
      migrateLegacy: value.schemaVersion < FORGE_PORTABLE_VERSION,
    });
  if (d.profile !== undefined) {
    if (!object(d.profile)) fail();
    draft.profile = {};
    for (const key of ["pronouns", "player", "story"])
      if (d.profile[key] !== undefined) {
        if (!string(d.profile[key], key === "story" ? 10000 : 200)) fail();
        draft.profile[key] = d.profile[key];
      }
  }
  if (d.learningReview !== undefined) {
    if (!strings(d.learningReview, 500)) fail();
    draft.learningReview = [...d.learningReview];
  }
  const preview = workshopCharacter(draft, catalogs, languages);
  return { draft, preview };
}

export function writePortableCharacter(
  draft,
  catalogs,
  { ready = false, languages } = {},
) {
  const value = {
    format: PORTABLE_FORMAT,
    schemaVersion: portableVersion(catalogs),
    sourceCommit: catalogs.commit,
    draft,
  };
  const normalized = readPortableCharacter(value, catalogs, languages);
  if (ready && !normalized.preview.valid)
    throw new Error(
      "Finish the choices in Review before exporting a ready character. You can save a draft at any time.",
    );
  const text = JSON.stringify(
    {
      ...value,
      status: normalized.preview.valid ? "ready" : "draft",
      draft: normalized.draft,
    },
    null,
    2,
  );
  if (new TextEncoder().encode(text).length > MAX_CHARACTER_BYTES)
    throw new Error(
      "Character file is too large. Shorten the draft before saving.",
    );
  return text;
}
