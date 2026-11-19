import { nativeForgeVitals } from "./native-health.mjs";
import { normalizeForgeRecovery } from "./forge-recovery.mjs";
import { forgeVitals } from "./forge-vitals.mjs";
const ID = "heroes-of-legend";

export const BLADE_CASTING_SP_FLAG = "bladeCastingSpUpdated";

/** Preserve spent SP and adjust the committed reserve by only the class-rule difference. */
export function bladeCastingSpChanges({ classId, updated, sp, attributes, bonusSp = 0 }) {
  if (classId !== "class-blade" || updated || !sp || !attributes) return null;
  const oldBonus = 2 * Math.max(0, attributes.reason.base);
  const newBonus = 2 * Math.max(0, attributes.knowledge.base);
  const max = Math.max(0, sp.max + newBonus - oldBonus);
  return {
    "system.sp.max": max,
    "system.sp.value": Math.min(sp.value, max + bonusSp),
    [`flags.${ID}.${BLADE_CASTING_SP_FLAG}`]: true,
  };
}

/** Current heroes use Forge death/recovery state; never synthesize legacy wounds. */
export function currentNativeCharacterChanges(draft, preview, { preserveResources, previousLevel = 0, level = previousLevel, hpPerLevel = 0, equipmentBonuses = { hp: 0, sp: 0 } } = {}) {
  const limits = preview.limits;
  const play = forgeVitals(draft.play, limits);
  const current = preserveResources;
  const changes = {
    name: draft.name.trim(),
    [`flags.${ID}.forgeMovement`]: {speedBase: preview.summary.unencumberedSpeed - draft.attributes.agility},
    "system.health.baseMax": limits.maxHp,
    "system.health.value": current ? Math.min(limits.maxHp + equipmentBonuses.hp, current.health.value > 0 ? current.health.value + Math.max(0,level-previousLevel)*hpPerLevel : 0) : play.hp,
    "system.recovery": current ? structuredClone(current.recovery ?? normalizeForgeRecovery(draft.play?.recovery)) : normalizeForgeRecovery(draft.play?.recovery),
    "system.sp.max": limits.maxSp,
    "system.sp.value": current ? Math.min(limits.maxSp + equipmentBonuses.sp, current.sp?.value ?? 0) : play.sp,
    [`flags.${ID}.${BLADE_CASTING_SP_FLAG}`]: true,
    "system.grit.granted": limits.gritGranted,
    "system.grit.spent": current ? current.grit.spent : play.gritSpent,
    "system.biography": draft.profile?.story ?? "",
    [`flags.${ID}.profile`]: structuredClone(draft.profile ?? {}),
    [`flags.${ID}.forgeVitals`]: nativeForgeVitals(play),
  };
  for (const [key, value] of Object.entries(draft.attributes)) changes[`system.attributes.${key}.base`] = value;
  return changes;
}
