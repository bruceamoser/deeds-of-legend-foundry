import {forgeSignatureComponent} from "./forge-signatures.mjs";
import { sustainLimit } from "./forge-sustain.mjs";
import { WOUND_TABLES } from "./damage.mjs";
import { legacyWaterSupplyDie } from "./inventory.mjs";
import { woundRoll } from "./wounds.mjs";
import { normalizeForgeRecovery } from "./forge-recovery.mjs";
import { normalizeRecovery } from "./recovery.mjs";
import { LEARNED_GEAR_PREFIX } from "./training-equipment.mjs";
import {
  CONDITION_KINDS,
  conditionSummary,
  validateContributions,
} from "./conditions.mjs";

const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
const text = (value, max = 200) =>
  typeof value === "string" && value.length <= max;
const instance = (value) => text(value) && /^[a-z0-9:-]{1,200}$/.test(value);
const list = (value, max = 500) => Array.isArray(value) && value.length <= max;

// These labels were previously written directly into the portable structure.
const favoriteSectionLabels = ["Main Action", "Maneuver", "Reaction", "Movement", "Passive"];
export function favoriteSectionKey(label) {
  return `favorites-${label.toLowerCase().replaceAll(" ", "-")}`;
}
const oldFavoriteKeys = new Map(favoriteSectionLabels.map(label =>
  [`favorites-${label}`, favoriteSectionKey(label)]));


