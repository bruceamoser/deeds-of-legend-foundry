import { abilityRollConfiguration, printedAbilityRoll } from "../src/rules/ability-roll.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  resolvedAttackEffects,
  printedDamageChoices,
} from "../src/rules/attack-outcomes.mjs";
import { DAMAGE_TYPE, DAMAGE_TYPES } from "../src/rules/damage.mjs";
const records = JSON.parse(
  await readFile(new URL("../static/data/choices.json", import.meta.url)),
).records;
test("all supported absolute damage-first catalog tiers resolve canonical fixed damage without a later prompt", () => {
  const absolute = new RegExp(`^(?:Deal\\s+)?\\d+\\s+(?:(?:${DAMAGE_TYPES.join("|")})\\s+)?damage\\b`, "i");
  let count = 0;
  for (const record of records.filter((r) => r.kind === "ability"))
    for (const [label, text] of Object.entries(printedAbilityRoll(record).outcomes)) {
      const outcome = {label, text};
      if (!absolute.test(outcome.text)) continue;
      if (/\b(?:chosen|that) type\b/i.test(outcome.text)) continue;
      for (const damageType of printedDamageChoices(record).length
        ? printedDamageChoices(record)
        : [undefined]) {
        const effects = resolvedAttackEffects(outcome.text, { damageType });
        assert(
          effects?.components.length,
          `${record.id} ${outcome.label}: ${outcome.text}`,
        );
        assert(
          effects.components.every(
            (c) =>
              DAMAGE_TYPES.includes(c.type) && Number.isSafeInteger(c.amount),
          ),
        );
      }
      count++;
    }
  assert.equal(count, 252);
});
test("every damage enum produces a fixed typed outcome with conditions", () => {
  for (const type of DAMAGE_TYPES)
    assert.deepEqual(resolvedAttackEffects(`3 ${type} damage + Slowed 1`), {
      components: [{ type, amount: 3 }],
      conditions: [{ key: "slowed", rating: 1 }],
    });
});
test("mixed damage, area effects and conditions after movement retain their own typed values", () => {
  assert.deepEqual(
    resolvedAttackEffects("2 physical and 1 fire damage; Burning 1."),
    {
      components: [
        { type: DAMAGE_TYPE.PHYSICAL, amount: 2 },
        { type: DAMAGE_TYPE.FIRE, amount: 1 },
      ],
      conditions: [{ key: "burning", rating: 1 }],
    },
  );
  assert.deepEqual(
    resolvedAttackEffects(
      "6 physical damage, push 2, knock prone and apply Dazed 1.",
    ),
    {
      components: [{ type: "physical", amount: 6 }],
      conditions: [
        { key: "prone", rating: 1 },
        { key: "dazed", rating: 1 },
      ],
      manual: "push 2",
    },
  );
  assert.equal(
    resolvedAttackEffects("4 lightning damage to each; Burning 1.")
      .components[0].amount,
    4,
  );
});
test("printed element choices resolve in the initial roll and ambiguous conditionals never invent damage", () => {
  assert.deepEqual(
    printedDamageChoices(
      records.find((r) => r.id === "ability-let-the-spark-decide"),
    ),
    ["fire", "cold"],
  );
  assert.deepEqual(
    printedDamageChoices(
      records.find((r) => r.id === "ability-a-splendid-mistake"),
    ),
    ["fire", "lightning"],
  );
  assert.deepEqual(
    resolvedAttackEffects("Deal 4 damage to each, then push each 1 square.", {
      damageType: "lightning",
    }),
    {
      components: [{ type: "lightning", amount: 4 }],
      conditions: [],
      manual: "push each 1 square",
    },
  );
  for (const text of [
    "If adjacent, 5 fire damage; Slowed 1.",
    "5 fire damage or Prone",
    "Deal double damage.",
    "Add 1 progress and learn whether the lock shows damage or tampering.",
  ])
    assert.equal(resolvedAttackEffects(text), null);
});

test("conditional and optional suffixes never apply their later effects unconditionally",()=>{
 for(const text of ['3 fire damage; if the target is wet, Freezing 1.','3 fire damage; if the target is wet, then 5 cold damage.','3 fire damage; you may choose an additional effect, Prone.']){
  const result=resolvedAttackEffects(text);
  assert.deepEqual(result.components,[{type:'fire',amount:3}]);
  assert.deepEqual(result.conditions,[]);
  assert(result.manual);
 }
});

function techniqueOutcomes({effect, improvements = [], id = "guard:shieldwork:1"}) {
  const record = { id, pathId: id.split(":").slice(0, 2).join(":"), attribute: "Brawn", effect };
  const nodes = improvements.map((text, index) => ({
    id: `improvement-${index}`, improves: id, effect: text,
  }));
  const item = {
    uuid: "Actor.guard.Item.shield-bash",
    actor: { type: "character", getFlag: () => nodes.map(node => node.id) },
  };
  return abilityRollConfiguration(item, record, { nodes }).outcomes;
}

