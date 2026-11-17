# Sera Quietstep: monk after the rewrite

Pinned authored source `87f5141bd6e0da74a10c07b3239e975c7656430a`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../monk.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

A complete shared unarmed branch now supplies real unarmed attacks and their own development. The staff is used only for the selected weapon-required guard, not to pretend weapon attacks are punches.

The character is not a Focus-point monk. Measured Guard still needs the readied staff; with empty hands, use the learned Athletics response or basic defense instead.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 16 | 24 | 40 |
| SP | 3 | 7 | 15 |
| DP spent / total | 7 / 7 | 20 / 20 | 51 / 58 |
| Unspent DP | 0 | 0 | 7 |
| Learned action choices (Main / Maneuver / Reaction) | 1 / 1 / 2 | 2 / 1 / 2 | 3 / 2 / 4 |
| Known book spells (free / paid) | 0 (0 / 0) | 0 (0 / 0) | 0 (0 / 0) |
| Shared reserve: casts at 2 SP | 1 | 3 | 7 |
| Shared reserve: casts at 5 SP | 0 | 1 | 3 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Human**; class: **Blade**. Attributes: brawn +1, fortitude +1, agility +2, guile -1, knowledge +0, reason +0. Traits: Never Quite Finished; The Impossible Streak.

Starting disciplines: arms from culture, athletics from background, and subterfuge from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Travel Pack; Food Bundle; Water Flask; Sleeping Roll; Rope Coil. 21 starting coins remain. 

