import { ancestryBenefits } from "./ancestry.mjs";

/** Workshop's reviewed traits; native Actors retain their separately pinned rules. */
export function forgeAncestryBenefits(traitIds, graph, { stowedBulk = 0 } = {}) {
  const prior = ancestryBenefits(traitIds);
  if (graph?.rulesRevision !== 299) return prior;
  const traits = new Set(traitIds);
  return {
    ...prior,
    maximumHpBonus: prior.maximumHpBonus + Number(traits.has("trait-dwarf-deep-constitution")),
    capacityBonus: (traits.has("trait-tallfolk-broad-back") ? 3 : 0) +
      (traits.has("trait-halfling-resilient") ? Math.min(2, Math.max(0, stowedBulk)) : 0),
    // Small Target depends on both cover and a ranged attack; the player applies it.
    defenseBoons: 0,
  };
}
