# Pip Nightjar: rogue after the rewrite

Pinned authored source `d6a241b85446be95d6391603880e7788b3c92715`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../rogue.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Opportunistic attack gains an additive slowing effect and a later interruption; infiltration develops separately rather than inflating the damage action list.

Blade in the Back is its own attack rather than bonus Sneak Attack dice. The build still pays for mundane intrusion and mobility instead of receiving all skills automatically.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 13 | 19 | 31 |
| SP | 7 | 11 | 19 |
| DP spent / total | 9 / 9 | 22 / 22 | 56 / 60 |
| Unspent DP | 0 | 0 | 4 |
| Learned action choices (Main / Maneuver / Reaction) | 2 / 2 / 1 | 3 / 3 / 1 | 5 / 4 / 2 |
| Known book spells (free / paid) | 0 (0 / 0) | 0 (0 / 0) | 0 (0 / 0) |
| Shared reserve: casts at 2 SP | 3 | 5 | 9 |
| Shared reserve: casts at 5 SP | 1 | 2 | 3 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Halfling**; class: **Shadow**. Attributes: brawn +0, fortitude +0, agility +2, guile +2, knowledge +0, reason -1. Traits: Under Their Noses; A Little Luck.

Starting disciplines: subterfuge from culture, athletics from background, and marksmanship from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Lock Tools; Travel Pack; Food Bundle; Water Flask; Sleeping Roll. 12 starting coins remain. 

