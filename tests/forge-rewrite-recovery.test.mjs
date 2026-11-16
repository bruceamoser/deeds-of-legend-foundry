import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { normalizeForgeRecovery, payForgeDebt, nextForgeDawn } from "../src/rules/forge-recovery.mjs";
import { forgeRest } from "../src/rules/forge-vitals.mjs";
import { normalizeWorkshopPlay } from "../src/rules/workshop-play.mjs";
import { readPortableCharacter, writePortableCharacter } from "../src/rules/portable-character.mjs";
import { workshopCatalogs } from "../src/rules/workshop-forge-catalog.mjs";
import { forgeSignatureLearning } from "../src/rules/forge-signatures.mjs";
import { signatureSpellCost, isForgeRitual } from "../src/rules/forge-casting.mjs";
import { sustainLimit, beginForgeSustain } from "../src/rules/forge-sustain.mjs";
import { forgeAncestryBenefits } from "../src/rules/forge-ancestry.mjs";

const read = name => JSON.parse(readFileSync(new URL(`../static/data/${name}.json`, import.meta.url)));
const graph = read("forge");
const catalogs = workshopCatalogs(...["choices", "inventory", "wounds", "forge", "forge-references"].map(read));
const limits = {maxHp:20,maxSp:10,gritGranted:1};
const traitIds = ["trait-oath-bound-the-debt-comes-due"];
const pay = play => payForgeDebt({...play,maxHp:20,traitIds});

test("dawn releases unavailable HP without healing or renewing Debt", () => {
  const paid = pay({hp:20});
  assert.deepEqual(paid,{hp:19,recovery:{unavailableHp:1,debtUsed:true}});
  const dawn = nextForgeDawn(paid);
  assert.deepEqual(dawn,{hp:19,recovery:{unavailableHp:0,debtUsed:true}});
  assert.throws(()=>pay(dawn),/already been used/);
  assert.deepEqual(nextForgeDawn({hp:0,recovery:paid.recovery}),{hp:0,recovery:{unavailableHp:0,debtUsed:true}});
});

test("rest renews Debt while preserving unpaid HP, so another use can stack before dawn", () => {
  const paid = pay({hp:10});
  const rested = forgeRest({...paid,sp:1},{...limits,unavailableHp:paid.recovery.unavailableHp});
  assert.equal(rested.hp,19);
  assert.equal(rested.sp,10);
  assert.deepEqual(rested.recovery,{unavailableHp:1,debtUsed:false});
  assert.deepEqual(normalizeForgeRecovery(rested.recovery),rested.recovery);
  const again = pay(rested);
  assert.deepEqual(again,{hp:18,recovery:{unavailableHp:2,debtUsed:true}});
  assert.equal(nextForgeDawn(again).hp,18);
  assert.throws(()=>payForgeDebt({hp:1,maxHp:20,traitIds}),/at least 1 HP/);
  assert.throws(()=>payForgeDebt({hp:10,maxHp:20}),/requires/);
});

test("casting benefits survive normalization and a portable save, then renew only with rest", () => {
  const draft = structuredClone(read("forge-party").party[0].draft);
  draft.play = {...draft.play,hp:7,sp:1,soulWellspringUsed:true,mindPalaceUsed:true,
    recovery:{unavailableHp:2,debtUsed:false}};
  const normalized = normalizeWorkshopPlay(draft.play,catalogs);
  assert.equal(normalized.soulWellspringUsed,true);
  assert.equal(normalized.mindPalaceUsed,true);
  const saved = writePortableCharacter(draft,catalogs,{ready:true});
  const restored = readPortableCharacter(saved,catalogs).draft.play;
  assert.equal(restored.soulWellspringUsed,true);
  assert.equal(restored.mindPalaceUsed,true);
  assert.deepEqual(restored.recovery,{unavailableHp:2,debtUsed:false});
  assert.equal(restored.hp,7);
  assert.equal(restored.sp,1);
  const rested = forgeRest(restored,{...limits,unavailableHp:2});
  assert.equal(rested.soulWellspringUsed,false);
  assert.equal(rested.mindPalaceUsed,false);
  for (const key of ["soulWellspringUsed","mindPalaceUsed"])
    assert.throws(()=>normalizeWorkshopPlay({[key]:"true"},catalogs),/malformed/);
});

test("actual signature components expose metadata-only spell costs and long rituals", () => {
  const components = graph.signatureDevelopment.signatures.filter(x=>x.level===1)
    .flatMap(line=>forgeSignatureLearning(graph,{1:line.id}).components);
  for (const name of ["Healing Hands","Borrowed Shape"]) {
    const card = components.find(x=>x.name===name);
    assert(card,`${name} is present in imported signature components`);
    assert.equal(signatureSpellCost(card),1,name);
  }
  const ritual = components.find(x=>x.name==="Make It Last");
  assert(ritual);
  assert.equal(signatureSpellCost(ritual),1);
  assert.equal(isForgeRitual(ritual),true);
});

test("reviewed ancestry benefits distinguish fixed HP from contextual cover and stored bulk", () => {
  assert.equal(forgeAncestryBenefits(["trait-dwarf-deep-constitution"],graph).maximumHpBonus,2);
  assert.equal(forgeAncestryBenefits(["trait-gnome-small-target"],graph).defenseBoons,0);
  assert.equal(forgeAncestryBenefits(["trait-halfling-resilient"],graph,{stowedBulk:0}).capacityBonus,0);
  assert.equal(forgeAncestryBenefits(["trait-halfling-resilient"],graph,{stowedBulk:1}).capacityBonus,1);
  assert.equal(forgeAncestryBenefits(["trait-halfling-resilient","trait-tallfolk-broad-back"],graph,{stowedBulk:9}).capacityBonus,5);
});


test("The Fold signature is a zero-SP spell and its Sustain survives saving", () => {
  const line = graph.signatureDevelopment.signatures.find(entry => entry.name === "The Fold" || entry.id === "ability-signature-shepherd-bring-them-near");
  assert(line);
  const spell = forgeSignatureLearning(graph, {3: line.id}).components.find(entry => entry.id === line.id);
  assert.equal(signatureSpellCost(spell), 0);
  assert.equal(sustainLimit(spell), 10);
  const play = beginForgeSustain({workshopTurn: 2, sp: 0}, spell);
  assert.equal(play.sustain.spellId, line.id);
  assert.deepEqual(normalizeWorkshopPlay(play, catalogs).sustain, play.sustain);
});