test("Shield Bash applies damage and prints the Standard and Strong Push for table resolution", () => {
  const outcomes = techniqueOutcomes({
    effect: "Main Action · Brawn. Attack one adjacent creature with your shield for 1/2/3 physical damage. On Standard or Strong, push it 1 square directly away. Resolve collisions normally.",
    improvements: [
      "Shield Bash deals 2/3/4 physical damage.",
      "Shield Bash also knocks its target Prone on Strong after the push.",
    ],
  });
  assert.deepEqual(resolvedAttackEffects(outcomes.weak), {
    components: [{ type: "physical", amount: 2 }], conditions: [],
  });
  for (const [tier, amount] of [["standard", 3], ["strong", 4]]) {
    assert.deepEqual(resolvedAttackEffects(outcomes[tier]), {
      components: [{ type: "physical", amount }],
      conditions: [],
      manual: "Push it 1 square directly away",
    });
  }
});

test("a weapon attack applies fixed conditions for its exact result band", () => {
  const outcomes = techniqueOutcomes({
    id: "arms:bladework:1",
    effect: "Main Action · Brawn. Attack one creature for 2/3/5 physical damage. On Standard and Strong, apply Dazed 1 to the target.",
    improvements: ["The attack also applies Bleeding 1 on Strong."],
  });
  assert.deepEqual(resolvedAttackEffects(outcomes.weak).conditions, []);
  assert.deepEqual(resolvedAttackEffects(outcomes.standard).conditions, [{ key: "dazed", rating: 1 }]);
  assert.deepEqual(resolvedAttackEffects(outcomes.strong).conditions, [
    { key: "dazed", rating: 1 }, { key: "bleeding", rating: 1 },
  ]);
});

test("ambiguous riders remain contextual, including choices and conditional follow-ons", () => {
  const outcomes = techniqueOutcomes({
    id: "arms:bladework:1",
    effect: "Main Action · Brawn. Attack one creature for 2/3/5 physical damage. On Standard or Strong, choose an enemy that gains Dazed 1.",
    improvements: [
      "On Strong, you may apply Dazed 2.",
      "On Strong, apply Dazed 2 if its weapon breaks.",
      "If the target is braced, deal extra damage; on Strong, apply Dazed 1.",
    ],
  });
  assert.deepEqual(resolvedAttackEffects(outcomes.standard).conditions, []);
  assert.deepEqual(resolvedAttackEffects(outcomes.strong).conditions, []);
});

test("element selection recognizes only explicit pre-roll attack choices, including revised conjunctions", () => {
  const record = text => ({reference: {rules: {body: [{text}]}}});
  for (const text of [
    "Choose fire or cold before rolling.",
    "Choose fire or cold, then make a Guile spell attack.",
    "Choose fire or cold and make a Guile spell attack.",
  ]) assert.deepEqual(printedDamageChoices(record(text)), ["fire", "cold"]);
  for (const text of ["You can describe fire or cold.", "Choose fire or cold colors.", "Choose armor or fire before rolling."])
    assert.deepEqual(printedDamageChoices(record(text)), []);
});


test("Reckless Charge's three extra-damage modifiers never become standalone damage payloads", () => {
  const record = records.find(record => record.id === "ability-signature-blade-cut-and-turn");
  const outcomes = printedAbilityRoll(record).outcomes;
  for (const [tier, amount] of Object.entries({weak:1, standard:2, strong:3})) {
    assert.match(outcomes[tier], new RegExp(`\\b${amount} extra damage`));
    assert.equal(resolvedAttackEffects(outcomes[tier]), null, tier);
  }
  for (const text of ["Deal 2 additional physical damage.", "Deal 3 bonus damage.", "Deal 4 more fire damage."])
    assert.equal(resolvedAttackEffects(text), null, text);
  assert.deepEqual(resolvedAttackEffects("Deal 4 physical damage."), {components:[{type:"physical",amount:4}],conditions:[]});
});

test("Foul Wind resolves its three printed canonical poison damage profiles", () => {
  const record = records.find(record => record.name === "Foul Wind");
  const outcomes = printedAbilityRoll(record).outcomes;
  assert(DAMAGE_TYPES.includes("poison"));
  for (const [tier, amount] of Object.entries({weak:1, standard:2, strong:4})) {
    assert.match(outcomes[tier], new RegExp(`\\b${amount} poison damage`));
    assert.deepEqual(resolvedAttackEffects(outcomes[tier]), {components:[{type:"poison",amount}],conditions:[]}, tier);
  }
});
