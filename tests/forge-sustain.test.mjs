import assert from "node:assert/strict";
import test from "node:test";
import {
  activeForgeSustain,
  beginForgeSustain,
  convertForgeManeuver,
  endForgeSustain,
  maintainForgeSustain,
  nextForgeTurn,
  sustainLimit,
} from "../src/rules/forge-sustain.mjs";

const fog = { id: "spell:air:3", duration: "Sustained, up to 1 minute" };
const bead = { id: "spell:flame:a2", duration: "Sustained, up to 3 rounds" };

test("Sustain Spell uses one Maneuver without SP starting the turn after casting", () => {
  let hero = beginForgeSustain({ sp: 0 }, fog);
  assert.throws(() => maintainForgeSustain(hero, fog), /next turn/);
  hero = nextForgeTurn(hero, fog);
  assert.ok(activeForgeSustain(hero, fog));
  assert.throws(() => maintainForgeSustain({ ...hero, maneuverSpent: true }, fog), /already been spent/);
  hero = convertForgeManeuver({ ...hero, maneuverSpent: true });
  assert.throws(() => convertForgeManeuver(hero), /available Main Action/);
  hero = maintainForgeSustain(hero, fog);
  assert.equal(hero.sp, 0);
  assert.equal(hero.mainSpent, true);
  assert.equal(hero.maneuverSpent, true);
  assert.throws(() => maintainForgeSustain(hero, fog), /already sustained/);
  hero = nextForgeTurn(hero, fog);
  assert.equal(hero.mainSpent, false);
  assert.equal(hero.maneuverSpent, false);
  assert.ok(activeForgeSustain(hero, fog));
  hero = nextForgeTurn(hero, fog);
  assert.equal(hero.sustain, undefined);
});

test("a new sustained spell replaces the prior one and ends at its printed limit or on unconsciousness", () => {
  assert.equal(sustainLimit(fog), 10);
  assert.equal(sustainLimit(bead), 3);
  let hero = beginForgeSustain(beginForgeSustain({ sp: 4, workshopTurn: 8 }, fog), bead);
  assert.equal(activeForgeSustain(hero, fog), null);
  assert.ok(activeForgeSustain(hero, bead));
  assert.equal(activeForgeSustain(hero, bead, true), null);
  assert.equal(endForgeSustain(hero).sustain, undefined);
  assert.equal(nextForgeTurn(hero, bead, true).sustain, undefined);
  for (let turn = 9; turn <= 10; turn++) {
    hero = nextForgeTurn(hero, bead);
    hero = maintainForgeSustain(hero, bead);
    assert.equal(hero.workshopTurn, turn);
  }
  hero = nextForgeTurn(hero, bead);
  assert.equal(hero.sustain, undefined);
  assert.equal(hero.sp, 4);
});
