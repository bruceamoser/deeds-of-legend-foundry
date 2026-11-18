/** Absolute resource value or a signed correction relative to its current value. */
export function currentResourceInput(value, maximum, current, resource) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Current ${resource} cannot be empty.`);
  const text = value.trim().replace(/^−/, "-");
  if (!/^[+-]?\d+$/.test(text)) throw new Error(`Enter whole ${resource}, or a signed adjustment such as -3 or +2.`);
  const amount = Number(text);
  const relative = /^[+-]/.test(text);
  if (!Number.isSafeInteger(amount)) throw new Error(`Enter a whole ${resource} value.`);
  if (relative && Number.isSafeInteger(current)) return Math.max(0, Math.min(maximum, current + amount));
  if (amount < 0 || amount > maximum)
    throw new Error(`Current ${resource} must be a whole number within the character’s maximum.`);
  return amount;
}

export function currentHpInput(value, maximum, current = null) {
  return currentResourceInput(value, maximum, current, "HP");
}
