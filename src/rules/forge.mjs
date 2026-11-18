const indexes = new WeakMap();

export function forgeIndex(catalog) {
  if (!indexes.has(catalog)) {
    indexes.set(catalog, {
      nodes: new Map(catalog.nodes.map((node) => [node.id, node])),
      spells: new Map(catalog.spells.map((spell) => [spell.id, spell])),
    });
  }
  return indexes.get(catalog);
}

export function forgeEligibility(catalog, state, id) {
  const { nodes } = forgeIndex(catalog);
  const node = nodes.get(id);
  if (!node)
    return { eligible: false, cost: null, reasons: ["Choose an entry in the current learning paths."] };
  const cls = catalog.classes?.find(entry => entry.id === state.classId);
  const cost = node.kind === "discipline" && (catalog.playtest || catalog.rulesRevision === 299)
    ? cls?.disciplineCosts?.[id] ?? null
    : node.dp;
  const learned = new Set(state.learned);
  const reasons = [];
  if (learned.has(id)) reasons.push("Already learned.");
  if (state.level < node.level) reasons.push(`Available at level ${node.level}.`);
  for (const parent of node.requires)
    if (!learned.has(parent)) reasons.push(`Learn ${nodes.get(parent)?.name ?? parent} first.`);
  if (cost === null) reasons.push("Choose a class to see this discipline’s DP cost.");
  else if (state.dp < cost) reasons.push(`Costs ${cost} DP. You have ${state.dp} DP.`);
  return { eligible: reasons.length === 0, cost, reasons };
}

export function learnForgeEntry(catalog, state, id) {
  const result = forgeEligibility(catalog, state, id);
  return result.eligible
    ? { ...result, state: { ...state, dp: state.dp - result.cost, learned: [...state.learned, id] } }
    : { ...result, state };
}

/** Refund an entry and its prerequisite descendants wherever they were learned. */
export function refundForgePurchases(catalog, draft, id) {
  const groups = [
    ...Object.entries(draft.purchases ?? {}).map(([level, purchases]) => ({ level, purchases, acquisitions: draft.acquisitions })),
    ...Object.entries(draft.progression?.levels ?? {}).map(([level, data]) => ({ level, ...data })),
  ];
  if (!groups.some(({ purchases }) => purchases?.some(entry => entry.id === id))) return [];

  const removed = new Set([id]);
  for (let size = 0; size < removed.size;) {
    size = removed.size;
    for (const node of catalog.nodes) {
      if (node.requires.some(parent => removed.has(parent))) removed.add(node.id);
    }
  }

  const refunds = [];
  for (const { level, purchases, acquisitions } of groups) {
    if (!purchases?.length) continue;
    const retained = [];
    for (const entry of purchases) {
      if (!removed.has(entry.id)) retained.push(entry);
      else {
        refunds.push({ id: entry.id, level: Number(level) });
        if (acquisitions) delete acquisitions[entry.id];
      }
    }
    purchases.splice(0, purchases.length, ...retained);
  }
  return refunds;
}

export function forgeLearning(catalog, learned) {
  const { nodes, spells } = forgeIndex(catalog);
  const entries = learned.map((id) => nodes.get(id)).filter(Boolean);
  const improvements = new Map();
  for (const entry of entries) {
    if (!entry.improves) continue;
    const prior = improvements.get(entry.improves) ?? [];
    improvements.set(entry.improves, [...prior, entry]);
  }
  return {
    disciplines: entries.filter((entry) => entry.kind === "discipline"),
    abilities: entries.filter((entry) => ["technique", "mastery", "combined", "talent"].includes(entry.kind) && !entry.improves),
    improvements,
    spells: [...new Set(entries.flatMap((entry) => entry.spellIds ?? []))].map((id) => spells.get(id)),
    capacitySp: entries.reduce((sum, entry) => sum + (entry.spCapacity ?? 0), 0),
    recoverySp: Math.max(0, ...entries.map((entry) => entry.spRecovery ?? 0)),
    recoveryMinutes: entries.find(entry => entry.recoveryMinutes === 30) ? 30 : 60,
  };
}
