import { isEquipped } from "./equipment-bonuses.mjs";
import { untrainedArmorPenalty } from "./native-armor.mjs";

/** Item modifiers affect play, never creation DP or acquisition eligibility.
 * Sources are explicit equipped effects; set-value curse overrides must name the
 * replacement value, rather than implicitly adding a penalty to an exact set. */
export function effectiveAttribute(base, sources = []) {
  if (!Number.isSafeInteger(base) || !Array.isArray(sources)) throw new Error("A base attribute and item sources are required.");
  for (const source of sources) {
    if (!source || !["modifier", "set", "curse-override"].includes(source.kind) || !Number.isSafeInteger(source.value))
      throw new Error("Each attribute effect needs a kind and integer value.");
  }
  const sets = sources.filter(source => source.kind === "set"), overrides = sources.filter(source => source.kind === "curse-override");
  if (sets.length > 1) throw new Error("Only one set-value item per attribute can apply at a time.");
  if (overrides.length > 1) throw new Error("Resolve competing explicit curse overrides with the DA.");
  if (overrides.length) return overrides[0].value;
  if (sets.length) return sets[0].value;
  const modifiers = sources.filter(source => source.kind === "modifier");
  const penalty = Math.min(0, ...modifiers.map(source => source.value));
  const cursed = modifiers.some(source => source.cursed === true && source.value < 0);
  const bonus = cursed ? 0 : Math.max(0, ...modifiers.map(source => source.value));
  const effective = base + bonus + penalty;
  if (!Number.isSafeInteger(effective)) throw new Error("Effective attribute arithmetic overflow.");
  return effective;
}

export const ITEM_EFFECT_ATTRIBUTES = Object.freeze(['brawn','fortitude','agility','guile','knowledge','reason']);
export const ITEM_EFFECT_MODES = Object.freeze(['modifier','set','curse-override']);
export function validateItemAttributeEffects(effects = []) {
  if (!Array.isArray(effects)) throw new Error('Item attribute effects must be an array.');
  const seen = new Set();
  for (const effect of effects) {
    if (!ITEM_EFFECT_ATTRIBUTES.includes(effect?.attribute) || !ITEM_EFFECT_MODES.includes(effect.mode) || !Number.isSafeInteger(effect.value) || typeof effect.cursed !== 'boolean')
      throw new Error('Each item attribute effect needs an attribute, mode, whole signed value and curse state.');
    if (seen.has(effect.attribute)) throw new Error(`Use one ${effect.attribute} effect on this item.`);
    seen.add(effect.attribute);
    if (effect.mode === 'curse-override' && !effect.cursed) throw new Error(`Mark the explicit ${effect.attribute} curse override as cursed.`);
  }
  return effects;
}
/** Applicability is explicit native equipment arrangement, never inferred from prose. */
export function equipmentAttributeSources(items = [], attribute) {
  if (!ITEM_EFFECT_ATTRIBUTES.includes(attribute)) throw new Error('Choose an available attribute.');
  const sources=[];
  for (const item of items) {
    if (item.type !== 'equipment') continue;
    const system=item.system ?? {};
    validateItemAttributeEffects(system.attributeEffects ?? []);
    if (!isEquipped(item)) continue;
    for (const effect of system.attributeEffects ?? []) if (effect.attribute === attribute)
      sources.push({kind:effect.mode,value:effect.value,cursed:effect.cursed,id:item.id??item._id,name:item.name??'Equipment'});
  }
  return sources;
}
export function equipmentAttributeValue(base, items, attribute) {
  const sources=equipmentAttributeSources(items,attribute);
  try {return effectiveAttribute(base,sources);}
  catch(error) {throw new Error(`${attribute[0].toUpperCase()+attribute.slice(1)}: ${error.message} Check ${sources.map(source=>source.name).join(', ')} in Equipment.`);}
}
/** Native rolls and derived displays use the same situational armor penalty. */
export function effectiveActorAttributeValue(base, actor, attribute) {
  const items = [...(actor?.items ?? [])];
  const value = equipmentAttributeValue(base, items, attribute);
  return attribute === 'agility'
    ? value - untrainedArmorPenalty(actor?.getFlag?.('heroes-of-legend', 'forgeLearned'), items.filter(item => item.type === 'equipment'))
    : value;
}
/** Reject conflicting arrangements before a document write, without recalculating base stats. */
export function validateEquipmentAttributeArrangement(items) {
  for (const attribute of ITEM_EFFECT_ATTRIBUTES) equipmentAttributeValue(0,items,attribute);
}

export function readAttributeEffectRows(rows) {
  return rows.flatMap(row=>{
    const mode=row.querySelector('[data-effect-mode]').value;if(mode==='none')return [];
    const raw=row.querySelector('[data-effect-value]').value;
    if(!String(raw).trim()||!Number.isSafeInteger(Number(raw)))throw new Error(`Enter a whole signed value for ${row.dataset.attributeEffect}.`);
    return [{attribute:row.dataset.attributeEffect,mode,value:Number(raw),cursed:row.querySelector('[data-effect-cursed]').checked}];
  });
}
