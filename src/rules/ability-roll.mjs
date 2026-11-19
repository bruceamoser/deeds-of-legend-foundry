import {DAMAGE_TYPES} from "./damage.mjs";
import {fixedTieredAttackRiders,printedDamageChoices} from "./attack-outcomes.mjs";
import {canCustomizeWorkshopRoll,workshopRollAttributes,workshopRollSourceId} from "./workshop-ability.mjs";
import {basicAttackDamageProfile,nativeWeaponTrainingIds} from "./weapon-training.mjs";
import {reactionTrigger} from "./ability-roll-relevance.mjs";
/** Printed roll metadata is independent of whether an effect has an automation adapter. */
const TIERS = ['weak', 'standard', 'strong'];
const PHYSICAL_PROFILE = /\b(?:for|takes|deals) (\d+)\/(\d+)\/(\d+) physical damage\b/i;

const ATTRIBUTES = new Set(['brawn', 'fortitude', 'agility', 'guile', 'knowledge', 'reason']);
const SYSTEM_ID = 'heroes-of-legend';
export const WORKSHOP_ROLL_ATTRIBUTE_FLAG = 'rollAttributeOverride';
export function ownedWorkshopAbility(actor, id) {
  return actor?.items?.find(item => item.type === 'ability' &&
    item.getFlag(SYSTEM_ID, 'grantKind') === 'nativeWorkshop' && item.getFlag(SYSTEM_ID, 'catalogId') === id);
}
export function ownedWorkshopRollAttribute(actor, record) {
  const id = workshopRollSourceId(record?.id);
  if (!id || (id === record.id && !canCustomizeWorkshopRoll(record))) return null;
  const key = ownedWorkshopAbility(actor, id)?.getFlag(SYSTEM_ID, WORKSHOP_ROLL_ATTRIBUTE_FLAG);
  return ATTRIBUTES.has(key) ? key : null;
}
/** Resolve imported identity without guessing from a mutable display name. */
export function abilityCatalogRecord(item, records) {
  const flaggedId = item?.getFlag?.("heroes-of-legend", "catalogId");
  const ability = (record) => record.kind === "ability";
  if (flaggedId !== undefined && flaggedId !== null)
    return records.find((record) => ability(record) && record.id === flaggedId);
  const systemId = item?.system?.catalogId;
  const systemRecord = records.find(
    (record) => ability(record) && record.id === systemId,
  );
  if (systemRecord) return systemRecord;
  const source = item?.getFlag?.("heroes-of-legend", "source");
  if (typeof source?.path !== "string" || !source.path) return undefined;
  const matches = records.filter(
    (record) =>
      ability(record) &&
      record.source?.path === source.path &&
      (source.sha256 === undefined ||
        source.sha256 === null ||
        record.source.sha256 === source.sha256),
  );
  return matches.length === 1 ? matches[0] : undefined;
}
export function printedAbilityRoll(record) {
  const rules = record?.reference?.rules;
  const value = rules?.details?.find(detail => detail.label === 'Attribute')?.value?.trim().toLowerCase();
  const attribute = ATTRIBUTES.has(value) ? value : null;
  const outcomes = Object.fromEntries((rules?.body ?? []).flatMap(block => block.outcomes ?? [])
    .filter(outcome => ['weak','standard','strong'].includes(outcome.label.toLowerCase()))
    .map(outcome => [outcome.label.toLowerCase(),outcome.text]));
  return {attribute, outcomes: {...outcomes, ...(record?.reference?.rollOutcomes ?? {})}};
}
/** Use explicit attack profiles from the current authored Forge paths. */
function forgeWeaponAttack(record, forge, learned) {
  if (!record?.pathId || record.improves || !workshopRollAttributes(record).length) return null;
  const path = record.pathId;
  const family = record.weaponRequirement ? "melee"
    : /^arms:(bladework|dueling)$/.test(path) ? "melee"
    : path === "arms:unarmed" ? "unarmed"
    : path === "guard:shieldwork" ? (record.id.endsWith(":7") ? "melee" : "shield")
    : /^marksmanship:(precision|readiness)$/.test(path) ? "ranged"
    : path === "marksmanship:thrown-weapons" ? "thrown" : null;
  const effect = record.effect ?? "";
  // Table rulings that change resistance or replace the damage profile need
  // their printed options resolved before damage can be applied.
  if (!family || /(?:ignores?|ignoring|bypasses?) (?:up to )?\d+ physical resistance|instead strike/i.test(effect)) return null;
  const match = PHYSICAL_PROFILE.exec(effect);
  if (!match) return null;
  const improvements = (forge?.nodes ?? []).filter(node => node.improves === record.id && learned.includes(node.id));
  const profile = improvements.map(node => PHYSICAL_PROFILE.exec(node.effect)).filter(Boolean).at(-1) ?? match;
  const effects = [effect, ...improvements.map(node=>node.effect)];
  const outcomes = Object.fromEntries(TIERS.map((tier, index) => {
    const riders = fixedTieredAttackRiders(effects, tier);
    return [tier, [`${profile[index + 1]} physical damage`, ...riders].join("; ")];
  }));
  return {family, outcomes, effect:effects.join(" ")};
}

