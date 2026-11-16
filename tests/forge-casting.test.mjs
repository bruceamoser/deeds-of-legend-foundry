import assert from "node:assert/strict";
import test from "node:test";
import { signatureSpellCost, isForgeRitual, forgeCastOptions, forgeCastPayment } from "../src/rules/forge-casting.mjs";
import { forgeRest } from "../src/rules/forge-vitals.mjs";

const limits = { maxHp: 20, maxSp: 10, gritGranted: 1 };
const state = { learned: ["spellcraft:soul-capacity:7", "spellcraft:mind-capacity:7"] };
const ritual = { sp: 5, action: "Ritual — 1 hour" };

test("explicit signature metadata supplies SP, ordinary SP benefits do not become spells", () => {
  assert.equal(signatureSpellCost({effect: "**Magic:** Spell · **SP:** 1\nRestore 3/5/7 HP."}), 1);
  assert.equal(signatureSpellCost({effect: "**Magic:** Spell · **SP:** 0"}), 0);
  assert.equal(signatureSpellCost({sp: 3, effect: "**SP:** 1"}), 3);
  assert.ok(Number.isNaN(signatureSpellCost({effect: "Restore 2 SP; maximum SP increases by 4 SP."})));
  assert.equal(signatureSpellCost({effect: "**Magic:** Spell\nPay 2 SP to cast."}), 2);
  assert.ok(Number.isNaN(signatureSpellCost({effect: "**Magic:** Spell\nRecover 2 SP."})));
  assert.ok(Number.isNaN(signatureSpellCost({effect: "Pay 2 SP to make an ordinary weapon strike."})));
});

test("ritual variants and inline Action fields are recognized", () => {
  for (const action of ["Ritual", "Ritual — 1 hour", "Ritual · 10 minutes"])
    assert.equal(isForgeRitual({action}), true);
  assert.equal(isForgeRitual({effect: "**Action:** Ritual — 1 hour\n**Magic:** Spell"}), true);
  assert.equal(isForgeRitual({action: "Main action", effect: "Describes a ritual."}), false);
});

test("discount choices require learned masteries, eligible casting, and unused benefits", () => {
  assert.deepEqual(forgeCastOptions({}, {}, ritual).map(x=>x.id), ["normal"]);
  assert.deepEqual(forgeCastOptions({}, state, ritual).map(x=>[x.id,x.cost]), [["normal",5],["soul",3],["mind",3],["soul+mind",1]]);
  assert.deepEqual(forgeCastOptions({}, state, {sp:5,action:"Main action"}).map(x=>x.id), ["normal","soul"]);
  assert.deepEqual(forgeCastOptions({}, state, {sp:0,action:"Ritual"}).map(x=>x.id), ["normal"]);
  assert.deepEqual(forgeCastOptions({}, state, {sp:1,action:"Ritual"}).map(x=>[x.id,x.cost]), [["normal",1],["soul",0],["mind",0]]);
  assert.deepEqual(forgeCastOptions({soulWellspringUsed:true,mindPalaceUsed:true}, state, ritual).map(x=>x.id), ["normal"]);
});

test("payment consumes only chosen benefits, permits low-SP discounted casting and is immutable", () => {
  const play = {hp:20,sp:1};
  const next = forgeCastPayment(play,limits,state,ritual,"soul+mind");
  assert.equal(next.sp,0);
  assert.equal(next.soulWellspringUsed,true);
  assert.equal(next.mindPalaceUsed,true);
  assert.deepEqual(play,{hp:20,sp:1});
  assert.throws(()=>forgeCastPayment(next,limits,state,ritual,"soul+mind"), /available/);
  assert.throws(()=>forgeCastPayment(play,limits,state,ritual), /more SP/);
  assert.throws(()=>forgeCastPayment(play,limits,{},ritual,"soul"), /available/);
  assert.throws(()=>forgeCastPayment(play,limits,state,{effect:"Recover 5 SP."}), /available/);
  const free = forgeCastPayment({hp:20,sp:0},limits,state,{sp:1,action:"Main action"},"soul");
  assert.equal(free.sp,0);
  assert.equal(free.soulWellspringUsed,true);
  assert.equal(free.mindPalaceUsed,undefined);
  const rested = forgeRest(next,limits);
  assert.equal(rested.soulWellspringUsed,false);
  assert.equal(rested.mindPalaceUsed,false);
});
