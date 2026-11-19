# Harka Stormshoulder: barbarian after the rewrite

Pinned authored source `837a3eb42850d6c531c6153349664b49db0d0882`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../barbarian.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Rage now explicitly supplies physical resistance. The same paid weapon path grows into a substantial level-7 sweep.

This is a dangerous berserker rather than a copy of daily Rage uses. Rage and light armor use the highest resistance, not additive protection.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 18 | 30 | 54 |
| SP | 2 | 6 | 14 |
| DP spent / total | 6 / 9 | 19 / 26 | 51 / 72 |
| Unspent DP | 3 | 7 | 21 |
| Learned action choices (Main / Maneuver / Reaction) | 1 / 3 / 1 | 2 / 4 / 1 | 3 / 8 / 1 |
| Known book spells (free / paid) | 0 (0 / 0) | 0 (0 / 0) | 0 (0 / 0) |
| Shared reserve: casts at 2 SP | 1 | 3 | 7 |
| Shared reserve: casts at 5 SP | 0 | 1 | 2 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Tallfolk**; class: **Unbalanced**. Attributes: brawn +2, fortitude +2, agility +0, guile -1, knowledge -1, reason +1. Traits: Long Reach; Built for the Weather.

Starting disciplines: arms from culture, athletics from background, and armor from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Travel Pack; Food Bundle; Water Flask; Sleeping Roll; Rope Coil; Lighting Bundle. 10 starting coins remain. 

