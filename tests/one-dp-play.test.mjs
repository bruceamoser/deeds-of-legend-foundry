import test from "node:test";
import assert from "node:assert/strict";
import {
  startTurn,
  convertAction,
  movementRemaining,
  spendMovement,
} from "../src/rules/actions.mjs";
import { finishTurn } from "../src/rules/encounter.mjs";
import { ABILITY_DEFINITIONS as definitions } from "../src/rules/ability-definitions.mjs";
import {
  planSimpleAbility,
  contextualAbilitySources,
} from "../src/rules/one-dp-play.mjs";
const disengage = definitions["ability-disengage"];
test("Quick Exit grants one terrain-costed square per turn, never per movement conversion", () => {
  const initial = startTurn({ turnId: "turn1", speed: 4 });
  const used = planSimpleAbility(initial, {
    operationId: "exit1",
    definition: disengage,
    quickExit: true,
  });
  assert.equal(used.disengaged, true);
  assert.equal(used.speed, 4);
  assert.equal(movementRemaining(used), 5);
  assert.deepEqual(
    planSimpleAbility(used, {
      operationId: "exit1",
      definition: disengage,
      quickExit: true,
    }),
    used,
  );
  const again = planSimpleAbility(used, {
    operationId: "exit2",
    definition: disengage,
    quickExit: true,
  });
  assert.equal(movementRemaining(again), 5);
  const maneuver = convertAction(again, {
    operationId: "convertMain",
    from: "main",
    to: "maneuver",
  });
  const converted = convertAction(maneuver, {
    operationId: "convert",
    from: "maneuver",
    to: "movement",
  });
  assert.equal(movementRemaining(converted), 9);
  const moved = spendMovement(converted, { operationId: "terrain", amount: 2 });
  assert.equal(movementRemaining(moved), 7);
  assert.equal(movementRemaining(moved, { grappled: 1 }), 0);
  assert.equal(movementRemaining(moved, { unconscious: true }), 0);
  assert.equal(
    startTurn({ turnId: "turn2", speed: 4 }).bonusMovement,
    undefined,
  );
  const ended = finishTurn({
    current: "hero",
    roster: [{ id: "hero", side: "players" }],
    acted: [],
    startingSide: "players",
    round: 1,
    serial: 1,
    revision: 1,
    history: [],
    budgets: { hero: used },
  });
  assert.equal(ended.budgets.hero.bonusMovement, undefined);
  assert.equal(ended.budgets.hero.disengaged, undefined);
  assert.equal(
    movementRemaining(
      planSimpleAbility(initial, {
        operationId: "plain",
        definition: disengage,
      }),
    ),
    4,
  );
});
test("Catch That and Look Over Here use normal off-turn Reactions without ability-specific play gates", () => {
  for (const key of ["catch-that", "look-over-here"]) {
    const initial = startTurn({ turnId: "turn", speed: 4 });
    const used = planSimpleAbility(initial, {
      operationId: "react",
      definition: definitions[`ability-${key}`],
      ownTurn: false,
    });
    assert.equal(used.remaining.reaction, 0);
    assert.equal(used.remaining.main, 1);
    assert.equal(used.operations.react.status, "complete");
    const repeat = planSimpleAbility(used, {
      operationId: "repeat",
      definition: definitions[`ability-${key}`],
      ownTurn: false,
    });
    assert.equal(repeat.remaining.reaction, 0);
    assert.equal(repeat.operations.repeat.trackedCost.spent, 0);
    assert.deepEqual(
      planSimpleAbility(used, {
        operationId: "react",
        definition: definitions[`ability-${key}`],
        ownTurn: false,
      }),
      used,
    );
  }
});
test("instrument Guile Boon defaults off, supports all Guile approaches, and excludes other attributes", () => {
  const guile = {
    mode: "attribute",
    attributeKey: "guile",
    partyPiece: "Actor.a.Item.party",
  };
  assert.deepEqual(contextualAbilitySources(guile), []);
  assert.match(contextualAbilitySources(guile, {partyPiece: true})[0].label, /playing your chosen instrument/);
  for (const mode of ["attribute", "attack", "defense"]) {
    assert.equal(contextualAbilitySources({...guile, mode}, {partyPiece: true})[0].amount, 1);
  }
  assert.deepEqual(contextualAbilitySources({...guile, mode: "death"}, {partyPiece: true}), []);
  assert.equal(
    contextualAbilitySources(guile, { partyPiece: true })[0].amount,
    1,
  );
  assert.deepEqual(
    contextualAbilitySources(
      { ...guile, attributeKey: "brawn" },
      { partyPiece: true },
    ),
    [],
  );
  assert.deepEqual(
    contextualAbilitySources(
      { ...guile, partyPiece: null },
      { partyPiece: true },
    ),
    [],
  );
  assert.deepEqual(
    contextualAbilitySources({ mode: "defense" }, { lookOverHere: true }),
    [],
  );
  const defense = { mode: "defense", incoming: { title: "Attack" } };
  const source = contextualAbilitySources(defense, { lookOverHere: true });
  assert.equal(source.length, 1);
  assert.equal(source[0].amount, 1);
  assert.deepEqual(Object.keys(source[0]).sort(), [
    "amount",
    "automatic",
    "id",
    "kind",
    "label",
    "sourceIds",
  ]);
});
