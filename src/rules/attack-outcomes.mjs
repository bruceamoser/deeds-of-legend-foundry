import { DAMAGE_TYPES, canonicalDamageType } from "./damage.mjs";
import { outcomeEffects } from "./outcome-effects.mjs";

const types = DAMAGE_TYPES.join("|");
const resultBand = "(?:Weak|Standard|Strong)";
const resultBands = `${resultBand}(?: (?:or|and) ${resultBand})?`;
const resultFirst = new RegExp(`^On (${resultBands})(?:,)? (.+)$`, "i");
const resultLast = new RegExp(`^(.+) on (${resultBands})$`, "i");
const fixedPush =
  /^(?:also )?push(?:es)? (it|the target|each target) (\d+ squares? directly away)$/i;

/** Attach only complete, fixed riders to an absolute attack. Movement is printed
 * with the outcome, and the table still resolves the actual movement. */
export function fixedTieredAttackRiders(texts, tier) {
  const fixed = [], movement = [];
  for (const text of texts) {
    for (const sentence of text.split(/\.(?:\s+|$)/)) {
      if (/\b(?:if|unless|when|whenever|otherwise|instead|only|may)\b/i.test(sentence)) continue;
      for (const fragment of sentence.split(/;\s*|,\s+and (?=on )/i)) {
        const clause = fragment.trim();
        const first = resultFirst.exec(clause);
        const last = first ? null : resultLast.exec(clause);
        const bands = (first?.[1] ?? last?.[2])?.toLowerCase().split(/ (?:or|and) /);
        if (!bands?.includes(tier)) continue;
        const effect = first?.[2] ?? last[1];
        const push = fixedPush.exec(effect);
        if (push) {
          movement.push(`Push ${push[1]} ${push[2]}`);
          continue;
        }
        // After a leading result, assume only an explicit target predicate.
        // A result at the end can also follow the name of the technique.
        const predicate = first
          ? /^(?:(?:it|the target|each target) )?(?:also )?(?:appl(?:y|ies)|adds?|gains?|becomes) (.+)$/i.exec(effect)
          : /^[^,]+? (?:also )?(?:applies|adds) (.+)$/i.exec(effect);
        const body = predicate?.[1].replace(/ to (?:its|the) target$/i, "");
        if (!body) continue;
        const parts = body.split(/\s+and\s+(?=push(?:es)? )/i);
        if (parts.length > 2) continue;
        const [conditions, displacement] = parts;
        const resolved = outcomeEffects(conditions);
        const extraPush = displacement && fixedPush.exec(displacement);
        if (!resolved?.conditions.length || resolved.components.length || (displacement && !extraPush)) continue;
        fixed.push(conditions);
        if (extraPush) movement.push(`Push ${extraPush[1]} ${extraPush[2]}`);
      }
    }
  }
  return [...fixed, ...movement];
}

/** Fixed numeric effects only. Movement/benefits remain explicit printed clauses. */
export function resolvedAttackEffects(text, { damageType } = {}) {
  if (typeof text !== "string" || !text.trim()) return null;
  // A relative modifier is not an entire attack payload. Applying its printed
  // bonus alone would omit the base attack; leave that procedure at the table.
  if (/\b(?:extra|additional|bonus|more)\s+(?:[a-z]+\s+)?damage\b/i.test(text)) return null;
  let normalized = text.trim().replace(/[.!]$/, "");
  // Shared trailing "damage" in authored mixed-type outcomes.
  normalized = normalized.replace(
    new RegExp(
      `(\\d+\\s+(?:${types}))\\s+and(?=\\s*\\d+\\s+(?:${types})\\s+damage)`,
      "gi",
    ),
    "$1 damage;",
  );
  const clauses = normalized
    .split(/\s*(?:;|,|\.\s+|\band\b|\bthen\b)\s*/i)
    .filter(Boolean);
  const components = [],
    conditions = [],
    manual = [];
  let manualRemainder = false;
  for (const [index, raw] of clauses.entries()) {
    if (index === 0 && /^\d+\s+squares?\b/i.test(raw)) {
      manual.push(raw.trim());
      continue;
    }
    if (manualRemainder || /\b(?:if|unless|when|whenever|otherwise|instead)\b/i.test(raw)) {
      if (index === 0) return null;
      manualRemainder = true;
      manual.push(raw.trim());
      continue;
    }
    let clause = raw.trim();
    const chosen =
      /^(?:Deal\s+)?(\d+)\s+damage(?:\s+of\s+(?:the chosen|that)\s+type)?(?:\s+to each(?: target)?)?$/i.exec(
        clause,
      );
    if (chosen && damageType)
      clause = `${chosen[1]} ${canonicalDamageType(damageType)} damage`;
    clause = clause.replace(/\s+to each(?: target)?$/i, "");
    clause = clause.replace(/\s+to each creature adjacent to you$/i, "");
    clause = clause.replace(/\s+to the target$/i, "");
    clause = clause.replace(/^Deal (\d+) damage$/i, "Deal $1 physical damage");
    clause = clause.replace(/^knock\s+(?:it\s+)?prone$/i, "Prone");
    clause = clause.replace(/^(Frightened\s+\d+)\s+of you$/i, "$1");
    const effect = /^No damage$/i.test(clause) ? {components:[],conditions:[]} : outcomeEffects(clause);
    if (effect) {
      components.push(...effect.components);
      conditions.push(...effect.conditions);
    } else {
      // Never mine later numbers from an initially conditional or variable outcome.
      if (index === 0) return null;
      manual.push(raw.trim());
      if (!/^(?:push|pull|slide)\b/i.test(raw.trim())) manualRemainder = true;
    }
  }
  return components.length || conditions.length
    ? {
        components,
        conditions,
        ...(manual.length ? { manual: manual.join("; ") } : {}),
      }
    : null;
}

/** A printed pre-roll choice is part of the roll, never a later damage prompt. */
export function printedDamageChoices(record) {
  const body = (record?.reference?.rules?.body ?? [])
    .map((block) => block.text ?? "")
    .join(" ");
  const match = new RegExp(
    `\\bChoose\\s+(${types})\\s+or\\s+(${types})(?:\\s+and the area)?(?:\\s+before rolling\\b|(?:,?\\s+then|\\s+and)\\s+make\\b)`,
    "i",
  ).exec(body);
  return match ? [...new Set(match.slice(1).map(canonicalDamageType))] : [];
}

/** A straight printed per-target spell damage profile. Split pools, conditional
 * damage and choices stay in the spell text for the table to resolve. */
export function spellAttackOutcomes(record) {
  if (!record?.effect) return null;
  const match = /(?:^|\.\s+)Deal (\d+)\/(\d+)\/(\d+) ([a-z]+) damage(?:\.| to (?:each|every) creature[^.!?]*\.)/i.exec(record.effect);
  if (!match || !DAMAGE_TYPES.includes(match[4].toLowerCase())) return null;
  return Object.fromEntries(["weak","standard","strong"].map((tier,index)=>[tier,`${match[index+1]} ${match[4].toLowerCase()} damage`]));
}
