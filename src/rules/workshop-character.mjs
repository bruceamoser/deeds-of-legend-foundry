import { forgeAncestryBenefits } from "./forge-ancestry.mjs";
import { forgeAdvancement, forgeArmorRequirement } from "./forge-character.mjs";
import { isForgeRitual } from "./forge-casting.mjs";
import { forgeMaximums } from "./forge-vitals.mjs";
import { workshopPlay } from "./workshop-play.mjs";
import { creationPreview } from "./creation.mjs";
import { awardMilestones } from "./development.mjs";
import { advancementPreview } from "./advancement.mjs";
import { passiveDefenseSources } from "./passive-defenses.mjs";
import { currentAncestryId, ancestryBenefits, ancestrySelection } from "./ancestry.mjs";
import { nativeForgeArmorSources, untrainedArmorPenalty } from "./native-armor.mjs";
import { addTrainingEquipment, STARTING_PROVISIONS } from "./training-equipment.mjs";

export const emptyLevelDraft = () => ({
  purchases: [],
  signatures: {},
  acquisitions: {},
});

/** Rebuild from choices so lowering/revisiting a level cannot duplicate grants. */
export function workshopCharacter(draft, catalogs, languages, { projectInventory, projectAttributes } = {}) {
  languages ??= catalogs.languages;
  draft = { ...draft, ancestryId: currentAncestryId(draft.ancestryId) };
  const effectiveTraitIds = ancestrySelection(draft, catalogs.choices).traitIds;
  const creation = creationPreview(
    draft,
    catalogs.choices,
    catalogs.inventory,
    languages,
    catalogs.forge,
  );
  const playtest = Boolean(catalogs.forge?.playtest || catalogs.forge?.rulesRevision === 299);
  const dpBase = playtest ? 4 : 8;
  const target = draft.progression?.level ?? 1;
  if (!Number.isSafeInteger(target) || target < 1 || target > 100)
    throw new Error("Choose a whole level from 1 to 100.");
  let state = {
    ...structuredClone(creation.state),
    level: 1,
    stage: "advancement",
    dp: playtest ? creation.state.dp : 0,
    items: structuredClone(creation.inventory.items),
    safePlace: true,
  };
  let maximumHpDelta = 0;
  const errors = [...creation.errors],
    levels = {},
    advancementLedger = [];
  for (let level = 2; level <= target; level++) {
    state = awardMilestones(state, level, { dpBase });
    state.safePlace = true; // Browser planning; native commitment retains campaign authority.
    const before = structuredClone(state);
    const levelPlan = draft.progression?.levels?.[level] ?? emptyLevelDraft();
    const currentPlay = workshopPlay(draft, state.items, state.languages ?? [], catalogs);
    const result = catalogs.forge
      ? forgeAdvancement(state, levelPlan, catalogs, languages, currentPlay)
      : advancementPreview(state, levelPlan, catalogs.choices, catalogs.inventory, languages, {
          knownLanguages: currentPlay.languages,
          ownedItems: currentPlay.inventory,
        });
    state = result.state;
    maximumHpDelta += result.maximumHpDelta;
    errors.push(
      ...result.errors.map((e) => ({
        ...e,
        level,
        ...(e.code === "signature" ? { signatureTier: e.level } : {}),
      })),
    );
    levels[level] = { before, ...result };
    advancementLedger.push(
      { kind: "award", level, delta: dpBase + level + ancestryBenefits(effectiveTraitIds).additionalDpPerLevel },
      ...result.ledger,
    );
  }
  if (catalogs.forge?.rulesRevision === 299)
    addTrainingEquipment(state.items, state, catalogs.inventory, draft);
  const play = workshopPlay(
    draft,
    state.items,
    state.languages ?? creation.summary?.languages ?? [],
    catalogs,
  );
  const mappedItems = play.inventory.map((item) => {
    const definition = catalogs.inventory.equipment.find(
      (r) => r.id === item.catalogId,
    );
    const saved = draft.loadout?.[item.instanceId];
    const carried = saved?.carried !== false && item.quantity > 0;
    return {
      ...item,
      carried,
      worn: carried && (saved?.worn ?? item.instanceId === "creation-outfit"),
      held: carried && (saved?.held ?? false),
      inventoryDie: item.inventoryDie ?? definition.inventoryDie,
      bulk: definition.bulk * item.quantity,
      definition,
    };
  });
  const projection = projectInventory?.(mappedItems) ?? { items: mappedItems, additional: [] };
  const items = projection.items;
  const burdenItems = [...items, ...(projection.additional ?? [])];
  const outfit = items.find(
    (i) => i.catalogId === "item-travel-clothes" && i.worn,
  );
  // Exactly one worn outfit remains descriptive; spare outfits still count.
  const bulk = Math.max(0, burdenItems.filter(item => item.carried).reduce((sum, item) => sum + item.bulk, 0)
    - (outfit ? outfit.bulk / outfit.quantity : 0));
  let attributes = { ...draft.attributes };
  if (catalogs.forge && items.some((item) => item.worn && item.catalogId === "item-cincture-of-might"))
    attributes.brawn += 1;
  if (projectAttributes) attributes = projectAttributes(attributes);
  if (catalogs.forge?.rulesRevision === 299)
    attributes.agility -= untrainedArmorPenalty(state.learned, burdenItems);
  const stowedBulk = burdenItems.filter(item => item.carried && !item.worn && !item.held).reduce((sum, item) => sum + item.bulk, 0);
  const ancestry = forgeAncestryBenefits(effectiveTraitIds, catalogs.forge, { stowedBulk });
  const armorBulkRelief = catalogs.forge?.rulesRevision === 299 && state.learned.includes("armor:harness:1")
    ? Math.min(1, items.filter(item => item.worn && state.learned.includes(forgeArmorRequirement(item.catalogId, true))).reduce((sum, item) => sum + item.bulk, 0)) : 0;
  const capacity = 10 + 3 * attributes.brawn + ancestry.capacityBonus;
  const encumbrance = Math.max(0, bulk - armorBulkRelief - capacity);
  const passive = passiveDefenseSources({
    abilities: state.abilities.map((id) => ({
      catalogId: id,
      instanceId: id,
      source: catalogs.choices.find((r) => r.id === id)?.source,
    })),
    equipment: items.filter((item) => !catalogs.forge || !forgeArmorRequirement(item.catalogId, playtest)).map((i) => ({ ...i, source: i.definition.source })),
  });
  if (catalogs.forge?.rulesRevision === 299) {
    passive.resistances.push(...nativeForgeArmorSources(burdenItems));
  } else if (catalogs.forge) {
    for (const item of items.filter((entry) => entry.worn)) {
      const required = forgeArmorRequirement(item.catalogId, playtest);
      if (required && state.learned.includes(required))
        passive.resistances.push({ type: "physical", value: playtest ? item.definition.physicalResistance : Number(required.at(-1)), label: item.definition.name });
    }
  }
  const resistances = {};
  for (const source of passive.resistances)
    resistances[source.type] = Math.min(
      3,
      Math.max(resistances[source.type] ?? 0, source.value),
    );
  const spent = [...creation.ledger, ...advancementLedger]
    .filter((e) => e.kind === "purchase")
    .reduce((n, e) => n - e.delta, 0);
  const total =
    creation.ledger.reduce((n, e) => n + Math.max(0, e.delta), 0) +
    advancementLedger
      .filter((e) => e.kind === "award")
      .reduce((n, e) => n + e.delta, 0);
  const expired = creation.ledger
    .filter((e) => e.kind === "expired-pool")
    .reduce((n, e) => n - e.delta, 0);
  const limits = catalogs.forge && creation.summary ? forgeMaximums({
    level: target,
    ancestryHp: catalogs.choices.find((entry) => entry.id === draft.ancestryId).hp,
    classHp: catalogs.choices.find((entry) => entry.id === draft.classId).hp,
    fortitude: draft.attributes.fortitude,
    fixedHp: ancestry.maximumHpBonus,
    capacitySp: state.learning.capacitySp,
    startingSp: creation.summary.startingSp,
  }) : null;
  const unresolved = errors.filter(
    (e) =>
      e.code !== "signature" ||
      !e.signatureTier ||
      (state.pendingSignatures ?? []).includes(e.signatureTier),
  );
  const soldCoins = (draft.play?.inventory?.sold ?? []).reduce((total, instanceId) => {
    const purchase = draft.shopping?.find(item => item.instanceId === instanceId && item.quantity === 1);
    const definition = catalogs.inventory.equipment.find(item => item.id === purchase?.id);
    return total + (STARTING_PROVISIONS.includes(definition?.id) ? Math.floor(definition.price / 2) : 0);
  }, 0);
  return {
    ...creation,
    creation,
    state,
    valid: unresolved.length === 0,
    errors: unresolved,
    limits,
    attributes,
    play,
    levels,
    advancementLedger,
    development: { level: target, current: state.dp, spent, total, expired },
    inventory: { ...creation.inventory, remainingCoins: creation.inventory.remainingCoins + soldCoins, items, bulk, capacity, encumbrance },
    resistances,
    passiveSources: passive.resistances,
    summary: creation.summary
      ? {
          ...creation.summary,
          languages: state.languages ?? creation.summary.languages,
          maximumHp: limits?.maxHp ?? creation.summary.maximumHp + maximumHpDelta,
          ...(limits ? { maximumSp: limits.maxSp } : {}),
          gritGranted: state.gritGranted,
          speed: Math.max(0, creation.summary.unencumberedSpeed + attributes.agility - draft.attributes.agility - encumbrance +
            Number(catalogs.forge?.rulesRevision === 299 && state.learned.includes("armor:harness:3") && items.some(item => item.worn && state.learned.includes(forgeArmorRequirement(item.catalogId, true))))),
        }
      : null,
  };
}

