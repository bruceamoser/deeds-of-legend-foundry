const ROUND_SECONDS = 6;

export function sustainLimit(record) {
  const duration = record?.duration?.toLowerCase().match(/^Sustained, up to (\d+) (rounds?|minutes?)$/i);
  if (!duration) return null;
  return Number(duration[1]) * (duration[2].startsWith("minute") ? 60 / ROUND_SECONDS : 1);
}

export function activeForgeSustain(play, spell, incapacitated = false) {
  const current = play?.sustain;
  const limit = sustainLimit(spell);
  const turn = play?.workshopTurn ?? 0;
  if (!current || current.spellId !== spell?.id || !limit || incapacitated ||
      turn >= current.castTurn + limit || turn > current.maintainedTurn + 1)
    return null;
  return current;
}

export function beginForgeSustain(play, spell) {
  if (!sustainLimit(spell)) return play;
  const turn = play.workshopTurn ?? 0;
  return { ...play, sustain: { spellId: spell.id, castTurn: turn, maintainedTurn: turn } };
}

export function maintainForgeSustain(play, spell, incapacitated = false) {
  const active = activeForgeSustain(play, spell, incapacitated);
  if (!active) throw new Error("There is no active sustained spell.");
  const turn = play.workshopTurn ?? 0;
  if (active.castTurn === turn) throw new Error("Start sustaining on your next turn.");
  if (active.maintainedTurn === turn) throw new Error("You have already sustained this spell this turn.");
  if (play.maneuverSpent) throw new Error("Your Maneuver has already been spent this turn.");
  return { ...play, maneuverSpent: true, sustain: { ...active, maintainedTurn: turn } };
}

export function convertForgeManeuver(play) {
  if (play.mainSpent || !play.maneuverSpent) throw new Error("Convert an available Main Action after spending your Maneuver.");
  return { ...play, mainSpent: true, maneuverSpent: false };
}

export function endForgeSustain(play) {
  const next = { ...play };
  delete next.sustain;
  return next;
}

export function nextForgeTurn(play, spell, incapacitated = false) {
  const next = { ...play, workshopTurn: (play.workshopTurn ?? 0) + 1, maneuverSpent: false, mainSpent: false };
  if (activeForgeSustain(next, spell, incapacitated)) return next;
  return endForgeSustain(next);
}
