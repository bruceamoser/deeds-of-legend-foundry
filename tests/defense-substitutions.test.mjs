import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFENSE_SUBSTITUTIONS,
  defenseSubstitutionOptions,
} from "../src/rules/defense-substitutions.mjs";
import { prepareRoll } from "../src/services/roll-preparation.mjs";

const actor = {
  uuid: "Actor.defender",
  system: {
    attributes: {
      agility: { effective: 1 },
      brawn: { effective: 3 },
      knowledge: { effective: 4 },
      reason: { effective: 2 },
    },
  },
  items: [],
};

function card(id, valid = true) {
  const rule = DEFENSE_SUBSTITUTIONS[id],
    item = {
      uuid: `${actor.uuid}.Item.${id}`,
      type: "ability",
      actor,
      name: id,
      getFlag: (_scope, field) =>
        field === "catalogId"
          ? id
          : field === "source"
            ? { path: rule.path, sha256: valid ? rule.sha256 : "changed" }
            : null,
    };
  return item;
}

function basis(options) {
  return {
    mode: "defense",
    attributeKey: "agility",
    attribute: 1,
    contributions: [],
    woundModifiers: [],
    benefits: [],
    incoming: null,
    defenseSubstitutions: options,
  };
}

test("only exact embedded source editions offer the four substitution choices", () => {
  actor.items = [
    ...Object.keys(DEFENSE_SUBSTITUTIONS).map((id) => card(id)),
    card("ability-snare-the-missile", false),
    { ...card("ability-steel-at-the-wrist"), actor: { uuid: "Actor.other" } },
  ];
  const options = defenseSubstitutionOptions(actor);
  assert.equal(options.length, 4);
  assert.deepEqual(
    Object.fromEntries(
      options.map((option) => [
        option.catalogId,
        [option.attributeKey, option.boons],
      ]),
    ),
    {
      "ability-catch-the-mechanism": ["knowledge", 1],
      "ability-steel-at-the-wrist": ["brawn", 1],
      "ability-snare-the-missile": ["knowledge", 2],
      "ability-thought-before-the-blow": ["reason", 1],
    },
  );
});

test("every current catalog defense card is accepted with its approved effects", async () => {
  const catalog = JSON.parse(await readFile(new URL("../static/data/choices.json", import.meta.url), "utf8"));
  actor.items = Object.keys(DEFENSE_SUBSTITUTIONS).map(id => {
    const record = catalog.records.find(record => record.id === id);
    assert(record, id);
    return {...card(id), getFlag: (_scope, field) => field === "catalogId" ? id : field === "source" ? record.source : null};
  });
  const options = defenseSubstitutionOptions(actor);
  assert.equal(options.length, 4);
  assert.deepEqual(Object.fromEntries(options.map(option => [option.catalogId, option.boons])), {
    "ability-catch-the-mechanism": 1, "ability-steel-at-the-wrist": 1,
    "ability-snare-the-missile": 2, "ability-thought-before-the-blow": 1,
  });
  const guidance = Object.fromEntries(options.map(option => [option.catalogId, option.guidance]));
  assert.match(guidance["ability-catch-the-mechanism"], /On Strong.*Main Action freeing it/);
  assert.match(guidance["ability-snare-the-missile"], /single-target.*On Strong.*fits in your free hand/);
  assert.match(guidance["ability-thought-before-the-blow"], /After the attack resolves, move up to 2 squares without provoking/);
  assert.doesNotMatch(guidance["ability-thought-before-the-blow"], /Strong/);
});
