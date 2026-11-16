/** Workshop debt: overnight rest renews use; dawn releases unavailable HP. */
export function normalizeForgeRecovery(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Recovery accounting must be an object.");
  const unavailableHp = value.unavailableHp ?? 0, debtUsed = value.debtUsed ?? false;
  if (!Number.isSafeInteger(unavailableHp) || unavailableHp < 0 || typeof debtUsed !== "boolean")
    throw new Error("Invalid unavailable HP or Debt use.");
  return { unavailableHp, debtUsed };
}
export function payForgeDebt({ hp, maxHp, recovery, traitIds = [] }) {
  const current = normalizeForgeRecovery(recovery);
  if (!traitIds.includes("trait-oath-bound-the-debt-comes-due")) throw new Error("The Debt Comes Due requires its ancestry trait.");
  if (current.debtUsed) throw new Error("The Debt Comes Due has already been used since your safe overnight rest.");
  if (!Number.isSafeInteger(maxHp) || maxHp < 1 || !Number.isSafeInteger(hp) || hp < 2 || hp > maxHp)
    throw new Error("Paying 1 HP must leave at least 1 HP.");
  return { hp: hp - 1, recovery: { unavailableHp: current.unavailableHp + 1, debtUsed: true } };
}
export function nextForgeDawn({ hp, recovery }) {
  const current = normalizeForgeRecovery(recovery);
  if (!Number.isSafeInteger(hp) || hp < 0) throw new Error("Current HP must be a nonnegative whole number.");
  return { hp, recovery: { ...current, unavailableHp: 0 } };
}