export function abilityRollConfiguration(item, record, forge) {
  const printed = printedAbilityRoll(record);
  const learned = nativeWeaponTrainingIds(item.actor);
  const technique = forgeWeaponAttack(record, forge, learned);
  const basic = item.actor?.type === "character" && basicAttackDamageProfile(learned, record?.id);
  const override = ownedWorkshopRollAttribute(item.actor, record);
  const attributes = workshopRollAttributes(record, override);
  const configured = item.system?.activity;
  const attribute = override ?? (record
    ? (technique || record.id === "ability-opportunity-attack" ? attributes[0] : printed.attribute)
    : configured?.rollMode === 'attribute' && ATTRIBUTES.has(configured.attribute)
      ? configured.attribute : null);
  const outcomes = technique?.outcomes ?? (basic
    ? Object.fromEntries(TIERS.map((tier, index) => [tier, `${basic[index]} physical damage`]))
    : record ? printed.outcomes : item.system?.outcomes);
  const rules=record?.reference?.rules;
  const tags=[...(rules?.details ?? []).filter(detail=>detail.label === "Type").map(detail=>detail.value),
    ...(rules?.notes ?? []).filter(note=>note.label === "Tags").map(note=>note.text)];
  const attack=Boolean(technique)||record?.id === "ability-opportunity-attack" ||tags.some(value=>String(value).split("/").some(tag=>tag.trim() === "Attack"));
  const ranged = technique?.family === "ranged" || attack && (/ranged weapon/i.test(JSON.stringify(record?.reference?.rules ?? {})) || record?.id === "ability-basic-ranged");
  const equipment=rules?.details?.find(detail=>detail.label === "Equipment / acquisition")?.value ?? "";
  const weaponKind=technique ? technique.family : record?.id === "ability-opportunity-attack" ? "opportunity" : attack ? ranged ? "ranged" : /melee weapon/i.test(equipment) ? "melee" : record?.id === "ability-basic-throw" ? "thrown" : record?.id === "ability-basic-unarmed" ? "unarmed" : null : null;
  const action = rules?.details?.find(detail=>detail.label==="Action")?.value ?? "";
  const category = /^Reaction\b/i.test(action) ? "reaction" : /^Maneuver\b/i.test(action) ? "maneuver" : /^Main Action\b/i.test(action) ? "main" : null;
  return {attributes,category,weaponRequirement:record?.weaponRequirement ?? null,forgeWeaponAttack:Boolean(technique),damageTypes:printedDamageChoices(record),itemUuid:item.uuid, name:item.name, attribute, attack, ranged, weaponKind, trigger:reactionTrigger(record),
    effect:technique?.effect ?? ((record?.reference?.rules?.body ?? []).flatMap(block=>block.text ? [block.text] : block.items ?? []).join(" ") || String(item.system?.description ?? "").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()),
    outcomes:Object.fromEntries(['weak','standard','strong'].map(tier => [tier,outcomes?.[tier] ?? '']))};
}
export function assertAbilityConfiguration(current, opened) {
  if (opened && JSON.stringify(current) !== JSON.stringify(opened))
    throw new Error("The ability configuration changed. Reopen its roll dialog to use the current attribute and outcomes.");
}

/** Only a complete, unconditional numeric damage sentence is a button payload.
 * Conditional, variable and split effects remain printed for table adjudication. */
export function outcomeDamage(text) {
  const match = new RegExp(`^\\s*(?:Deal\\s+)?(\\d+)\\s+(${DAMAGE_TYPES.join("|")})\\s+damage[.!]?\\s*$`, "i").exec(text ?? "");
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isSafeInteger(amount) ? [{type: match[2].toLowerCase(), amount}] : null;
}
