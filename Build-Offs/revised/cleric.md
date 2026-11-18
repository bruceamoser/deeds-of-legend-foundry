# Brunna Hearthward: cleric after the rewrite

Pinned authored source `6ed861864bd6398f4d40e18d12bc2c5378373a47`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../cleric.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Repeatable Mend, explicit shared first-aid recovery, defensive prayers and developed treatment make a complete support identity.

There is no separate Channel Divinity pool or Turn Undead feature in these selections. Burning SP on healing competes directly with other paid spells.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 18 | 28 | 48 |
| SP | 6 | 10 | 18 |
| DP spent / total | 8 / 10 | 22 / 23 | 61 / 61 |
| Unspent DP | 2 | 1 | 0 |
| Learned action choices (Main / Maneuver / Reaction) | 2 / 0 / 0 | 4 / 0 / 0 | 5 / 0 / 0 |
| Known book spells (free / paid) | 6 (4 / 2) | 12 (4 / 8) | 25 (4 / 21) |
| Shared reserve: casts at 2 SP | 3 | 5 | 9 |
| Shared reserve: casts at 5 SP | 1 | 2 | 3 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Hill Dwarf**; class: **Shepherd**. Attributes: brawn +0, fortitude +1, agility +0, guile +0, knowledge +0, reason +2. Traits: Hard as Bedrock; Rooted in Stone.

Starting disciplines: wards from culture, life from background, and medicine from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Light Armor (worn); Ordinary Shield (held); Travel Pack; Food Bundle; Water Flask; Sleeping Roll; First-Aid Supplies. 11 starting coins remain. The cleric trades the old backup mace for actual first-aid supplies; Sacred Flame supplies the ranged attack.

The D&D baseline has **19 HP** and **AC 15 (Chain Shirt 13 + DEX 0 + Shield 2)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Creation remains **8 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `medicine:first-aid` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/cleric-level-1.hol.json). 2 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Restoration I (`restoration:0`) | 1 | 1 |
| Protection I (`protection:0`) | 1 | 1 |
| Sanctuary I (`sanctuary:0`) | 1 | 1 |
| Field Dressing I (`medicine:first-aid:1`) | 1 | 1 |
| Armor (`armor`) | 3 | 1 |
| Light Armor I (`armor:harness:1`) | 1 | 1 |

**Signature choices:** level 1: Mend.

<details><summary>Mend: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One living ally within 3 squares.

pay 1 SP before rolling. You must have enough SP to pay this cost. Requires a free hand. Make a Reason roll. Weak: restore 3 HP. Standard: restore 6 HP. Strong: restore 9 HP, and the target may stand without spending movement. Reduce the restored amount by the target's Life resistance, to a minimum of 1 if HP is missing, and never exceed maximum HP. A Dying or stabilized living creature can receive this healing. This does not erase scars or restore the dead.

**Duration:** Immediate.

**Equipment / acquisition:** A free hand.

This is a spell; use its printed 1 SP cost and ordinary casting rules.

</details>

**Useful actions and improvements:**

- **Field Dressing I:** Main Action, with a free hand and bandaging: reduce an adjacent patient’s Bleeding by 2, minimum 0, without HP restoration or a first-aid attempt. Alternatively spend 10 minutes and roll Knowledge to restore 3/5/7 HP to a patient within reach, consuming its first-aid attempt.
- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size.