The D&D baseline has **23 HP** and **AC 14 unarmored (10 + DEX 2 + CON 2)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Starting DP is **10 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. From level 2 onward, each level grants **6 + new level** DP, plus any applicable ancestry benefits. The completed `arms:bladework` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/barbarian-level-1.hol.json). 3 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Driving Opening I (`arms:impact:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |
| Catch Your Balance I (`athletics:balance:1`) | 1 | 1 |

**Signature choices:** level 1: Go Berserk.

<details><summary>Go Berserk: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self.

Enter a rage until the end of the scene. While raging, you gain 1 Boon to attack rolls, have 1 Bane to defense rolls, and gain physical resistance 1. You can end the rage at will. It also ends if you fall unconscious or enter Dying.

**Duration:** Until the end of the scene, or until you end it.

**Equipment / acquisition:** None.

**Frequency:** Once per scene.

</details>

**Useful actions and improvements:**

- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage.
- **Driving Opening I:** Maneuver. Choose one visible creature. Before your turn ends, your next Main Action melee weapon attack against it pushes that creature directly away from your attack position, 1 square on Standard or 2 squares on Strong. Resolve collisions normally. Apply the push only to the chosen creature on that attack. Reusing this technique replaces its unused effect.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply.
- **Catch Your Balance I:** Reaction. When you would fall Prone and can move, remain standing instead. No roll.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 2/1/0/0 casts respectively; with the learned once-per-rest recovery it funds 2/1/0/0. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/barbarian-level-3.hol.json). 7 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Driving Opening I (`arms:impact:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |
| Catch Your Balance I (`athletics:balance:1`) | 1 | 1 |
| Measured Cut III (`arms:bladework:3`) | 2 | 3 |
| Sweeping Blade I (`arms:bladework:4`) | 3 | 3 |
| Sweeping Blade II (`arms:bladework:5`) | 4 | 3 |
| Sweeping Blade III (`arms:bladework:6`) | 4 | 3 |

**Signature choices:** level 1: Go Berserk; level 3: Pain Feeds the Fire.

<details><summary>Go Berserk: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self.

Enter a rage until the end of the scene. While raging, you gain 1 Boon to attack rolls, have 1 Bane to defense rolls, and gain physical resistance 1. You can end the rage at will. It also ends if you fall unconscious or enter Dying.

**Duration:** Until the end of the scene, or until you end it.

**Equipment / acquisition:** None.

**Frequency:** Once per scene.

</details>

<details><summary>Pain Feeds the Fire: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self.

Enter a rage until the end of the scene. While raging, gain 1 Boon to attack rolls, 1 Bane to defense rolls, and physical resistance 1. You can end the rage at will. It also ends if you fall unconscious or enter Dying.

When an enemy damages you during this rage, gain 1 Boon to your next attack before the end of your next turn. Repeated damage does not accumulate these Boons. Damage you or an ally deliberately deal to you, and hazards you deliberately enter to hurt yourself, do not trigger it. Hostile forced movement into a hazard does trigger it.

**Duration:** Rage until scene end or until ended; damage-triggered Boon until your next attack or the end of your next turn.

**Equipment / acquisition:** None.

Use once per scene. If you also know Go Berserk, both signatures share that rage use.

</details>

**Useful actions and improvements:**

- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage. Measured Cut also applies Bleeding 1 on Strong.
- **Driving Opening I:** Maneuver. Choose one visible creature. Before your turn ends, your next Main Action melee weapon attack against it pushes that creature directly away from your attack position, 1 square on Standard or 2 squares on Strong. Resolve collisions normally. Apply the push only to the chosen creature on that attack. Reusing this technique replaces its unused effect.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply.
- **Catch Your Balance I:** Reaction. When you would fall Prone and can move, remain standing instead. No roll.
- **Sweeping Blade I:** Main Action · Brawn. Attack up to three adjacent enemies. Roll once; each takes 1/2/4 physical damage. Each creature is struck once. Sweeping Blade deals 2/3/5 physical damage to each target. Sweeping Blade also pushes each target 1 square directly away on Strong. Resolve collisions normally.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 6/3/2/1 casts respectively; with the learned once-per-rest recovery it funds 6/3/2/1. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/barbarian-level-7.hol.json). 21 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Cut I (`arms:bladework:1`) | 1 | 1 |
| Measured Cut II (`arms:bladework:2`) | 2 | 1 |
| Driving Opening I (`arms:impact:1`) | 1 | 1 |
| Running Vault I (`athletics:leaping:1`) | 1 | 1 |
| Catch Your Balance I (`athletics:balance:1`) | 1 | 1 |
| Measured Cut III (`arms:bladework:3`) | 2 | 3 |
| Sweeping Blade I (`arms:bladework:4`) | 3 | 3 |
| Sweeping Blade II (`arms:bladework:5`) | 4 | 3 |
| Sweeping Blade III (`arms:bladework:6`) | 4 | 3 |
| Iron Tempest (`arms:bladework:7`) | 5 | 7 |
| Running Vault II (`athletics:leaping:2`) | 2 | 7 |
| Running Vault III (`athletics:leaping:3`) | 2 | 7 |
| Follow My Leap I (`athletics:leaping:4`) | 3 | 7 |
| Follow My Leap II (`athletics:leaping:5`) | 4 | 7 |
| Follow My Leap III (`athletics:leaping:6`) | 4 | 7 |
| Bounding Company (`athletics:leaping:7`) | 5 | 7 |
| Driving Opening II (`arms:impact:2`) | 2 | 7 |
| Driving Opening III (`arms:impact:3`) | 2 | 7 |
| Battering Stroke I (`arms:impact:4`) | 3 | 7 |

**Signature choices:** level 1: Go Berserk; level 3: Pain Feeds the Fire; level 7: Deathless Rage.

<details><summary>Go Berserk: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self.

Enter a rage until the end of the scene. While raging, you gain 1 Boon to attack rolls, have 1 Bane to defense rolls, and gain physical resistance 1. You can end the rage at will. It also ends if you fall unconscious or enter Dying.

**Duration:** Until the end of the scene, or until you end it.

**Equipment / acquisition:** None.

**Frequency:** Once per scene.

</details>

<details><summary>Pain Feeds the Fire: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self.

Enter a rage until the end of the scene. While raging, gain 1 Boon to attack rolls, 1 Bane to defense rolls, and physical resistance 1. You can end the rage at will. It also ends if you fall unconscious or enter Dying.

When an enemy damages you during this rage, gain 1 Boon to your next attack before the end of your next turn. Repeated damage does not accumulate these Boons. Damage you or an ally deliberately deal to you, and hazards you deliberately enter to hurt yourself, do not trigger it. Hostile forced movement into a hazard does trigger it.

**Duration:** Rage until scene end or until ended; damage-triggered Boon until your next attack or the end of your next turn.

**Equipment / acquisition:** None.