/** Explicit play edits stay separate from acquisition and creation receipts. */
export function normalizeWorkshopPlay(
  value,
  catalogs,
  { migrateLegacy = false } = {},
) {
  const fail = () => {
    throw new Error("The character file contains malformed play controls.");
  };
  if (!object(value)) fail();
  const result = {
    inventory: { added: [], removed: [] },
    languages: { added: [], removed: [] },
    conditions: [],
  };
  if (value.recovery !== undefined) {
    try {
      result.recovery = catalogs.forge?.rulesRevision === 299 ? normalizeForgeRecovery(value.recovery) : normalizeRecovery(value.recovery);
    } catch {
      fail();
    }
  }
  const numericLimits = { hp: 1000000, failedDeathRolls: 3 };
  if (catalogs.forge)
    Object.assign(numericLimits, {
      sp: 1000000,
      successfulDeathRolls: 2,
      lastRestHour: Number.MAX_SAFE_INTEGER,
    });
  if (catalogs.forge?.playtest || catalogs.forge?.rulesRevision === 299) numericLimits.workshopTurn = Number.MAX_SAFE_INTEGER - 10;
  for (const [key, maximum] of Object.entries(numericLimits)) {
    if (value[key] !== undefined) {
      if (
        !Number.isSafeInteger(value[key]) ||
        value[key] < 0 ||
        value[key] > maximum
      )
        fail();
      result[key] = value[key];
    }
  }
  if (value.gritSpent !== undefined) {
    if (
      !Number.isSafeInteger(value.gritSpent) ||
      value.gritSpent < 0 ||
      value.gritSpent > 10000
    )
      fail();
    result.gritSpent = value.gritSpent;
  }
  if (catalogs.forge) {
    for (const key of [
      "dying",
      "dead",
      "firstAidUsed",
      "firstAidPending",
      "immediateDeathRoll",
      "spellcraftRecoveryUsed",
      "soulWellspringUsed",
      "mindPalaceUsed",
    ]) {
      if (value[key] === undefined) continue;
      if (typeof value[key] !== "boolean") fail();
      result[key] = value[key];
    }
    if (catalogs.forge.playtest || catalogs.forge.rulesRevision === 299) {
      for (const key of ["maneuverSpent", "mainSpent"]) {
        if (value[key] === undefined) continue;
        if (typeof value[key] !== "boolean") fail();
        result[key] = value[key];
      }
      if (value.sustain !== undefined) {
        if (!object(value.sustain)) fail();
        const { spellId, castTurn, maintainedTurn } = value.sustain;
        const turn = result.workshopTurn ?? 0;
        if (!text(spellId) ||
            !Number.isSafeInteger(castTurn) || !Number.isSafeInteger(maintainedTurn) ||
            castTurn < 0 || maintainedTurn < castTurn || maintainedTurn > turn) fail();
        const record = catalogs.forge.spells.find(spell => spell.id === spellId)
          ?? forgeSignatureComponent(catalogs.forge,spellId);
        const limit = sustainLimit(record);
        if (limit && turn < castTurn + limit && turn <= maintainedTurn + 1)
          result.sustain = { spellId, castTurn, maintainedTurn };
      }
    }
    if (value.gritTrigger !== undefined) {
      if (
        ![null, "fall", "failure", "stable", "turn-start"].includes(
          value.gritTrigger,
        )
      )
        fail();
      result.gritTrigger = value.gritTrigger;
    }
    if (value.scars !== undefined) {
      if (
        !list(value.scars, 200) ||
        value.scars.some((scar) => !text(scar, 2500) || !scar.trim())
      )
        fail();
      result.scars = value.scars.map((scar) => scar.trim());
    }
    if (migrateLegacy && value.lastWords === true) {
      result.hp = 0;
      result.dead = false;
      result.dying = true;
      result.failedDeathRolls = 3;
      result.gritTrigger = "failure";
    }
  } else if (value.lastWords !== undefined) {
    if (typeof value.lastWords !== "boolean") fail();
    result.lastWords = value.lastWords;
  }
  if (value.collapsed !== undefined) {
    if (
      !object(value.collapsed) ||
      Object.keys(value.collapsed).length > 100 ||
      Object.entries(value.collapsed).some(
        ([k, v]) => (!instance(k) && !oldFavoriteKeys.has(k)) || typeof v !== "boolean",
      )
    )
      fail();
    result.collapsed = Object.fromEntries(Object.entries(value.collapsed)
      .filter(([key]) => instance(key)));
    for (const [oldKey, key] of oldFavoriteKeys) {
      if (Object.hasOwn(value.collapsed, oldKey) && !Object.hasOwn(result.collapsed, key))
        result.collapsed[key] = value.collapsed[oldKey];
    }
  }
  if (value.crafting !== undefined) {
    if (!object(value.crafting) || Object.keys(value.crafting).length > 100)
      fail();
    result.crafting = Object.fromEntries(
      Object.entries(value.crafting).map(([id, state]) => {
        const recipe = catalogs.inventory.recipes.find((r) => r.id === id);
        if (
          !recipe ||
          !object(state) ||
          ["progress", "completed", "attempts"].some(
            (k) =>
              !Number.isSafeInteger(state[k]) ||
              state[k] < 0 ||
              state[k] > 1000000,
          ) ||
          state.progress > (recipe.target ?? 0)
        )
          fail();
        if (state.active !== undefined && typeof state.active !== "boolean")
          fail();
        if (
          state.supplyId !== undefined &&
          state.supplyId !== "" &&
          !instance(state.supplyId)
        )
          fail();
        return [
          id,
          {
            active:
              state.active ??
              (state.progress > 0 && state.progress < (recipe.target ?? 0)),
            supplyId: state.supplyId ?? "",
            progress: state.progress,
            completed: state.completed,
            attempts: state.attempts,
          },
        ];
      }),
    );
  }
  if (value.favorites !== undefined) {
    if (!object(value.favorites)) fail();
    result.favorites = {};
    for (const key of ["abilities", "items"]) {
      const values = value.favorites[key] ?? [];
      if (!list(values, 1000) || !values.every(instance)) fail();
      result.favorites[key] = [...new Set(values)];
    }
  }
  if (value.wounds !== undefined && (!catalogs.forge || migrateLegacy)) {
    if (
      !list(value.wounds, 100) ||
      value.wounds.some(
        (w) =>
          !object(w) ||
          !instance(w.id) ||
          !text(w.name, 200) ||
          !w.name.trim() ||
          !text(w.notes, 2000),
      ) ||
      new Set(value.wounds.map((w) => w.id)).size !== value.wounds.length
    )
      fail();
    const wounds = value.wounds.map((w) => {
      const next = { id: w.id, name: w.name.trim(), notes: w.notes };
      if (catalogs.forge) return next;
      if (w.progress !== undefined) {
        if (
          !Number.isSafeInteger(w.progress) ||
          w.progress < 0 ||
          w.progress > 1000000
        )
          fail();
        next.progress = w.progress;
      }
      if (w.catalogId !== undefined) {
        if (
          !text(w.catalogId) ||
          !/^wound-(physical|elemental|mental|radiant|life)-[1-6]{3}$/.test(
            w.catalogId,
          ) ||
          ![
            "physical",
            "fire",
            "cold",
            "lightning",
            "mental",
            "radiant",
            "life",
          ].includes(w.damageType) ||
          !object(w.roll) ||
          !Number.isSafeInteger(w.roll.priorWounds) ||
          w.roll.priorWounds < 0 ||
          w.roll.priorWounds > 100
        )
          fail();
        const roll = woundRoll(w.roll.priorWounds, w.roll.faces);
        if (
          roll.key !== w.roll.key ||
          w.catalogId !== `wound-${WOUND_TABLES[w.damageType]}-${roll.key}`
        )
          fail();
        Object.assign(next, {
          catalogId: w.catalogId,
          damageType: w.damageType,
          roll: {
            priorWounds: w.roll.priorWounds,
            faces: [...w.roll.faces],
            key: roll.key,
          },
        });
      }
      return next;
    });
    if (catalogs.forge) {
      const scars = wounds.map(({ name, notes }) =>
        notes.trim() ? `${name} — ${notes.trim()}` : name,
      );
      result.scars = [...(result.scars ?? []), ...scars];
      if (!list(result.scars, 200)) fail();
    } else result.wounds = wounds;
  }
  if (value.memorizedMessage !== undefined) {
    if (
      !text(value.memorizedMessage, 5000) ||
      value.memorizedMessage.trim().split(/\s+/).filter(Boolean).length > 50
    )
      fail();
    result.memorizedMessage = value.memorizedMessage;
  }
  if (value.inventory !== undefined) {
    const inv = value.inventory;
    if (
      !object(inv) ||
      !list(inv.added) ||
      !list(inv.removed) ||
      !inv.removed.every(instance)
    )
      fail();
    if (inv.overrides !== undefined) {
      if (!object(inv.overrides) || Object.keys(inv.overrides).length > 1000)
        fail();
      result.inventory.overrides = Object.fromEntries(
        Object.entries(inv.overrides).map(([id, v]) => {
          if (
            !instance(id) ||
            !object(v) ||
            Object.keys(v).some(
              (k) => !["quantity", "inventoryDie", "name", "waterUnits"].includes(k),
            )
          )
            fail();
          const next = {};
          if (v.name !== undefined) {
            if (typeof v.name !== "string" || !v.name.trim() || v.name.trim().length > 200) fail();
            next.name = v.name.trim();
          }
          if (v.quantity !== undefined) {
            if (
              !Number.isSafeInteger(v.quantity) ||
              v.quantity < 0 ||
              v.quantity > 10000
            )
              fail();
            next.quantity = v.quantity;
          }
          if (v.inventoryDie !== undefined) {
            if (![0, 4, 6, 8, 10, 12, 20].includes(v.inventoryDie)) fail();
            next.inventoryDie = v.inventoryDie;
          }
          if (v.waterUnits !== undefined) {
            if (!Number.isSafeInteger(v.waterUnits) || v.waterUnits < 0 || v.waterUnits > 10000) fail();
            if (!next.inventoryDie) next.inventoryDie = legacyWaterSupplyDie(v.waterUnits);
          }
          return [id, next];
        }),
      );
    }
    const seen = new Set();
    result.inventory.removed = [...new Set(inv.removed)];
    if (inv.ammunition !== undefined) {
      if (!object(inv.ammunition) || Object.keys(inv.ammunition).length > 500 ||
          !Object.entries(inv.ammunition).every(([weapon, ammo]) => instance(weapon) && instance(ammo))) fail();
      result.inventory.ammunition = { ...inv.ammunition };
    }
    if (inv.sold !== undefined) {
      if (!list(inv.sold, 4) || !inv.sold.every(id => instance(id) && /^shop-starter-/.test(id) && result.inventory.removed.includes(id))) fail();
      result.inventory.sold = [...new Set(inv.sold)];
    }
    result.inventory.added = inv.added.map((item) => {
      if (
        !object(item) ||
        !text(item.instanceId, 90) ||
        !/^inventory-[a-z0-9-]+$/.test(item.instanceId) ||
        seen.has(item.instanceId) ||
        !catalogs.inventory.equipment.some((r) => r.id === item.id) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 10000
      )
        fail();
      seen.add(item.instanceId);
      return {
        instanceId: item.instanceId,
        id: item.id,
        quantity: item.quantity,
      };
    });
  }
  if (value.languages !== undefined) {
    const langs = value.languages;
    if (
      !object(langs) ||
      !list(langs.added, 100) ||
      !list(langs.removed, 100) ||
      !langs.removed.every((id) => text(id, 80))
    )
      fail();
    result.languages.removed = [...new Set(langs.removed)];
    const ids = new Set();
    result.languages.added = langs.added.map((lang) => {
      if (
        !object(lang) ||
        !text(lang.id, 80) ||
        !/^[a-z0-9-]+$/.test(lang.id) ||
        ids.has(lang.id) ||
        !text(lang.name, 80) ||
        !lang.name.trim() ||
        !["spoken", "signed"].includes(lang.form) ||
        typeof lang.written !== "boolean"
      )
        fail();
      ids.add(lang.id);
      return {
        id: lang.id,
        name: lang.name.trim(),
        form: lang.form,
        written: lang.written,
      };
    });
  }
  if (value.conditions !== undefined) {
    if (!list(value.conditions, 100)) fail();
    const wounds = catalogs.forge && migrateLegacy ? (value.wounds ?? []) : [];
    result.conditions = value.conditions
      .map((c) => {
        if (
          !object(c) ||
          !text(c.id, 80) ||
          !text(c.source, 200) ||
          !Object.hasOwn(CONDITION_KINDS, c.key) ||
          !Number.isSafeInteger(c.rating) ||
          c.rating > 10000
        )
          fail();
        return {
          id: c.id,
          key: c.key,
          source: c.source,
          rating: c.rating,
          persistence: c.persistence,
        };
      })
      .filter(
        (condition) =>
          !wounds.some(
            (wound) =>
              condition.id.startsWith(`${wound.id}-`) &&
              condition.source === wound.name,
          ),
      );
    validateContributions(result.conditions);
  }
  return result;
}