**Known book spells:** Spare the Dying (Maneuver; SP 0); Cure Wounds (Main Action; SP 1); Sacred Flame (Main Action; SP 0); Shield (Reaction; SP 0); Resistance (Maneuver; SP 0); Sanctuary (Main Action; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 6/3/2/1 casts respectively; with the learned once-per-rest recovery it funds 6/3/2/1. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/cleric-level-3.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Restoration I (`restoration:0`) | 1 | 1 |
| Protection I (`protection:0`) | 1 | 1 |
| Sanctuary I (`sanctuary:0`) | 1 | 1 |
| Field Dressing I (`medicine:first-aid:1`) | 1 | 1 |
| Armor (`armor`) | 3 | 1 |
| Light Armor I (`armor:harness:1`) | 1 | 1 |
| Restoration II (`restoration:1`) | 2 | 3 |
| Restoration III (`restoration:2`) | 2 | 3 |
| Living Renewal (`restoration:3`) | 3 | 3 |
| Field Dressing II (`medicine:first-aid:2`) | 2 | 3 |
| Field Dressing III (`medicine:first-aid:3`) | 2 | 3 |
| Emergency Treatment I (`medicine:first-aid:4`) | 3 | 3 |

**Signature choices:** level 1: Mend; level 3: Triage.

<details><summary>Mend: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One living ally within 3 squares.

pay 1 SP before rolling. You must have enough SP to pay this cost. Requires a free hand. Make a Reason roll. Weak: restore 3 HP. Standard: restore 6 HP. Strong: restore 9 HP, and the target may stand without spending movement. Reduce the restored amount by the target's Life resistance, to a minimum of 1 if HP is missing, and never exceed maximum HP. A Dying or stabilized living creature can receive this healing. This does not erase scars or restore the dead.

**Duration:** Immediate.

**Equipment / acquisition:** A free hand.

This is a spell; use its printed 1 SP cost and ordinary casting rules.

</details>

<details><summary>Triage: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One or two living allies within 3 squares.

Pay 2 SP before rolling. You must have enough SP to pay this cost. Requires a free hand. Make a Reason roll. Choose one or two allies. One ally: restore 6 HP on Weak, 11 HP on Standard, 16 HP on Strong. Two allies: restore 4 HP each on Weak, 7 HP each on Standard, 10 HP each on Strong. Reduce the restored amount by each target's Life resistance, to a minimum of 1 if HP is missing, and never exceed maximum HP. A Dying or stabilized living creature can receive this healing. This does not erase scars or restore the dead.

**Duration:** Immediate.

**Equipment / acquisition:** A free hand.

This is a spell.

</details>

**Useful actions and improvements:**

- **Field Dressing I:** Main Action, with a free hand and bandaging: reduce an adjacent patient’s Bleeding by 2, minimum 0, without HP restoration or a first-aid attempt. Alternatively spend 10 minutes and roll Knowledge to restore 3/5/7 HP to a patient within reach, consuming its first-aid attempt. Field Dressing’s first aid restores 4/6/8 HP; its immediate bandaging reduces Bleeding by 3. Field Dressing’s first aid takes 5 minutes. Its bandaging can be performed as a Maneuver.
- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size.
- **Emergency Treatment I:** Main Action · Knowledge, with medical supplies. Apply Field Dressing’s current healing immediately to an adjacent patient and mark its first-aid attempt used.

**Known book spells:** Spare the Dying (Maneuver; SP 0); Cure Wounds (Main Action; SP 1); Sacred Flame (Main Action; SP 0); Shield (Reaction; SP 0); Resistance (Maneuver; SP 0); Sanctuary (Main Action; SP 1); Healing Word (Maneuver; SP 1); Lesser Restoration (Main Action; SP 2); Prayer of Healing (Ritual; SP 2); Mass Healing Word (Main Action; SP 3); Greater Restoration (Main Action; SP 3); Mass Cure Wounds (Main Action; SP 4).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 10/5/3/2 casts respectively; with the learned once-per-rest recovery it funds 10/5/3/2. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/cleric-level-7.hol.json). 0 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Restoration I (`restoration:0`) | 1 | 1 |
| Protection I (`protection:0`) | 1 | 1 |
| Sanctuary I (`sanctuary:0`) | 1 | 1 |
| Field Dressing I (`medicine:first-aid:1`) | 1 | 1 |
| Armor (`armor`) | 3 | 1 |
| Light Armor I (`armor:harness:1`) | 1 | 1 |
| Restoration II (`restoration:1`) | 2 | 3 |
| Restoration III (`restoration:2`) | 2 | 3 |
| Living Renewal (`restoration:3`) | 3 | 3 |
| Field Dressing II (`medicine:first-aid:2`) | 2 | 3 |
| Field Dressing III (`medicine:first-aid:3`) | 2 | 3 |
| Emergency Treatment I (`medicine:first-aid:4`) | 3 | 3 |
| Emergency Treatment II (`medicine:first-aid:5`) | 4 | 7 |
| Emergency Treatment III (`medicine:first-aid:6`) | 4 | 7 |
| A Way through Death (`medicine:first-aid:7`) | 5 | 7 |
| Heal (`restoration:4`) | 4 | 7 |
| Regenerate (`restoration:5`) | 4 | 7 |
| True Resurrection (`restoration:6`) | 5 | 7 |
| Protection II (`protection:1`) | 2 | 7 |
| Protection III (`protection:2`) | 2 | 7 |
| The Unbroken (`protection:3`) | 3 | 7 |
| Sanctuary II (`sanctuary:1`) | 2 | 7 |
| Sanctuary III (`sanctuary:2`) | 2 | 7 |
| Spellcraft (`spellcraft`) | 2 | 7 |

**Signature choices:** level 1: Mend; level 3: Triage; level 7: The Shepherd's Call.

<details><summary>Mend: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One living ally within 3 squares.

