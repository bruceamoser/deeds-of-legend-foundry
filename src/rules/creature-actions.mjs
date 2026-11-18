import { outcomeEffects } from "./outcome-effects.mjs";
import { resolvedAttackEffects } from "./attack-outcomes.mjs";
import { DAMAGE_TYPES } from "./damage.mjs";
import { ATTRIBUTES } from "./character.mjs";
const TIERS = ["weak", "standard", "strong"];

/** A complete reference snapshot keeps the printed outcome beside explicit effect controls. */
export function validReferenceAttack(attack) {
  return attack?.resolution === "reference" &&
    ATTRIBUTES.includes(attack.attributeKey) &&
    typeof attack.effect === "string" &&
    typeof attack.referenceMarkdown === "string" &&
    (attack.outcomes === null || TIERS.every(key =>
      typeof attack.outcomes?.[key] === "string" && attack.outcomes[key].length > 0));
}

export function printedCreatureDamageType(markdown) {
  const type = /\*\*Damage type:\*\*\s*([a-z]+)/i.exec(markdown ?? "")?.[1].toLowerCase();
  return DAMAGE_TYPES.includes(type) ? type : null;
}

export function incomingOutcome(incoming, tier) {
  if (!incoming) return null;
  if (!TIERS.includes(tier)) throw new Error("Unknown defense result.");
  if (incoming.resolution === "reference") {
    if (!validReferenceAttack(incoming)) throw new Error("Invalid reference attack.");
    const text = incoming.outcomes?.[tier] ?? incoming.effect;
    const type = incoming.damageType ?? printedCreatureDamageType(incoming.referenceMarkdown);
    const defaultType = type ?? "physical";
    const normalized = incoming.outcomes && /^\d+\s*\+/.test(text)
      ? text.replace(/^(\d+)\s*\+\s*/, `$1 ${defaultType} damage; `).replace(/\s*\+\s*/g, "; ")
      : text;
    const effects = outcomeEffects(text,{defaultType,numeric:Boolean(type || incoming.outcomes)})
      ?? (incoming.outcomes ? resolvedAttackEffects(normalized,{damageType:defaultType}) : null);
    return { resolution: effects ? "effects" : "reference", text, ...(effects ?? {}), applied:false };
  }
  return { damage: incoming.damage[tier], type: "physical", applied: false };
}
