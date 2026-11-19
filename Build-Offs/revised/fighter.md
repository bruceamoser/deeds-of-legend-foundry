# Corin Ashguard: fighter after the rewrite

Pinned authored source `e5575a674821fe31387cf4bf622a2dea96dd0906`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../fighter.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Measured Guard develops its counter and then an additional constrained Reaction. Main attack, Maneuver preparation, defense and armor investment remain distinct.

No Second Wind pool or exact Action Surge is selected. Heavy-armor training is reached at level 3 or later, but this continuing character keeps its purchased light suit until it buys another.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 16 | 24 | 40 |
| SP | 3 | 7 | 15 |
| DP spent / total | 7 / 10 | 22 / 23 | 56 / 61 |
| Unspent DP | 3 | 1 | 5 |
| Learned action choices (Main / Maneuver / Reaction) | 1 / 1 / 3 | 2 / 1 / 4 | 3 / 1 / 6 |
| Known book spells (free / paid) | 0 (0 / 0) | 0 (0 / 0) | 0 (0 / 0) |
| Shared reserve: casts at 2 SP | 1 | 3 | 7 |
| Shared reserve: casts at 5 SP | 0 | 1 | 3 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Human**; class: **Blade**. Attributes: brawn +2, fortitude +1, agility +0, guile +0, knowledge +0, reason +0. Traits: Never Quite Finished; Ingenuity.

Starting disciplines: armor from culture, guard from background, and arms from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Ordinary Light Armor (worn); Ordinary Shield (held); Travel Pack; Food Bundle; Water Flask; Sleeping Roll. 11 starting coins remain. 

The D&D baseline has **20 HP** and **AC 19 with Flail and Shield (Chain Mail 16 + Shield 2 + Defense 1); 17 while wielding Greatsword** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Starting DP is **10 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `arms:bladework` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/fighter-level-1.hol.json). 3 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Light Armor I (`armor:harness:1`) | 1 | 1 |
| Interpose I (`guard:interception:1`) | 1 | 1 |
| Sheltering Guard I (`guard:shelter:1`) | 1 | 1 |
| Blade Ward I (`arms:dueling:1`) | 1 | 1 |

**Signature choices:** level 1: Measured Guard.

<details><summary>Measured Guard: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (no roll)

**Target / range / shape:** Self, before a defense against an adjacent enemy.

Gain 1 Boon to the defense. After the attack resolves, if the defense was Strong and the attacker is within your reach, make a Basic Melee attack against that attacker. This counterattack is part of the Reaction and does not use your Main Action.

**Duration:** The triggering defense and immediate counterattack.

**Equipment / acquisition:** None.

You must wield a melee weapon to use this guard and counterattack. A granted counterattack cannot trigger another granted attack.

</details>

**Useful actions and improvements:**

- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage.
- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size.
- **Interpose I:** Reaction. After an adjacent ally rolls defense, before applying physical damage from that attack, reduce that damage by 1 after resistance. You must be able to reach the ally. No roll.
- **Sheltering Guard I:** Maneuver. Choose one willing adjacent ally. Until your next turn starts it gains 1 Boon on ranged defenses while adjacent. Reusing this technique replaces its previous effect. No roll.
- **Blade Ward I:** Reaction. After resolving your defense against a melee attack, before taking its damage, reduce that attack’s damage by 2 after resistance, respecting the attack minimum. No roll.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 3/1/1/0 casts respectively; with the learned once-per-rest recovery it funds 3/1/1/0. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/fighter-level-3.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Light Armor I (`armor:harness:1`) | 1 | 1 |
| Interpose I (`guard:interception:1`) | 1 | 1 |
| Sheltering Guard I (`guard:shelter:1`) | 1 | 1 |
| Blade Ward I (`arms:dueling:1`) | 1 | 1 |
| Measured Cut III (`arms:bladework:3`) | 2 | 3 |
| Sweeping Blade I (`arms:bladework:4`) | 3 | 3 |
| Sweeping Blade II (`arms:bladework:5`) | 4 | 3 |
| Sweeping Blade III (`arms:bladework:6`) | 4 | 3 |
| Light Armor II (`armor:harness:2`) | 2 | 3 |

**Signature choices:** level 1: Measured Guard; level 3: Return Stroke.

<details><summary>Measured Guard: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (no roll)

**Target / range / shape:** Self, before a defense against an adjacent enemy.