The D&D baseline has **17 HP** and **AC 15 unarmored (10 + DEX 3 + WIS 2)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Creation remains **8 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `arms:unarmed` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/monk-level-1.hol.json). 0 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Empty-Hand Strike I (`arms:unarmed:1`) | 1 | 1 |
| Empty-Hand Strike II (`arms:unarmed:2`) | 2 | 1 |
| Empty-Hand Strike III (`arms:unarmed:3`) | 2 | 1 |
| Catch Your Balance I (`athletics:balance:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |

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

- **Empty-Hand Strike I:** Main Action · Brawn or Agility, chosen before rolling. Strike one adjacent creature unarmed for 2/3/5 physical damage. Choose an available hand, foot or other natural contact; restraint that prevents that contact prevents the strike. Empty-Hand Strike deals 3/4/6 physical damage. Empty-Hand Strike also applies Slowed 1 on Strong. Before rolling against a living creature with positive HP, you may declare the strike nonlethal: if its damage would reduce the target to 0 HP, leave it at 1 HP, Prone and Unconscious for 1 minute or until it next takes damage.
- **Catch Your Balance I:** Reaction. When you would fall Prone, remain standing instead. You must be conscious and able to move. No roll.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 3/1/1/0 casts respectively; with the learned once-per-rest recovery it funds 3/1/1/0. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/monk-level-3.hol.json). 0 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Empty-Hand Strike I (`arms:unarmed:1`) | 1 | 1 |
| Empty-Hand Strike II (`arms:unarmed:2`) | 2 | 1 |
| Empty-Hand Strike III (`arms:unarmed:3`) | 2 | 1 |
| Catch Your Balance I (`athletics:balance:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |
| Flowing Hands I (`arms:unarmed:4`) | 3 | 3 |
| Flowing Hands II (`arms:unarmed:5`) | 4 | 3 |
| Flowing Hands III (`arms:unarmed:6`) | 4 | 3 |
| Catch Your Balance II (`athletics:balance:2`) | 2 | 3 |

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

**Action:** Passive · **Attribute:** None

**Target / range / shape:** Your Measured Guard.

Measured Guard grants its Basic Melee counterattack after a Standard or Strong defense. It remains one Reaction: declare the guard before defending, gain its Boon, resolve the triggering attack, then counter if the attacker is still in reach and you can attack.

**Duration:** The triggering defense and counterattack.

**Equipment / acquisition:** A ready melee weapon.

</details>

**Useful actions and improvements:**

- **Empty-Hand Strike I:** Main Action · Brawn or Agility, chosen before rolling. Strike one adjacent creature unarmed for 2/3/5 physical damage. Choose an available hand, foot or other natural contact; restraint that prevents that contact prevents the strike. Empty-Hand Strike deals 3/4/6 physical damage. Empty-Hand Strike also applies Slowed 1 on Strong. Before rolling against a living creature with positive HP, you may declare the strike nonlethal: if its damage would reduce the target to 0 HP, leave it at 1 HP, Prone and Unconscious for 1 minute or until it next takes damage.
- **Catch Your Balance I:** Reaction. When you would fall Prone, remain standing instead. You must be conscious and able to move. No roll. Catch Your Balance can also catch a secure ledge within reach when you begin to fall, leaving you hanging instead. You need a free hand.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply.
- **Flowing Hands I:** Main Action · Brawn or Agility. Move up to 2 squares without movement reactions and strike up to two different creatures adjacent at any point of the route. Roll once; each takes 1/2/4 physical damage. You may make each strike nonlethal using Empty-Hand Strike’s declaration before rolling. Flowing Hands deals 2/3/5 physical damage to each target. Flowing Hands also applies Dazed 1 and pushes each target 2 squares directly away on Strong; resolve collisions normally.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 7/3/2/1 casts respectively; with the learned once-per-rest recovery it funds 7/3/2/1. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/monk-level-7.hol.json). 7 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Empty-Hand Strike I (`arms:unarmed:1`) | 1 | 1 |
| Empty-Hand Strike II (`arms:unarmed:2`) | 2 | 1 |
| Empty-Hand Strike III (`arms:unarmed:3`) | 2 | 1 |
| Catch Your Balance I (`athletics:balance:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |
| Flowing Hands I (`arms:unarmed:4`) | 3 | 3 |
| Flowing Hands II (`arms:unarmed:5`) | 4 | 3 |
| Flowing Hands III (`arms:unarmed:6`) | 4 | 3 |
| Catch Your Balance II (`athletics:balance:2`) | 2 | 3 |
| Empty-Hand Tempest (`arms:unarmed:7`) | 5 | 7 |
| Catch Your Balance III (`athletics:balance:3`) | 2 | 7 |
| Catch Them Falling I (`athletics:balance:4`) | 3 | 7 |
| Catch Them Falling II (`athletics:balance:5`) | 4 | 7 |
| Catch Them Falling III (`athletics:balance:6`) | 4 | 7 |
| Defy the Fall (`athletics:balance:7`) | 5 | 7 |
| Running Vault II (`athletics:leaping:2`) | 2 | 7 |
| Running Vault III (`athletics:leaping:3`) | 2 | 7 |
| Follow My Leap I (`athletics:leaping:4`) | 3 | 7 |
| Quiet Passage I (`subterfuge:stealth:1`) | 1 | 7 |

**Signature choices:** level 1: Measured Guard; level 3: Return Stroke; level 7: Twitch Reflexes.

<details><summary>Measured Guard: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (no roll)

**Target / range / shape:** Self, before a defense against an adjacent enemy.

Gain 1 Boon to the defense. After the attack resolves, if the defense was Strong and the attacker is within your reach, make a Basic Melee attack against that attacker. This counterattack is part of the Reaction and does not use your Main Action.

**Duration:** The triggering defense and immediate counterattack.

**Equipment / acquisition:** None.

You must wield a melee weapon to use this guard and counterattack. A granted counterattack cannot trigger another granted attack.

</details>

<details><summary>Twitch Reflexes: complete signature component</summary>

**Action:** Passive · **Attribute:** None

**Target / range / shape:** Self.

Each round you have one additional Reaction usable only for Measured Guard or an opportunity attack. Use at most one Measured Guard against a given attack. Your normal Reaction remains available for any reaction you know.

**Duration:** Permanent.

**Equipment / acquisition:** None.

</details>

<details><summary>Return Stroke: complete signature component</summary>

**Action:** Passive · **Attribute:** None

**Target / range / shape:** Your Measured Guard.

Measured Guard grants its Basic Melee counterattack after a Standard or Strong defense. It remains one Reaction: declare the guard before defending, gain its Boon, resolve the triggering attack, then counter if the attacker is still in reach and you can attack.

**Duration:** The triggering defense and counterattack.

**Equipment / acquisition:** A ready melee weapon.

</details>

**Useful actions and improvements:**

- **Empty-Hand Strike I:** Main Action · Brawn or Agility, chosen before rolling. Strike one adjacent creature unarmed for 2/3/5 physical damage. Choose an available hand, foot or other natural contact; restraint that prevents that contact prevents the strike. Empty-Hand Strike deals 3/4/6 physical damage. Empty-Hand Strike also applies Slowed 1 on Strong. Before rolling against a living creature with positive HP, you may declare the strike nonlethal: if its damage would reduce the target to 0 HP, leave it at 1 HP, Prone and Unconscious for 1 minute or until it next takes damage.
- **Catch Your Balance I:** Reaction. When you would fall Prone, remain standing instead. You must be conscious and able to move. No roll. Catch Your Balance can also catch a secure ledge within reach when you begin to fall, leaving you hanging instead. You need a free hand. After Catch Your Balance, you may move 1 square to a safe unoccupied surface within reach without movement reactions.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply. Running Vault reaches up to 3 squares. Running Vault ignores movement reactions during the jump.
- **Flowing Hands I:** Main Action · Brawn or Agility. Move up to 2 squares without movement reactions and strike up to two different creatures adjacent at any point of the route. Roll once; each takes 1/2/4 physical damage. You may make each strike nonlethal using Empty-Hand Strike’s declaration before rolling. Flowing Hands deals 2/3/5 physical damage to each target. Flowing Hands also applies Dazed 1 and pushes each target 2 squares directly away on Strong; resolve collisions normally.
- **Empty-Hand Tempest:** Main Action · Brawn or Agility. Move up to 4 squares without movement reactions and strike up to three different adjacent creatures along that route. Roll once; each takes 3/5/7 physical damage, and on Strong becomes Prone. You may declare these strikes nonlethal before rolling. Once per scene, after the strikes, move up to 2 further squares without movement reactions.
- **Catch Them Falling I:** Reaction. Catch one adjacent falling creature no larger than you. With secure footing and a free hand, bring it into a free adjacent square. Otherwise, if a reachable hold supports both of you, you both hang there. Without a suitable hold this intervention is unavailable. No roll. Before Catch Them Falling, move 1 square along a safe surface without movement reactions to reach the falling creature. Catch Them Falling can catch a creature one Size larger than you when your footing and anchor support both creatures.
- **Defy the Fall:** Reaction. When a rope-linked group begins to fall, secure its rope to an anchor within reach or hold it yourself. Arrest the falls of up to four connected creatures whose combined weight the rope and anchor can bear; if holding it yourself, the load cannot exceed twice your normal carrying capacity. They hang from the rope and take no damage from this arrested fall. Spend a Main Action on each following turn to hold it yourself; releasing or losing the support resumes the fall. No roll.
- **Follow My Leap I:** Maneuver. Use Running Vault and guide one willing adjacent ally through the same jump immediately after you. It lands adjacent to your destination; both landings must be legal.
- **Quiet Passage I:** Passive. Gain 1 Boon on Agility rolls to move quietly while concealed. Concealment needs cover or a plausible distraction.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 15/7/5/3 casts respectively; with the learned once-per-rest recovery it funds 15/7/5/3. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 3: Catch Your Balance III — Costs 2 DP. You have 0 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
