# Aldren Vowkeeper: paladin after the rewrite

Pinned authored source `486f57f4eaf6acd7af39f16d403870dc0e574f6d`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../paladin.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Oathstrike supplies a declared, SP-paid radiant rider on the real learned weapon attack. Its later control and threshold create an avenging guardian rather than a generic weapon buff.

The rider needs an enemy that harmed an ally this scene. Healing here comes from the restoration book; choosing the healing signature instead would trade away early Oathstrike.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 16 | 26 | 46 |
| SP | 6 | 10 | 18 |
| DP spent / total | 7 / 10 | 22 / 23 | 52 / 61 |
| Unspent DP | 3 | 1 | 9 |
| Learned action choices (Main / Maneuver / Reaction) | 1 / 1 / 1 | 2 / 1 / 1 | 4 / 1 / 1 |
| Known book spells (free / paid) | 2 (1 / 1) | 2 (1 / 1) | 12 (3 / 9) |
| Shared reserve: casts at 2 SP | 3 | 5 | 9 |
| Shared reserve: casts at 5 SP | 1 | 2 | 3 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Oath-Bound**; class: **Protector**. Attributes: brawn +2, fortitude +1, agility +0, guile +0, knowledge -1, reason +1. Traits: The Will That Made You; A Hand on the Rudder.

Starting disciplines: armor from culture, life from background, and arms from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Ordinary Light Armor (worn); Ordinary Shield (held); Travel Pack; Food Bundle; Water Flask; Sleeping Roll. 11 starting coins remain. 

The D&D baseline has **20 HP** and **AC 19 (Chain Mail 16 + Shield 2 + Defense 1)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Starting DP is **10 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `arms:bladework` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/paladin-level-1.hol.json). 3 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Light Armor I (`armor:harness:1`) | 1 | 1 |
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Restoration I (`restoration:0`) | 1 | 1 |
| Blade Ward I (`arms:dueling:1`) | 1 | 1 |
| Driving Opening I (`arms:impact:1`) | 1 | 1 |

**Signature choices:** level 1: Oathstrike.

<details><summary>Oathstrike: complete signature component</summary>

**Action:** Passive modifier to a melee weapon attack · **Attribute:** Use that attack’s attribute

**Target / range / shape:** An enemy that damaged one of your allies this scene.

**Magic:** Magical weapon modifier · **SP:** 1

Once on your turn, declare Oathstrike and pay 1 SP before a melee weapon attack against that enemy. Add 1/2/3 radiant damage to the attack on Weak/Standard/Strong. Resolve each damage component’s resistance, then apply the minimum once to the whole attack. This magical weapon modifier is not a separate spell casting and does not require a free hand beyond the weapon’s requirements.

**Duration:** The attack.

**Equipment / acquisition:** The actual melee weapon required by the attack.

</details>

**Useful actions and improvements:**

- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size.
- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage.
- **Blade Ward I:** Reaction. After resolving your defense against a melee attack, before taking its damage, reduce that attack’s damage by 2 after resistance, respecting the attack minimum. No roll.
- **Driving Opening I:** Maneuver. Choose one visible creature. Before your turn ends, your next Main Action melee weapon attack against it pushes that creature directly away from your attack position, 1 square on Standard or 2 squares on Strong. Resolve collisions normally. Apply the push only to the chosen creature on that attack. Reusing this technique replaces its unused effect.

