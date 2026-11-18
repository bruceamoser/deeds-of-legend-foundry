const meleeSignatures = new Set([
  'ability-signature-blade-cut-and-turn', 'ability-signature-blade-press-on',
  'ability-signature-blade-return-stroke', 'ability-signature-blade-fell-the-balance',
  'ability-signature-blade-relentless-pursuit', 'ability-signature-blade-dance-through-steel',
  'ability-signature-leader-orderly-withdrawal', 'ability-signature-protector-oathstrike',
  'ability-signature-protector-rebuking-light', 'ability-signature-shadow-soft-landing',
  'ability-signature-shadow-strike-and-vanish', 'ability-signature-warden-follow-my-footsteps',
  'ability-signature-warden-through-bramble', 'ability-signature-warden-know-what-you-hunt',
]);
const rangedSignatures = new Set([
  'ability-signature-warden-keep-the-quarry-close', 'ability-signature-warden-stay-on-the-scent',
  'ability-signature-warden-turn-the-hunt',
]);

/** Training comes from a technique that uses the weapon, or a named combat signature. */
export function weaponTraining(learnedIds = []) {
  const groups = new Set();
  for (const id of learnedIds) {
    if (typeof id !== 'string') continue;
    if (id.startsWith('arms:unarmed:')) groups.add('unarmed');
    else if (/^arms:(bladework|impact):|^fencing:[a-z-]+:|^tactics:openings:/.test(id) ||
      /^arms:dueling:[4-7]$/.test(id) || id === 'guard:shieldwork:7' || meleeSignatures.has(id)) groups.add('melee');
    if (id.startsWith('marksmanship:thrown-weapons:')) groups.add('throw');
    if (/^marksmanship:(precision|pinning|readiness):/.test(id) || rangedSignatures.has(id)) groups.add('ranged');
  }
  return groups;
}

export function basicAttackDamageProfile(learnedIds, abilityId) {
  const family = {
    'ability-basic-melee': 'melee',
    'ability-basic-ranged': 'ranged',
    'ability-basic-throw': 'throw',
    'ability-basic-unarmed': 'unarmed',
  }[abilityId];
  if (!family) return undefined;
  if (!weaponTraining(learnedIds).has(family)) return [1, 1, 2];
  return family === 'unarmed' ? [1, 2, 4] : [2, 3, 5];
}

export function nativeWeaponTrainingIds(actor) {
  const scope = 'heroes-of-legend';
  return [
    ...(actor?.getFlag?.(scope, 'forgeLearned') ?? []),
    ...(actor?.getFlag?.(scope, 'development')?.abilities ?? []),
  ];
}
