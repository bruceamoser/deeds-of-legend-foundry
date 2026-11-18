# Nim Coppercoil: artificer after the rewrite

Pinned authored source `56f2ec94077407c56f60caa29345a5e3dca4c28b`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../artificer.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Make It Last now creates a persistent bound item, then two and three with reviewed properties. This directly addresses the previous inability to represent enduring magical inventions.

The small curated properties are not the full 5e replication catalog. Each binding needs its actual ordinary item and tools; these drafts supply tools, while a chosen lamp/shield would need a separate purchased item.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 13 | 17 | 25 |
| SP | 9 | 13 | 21 |
| DP spent / total | 9 / 12 | 24 / 25 | 62 / 63 |
| Unspent DP | 3 | 1 | 1 |
| Learned action choices (Main / Maneuver / Reaction) | 1 / 0 / 1 | 2 / 0 / 1 | 3 / 0 / 1 |
| Known book spells (free / paid) | 8 (4 / 4) | 8 (4 / 4) | 30 (4 / 26) |
| Shared reserve: casts at 2 SP | 4 | 6 | 10 |
| Shared reserve: casts at 5 SP | 1 | 2 | 4 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Gnome**; class: **Intellect**. Attributes: brawn +0, fortitude +1, agility +0, guile +0, knowledge +2, reason +0. Traits: Fingers in the Works; Bright Idea.

Starting disciplines: craft from culture, influence from background, and divination from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Craft Tools; Material Bundle; Writing Kit; Travel Pack; Food Bundle; Water Flask. 2 starting coins remain. The artificer can bind the actual craft tools as the returning tool, paying the ritual’s 1 SP when performed. Other item properties require their actual item.

The D&D baseline has **17 HP** and **AC 16 (Studded Leather 12 + DEX 2 + purchased Shield 2)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Starting DP is **10 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `craft:repairs` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/artificer-level-1.hol.json). 3 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Force (`force`) | 2 | 1 |
| Telekinesis I (`telekinesis:0`) | 1 | 1 |
| Shaping I (`shaping:0`) | 1 | 1 |
| Imbuement I (`imbuement:0`) | 1 | 1 |
| Mend and Fit I (`craft:repairs:1`) | 1 | 1 |
| Smoke in a Bottle I (`craft:mixtures:1`) | 1 | 1 |
| Detection I (`detection:0`) | 1 | 1 |
| Catch the Failure I (`craft:safeguards:1`) | 1 | 1 |

**Signature choices:** level 1: Make It Last.

<details><summary>Make It Last: complete signature component</summary>

**Action:** Ritual — 1 hour · **Attribute:** None

**Target / range / shape:** One ordinary item you own within reach.

**Magic:** Bound-item spell · **SP:** 1

Pay 1 SP and bind one item with a property chosen when bound: a lamp gives controllable ordinary torchlight; a tool returns to its bearer’s empty hand with a Maneuver from within 3 squares along a clear path; or a shield lets its bearer spend a Reaction once per scene to reduce one attack’s damage by 1 after rolling defense, respecting the attack’s minimum damage. You can have one bound item. A binding lasts until you end or replace it, even if the item is lent or lost. Cancellation target 3 ends its magic but leaves the ordinary item and occupied binding; restore the magic with a new ritual and SP. Lending or re-binding an item does not refresh its limited use.

**Duration:** Indefinite; no Sustain.

**Equipment / acquisition:** Suitable tools and the actual ordinary item.

</details>

**Useful actions and improvements:**

- **Mend and Fit I:** Main Action, with tools and a suitable brace or fastening: temporarily secure one damaged nonmagical item within reach so it can support its ordinary stationary load until your next turn ends. It gains no HP and cannot attack or protect from attacks while broken. Alternatively work for 10 minutes and roll Knowledge for 1/2/3 progress toward repairing an item that retains enough structure.
- **Smoke in a Bottle I:** 1 hour · Knowledge, with alchemical tools and one purchased batch of smoke ingredients. Add 1/2/3 progress toward target 3 to prepare one smoke flask. Maneuver: throw a prepared flask to a visible point within 4 squares, consuming it. Smoke fills a 1-square-radius area until your next turn ends and blocks sight through it. No throwing roll.
- **Catch the Failure I:** Reaction. When a visible component within reach begins to fail during a nonmagical task, use tools in hand to arrest it before the consequence resolves. Give the worker 1 Boon on the associated roll to prevent injury or material loss, if such a roll is possible. Once per distinct failure event; this does not improve the task’s progress roll or reverse damage already applied.