Gain 1 Boon to the defense. After the attack resolves, if the defense was Strong and the attacker is within your reach, make a Basic Melee attack against that attacker. This counterattack is part of the Reaction and does not use your Main Action.

**Duration:** The triggering defense and immediate counterattack.

**Equipment / acquisition:** None.

You must wield a melee weapon to use this guard and counterattack. A granted counterattack cannot trigger another granted attack.

</details>

<details><summary>Return Stroke: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (roll the triggering defense normally)

**Target / range / shape:** Self, before a defense against an adjacent enemy.

Declare this guard before defending and gain 1 Boon to the defense. Resolve the triggering attack. After a Standard or Strong defense, if the attacker is still within your melee reach and you can attack, make one Basic Melee attack against it. The counterattack is part of this Reaction and does not use your Main Action. A granted counterattack cannot trigger another granted attack.

**Duration:** The triggering defense and immediate counterattack.

**Equipment / acquisition:** A ready melee weapon.

</details>

**Useful actions and improvements:**

- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage. Measured Cut also applies Bleeding 1 on Strong.
- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size. While wearing armor you are trained to use, gain 1 Boon on rolls to resist forced movement. This is not additional resistance or Stability.
- **Interpose I:** Reaction. After an adjacent ally rolls defense, before applying physical damage from that attack, reduce that damage by 1 after resistance. You must be able to reach the ally. No roll.
- **Sheltering Guard I:** Maneuver. Choose one willing adjacent ally. Until your next turn starts it gains 1 Boon on ranged defenses while adjacent. Reusing this technique replaces its previous effect. No roll.
- **Blade Ward I:** Reaction. After resolving your defense against a melee attack, before taking its damage, reduce that attack’s damage by 2 after resistance, respecting the attack minimum. No roll.
- **Sweeping Blade I:** Main Action · Brawn. Attack up to three adjacent enemies. Roll once; each takes 1/2/4 physical damage. Each creature is struck once. Sweeping Blade deals 2/3/5 physical damage to each target. Sweeping Blade also pushes each target 1 square directly away on Strong. Resolve collisions normally.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 7/3/2/1 casts respectively; with the learned once-per-rest recovery it funds 7/3/2/1. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/fighter-level-7.hol.json). 5 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Light Armor I (`armor:harness:1`) | 1 | 1 |
| Interpose I (`guard:interception:1`) | 1 | 1 |
| Sheltering Guard I (`guard:shelter:1`) | 1 | 1 |
| Blade Ward I (`arms:dueling:1`) | 1 | 1 |
| Measured Cut III (`arms:bladework:3`) | 2 | 3 |
| Sweeping Blade I (`arms:bladework:4`) | 3 | 3 |
| Sweeping Blade II (`arms:bladework:5`) | 4 | 3 |
| Sweeping Blade III (`arms:bladework:6`) | 4 | 3 |
| Light Armor II (`armor:harness:2`) | 2 | 3 |
| Iron Tempest (`arms:bladework:7`) | 5 | 7 |
| Interpose II (`guard:interception:2`) | 2 | 7 |
| Interpose III (`guard:interception:3`) | 2 | 7 |
| Take the Blow I (`guard:interception:4`) | 3 | 7 |
| Take the Blow II (`guard:interception:5`) | 4 | 7 |
| Take the Blow III (`guard:interception:6`) | 4 | 7 |
| The Last Safe Step (`guard:interception:7`) | 5 | 7 |
| Light Armor III (`armor:harness:3`) | 2 | 7 |
| Heavy Armor I (`armor:harness:4`) | 3 | 7 |
| Sheltering Guard II (`guard:shelter:2`) | 2 | 7 |
| Sheltering Guard III (`guard:shelter:3`) | 2 | 7 |

**Signature choices:** level 1: Measured Guard; level 3: Return Stroke; level 7: Twitch Reflexes.

<details><summary>Measured Guard: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (no roll)

**Target / range / shape:** Self, before a defense against an adjacent enemy.

Gain 1 Boon to the defense. After the attack resolves, if the defense was Strong and the attacker is within your reach, make a Basic Melee attack against that attacker. This counterattack is part of the Reaction and does not use your Main Action.

**Duration:** The triggering defense and immediate counterattack.

**Equipment / acquisition:** None.

You must wield a melee weapon to use this guard and counterattack. A granted counterattack cannot trigger another granted attack.

</details>

