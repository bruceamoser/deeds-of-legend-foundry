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
