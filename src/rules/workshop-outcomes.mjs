import { printedAbilityRoll } from "./ability-roll.mjs";
import { CONDITION_KINDS } from "./conditions.mjs";

const TIERS = ["weak", "standard", "strong"];
const printedScale = /\b(up to )?(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s+(progress or inventory steps|cancellation progress|progress|supply die steps?|inventory steps?|steps?|HP|SP|squares?)\b/gi;
const harvest = "wilderness:provisioning:1";
const scale = String.raw`(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)`;
const conditions = Object.keys(CONDITION_KINDS).join("|");
const scopedScale = new RegExp(
  String.raw`\b(?:` +
  String.raw`(?:${conditions}) ${scale}|(?:Learn|Receive) ${scale}|Reduce [^.;]+? by ${scale}|Transfer ${scale}|roll for ${scale} if either is unwilling)`,
  "i",
);
const slashScale = new RegExp(scale, "g");
const tierFirst = /^On ((?:Weak|Standard|Strong)(?: (?:or|and) (?:Weak|Standard|Strong))?),? (.+)$/i;
const namedProfile = /^(Weak|Standard|Strong):\s+(.+)$/i;
const triageAmount = /(\d+) HP(?: each)? on (Weak|Standard|Strong)/gi;

function printedText(record) {
  return record.effect ?? (record.reference?.rules?.body ?? [])
    .flatMap(block => block.text ?? block.items ?? [])
    .join("\n");
}

/** Preserve the actual printed qualifier and the subject of a scoped quantity. */
function scopedOutcomes(source, record, tier, index) {
  const result = [];
  for (const sentence of source.split(/(?<=[.!?])\s+|\n+/)) {
    const line = sentence.trim();
    if (!line || /^\*\*/.test(line)) continue;
    const profile = namedProfile.exec(line);
    if (profile?.[1].toLowerCase() === tier) {
      result.push(profile[2].replace(/[.!?]$/, ""));
      continue;
    }
    if (record.id === "ability-signature-shepherd-careful-transfer" && /^(?:One ally|Two allies):/.test(line)) {
      const amount = [...line.matchAll(triageAmount)].find(match => match[2].toLowerCase() === tier);
      if (amount) result.push(`${line.split(":")[0]}: restore ${amount[0].replace(/ on \w+$/, "")}`);
      continue;
    }
    if (scopedScale.test(line)) {
      const primary = line.replace(/ on Weak\/Standard\/Strong\b/i, "");
      result.push(primary.replace(slashScale, (_match, ...amounts) => amounts[index]));
      continue;
    }
    for (const segment of line.split(/;\s*/)) {
      const clause = segment.trim().replace(/^Roll:\s*/i, "").replace(/[.!?]$/, "");
      const selected = tierFirst.exec(clause);
      if (selected && selected[1].toLowerCase().split(/ (?:or|and) /).includes(tier))
        result.push(selected[2]);
    }
  }
  return result;
}

/** Read the printed Weak/Standard/Strong quantities. A learned improvement can
 * replace one quantity without changing the other effects or applying them. */
export function workshopRollOutcome(record, improvements, tier) {
  const index = TIERS.indexOf(tier);
  if (!record || index < 0) return { text: [] };
  const explicit = printedAbilityRoll(record).outcomes[tier];
  const quantities = new Map();
  const texts = [];
  for (const rule of [record, ...improvements]) {
    const source = printedText(rule);
    texts.push(...scopedOutcomes(source, record, tier, index));
    // Forcecage prints separate numbers for a caster roll and for a hero's
    // defense against an NPC. A Workshop cast resolves the first one.
    const scaleSource = record.id === "spell:binding:a2"
      ? source.split("When an NPC casts", 1)[0] : source;
    for (const match of scaleSource.matchAll(printedScale)) {
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
    text: explicit ? [explicit] : [...new Set([...quantities.values()].map(result => result.text).concat(texts))],
    ...(record.id === harvest && steps !== undefined ? { supplySteps: steps } : {}),
  };
}
