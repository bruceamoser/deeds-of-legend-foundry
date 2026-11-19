import { printedAbilityRoll } from "./ability-roll.mjs";

const TIERS = ["weak", "standard", "strong"];
const printedScale = /\b(up to )?(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s+(progress or inventory steps|cancellation progress|progress|supply die steps?|inventory steps?|steps?|HP|SP|squares?)\b/gi;
const harvest = "wilderness:provisioning:1";

/** Read the printed Weak/Standard/Strong quantities. A learned improvement can
 * replace one quantity without changing the other effects or applying them. */
export function workshopRollOutcome(record, improvements, tier) {
  const index = TIERS.indexOf(tier);
  if (!record || index < 0) return { text: [] };
  const explicit = printedAbilityRoll(record).outcomes[tier];
  const quantities = new Map();
  for (const rule of [record, ...improvements]) {
    for (const match of (rule.effect ?? "").matchAll(printedScale)) {
      const [, limit, weak, standard, strong, printedUnit] = match;
      const amount = Number([weak, standard, strong][index]);
      let unit = printedUnit.replace(/squares?$/i, "square").replace(/steps?$/i, "step");
      if (unit === "step") {
        if (record.id !== harvest) continue;
        unit = "supply die step";
      }
      const label = amount === 1 ? unit : unit.replace(/\b(square|step)$/, "$1s");
      quantities.set(unit.toLowerCase(), {
        amount, text: `${limit ?? ""}${amount} ${label}`,
      });
    }
  }
  const steps = quantities.get("supply die step")?.amount;
  return {
    text: explicit ? [explicit] : [...quantities.values()].map(result => result.text),
    ...(record.id === harvest && steps !== undefined ? { supplySteps: steps } : {}),
  };
}