export function workshopAbility(character, record) {
  if (!record) return undefined;
  record = character.state.signatureComponents?.find(entry => entry.id === record.id) ?? record;
  const improvements = character.state.learning?.improvements.get(record.id) ?? [];
  const currentAction = improvements.map((entry) => entry.effect.match(
    /takes (?:a |an )?(Main Action|Maneuver|Reaction)\b/i,
  )?.[1]).find(Boolean);
  return currentAction ? { ...record, currentAction } : record;
}

export function actionTiming(record) {
  if (isForgeRitual(record)) return ["Main Action"];
  const action = record.currentAction ??
    record.reference?.rules.details.find((d) => d.label === "Action")?.value ??
    record.actionText ?? record.action ?? "Passive";
  if (/^Passive/i.test(action)) return ["Passive"];
  const groups = [
    [/Main Action/i, "Main Action"],
    [/Maneuver/i, "Maneuver"],
    [/Reaction/i, "Reaction"],
  ]
    .filter(([pattern]) => pattern.test(action))
    .map(([, group]) => group);
  return groups.length
    ? groups
    : [/Movement/i.test(action) ? "Movement" : "Other"];
}

/** Visible weapon basics derive from owned gear, not the first six learned cards. */
export function mainActions(character, draft, catalogs) {
  const get = (id) => workshopAbility(character, catalogs.choices.find((r) => r.id === id));
  const has = (id) =>
    character.inventory.items.some((i) => i.catalogId === id && i.carried);
  const records = character.state.abilities
    .map(get)
    .filter(Boolean)
    .map((record) => ({ record, basic: false, visible: true }));
  for (const record of catalogs.choices.filter((r) => r.universal)) {
    let available = true;
    if (record.id === "ability-opportunity-attack" && catalogs.forge) {
      const held = character.inventory.items.filter((item) => item.held);
      available = held.some((item) => item.catalogId === "item-ordinary-melee-weapon") ||
        held.reduce((used, item) => used + (item.hands || 1), 0) < 2;
    } else if (["ability-basic-melee", "ability-opportunity-attack"].includes(record.id))
      available = has("item-ordinary-melee-weapon");
    if (record.id === "ability-basic-ranged")
      available = has("item-ordinary-ranged-weapon");
    if (record.id === "ability-shield-block")
      available = has("item-ordinary-shield");
    const visible = draft.basicActions?.[record.id] ?? available;
    if (!records.some((r) => r.record.id === record.id))
      records.push({ record, basic: true, visible, available });
  }
  return records;
}

export function craftingActions(character, catalogs) {
  return character.state.recipes.flatMap((id) => {
    const recipe = catalogs.inventory.recipes.find((r) => r.id === id);
    if (!recipe) return [];
    return (catalogs.forge ? [catalogs.forge.rulesRevision === 299 ? "craft:workshop:1" : "craft:supplies:1"] : recipe.permissions)
      .filter((id) => (catalogs.forge ? character.state.learned : character.state.abilities).includes(id))
      .map((abilityId) => {
        const ability = catalogs.choices.find((r) => r.id === abilityId);
        const attribute = ability?.reference?.rules.details.find(
          (d) => d.label === "Attribute",
        )?.value;
        return { recipe, ability, attribute };
      });
  });
}
