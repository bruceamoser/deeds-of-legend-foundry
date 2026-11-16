import { forgeSpendSp } from "./forge-vitals.mjs";

/** Read a casting cost, never an SP grant mentioned in an ordinary ability. */
export function signatureSpellCost(record) {
  if (!record) return NaN;
  if (Number.isSafeInteger(record.sp) && record.sp >= 0) return record.sp;
  const text = record.effect ?? record.rulesMarkdown ?? "";
  const explicit = text.match(/\*\*SP:\*\*\s*(\d+)\b/i) ?? text.match(/\bThis is a spell costing (\d+) SP\b/i);
  if (explicit) return Number(explicit[1]);
  const magic = record.magic === "Spell" || record.kind === "spell" || Boolean(record.page)
    || /\*\*Magic:\*\*\s*Spell\b/i.test(text);
  if (!magic) return NaN;
  // Legacy magical cards sometimes put the cost in their casting instruction.
  return Number(text.match(/\b(?:pay|spend|costs?)\s+(\d+)\s+SP\b/i)?.[1] ?? NaN);
}

export function isForgeRitual(record) {
  const text = record?.effect ?? record?.rulesMarkdown ?? "";
  const action = record?.action ?? text.match(/\*\*Action:\*\*\s*([^\n]+)/i)?.[1] ?? text;
  return /^Ritual\b/i.test(action.trim());
}

export function forgeCastOptions(play = {}, state = {}, record) {
  const cost = signatureSpellCost(record);
  if (!Number.isSafeInteger(cost)) return [];
  const options = [{ id: "normal", label: "Pay printed SP", cost }];
  if (!cost) return options;
  const learned = new Set(state.learned ?? []);
  const soul = learned.has("spellcraft:soul-capacity:7") && !play.soulWellspringUsed;
  const mind = learned.has("spellcraft:mind-capacity:7") && !play.mindPalaceUsed && isForgeRitual(record);
  if (soul) options.push({ id: "soul", label: "Soul Wellspring", cost: Math.max(0, cost - 2) });
  if (mind) options.push({ id: "mind", label: "Mind Palace", cost: Math.max(0, cost - 2) });
  // Mind reduces the printed payment first; Soul then pays the remaining cost.
  if (soul && mind && cost > 2) options.push({ id: "soul+mind", label: "Soul Wellspring + Mind Palace", cost: Math.max(0, cost - 4) });
  return options;
}

/** Call when beginning a cast, including a ritual; interruption does not refund it. */
export function forgeCastPayment(play, limits, state, record, option = "normal") {
  const choice = forgeCastOptions(play, state, record).find(entry => entry.id === option);
  if (!choice) throw new Error("Choose an available spell payment.");
  const next = forgeSpendSp(play, limits, choice.cost);
  if (option === "soul" || option === "soul+mind") next.soulWellspringUsed = true;
  if (option === "mind" || option === "soul+mind") next.mindPalaceUsed = true;
  return next;
}