Use once per scene. If you also know Go Berserk, both signatures share that rage use.

</details>

<details><summary>Deathless Rage: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self.

Enter a rage until the end of the scene. While raging, gain 1 Boon to attack rolls, 1 Bane to defense rolls, and physical resistance 1. You can end the rage at will. It also ends if you fall unconscious or enter Dying.

Once per scene, when damage would reduce you to 0 HP during this rage, remain at 1 HP. If you regain HP before the end of your next turn, the reprieve ends and you keep that HP. Otherwise, fall to 0 HP and begin Dying at the end of that turn. Further damage can still bring you to 0 during the reprieve. If you survive reaching 0, record a scar as usual.

**Duration:** Rage until scene end or until ended; reprieve until the end of your next turn.

**Equipment / acquisition:** None.

Use this rage once per scene. If you also know Go Berserk or Pain Feeds the Fire, all share that rage use. Pain Feeds the Fire’s damage-triggered Boon applies only if you also know that signature.

</details>

**Useful actions and improvements:**

- **Measured Cut I:** Main Action · Brawn or Agility, chosen before rolling. Attack one adjacent creature for 2/3/5 physical damage. On Strong, you may move 1 square after the attack. Measured Cut deals 3/4/6 physical damage. Measured Cut also applies Bleeding 1 on Strong.
- **Driving Opening I:** Maneuver. Choose one visible creature. Before your turn ends, your next Main Action melee weapon attack against it pushes that creature directly away from your attack position, 1 square on Standard or 2 squares on Strong. Resolve collisions normally. Apply the push only to the chosen creature on that attack. Reusing this technique replaces its unused effect. Driving Opening pushes 2 squares on Standard as well as Strong. Driving Opening also applies Slowed 2 on Strong to that target. Before rolling the modified attack against a living creature with positive HP, you may declare it nonlethal: if its damage would reduce the target to 0 HP, leave it at 1 HP and make it Unconscious for 1 minute or until it next takes damage. It falls Prone.
- **Running Vault I:** Maneuver. After moving at least 2 squares this turn, jump up to 2 squares horizontally to a visible unoccupied landing. Spend no additional movement. Movement reactions apply. Running Vault reaches up to 3 squares. Running Vault ignores movement reactions during the jump.
- **Catch Your Balance I:** Reaction. When you would fall Prone and can move, remain standing instead. No roll.
- **Sweeping Blade I:** Main Action · Brawn. Attack up to three adjacent enemies. Roll once; each takes 1/2/4 physical damage. Each creature is struck once. Sweeping Blade deals 2/3/5 physical damage to each target. Sweeping Blade also pushes each target 1 square directly away on Strong. Resolve collisions normally.
- **Iron Tempest:** Main Action · Brawn. Move up to 3 squares, ignoring extra movement cost from difficult terrain, and attack up to three enemies adjacent at any point along that route. Roll once; each takes 3/5/8 physical damage. Each creature is struck once. Once per scene, you may instead strike four enemies for 4/7/10; after this sweep gain Stability 3 until your next turn starts.
- **Follow My Leap I:** Maneuver. Use Running Vault and guide one willing adjacent ally through the same jump immediately after you. It lands adjacent to your destination; both landings must be legal. Follow My Leap reaches up to 4 squares horizontally. Follow My Leap can guide two willing adjacent allies through the jump, each to a different legal square adjacent to your destination.
- **Bounding Company:** Maneuver. Once per scene, after moving at least 2 squares, leap up to 5 squares horizontally and guide up to four willing allies initially within 2 squares through the same crossing. Each lands within 2 squares of your landing in a separate legal square. These jumps trigger no movement reactions. All travelers must be able to move; this grants no flight beyond the landing.
- **Battering Stroke I:** Maneuver. Prepare your next Main Action melee weapon attack against one chosen visible creature before this turn ends. That attack pushes the target 2 squares directly away on any result; resolve collisions normally. On Strong it also applies Dazed 1. This replaces Driving Opening on that attack.

**Known book spells:** None.

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 14/7/4/2 casts respectively; with the learned once-per-rest recovery it funds 14/7/4/2. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

Every planned choice was affordable when scheduled.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