The D&D baseline has **17 HP** and **AC 14 (Leather 11 + DEX 3)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Creation remains **8 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `subterfuge:stealth` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/rogue-level-1.hol.json). 0 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Quiet Passage I (`subterfuge:stealth:1`) | 1 | 1 |
| Quiet Passage II (`subterfuge:stealth:2`) | 2 | 1 |
| Quiet Passage III (`subterfuge:stealth:3`) | 2 | 1 |
| Patient Hand I (`subterfuge:locks:1`) | 1 | 1 |
| Catch the Click I (`subterfuge:traps:1`) | 1 | 1 |
| Light Fingers I (`subterfuge:sleight:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |

**Signature choices:** level 1: Blade in the Back.

<details><summary>Blade in the Back: complete signature component</summary>

**Action:** Main Action · **Attribute:** Agility

**Target / range / shape:** One creature within reach that has not noticed you or is adjacent to one of your allies.

Make an Agility roll against the target. Weak: 3 physical damage. Standard: 4 physical damage, and the target has Bleeding 1. Strong: 6 physical damage, and the target has Bleeding 2.

**Duration:** Immediate; Bleeding uses its normal decay.

**Equipment / acquisition:** A melee weapon.

</details>

**Useful actions and improvements:**

- **Quiet Passage I:** Passive. Gain 1 Boon on Agility rolls to move quietly while concealed. Concealment needs cover or a plausible distraction. Quiet Passage removes extra movement cost imposed solely by sneaking. Quiet Passage extends its Boon to one willing adjacent companion moving with you through the same concealment.
- **Patient Hand I:** Main Action · Guile, with lock tools. Examine and manipulate one reachable simple nonmagical fastening; add 1/2/3 progress toward opening it. The DA fixes the objective and work interval first: an intricate lock takes 10 minutes per attempt instead of a Main Action. Impossible mechanisms require another approach.
- **Catch the Click I:** Reaction. When you see a reachable nonmagical mechanism begin to trigger, warn one creature within 3 squares that can perceive you before its defense or avoidance roll; that roll gains 1 Boon. Once per triggering event. You can also inspect a suspected reachable trap for 1 minute, rolling Reason for 1/2/3 progress to identify its trigger and danger.
- **Light Fingers I:** Maneuver · Guile, with a free hand. Palm or plant one unattended palm-sized object within reach; add 1/2/3 progress toward doing so unnoticed. The DA sets the objective and whether scrutiny permits the attempt. The object moves when that objective completes.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 7/3/2/1 casts respectively; with the learned once-per-rest recovery it funds 7/3/2/1. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/rogue-level-3.hol.json). 0 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Quiet Passage I (`subterfuge:stealth:1`) | 1 | 1 |
| Quiet Passage II (`subterfuge:stealth:2`) | 2 | 1 |
| Quiet Passage III (`subterfuge:stealth:3`) | 2 | 1 |
| Patient Hand I (`subterfuge:locks:1`) | 1 | 1 |
| Catch the Click I (`subterfuge:traps:1`) | 1 | 1 |
| Light Fingers I (`subterfuge:sleight:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |
| Vanish into Cover I (`subterfuge:stealth:4`) | 3 | 3 |
| Vanish into Cover II (`subterfuge:stealth:5`) | 4 | 3 |
| Vanish into Cover III (`subterfuge:stealth:6`) | 4 | 3 |
| Patient Hand II (`subterfuge:locks:2`) | 2 | 3 |

**Signature choices:** level 1: Blade in the Back; level 3: Hamstring.

<details><summary>Blade in the Back: complete signature component</summary>

**Action:** Main Action · **Attribute:** Agility

**Target / range / shape:** One creature within reach that has not noticed you or is adjacent to one of your allies.

Make an Agility roll against the target. Weak: 3 physical damage. Standard: 4 physical damage, and the target has Bleeding 1. Strong: 6 physical damage, and the target has Bleeding 2.

**Duration:** Immediate; Bleeding uses its normal decay.

**Equipment / acquisition:** A melee weapon.

</details>

<details><summary>Hamstring: complete signature component</summary>

**Action:** Main Action · **Attribute:** Agility

**Target / range / shape:** One creature within melee reach that has not noticed you or is adjacent to one of your allies.

Make an Agility roll against the target. On Weak, deal 3 physical damage and apply Slowed 1. On Standard, deal 4 physical damage and apply Bleeding 1 and Slowed 2. On Strong, deal 6 physical damage and apply Bleeding 2 and Slowed 3. This is one attack, not an additional attack. Apply condition immunity and normal decay.

**Duration:** Attack immediate; conditions use normal decay.

**Equipment / acquisition:** A melee weapon.

</details>

**Useful actions and improvements:**

- **Quiet Passage I:** Passive. Gain 1 Boon on Agility rolls to move quietly while concealed. Concealment needs cover or a plausible distraction. Quiet Passage removes extra movement cost imposed solely by sneaking. Quiet Passage extends its Boon to one willing adjacent companion moving with you through the same concealment.
- **Patient Hand I:** Main Action · Guile, with lock tools. Examine and manipulate one reachable simple nonmagical fastening; add 1/2/3 progress toward opening it. The DA fixes the objective and work interval first: an intricate lock takes 10 minutes per attempt instead of a Main Action. Impossible mechanisms require another approach. Patient Hand adds 1/3/4 progress.
- **Catch the Click I:** Reaction. When you see a reachable nonmagical mechanism begin to trigger, warn one creature within 3 squares that can perceive you before its defense or avoidance roll; that roll gains 1 Boon. Once per triggering event. You can also inspect a suspected reachable trap for 1 minute, rolling Reason for 1/2/3 progress to identify its trigger and danger.
- **Light Fingers I:** Maneuver · Guile, with a free hand. Palm or plant one unattended palm-sized object within reach; add 1/2/3 progress toward doing so unnoticed. The DA sets the objective and whether scrutiny permits the attempt. The object moves when that objective completes.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply.
- **Vanish into Cover I:** Maneuver · Agility. Move up to 2 squares into cover, then add 1/2/3 progress toward evading pursuers. Become Hidden when the DA’s objective completes and concealment is plausible. Vanish into Cover adds 1/3/4 progress. Vanish into Cover moves up to 3 squares; this movement triggers no movement reactions from creatures that cannot see you when you begin moving.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 11/5/3/2 casts respectively; with the learned once-per-rest recovery it funds 11/5/3/2. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/rogue-level-7.hol.json). 4 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Quiet Passage I (`subterfuge:stealth:1`) | 1 | 1 |
| Quiet Passage II (`subterfuge:stealth:2`) | 2 | 1 |
| Quiet Passage III (`subterfuge:stealth:3`) | 2 | 1 |
| Patient Hand I (`subterfuge:locks:1`) | 1 | 1 |
| Catch the Click I (`subterfuge:traps:1`) | 1 | 1 |
| Light Fingers I (`subterfuge:sleight:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |
| Vanish into Cover I (`subterfuge:stealth:4`) | 3 | 3 |
| Vanish into Cover II (`subterfuge:stealth:5`) | 4 | 3 |
| Vanish into Cover III (`subterfuge:stealth:6`) | 4 | 3 |
| Patient Hand II (`subterfuge:locks:2`) | 2 | 3 |
| The Hidden Road (`subterfuge:stealth:7`) | 5 | 7 |
| Patient Hand III (`subterfuge:locks:3`) | 2 | 7 |
| Open under Pressure I (`subterfuge:locks:4`) | 3 | 7 |
| Open under Pressure II (`subterfuge:locks:5`) | 4 | 7 |
| Open under Pressure III (`subterfuge:locks:6`) | 4 | 7 |
| Silent Entry (`subterfuge:locks:7`) | 5 | 7 |
| Running Vault II (`athletics:leaping:2`) | 2 | 7 |
| Running Vault III (`athletics:leaping:3`) | 2 | 7 |
| Follow My Leap I (`athletics:leaping:4`) | 3 | 7 |
| Light Fingers II (`subterfuge:sleight:2`) | 2 | 7 |
| Light Fingers III (`subterfuge:sleight:3`) | 2 | 7 |

**Signature choices:** level 1: Blade in the Back; level 3: Hamstring; level 7: The Half-Second.

<details><summary>Blade in the Back: complete signature component</summary>

**Action:** Main Action · **Attribute:** Agility

**Target / range / shape:** One creature within reach that has not noticed you or is adjacent to one of your allies.

Make an Agility roll against the target. Weak: 3 physical damage. Standard: 4 physical damage, and the target has Bleeding 1. Strong: 6 physical damage, and the target has Bleeding 2.

**Duration:** Immediate; Bleeding uses its normal decay.

**Equipment / acquisition:** A melee weapon.

</details>

<details><summary>Hamstring: complete signature component</summary>

**Action:** Main Action · **Attribute:** Agility

**Target / range / shape:** One creature within melee reach that has not noticed you or is adjacent to one of your allies.

Make an Agility roll against the target. On Weak, deal 3 physical damage and apply Slowed 1. On Standard, deal 4 physical damage and apply Bleeding 1 and Slowed 2. On Strong, deal 6 physical damage and apply Bleeding 2 and Slowed 3. This is one attack, not an additional attack. Apply condition immunity and normal decay.

**Duration:** Attack immediate; conditions use normal decay.

**Equipment / acquisition:** A melee weapon.

</details>

<details><summary>The Half-Second: complete signature component</summary>

**Action:** Reaction · **Attribute:** Agility

**Target / range / shape:** The triggering creature within the ordinary range of your ready weapon; use Basic Melee reach or Basic Ranged range as appropriate.

Trigger: another creature you can see declares an action. Make an Agility attack roll with a weapon against the target. Weak: 3 physical damage. The triggering action resolves. Standard: 5 physical damage. The triggering action is interrupted and lost. Strong: 7 physical damage, and the target has Dazed 1. The triggering action is interrupted and lost.

**Duration:** Immediate.

**Equipment / acquisition:** A weapon.

Use this Reaction once per scene. Declare it before the target resolves its triggering action; resolve this signature first. It grants no further attacks.

</details>

**Useful actions and improvements:**

- **Quiet Passage I:** Passive. Gain 1 Boon on Agility rolls to move quietly while concealed. Concealment needs cover or a plausible distraction. Quiet Passage removes extra movement cost imposed solely by sneaking. Quiet Passage extends its Boon to one willing adjacent companion moving with you through the same concealment.
- **Patient Hand I:** Main Action · Guile, with lock tools. Examine and manipulate one reachable simple nonmagical fastening; add 1/2/3 progress toward opening it. The DA fixes the objective and work interval first: an intricate lock takes 10 minutes per attempt instead of a Main Action. Impossible mechanisms require another approach. Patient Hand adds 1/3/4 progress. Patient Hand takes 5 minutes rather than 10 on intricate locks.
- **Catch the Click I:** Reaction. When you see a reachable nonmagical mechanism begin to trigger, warn one creature within 3 squares that can perceive you before its defense or avoidance roll; that roll gains 1 Boon. Once per triggering event. You can also inspect a suspected reachable trap for 1 minute, rolling Reason for 1/2/3 progress to identify its trigger and danger.
- **Light Fingers I:** Maneuver · Guile, with a free hand. Palm or plant one unattended palm-sized object within reach; add 1/2/3 progress toward doing so unnoticed. The DA sets the objective and whether scrutiny permits the attempt. The object moves when that objective completes. Light Fingers adds 1/3/4 progress. Light Fingers can also target an accessible object worn or carried by a distracted creature, other than a held weapon, secured container or worn armor.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply. Running Vault reaches up to 3 squares. Running Vault ignores movement reactions during the jump.
- **Vanish into Cover I:** Maneuver · Agility. Move up to 2 squares into cover, then add 1/2/3 progress toward evading pursuers. Become Hidden when the DA’s objective completes and concealment is plausible. Vanish into Cover adds 1/3/4 progress. Vanish into Cover moves up to 3 squares; this movement triggers no movement reactions from creatures that cannot see you when you begin moving.
- **The Hidden Road:** 1 hour · Agility, with rope and concealment materials. Establish a concealed route up to 20 squares long across terrain you can physically traverse; add 3/5/7 progress toward the DA’s route objective. On completion, up to six companions following your instructions can traverse it at normal movement cost with 2 Boons to remain unnoticed. It creates no unsupported bridge. Discovery or damage ends these benefits until the route is repaired and concealed again.
- **Open under Pressure I:** Main Action · Guile, with lock tools. Work on a nonmagical lock already examined through at least one Patient Hand attempt; add 1/2/3 progress. You may repeat this faster action until that lock opens, provided its workings remain accessible. Open under Pressure adds 1/3/4 progress. Open under Pressure gains 1 Boon when you have both lock and repair tools at hand.
- **Silent Entry:** Main Action · Guile for a simple fastening, or 1 minute for an intricate mechanism, with lock and repair tools. Add 3/5/7 progress toward opening one reachable nonmagical door, lock or fastening without visible damage. At completion you can close it to appear undisturbed to casual inspection. Separate alarms and traps remain separate tasks.
- **Follow My Leap I:** Maneuver. Use Running Vault and guide one willing adjacent ally through the same jump immediately after you. It lands adjacent to your destination; both landings must be legal.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 19/9/6/3 casts respectively; with the learned once-per-rest recovery it funds 19/9/6/3. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 3: Patient Hand III — Costs 2 DP. You have 0 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
