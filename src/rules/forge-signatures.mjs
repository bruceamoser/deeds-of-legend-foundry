import {signatureSpellCost,isForgeSpell,isForgeModifier} from "./forge-casting.mjs";
const field = (markdown, label) => markdown.match(new RegExp(`\\*\\*${label}:\\*\\* ([^\\n]+)`))?.[1]?.split(/\s+·\s+(?=\*\*[^*]+:\*\*)/, 1)[0]?.trim();

function signatureMetadata(graph) {
  const metadata=graph?.signatureDevelopment;
  if(metadata?.schemaVersion!==2 || !Array.isArray(metadata.signatures)) throw new Error('Current signature metadata schema 2 is required.');
  return metadata.signatures;
}

/** Read exactly this independent choice's own complete rules. */
export function forgeSignatureComponent(graph, id) {
  const entry=signatureMetadata(graph).find(entry=>entry.id===id);
  if(!entry)return undefined;
  const rulesMarkdown=entry.rulesMarkdown;
  if (typeof rulesMarkdown !== 'string' || !rulesMarkdown.trim()) throw new Error(`Missing own signature rules: ${id}`);
  const sp = signatureSpellCost({effect:rulesMarkdown});
  return { id, name: entry.name, classId: entry.classId, level: entry.level,
    ...(entry.lineId ? { lineId: entry.lineId } : {}), signatureComponent: true, kind: 'ability',
    action: field(rulesMarkdown, 'Action'), attribute: field(rulesMarkdown, 'Attribute'),
    target: field(rulesMarkdown, 'Target / range / shape'), duration: field(rulesMarkdown, 'Duration'),
    equipment: field(rulesMarkdown, 'Equipment / acquisition'),
    sp:Number.isSafeInteger(sp) ? sp : undefined, magic:field(rulesMarkdown,'Magic') ?? (isForgeModifier({effect:rulesMarkdown}) ? 'Magical weapon modifier' : isForgeSpell({effect:rulesMarkdown}) ? 'Spell' : undefined), effect: rulesMarkdown, rulesMarkdown };
}

/** Plain prose for compact summaries; complete rules remain on the own record. */
export function signatureProse(record) {
  return String(record.effect ?? record.rulesMarkdown ?? '').split(/\n\s*\n/)
    .filter(block=>!/^\*\*(?:Action|Attribute|Target \/ range \/ shape|Magic|SP|Duration|Equipment \/ acquisition|Frequency|Time):\*\*/i.test(block.trim()))
    .join('\n\n').trim();
}

/** Use the own block in catalogs, native Items and compendiums alike. */
export function forgeSignatureRecord(graph, record) {
  const own = forgeSignatureComponent(graph, record.id);
  if (!own) return record;
  const details = Object.entries({Action:own.action,Attribute:own.attribute,'Target / range / shape':own.target,
    Magic:own.magic,SP:Number.isSafeInteger(own.sp)?String(own.sp):undefined,Duration:own.duration,
    'Equipment / acquisition':own.equipment,Frequency:field(own.effect,'Frequency'),Time:field(own.effect,'Time')})
    .filter(([,value])=>value).map(([label,value])=>({label,value}));
  return { ...record, ...own,
    reference: { flavor:record.reference?.flavor ?? [], rules: { details, body: signatureProse(own).split(/\n\s*\n/).filter(Boolean).map(text=>({text})), notes: [] } },
    referenceMarkdown: own.rulesMarkdown };
}

/** Each explicitly selected milestone contributes exactly its own independent choice. */
export function forgeSignatureLearning(graph, choices = {}) {
  const selected = [...new Set(Object.values(choices).filter(id => typeof id === 'string' && id))];
  const metadata = signatureMetadata(graph);
  const lines = selected.map(id => metadata.find(entry => entry.id === id)).filter(Boolean);
  const components = selected.map(id => forgeSignatureComponent(graph,id)).filter(Boolean);
  return { lines, components, abilityIds: components.map(component=>component.id) };
}