<details><summary>Return Stroke: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (roll the triggering defense normally)

**Target / range / shape:** Self, before a defense against an adjacent enemy.

Declare this guard before defending and gain 1 Boon to the defense. Resolve the triggering attack. After a Standard or Strong defense, if the attacker is still within your melee reach and you can attack, make one Basic Melee attack against it. The counterattack is part of this Reaction and does not use your Main Action. A granted counterattack cannot trigger another granted attack.

**Duration:** The triggering defense and immediate counterattack.

**Equipment / acquisition:** A ready melee weapon.

</details>

<details><summary>Twitch Reflexes: complete signature component</summary>

**Action:** Passive · **Attribute:** None

**Target / range / shape:** Self.

Each round you have one additional Reaction usable for an opportunity attack. Your normal Reaction remains available for any reaction you know. If you also know Measured Guard or Return Stroke, you may spend this additional Reaction on either instead. Use one of these guards against a given attack.

**Duration:** Permanent.

**Equipment / acquisition:** None.

</details>

**Useful actions and improvements:**

- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage. Measured Cut also applies Bleeding 1 on Strong.
- **Light Armor I:** Passive. You are trained to wear light armor; the suit supplies physical resistance 1. Ignore 1 Bulk from worn armor when calculating encumbrance, minimum 0 armor Bulk. This does not change its inventory size. While wearing armor you are trained to use, gain 1 Boon on rolls to resist forced movement. This is not additional resistance or Stability. You are also trained to wear medium armor; the suit supplies physical resistance 2. Your Speed increases by 1 while wearing armor you are trained to use.
- **Interpose I:** Reaction. After an adjacent ally rolls defense, before applying physical damage from that attack, reduce that damage by 1 after resistance. You must be able to reach the ally. No roll. Interpose reduces physical damage by 2. Before Interpose you may move 1 square to reach the ally without movement reactions.
- **Sheltering Guard I:** Maneuver. Choose one willing adjacent ally. Until your next turn starts it gains 1 Boon on ranged defenses while adjacent. Reusing this technique replaces its previous effect. No roll. Sheltering Guard can protect two adjacent allies. Sheltering Guard also gives each protected ally Stability 1 while adjacent.
- **Blade Ward I:** Reaction. After resolving your defense against a melee attack, before taking its damage, reduce that attack’s damage by 2 after resistance, respecting the attack minimum. No roll.
- **Sweeping Blade I:** Main Action · Brawn. Attack up to three adjacent enemies. Roll once; each takes 1/2/4 physical damage. Each creature is struck once. Sweeping Blade deals 2/3/5 physical damage to each target. Sweeping Blade also pushes each target 1 square directly away on Strong. Resolve collisions normally.
- **Iron Tempest:** Main Action · Brawn. Move up to 3 squares, ignoring extra movement cost from difficult terrain, and attack up to three enemies adjacent at any point along that route. Roll once; each takes 3/5/8 physical damage. Each creature is struck once. Once per scene, you may instead strike four enemies for 4/7/10; after this sweep gain Stability 3 until your next turn starts.
- **Take the Blow I:** Reaction. Before an adjacent ally rolls defense against a single-target attack, become its target if the attacker can legally target you. Roll your defense and receive all effects; the ally receives none. Before Take the Blow you may move up to 2 squares without movement reactions to reach an ally within 2 squares. Become a legal target before substituting. When you use Take the Blow, gain 1 Boon on your defense. After the intercepted attack resolves, the attacker’s remaining voluntary movement this turn becomes 0. Forced movement still applies.
- **The Last Safe Step:** Reaction. When an ally within 4 squares is about to take damage from an attack or fall, move up to 4 squares to reach it. If you reach it, move together up to 2 more squares and reduce that damage by 4 after resistance. Neither creature triggers movement reactions during this rescue. An attack still resolves against its original target; a fall ends only if the destination supports both creatures. Fall damage can reach 0. No roll beyond the original defense.
- **Heavy Armor I:** Passive. You are also trained to wear heavy armor; the suit supplies physical resistance 3. Maneuver: lift one willing or helpless adjacent creature no larger than you. For this turn, carrying it adds no encumbrance and occupies no weapon hand. Put it down in a legal adjacent square when your turn ends.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 15/7/5/3 casts respectively; with the learned once-per-rest recovery it funds 15/7/5/3. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 3: Light Armor III — Costs 2 DP. You have 1 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
