/** Rebuild changed learning choices without converting them into different abilities. */
export function reviseForgeLearning(draft, graph) {
  const migration = graph.migration?.disciplines;
  if (!migration) return;
  const affected = new Set((migration.nodes ?? []).map(entry => entry.sourceId));
  const removed = [];
  const containers = [draft, ...Object.values(draft.progression?.levels ?? {})];
  for (const [index, entry] of containers.entries()) {
    const lists = index === 0 ? Object.values(entry.purchases ?? {}) : [entry.purchases ?? []];
    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (let i = list.length - 1; i >= 0; i--) {
        const id = list[i]?.id;
        if (affected.has(id) || id?.startsWith("combined:")) {
          removed.push(id); list.splice(i, 1);
          if (entry.acquisitions) delete entry.acquisitions[id];
        }
      }
    }
  }
  if (removed.length) draft.learningReview = [...new Set(removed)];
  // Signature selections are checked against current class choices by the ledger.
  // A retired signature is never exchanged automatically for its conceptual successor.
}

/** The old fourth section included all three advanced spells. Return that
 * purchase and separate mastery folios to the DP ledger for current learning.
 * The portable schema gates this migration so relearned sections survive reload.
 */
export function reviseSpellbookLearning(draft, graph) {
  const changed = new Set(graph.books.map(book => `${book.id}:3`));
  const removed = [];
  const containers = [draft, ...Object.values(draft.progression?.levels ?? {})];
  for (const [index, entry] of containers.entries()) {
    const lists = index === 0 ? Object.values(entry.purchases ?? {}) : [entry.purchases ?? []];
    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (let i = list.length - 1; i >= 0; i--) {
        const id = list[i]?.id;
        if (changed.has(id) || id?.startsWith("mastery:")) {
          removed.push(id); list.splice(i, 1);
          if (entry.acquisitions) delete entry.acquisitions[id];
        }
      }
    }
  }
  if (removed.length) draft.learningReview = [...new Set([...(draft.learningReview ?? []), ...removed])];
}
export const SMALL_TALENT_IDS = Object.freeze([
  "ability-another-tongue",
  "ability-a-party-piece",
  "ability-catch-that",
  "ability-look-over-here",
  "ability-message-by-heart",
  "ability-quick-exit",
]);

/** Retired purchases no longer draw from the replayed DP ledger. Apply this
 * even to schema-7 saves, using the current graph rather than the save version.
 */
export function reviseSmallTalents(draft, graph) {
  const current = new Set(graph.nodes.map(({ id }) => id));
  const retired = new Set(SMALL_TALENT_IDS.filter((id) => !current.has(id)));
  if (!retired.size) return;

  const removed = [];
  const withoutRetired = (list) => Array.isArray(list) ? list.filter((purchase) => {
    if (!retired.has(purchase?.id)) return true;
    removed.push(purchase.id);
    return false;
  }) : list;
  for (const stage of [0, 1]) {
    if (Array.isArray(draft.purchases?.[stage]))
      draft.purchases[stage] = withoutRetired(draft.purchases[stage]);
  }
  for (const level of Object.values(draft.progression?.levels ?? {})) {
    if (!level || typeof level !== "object") continue;
    if (Array.isArray(level.purchases)) level.purchases = withoutRetired(level.purchases);
    if (level.acquisitions) for (const id of retired) delete level.acquisitions[id];
  }
  for (const id of retired) {
    if (draft.acquisitions) delete draft.acquisitions[id];
    if (draft.basicActions) delete draft.basicActions[id];
  }
  if (Array.isArray(draft.play?.favorites?.abilities))
    draft.play.favorites.abilities = draft.play.favorites.abilities.filter((id) => !retired.has(id));
  if (removed.length) draft.learningReview = [...new Set([...(draft.learningReview ?? []), ...removed])];
}
