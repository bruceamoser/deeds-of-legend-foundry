/** Compose only milestones actually selected; a foundation is provided once per line. */
export function forgeSignatureLearning(graph, choices = {}) {
  const metadata = graph.signatureDevelopment?.signatures ?? [];
  const selected = new Set(Object.values(choices));
  const byLine = new Map();
  for (const id of selected) {
    const record = metadata.find(entry => entry.id === id);
    if (record && (!byLine.has(record.lineId) || byLine.get(record.lineId).level < record.level))
      byLine.set(record.lineId, record);
  }
  const components = new Map();
  for (const line of byLine.values()) {
    for (const component of line.components) {
      if (component.condition === "selected-at-level-3" && !selected.has(component.id)) continue;
      const field = label => component.rulesMarkdown.match(new RegExp(`\\*\\*${label}:\\*\\* ([^\\n·]+)`))?.[1]?.trim();
      components.set(component.id, {
        id: component.id, name: component.name, classId: line.classId,
        lineId: line.lineId, signatureComponent: true, kind: "ability",
        action: field("Action"), attribute: field("Attribute"), duration: field("Duration"),
        effect: component.rulesMarkdown,
      });
    }
  }
  // The older pinned native catalog has no composition metadata.
  return { lines: [...byLine.values()], components: [...components.values()],
    abilityIds: metadata.length ? [...components.keys()] : [...selected] };
}