**Known book spells:** Spare the Dying (Maneuver; SP 0); Cure Wounds (Main Action; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 6/3/2/1 casts respectively; with the learned once-per-rest recovery it funds 6/3/2/1. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/paladin-level-3.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Light Armor I (`armor:harness:1`) | 1 | 1 |
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Restoration I (`restoration:0`) | 1 | 1 |
| Blade Ward I (`arms:dueling:1`) | 1 | 1 |
| Driving Opening I (`arms:impact:1`) | 1 | 1 |
| Measured Cut III (`arms:bladework:3`) | 2 | 3 |
| Sweeping Blade I (`arms:bladework:4`) | 3 | 3 |
| Sweeping Blade II (`arms:bladework:5`) | 4 | 3 |
| Sweeping Blade III (`arms:bladework:6`) | 4 | 3 |
| Light Armor II (`armor:harness:2`) | 2 | 3 |

**Signature choices:** level 1: Oathstrike; level 3: Rebuking Light.

<details><summary>Oathstrike: complete signature component</summary>

**Action:** Passive modifier to a melee weapon attack · **Attribute:** Use that attack’s attribute

**Target / range / shape:** An enemy that damaged one of your allies this scene.

**Magic:** Magical weapon modifier · **SP:** 1

Once on your turn, declare Oathstrike and pay 1 SP before a melee weapon attack against that enemy. Add 1/2/3 radiant damage to the attack on Weak/Standard/Strong. Resolve each damage component’s resistance, then apply the minimum once to the whole attack. This magical weapon modifier is not a separate spell casting and does not require a free hand beyond the weapon’s requirements.

**Duration:** The attack.

**Equipment / acquisition:** The actual melee weapon required by the attack.

</details>

<details><summary>Rebuking Light: complete signature component</summary>

**Action:** Passive modifier to a melee weapon attack · **Attribute:** Use that attack’s attribute

**Target / range / shape:** An enemy that damaged one of your allies this scene.

Once on your turn, declare this modifier and pay 1 SP before a melee weapon attack against that enemy. Add 1/2/3 radiant damage to the attack on Weak/Standard/Strong. On Standard or Strong, also push the target 1 square directly away from you. On Strong, also apply Dazed 1. Resolve each damage component’s resistance, then apply the minimum once to the whole attack. Resolve Stability, collisions and condition immunity normally.

**Duration:** The attack and immediate push; Dazed uses normal decay.

**Equipment / acquisition:** The actual melee weapon required by the attack.

This magical weapon modifier is not a separate spell casting and requires no free hand beyond the weapon’s requirements.

</details>

**Useful actions and improvements:**

- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size. While wearing armor you are trained to use, gain 1 Boon on rolls to resist forced movement. This is not additional resistance or Stability.
- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage. Measured Cut also applies Bleeding 1 on Strong.
- **Blade Ward I:** Reaction. After resolving your defense against a melee attack, before taking its damage, reduce that attack’s damage by 2 after resistance, respecting the attack minimum. No roll.
- **Driving Opening I:** Maneuver. Choose one visible creature. Before your turn ends, your next Main Action melee weapon attack against it pushes that creature directly away from your attack position, 1 square on Standard or 2 squares on Strong. Resolve collisions normally. Apply the push only to the chosen creature on that attack. Reusing this technique replaces its unused effect.
- **Sweeping Blade I:** Main Action · Brawn. Attack up to three adjacent enemies. Roll once; each takes 1/2/4 physical damage. Each creature is struck once. Sweeping Blade deals 2/3/5 physical damage to each target. Sweeping Blade also pushes each target 1 square directly away on Strong. Resolve collisions normally.

**Known book spells:** Spare the Dying (Maneuver; SP 0); Cure Wounds (Main Action; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 10/5/3/2 casts respectively; with the learned once-per-rest recovery it funds 10/5/3/2. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/paladin-level-7.hol.json). 9 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Light Armor I (`armor:harness:1`) | 1 | 1 |
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Restoration I (`restoration:0`) | 1 | 1 |
| Blade Ward I (`arms:dueling:1`) | 1 | 1 |
| Driving Opening I (`arms:impact:1`) | 1 | 1 |
| Measured Cut III (`arms:bladework:3`) | 2 | 3 |
| Sweeping Blade I (`arms:bladework:4`) | 3 | 3 |
| Sweeping Blade II (`arms:bladework:5`) | 4 | 3 |
| Sweeping Blade III (`arms:bladework:6`) | 4 | 3 |
| Light Armor II (`armor:harness:2`) | 2 | 3 |
| Iron Tempest (`arms:bladework:7`) | 5 | 7 |
| Light Armor III (`armor:harness:3`) | 2 | 7 |
| Heavy Armor I (`armor:harness:4`) | 3 | 7 |
| Heavy Armor II (`armor:harness:5`) | 4 | 7 |
| Heavy Armor III (`armor:harness:6`) | 4 | 7 |
| Restoration II (`restoration:1`) | 2 | 7 |
| Restoration III (`restoration:2`) | 2 | 7 |
| Living Renewal (`restoration:3`) | 3 | 7 |
| Wards (`wards`) | 2 | 7 |
| Protection I (`protection:0`) | 1 | 7 |
| Protection II (`protection:1`) | 2 | 7 |

**Signature choices:** level 1: Oathstrike; level 3: Rebuking Light; level 7: Radiant Threshold.

<details><summary>Oathstrike: complete signature component</summary>

**Action:** Passive modifier to a melee weapon attack · **Attribute:** Use that attack’s attribute

**Target / range / shape:** An enemy that damaged one of your allies this scene.

**Magic:** Magical weapon modifier · **SP:** 1

Once on your turn, declare Oathstrike and pay 1 SP before a melee weapon attack against that enemy. Add 1/2/3 radiant damage to the attack on Weak/Standard/Strong. Resolve each damage component’s resistance, then apply the minimum once to the whole attack. This magical weapon modifier is not a separate spell casting and does not require a free hand beyond the weapon’s requirements.

**Duration:** The attack.

**Equipment / acquisition:** The actual melee weapon required by the attack.

</details>

<details><summary>Rebuking Light: complete signature component</summary>

**Action:** Passive modifier to a melee weapon attack · **Attribute:** Use that attack’s attribute

**Target / range / shape:** An enemy that damaged one of your allies this scene.

Once on your turn, declare this modifier and pay 1 SP before a melee weapon attack against that enemy. Add 1/2/3 radiant damage to the attack on Weak/Standard/Strong. On Standard or Strong, also push the target 1 square directly away from you. On Strong, also apply Dazed 1. Resolve each damage component’s resistance, then apply the minimum once to the whole attack. Resolve Stability, collisions and condition immunity normally.

**Duration:** The attack and immediate push; Dazed uses normal decay.

**Equipment / acquisition:** The actual melee weapon required by the attack.

This magical weapon modifier is not a separate spell casting and requires no free hand beyond the weapon’s requirements.

</details>

<details><summary>Radiant Threshold: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** A straight line starting from a point you can see within 5 squares.

Make a Reason roll. Weak: 3 squares long; 1 radiant damage. Standard: 5 squares long; 2 radiant damage. Strong: 7 squares long; 3 radiant damage. The line is 1 square wide and lasts until the start of your next turn. You and allies you choose when you create it are unaffected. A creature takes the damage when the line appears in its square, when it enters a square of the line, or when it starts its turn there. A creature can take this damage only once per round. The line does not block movement.

**Duration:** Until the start of your next turn.

**Equipment / acquisition:** A free hand for casting.

This is a spell costing 2 SP, usable once per scene. You may have one threshold at a time; creating another ends it. Each creature takes its zone damage at most once per round. Damage dealt by occupying/crossing the persistent zone is non-attack damage and can be reduced to 0.

</details>

**Useful actions and improvements:**

- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size. While wearing armor you are trained to use, gain 1 Boon on rolls to resist forced movement. This is not additional resistance or Stability. You are also trained to wear medium armor; the suit supplies physical resistance 2. Your Speed increases by 1 while wearing armor you are trained to use.
- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage. Measured Cut also applies Bleeding 1 on Strong.
- **Blade Ward I:** Reaction. After resolving your defense against a melee attack, before taking its damage, reduce that attack’s damage by 2 after resistance, respecting the attack minimum. No roll.
- **Driving Opening I:** Maneuver. Choose one visible creature. Before your turn ends, your next Main Action melee weapon attack against it pushes that creature directly away from your attack position, 1 square on Standard or 2 squares on Strong. Resolve collisions normally. Apply the push only to the chosen creature on that attack. Reusing this technique replaces its unused effect.
- **Sweeping Blade I:** Main Action · Brawn. Attack up to three adjacent enemies. Roll once; each takes 1/2/4 physical damage. Each creature is struck once. Sweeping Blade deals 2/3/5 physical damage to each target. Sweeping Blade also pushes each target 1 square directly away on Strong. Resolve collisions normally.
- **Iron Tempest:** Main Action · Brawn. Move up to 3 squares, ignoring extra movement cost from difficult terrain, and attack up to three enemies adjacent at any point along that route. Roll once; each takes 3/5/8 physical damage. Each creature is struck once. Once per scene, you may instead strike four enemies for 4/7/10; after this sweep gain Stability 3 until your next turn starts.
- **Heavy Armor I:** Passive. You are also trained to wear heavy armor; the suit supplies physical resistance 3. Maneuver: lift one willing or helpless adjacent creature no larger than you. For this turn, carrying it adds no encumbrance and occupies no weapon hand. Put it down in a legal adjacent square when your turn ends. While wearing trained armor, ignore the extra cost of the first square of nonmagical difficult terrain you enter each turn. Heavy Armor’s carrying benefit lasts until the start of your next turn instead of turn end. Heavy Armor’s carrying Maneuver also lets you move 2 squares with the passenger without movement reactions. Place the passenger in a legal adjacent square when the carrying benefit ends.

**Known book spells:** Spare the Dying (Maneuver; SP 0); Cure Wounds (Main Action; SP 1); Healing Word (Maneuver; SP 1); Lesser Restoration (Main Action; SP 2); Prayer of Healing (Ritual; SP 2); Mass Healing Word (Main Action; SP 3); Greater Restoration (Main Action; SP 3); Mass Cure Wounds (Main Action; SP 4); Sacred Flame (Main Action; SP 0); Shield (Reaction; SP 0); Mage Armor (Main Action; SP 1); Bladeturn (Reaction; SP 2).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 18/9/6/3 casts respectively; with the learned once-per-rest recovery it funds 18/9/6/3. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 3: Light Armor III — Costs 2 DP. You have 1 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