pay 1 SP before rolling. You must have enough SP to pay this cost. Requires a free hand. Make a Reason roll. Weak: restore 3 HP. Standard: restore 6 HP. Strong: restore 9 HP, and the target may stand without spending movement. Reduce the restored amount by the target's Life resistance, to a minimum of 1 if HP is missing, and never exceed maximum HP. A Dying or stabilized living creature can receive this healing. This does not erase scars or restore the dead.

**Duration:** Immediate.

**Equipment / acquisition:** A free hand.

This is a spell; use its printed 1 SP cost and ordinary casting rules.

</details>

<details><summary>Triage: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One or two living allies within 3 squares.

Pay 2 SP before rolling. You must have enough SP to pay this cost. Requires a free hand. Make a Reason roll. Choose one or two allies. One ally: restore 6 HP on Weak, 11 HP on Standard, 16 HP on Strong. Two allies: restore 4 HP each on Weak, 7 HP each on Standard, 10 HP each on Strong. Reduce the restored amount by each target's Life resistance, to a minimum of 1 if HP is missing, and never exceed maximum HP. A Dying or stabilized living creature can receive this healing. This does not erase scars or restore the dead.

**Duration:** Immediate.

**Equipment / acquisition:** A free hand.

This is a spell.

</details>

<details><summary>The Shepherd's Call: complete signature component</summary>

**Action:** 10 minutes · **Attribute:** None (no roll)

**Target / range / shape:** Up to three willing characters.

Mark each target with a physical sigil. The first time a marked character would be reduced to 0 HP, it remains at 1 HP instead; the mark then disappears. An unused mark fades at the coming dawn. A character can bear only one mark from this ability.

**Duration:** Until used or dawn.

**Equipment / acquisition:** A free hand for casting.

This is a ritual spell costing 0 SP, usable once between safe overnight rests. Unused sigils expire at dawn; a creature may bear one sigil at a time.

</details>

**Useful actions and improvements:**

- **Field Dressing I:** Main Action, with a free hand and bandaging: reduce an adjacent patient’s Bleeding by 2, minimum 0, without HP restoration or a first-aid attempt. Alternatively spend 10 minutes and roll Knowledge to restore 3/5/7 HP to a patient within reach, consuming its first-aid attempt. Field Dressing’s first aid restores 4/6/8 HP; its immediate bandaging reduces Bleeding by 3. Field Dressing’s first aid takes 5 minutes. Its bandaging can be performed as a Maneuver.
- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size.
- **Emergency Treatment I:** Main Action · Knowledge, with medical supplies. Apply Field Dressing’s current healing immediately to an adjacent patient and mark its first-aid attempt used. Emergency Treatment restores 5/7/9 HP instead of Field Dressing’s amount. Emergency Treatment also reduces Bleeding by 2, and you may move 1 square toward the patient before treating it without movement reactions.
- **A Way through Death:** Main Action · Knowledge, with medical supplies. Move up to 3 squares to a patient no larger than you, restore 5/8/11 HP using its available first-aid attempt, then carry it up to 3 squares and place it in a legal adjacent square. Both movements ignore movement reactions. You may rescue a patient whose allowance is spent without healing or consuming supplies. A free hand is needed to carry it; no armor training is required.

**Known book spells:** Spare the Dying (Maneuver; SP 0); Cure Wounds (Main Action; SP 1); Sacred Flame (Main Action; SP 0); Shield (Reaction; SP 0); Resistance (Maneuver; SP 0); Sanctuary (Main Action; SP 1); Healing Word (Maneuver; SP 1); Lesser Restoration (Main Action; SP 2); Prayer of Healing (Ritual; SP 2); Mass Healing Word (Main Action; SP 3); Greater Restoration (Main Action; SP 3); Mass Cure Wounds (Main Action; SP 4); Heal (Main Action; SP 5); Regenerate (Ritual; SP 5); True Resurrection (Ritual; SP 8); Mage Armor (Main Action; SP 1); Bladeturn (Reaction; SP 2); Protection from Evil and Good (Main Action; SP 2); Protection from Energy (Main Action; SP 3); Death Ward (Main Action; SP 3); Warding Bond (Main Action; SP 4); Quiet Ways (Main Action; SP 1); Tiny Hut (Ritual; SP 2); Private Sanctum (Ritual; SP 2); Hallow (Ritual; SP 3).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 18/9/6/3 casts respectively; with the learned once-per-rest recovery it funds 18/9/6/3. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 3: Protection II — Costs 2 DP. You have 1 DP.
- Level 7: Haven — Costs 3 DP. You have 2 DP.
- Level 7: Soul Capacity I — Costs 1 DP. You have 0 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