**Known book spells:** Arcane Bolt (Main Action; SP 0); Mage Hand (Maneuver; SP 1); Mending (Ritual; SP 0); Grease (Main Action; SP 1); Light (Maneuver; SP 0); Magic Weapon (Main Action; SP 1); Detect Magic (Maneuver; SP 0); Detect Poison and Disease (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 9/4/3/1 casts respectively; with the learned once-per-rest recovery it funds 9/4/3/1. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/artificer-level-3.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Force (`force`) | 2 | 1 |
| Telekinesis I (`telekinesis:0`) | 1 | 1 |
| Shaping I (`shaping:0`) | 1 | 1 |
| Imbuement I (`imbuement:0`) | 1 | 1 |
| Mend and Fit I (`craft:repairs:1`) | 1 | 1 |
| Smoke in a Bottle I (`craft:mixtures:1`) | 1 | 1 |
| Detection I (`detection:0`) | 1 | 1 |
| Catch the Failure I (`craft:safeguards:1`) | 1 | 1 |
| Mend and Fit II (`craft:repairs:2`) | 2 | 3 |
| Mend and Fit III (`craft:repairs:3`) | 2 | 3 |
| Field Repair I (`craft:repairs:4`) | 3 | 3 |
| Field Repair II (`craft:repairs:5`) | 4 | 3 |
| Field Repair III (`craft:repairs:6`) | 4 | 3 |

**Signature choices:** level 1: Make It Last; level 3: Twofold Making.

<details><summary>Make It Last: complete signature component</summary>

**Action:** Ritual — 1 hour · **Attribute:** None

**Target / range / shape:** One ordinary item you own within reach.

**Magic:** Bound-item spell · **SP:** 1

Pay 1 SP and bind one item with a property chosen when bound: a lamp gives controllable ordinary torchlight; a tool returns to its bearer’s empty hand with a Maneuver from within 3 squares along a clear path; or a shield lets its bearer spend a Reaction once per scene to reduce one attack’s damage by 1 after rolling defense, respecting the attack’s minimum damage. You can have one bound item. A binding lasts until you end or replace it, even if the item is lent or lost. Cancellation target 3 ends its magic but leaves the ordinary item and occupied binding; restore the magic with a new ritual and SP. Lending or re-binding an item does not refresh its limited use.

**Duration:** Indefinite; no Sustain.

**Equipment / acquisition:** Suitable tools and the actual ordinary item.

</details>

<details><summary>Twofold Making: complete signature component</summary>

**Action:** Ritual — 1 hour · **Attribute:** None

**Target / range / shape:** One ordinary item you own within reach.

**Magic:** Bound-item spell · **SP:** 1

Pay 1 SP and bind the item with one property chosen when bound: a lamp gives controllable ordinary torchlight; a tool returns to its bearer’s empty hand with a Maneuver from within 3 squares along a clear path; or a shield lets its bearer spend a Reaction once per scene to reduce one attack’s damage by 1 after rolling defense, respecting the attack’s minimum damage. A weapon may instead have this property: once per scene, before a weapon attack, its bearer converts that attack’s physical damage to fire or cold. Choose the type before rolling. Its damage amount and other effects are unchanged; this adds no second damage component. The converted attack is magical.

You may maintain two bound items on different ordinary objects. A binding lasts until you end or replace it, even if the item is lent or lost. Cancellation target 3 ends its magic but leaves the ordinary item and occupied binding; restore its magic with a new ritual and SP. Lending, replacing or re-binding an item does not refresh its limited use.

**Duration:** Indefinite; no Sustain.

**Equipment / acquisition:** Suitable tools and the actual ordinary item.

If you also know Make It Last, both signatures use this same two-item binding limit; their capacities do not add.

</details>

**Useful actions and improvements:**

- **Mend and Fit I:** Main Action, with tools and a suitable brace or fastening: temporarily secure one damaged nonmagical item within reach so it can support its ordinary stationary load until your next turn ends. It gains no HP and cannot attack or protect from attacks while broken. Alternatively work for 10 minutes and roll Knowledge for 1/2/3 progress toward repairing an item that retains enough structure. Mend and Fit’s repair work adds 1/3/4 progress. Its temporary brace lasts 1 minute unless the item moves or receives further damage. Mend and Fit’s repair work takes 5 minutes per attempt.
- **Smoke in a Bottle I:** 1 hour · Knowledge, with alchemical tools and one purchased batch of smoke ingredients. Add 1/2/3 progress toward target 3 to prepare one smoke flask. Maneuver: throw a prepared flask to a visible point within 4 squares, consuming it. Smoke fills a 1-square-radius area until your next turn ends and blocks sight through it. No throwing roll.
- **Catch the Failure I:** Reaction. When a visible component within reach begins to fail during a nonmagical task, use tools in hand to arrest it before the consequence resolves. Give the worker 1 Boon on the associated roll to prevent injury or material loss, if such a roll is possible. Once per distinct failure event; this does not improve the task’s progress roll or reverse damage already applied.
- **Field Repair I:** Main Action · Knowledge, with tools and materials. Work on a damaged nonmagical item within reach whose essential structure remains. Add 1/2/3 progress toward repairing it. Completion restores its ordinary function; HP restoration for an object with HP is set as part of the repair objective before work. Field Repair adds 1/3/4 progress. Field Repair gains 1 Boon when you can reach and work on all damaged components.

**Known book spells:** Arcane Bolt (Main Action; SP 0); Mage Hand (Maneuver; SP 1); Mending (Ritual; SP 0); Grease (Main Action; SP 1); Light (Maneuver; SP 0); Magic Weapon (Main Action; SP 1); Detect Magic (Maneuver; SP 0); Detect Poison and Disease (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 13/6/4/2 casts respectively; with the learned once-per-rest recovery it funds 13/6/4/2. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/artificer-level-7.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Force (`force`) | 2 | 1 |
| Telekinesis I (`telekinesis:0`) | 1 | 1 |
| Shaping I (`shaping:0`) | 1 | 1 |
| Imbuement I (`imbuement:0`) | 1 | 1 |
| Mend and Fit I (`craft:repairs:1`) | 1 | 1 |
| Smoke in a Bottle I (`craft:mixtures:1`) | 1 | 1 |
| Detection I (`detection:0`) | 1 | 1 |
| Catch the Failure I (`craft:safeguards:1`) | 1 | 1 |
| Mend and Fit II (`craft:repairs:2`) | 2 | 3 |
| Mend and Fit III (`craft:repairs:3`) | 2 | 3 |
| Field Repair I (`craft:repairs:4`) | 3 | 3 |
| Field Repair II (`craft:repairs:5`) | 4 | 3 |
| Field Repair III (`craft:repairs:6`) | 4 | 3 |
| Make It Whole (`craft:repairs:7`) | 5 | 7 |
| Imbuement II (`imbuement:1`) | 2 | 7 |
| Imbuement III (`imbuement:2`) | 2 | 7 |
| The Enchanter’s Legacy (`imbuement:3`) | 3 | 7 |
| Shaping II (`shaping:1`) | 2 | 7 |
| Shaping III (`shaping:2`) | 2 | 7 |
| Masterwork Forms (`shaping:3`) | 3 | 7 |
| Telekinesis II (`telekinesis:1`) | 2 | 7 |
| Telekinesis III (`telekinesis:2`) | 2 | 7 |
| Invisible Architecture (`telekinesis:3`) | 3 | 7 |
| Trail Workshop I (`craft:workshop:1`) | 1 | 7 |
| Trail Workshop II (`craft:workshop:2`) | 2 | 7 |
| Trail Workshop III (`craft:workshop:3`) | 2 | 7 |
| A Roof before Nightfall I (`craft:workshop:4`) | 3 | 7 |
| Detection II (`detection:1`) | 2 | 7 |
| Detection III (`detection:2`) | 2 | 7 |

**Signature choices:** level 1: Make It Last; level 3: Twofold Making; level 7: Masterwork Bond.

<details><summary>Make It Last: complete signature component</summary>

**Action:** Ritual — 1 hour · **Attribute:** None

**Target / range / shape:** One ordinary item you own within reach.

**Magic:** Bound-item spell · **SP:** 1

Pay 1 SP and bind one item with a property chosen when bound: a lamp gives controllable ordinary torchlight; a tool returns to its bearer’s empty hand with a Maneuver from within 3 squares along a clear path; or a shield lets its bearer spend a Reaction once per scene to reduce one attack’s damage by 1 after rolling defense, respecting the attack’s minimum damage. You can have one bound item. A binding lasts until you end or replace it, even if the item is lent or lost. Cancellation target 3 ends its magic but leaves the ordinary item and occupied binding; restore the magic with a new ritual and SP. Lending or re-binding an item does not refresh its limited use.

**Duration:** Indefinite; no Sustain.

**Equipment / acquisition:** Suitable tools and the actual ordinary item.

</details>

<details><summary>Twofold Making: complete signature component</summary>

**Action:** Ritual — 1 hour · **Attribute:** None

**Target / range / shape:** One ordinary item you own within reach.

**Magic:** Bound-item spell · **SP:** 1

Pay 1 SP and bind the item with one property chosen when bound: a lamp gives controllable ordinary torchlight; a tool returns to its bearer’s empty hand with a Maneuver from within 3 squares along a clear path; or a shield lets its bearer spend a Reaction once per scene to reduce one attack’s damage by 1 after rolling defense, respecting the attack’s minimum damage. A weapon may instead have this property: once per scene, before a weapon attack, its bearer converts that attack’s physical damage to fire or cold. Choose the type before rolling. Its damage amount and other effects are unchanged; this adds no second damage component. The converted attack is magical.

You may maintain two bound items on different ordinary objects. A binding lasts until you end or replace it, even if the item is lent or lost. Cancellation target 3 ends its magic but leaves the ordinary item and occupied binding; restore its magic with a new ritual and SP. Lending, replacing or re-binding an item does not refresh its limited use.

**Duration:** Indefinite; no Sustain.

**Equipment / acquisition:** Suitable tools and the actual ordinary item.

If you also know Make It Last, both signatures use this same two-item binding limit; their capacities do not add.

</details>

<details><summary>Masterwork Bond: complete signature component</summary>

**Action:** Ritual — 1 hour · **Attribute:** None

**Target / range / shape:** One ordinary item you own within reach.

**Magic:** Bound-item spell · **SP:** 1

Pay 1 SP and bind the item with one property chosen when bound: a lamp gives controllable ordinary torchlight; a tool returns to its bearer’s empty hand with a Maneuver from within 3 squares along a clear path; or a shield lets its bearer spend a Reaction once per scene to reduce one attack’s damage by 1 after rolling defense, respecting the attack’s minimum damage. You may maintain three bound items on different ordinary objects.

One of those items may instead carry this masterwork property: once between your safe overnight rests, its wearer can spend a Reaction before one defense roll to gain 2 Boons. Track that use against your bond. A binding lasts until you end or replace it, even if the item is lent or lost. Cancellation target 3 ends its magic but leaves the ordinary item and occupied binding; restore its magic with a new ritual and SP. Lending, replacing or re-binding an item does not refresh its limited use.

**Duration:** Indefinite; no Sustain.

**Equipment / acquisition:** Suitable tools and the actual ordinary item.

If you also know Make It Last or Twofold Making, all your bindings share this three-item limit. Twofold Making’s weapon property is available only if you also know that signature.

</details>

**Useful actions and improvements:**

- **Mend and Fit I:** Main Action, with tools and a suitable brace or fastening: temporarily secure one damaged nonmagical item within reach so it can support its ordinary stationary load until your next turn ends. It gains no HP and cannot attack or protect from attacks while broken. Alternatively work for 10 minutes and roll Knowledge for 1/2/3 progress toward repairing an item that retains enough structure. Mend and Fit’s repair work adds 1/3/4 progress. Its temporary brace lasts 1 minute unless the item moves or receives further damage. Mend and Fit’s repair work takes 5 minutes per attempt.
- **Smoke in a Bottle I:** 1 hour · Knowledge, with alchemical tools and one purchased batch of smoke ingredients. Add 1/2/3 progress toward target 3 to prepare one smoke flask. Maneuver: throw a prepared flask to a visible point within 4 squares, consuming it. Smoke fills a 1-square-radius area until your next turn ends and blocks sight through it. No throwing roll.
- **Catch the Failure I:** Reaction. When a visible component within reach begins to fail during a nonmagical task, use tools in hand to arrest it before the consequence resolves. Give the worker 1 Boon on the associated roll to prevent injury or material loss, if such a roll is possible. Once per distinct failure event; this does not improve the task’s progress roll or reverse damage already applied.
- **Field Repair I:** Main Action · Knowledge, with tools and materials. Work on a damaged nonmagical item within reach whose essential structure remains. Add 1/2/3 progress toward repairing it. Completion restores its ordinary function; HP restoration for an object with HP is set as part of the repair objective before work. Field Repair adds 1/3/4 progress. Field Repair gains 1 Boon when you can reach and work on all damaged components.
- **Make It Whole:** Main Action · Knowledge, with tools and matching replacement parts. Add 3/5/7 progress toward repairing one examined nonmagical mechanism or object within reach, including a shattered item whose essential pieces or replacements are available. The DA fixes the complete repair objective and restored HP before work. Completing it restores normal function, not magical properties or expended ammunition. Large structures still require access to every affected section.
- **Trail Workshop I:** Passive. Learn two recipes from Bound Torches, Fletched Ammunition, Travel Food, Twisted Cord and Wooden Brace. With tools and ingredients, work at the recipe’s interval and roll Knowledge for 1/2/3 progress or inventory steps; its output cap applies. You may also build a brace, barricade or shelter with structural materials: 1 hour and Knowledge for 1/2/3 progress toward the DA’s construction objective. Trail Workshop teaches two more recipes from its list. Its construction work adds 1/3/4 progress. Trail Workshop adds 1/3/4 progress or inventory steps to its recipes, respecting output caps; construction attempts take 30 minutes.
- **A Roof before Nightfall I:** 1 hour, with tools and sound materials on stable ground. Build a weatherproof shelter for six people without a roll. It resists ordinary weather, not attacks or extreme hazards. You can also improvise a simple hook, wedge, lever or similar tool from suitable salvage: 10 minutes and Knowledge for 1/2/3 progress toward target 3. It lasts one task and cannot be a weapon, armor, consumable ingredient or valuable.

**Known book spells:** Arcane Bolt (Main Action; SP 0); Mage Hand (Maneuver; SP 1); Mending (Ritual; SP 0); Grease (Main Action; SP 1); Light (Maneuver; SP 0); Magic Weapon (Main Action; SP 1); Detect Magic (Maneuver; SP 0); Detect Poison and Disease (Ritual; SP 1); Elemental Weapon (Main Action; SP 1); Rune Mastery (Ritual; SP 2); Magic Mouth (Ritual; SP 2); Continual Flame (Ritual; SP 3); Holy Symbol (Ritual; SP 3); Weapon I (Ritual; SP 4); Enlarge/Reduce — Objects (Main Action; SP 1); Unlocking Ways (Ritual; SP 2); Heat Metal — Forge (Ritual; SP 2); Stone Shape — Craft (Ritual; SP 3); Fabricate (Ritual; SP 3); Earthen Transmutations (Ritual; SP 4); Magic Missile (Main Action; SP 1); Staying (Main Action; SP 2); Levitate — Objects (Main Action; SP 2); Shatter (Main Action; SP 3); Telekinesis (Main Action; SP 3); Resilient Sphere (Main Action; SP 4); Detect Evil and Good (Main Action; SP 1); Find Traps (Main Action; SP 2); See Invisibility (Main Action; SP 2); Identify (Ritual; SP 3).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 21/10/7/4 casts respectively; with the learned once-per-rest recovery it funds 21/10/7/4. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 3: Imbuement II — Costs 2 DP. You have 1 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