export function itemArrangement(previous, prop, value) {
  if (!["carried", "held", "worn"].includes(prop) || typeof value !== "boolean")
    throw new Error("Choose a carried, held or worn state.");
  const next = {
    carried: previous?.carried ?? true,
    held: previous?.held ?? false,
    worn: previous?.worn ?? false,
    [prop]: value,
  };
  if (prop === "carried" && !value) {
    next.held = false;
    next.worn = false;
  } else if (value && ["held", "worn"].includes(prop)) next.carried = true;
  return next;
}

export function workshopPlay(draft, inventoryItems, languages, catalogs) {
  const play = normalizeWorkshopPlay(draft.play ?? {}, catalogs);
  const inventory = [
    ...inventoryItems,
    ...play.inventory.added.map((item) => {
      const def = catalogs.inventory.equipment.find((r) => r.id === item.id);
      return {
        instanceId: item.instanceId,
        catalogId: item.id,
        quantity: item.quantity,
        hands: def.handChoices[0] ?? 0,
        inventoryDie: def.inventoryDie,
        source: item.instanceId.startsWith(LEARNED_GEAR_PREFIX) ? "training" : "play",
      };
    }),
  ]
    .filter((item) => !play.inventory.removed.includes(item.instanceId))
    .map((item) => ({
      ...item,
      ...play.inventory.overrides?.[item.instanceId],
      ...(play.inventory.ammunition?.[item.instanceId] ? { ammunitionInstanceId: play.inventory.ammunition[item.instanceId] } : {}),
    }));
  const known = new Map(
    languages.map((lang) => [lang.id, structuredClone(lang)]),
  );
  for (const lang of play.languages.added)
    known.set(lang.id, {
      id: lang.id,
      name: lang.name,
      form: lang.form,
      source: "play",
      permissions: {
        understand: true,
        express: true,
        speak: lang.form === "spoken",
        sign: lang.form === "signed",
        read: lang.written,
        write: lang.written,
      },
    });
  for (const id of play.languages.removed) known.delete(id);
  return {
    inventory,
    languages: [...known.values()],
    conditions: play.conditions,
    conditionSummary: conditionSummary(play.conditions),
  };
}
