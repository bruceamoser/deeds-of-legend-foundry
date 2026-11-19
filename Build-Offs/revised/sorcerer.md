# Ilyra Cinderblood: sorcerer after the rewrite

Pinned authored source `2b9af553cf9a4aaa3c8e795b57c0163763b85676`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../sorcerer.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Bent Trajectory remains a shaping identity, with real later spell duplication bounded to instantaneous targets. Reserves and recovery can now grow through the full training tail.

The charismatic ability array still gives less SP than a Knowledge-focused arcanist. Shaping is one line, not a free menu of all metamagic; learned Meteor Swarm still requires its SP and actual casting circumstances.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 14 | 20 | 32 |
| SP | 10 | 20 | 38 |
| DP spent / total | 10 / 12 | 22 / 25 | 62 / 63 |
| Unspent DP | 2 | 3 | 1 |
| Learned action choices (Main / Maneuver / Reaction) | 0 / 0 / 0 | 0 / 0 / 1 | 0 / 0 / 2 |
| Known book spells (free / paid) | 10 (4 / 6) | 16 (4 / 12) | 29 (4 / 25) |
| Shared reserve: casts at 2 SP | 5 | 10 | 19 |
| Shared reserve: casts at 5 SP | 2 | 4 | 7 |
| Extra SP from one recovery rest | 1 | 1 | 2 |

## Character choices

Ancestry: **High Elf**; class: **Arcanist**. Attributes: brawn -1, fortitude +1, agility +1, guile +2, knowledge +1, reason -1. Traits: Still Water; Starlight Eyes.

Starting disciplines: elements from culture, mentalism from background, and spellcraft from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Travel Pack; Food Bundle; Water Flask; Sleeping Roll; Lighting Bundle. 28 starting coins remain. 

The D&D baseline has **12 HP** and **AC 12 normally; 15 with Mage Armor (costs one level-1 slot)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Starting DP is **10 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `spellcraft:soul-capacity` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/sorcerer-level-1.hol.json). 2 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Flame I (`flame:0`) | 1 | 1 |
| Flame II (`flame:1`) | 2 | 1 |
| Air I (`air:0`) | 1 | 1 |
| Emotion I (`emotion:0`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Soul Capacity II (`spellcraft:soul-capacity:2`) | 2 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |

**Signature choices:** level 1: Bent Trajectory.

<details><summary>Bent Trajectory: complete signature component</summary>

**Action:** Passive · **Attribute:** None — no roll

**Target / range / shape:** One of your spell attacks; choose one visible, unoccupied square within 6 squares of you before rolling.

Choose one of your spell attacks. It can originate from any visible, unoccupied square within 6 squares of you. Determine cover and attack path from that square, but measure range from you. You must know the target’s location. Roll the spell attack normally.

**Duration:** For that spell.

**Equipment / acquisition:** None.

Use this shaping once on your turn. It changes the origin of an existing spell attack and uses that spell’s action, roll and SP; it is not a separate spell.

</details>

**Useful actions and improvements:**


**Known book spells:** Fire Bolt (Main Action; SP 0); Boil Liquid (Ritual; SP 1); Burning Hands (Main Action; SP 1); Heat Metal (Main Action; SP 2); Elementalism — Air (Maneuver; SP 0); Feather Fall (Reaction; SP 1); Vicious Mockery (Main Action; SP 0); Heroism (Main Action; SP 1); Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 10/5/3/2 casts respectively; with the learned once-per-rest recovery it funds 11/5/3/2. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/sorcerer-level-3.hol.json). 3 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Flame I (`flame:0`) | 1 | 1 |
| Flame II (`flame:1`) | 2 | 1 |
| Air I (`air:0`) | 1 | 1 |
| Emotion I (`emotion:0`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Soul Capacity II (`spellcraft:soul-capacity:2`) | 2 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |
| Flame III (`flame:2`) | 2 | 3 |
| Heart of the Furnace (`flame:3`) | 3 | 3 |
| Soul Capacity III (`spellcraft:soul-capacity:3`) | 2 | 3 |
| Deep Reserves I (`spellcraft:soul-capacity:4`) | 3 | 3 |
| Air II (`air:1`) | 2 | 3 |

**Signature choices:** level 1: Bent Trajectory; level 3: Create a Window.

<details><summary>Bent Trajectory: complete signature component</summary>

**Action:** Passive · **Attribute:** None — no roll

**Target / range / shape:** One of your spell attacks; choose one visible, unoccupied square within 6 squares of you before rolling.

Choose one of your spell attacks. It can originate from any visible, unoccupied square within 6 squares of you. Determine cover and attack path from that square, but measure range from you. You must know the target’s location. Roll the spell attack normally.

**Duration:** For that spell.

**Equipment / acquisition:** None.

Use this shaping once on your turn. It changes the origin of an existing spell attack and uses that spell’s action, roll and SP; it is not a separate spell.

</details>

<details><summary>Create a Window: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (no roll)

**Target / range / shape:** One willing ally during their turn, before their chosen step or attack resolves. Choose two visible, unoccupied squares within 6 squares of you.

The two squares become connected windows until the end of the ally’s turn. The ally can use the windows once at any point during their turn, either to move through one and out the other, spending 1 square of movement, or to make one attack through one window, measuring range and cover from the other. The ally must be able to see the window they use. The windows vanish at the end of the ally’s turn. This movement does not provoke opportunity attacks.

**Duration:** Until the end of the ally’s turn.

**Equipment / acquisition:** A free hand for casting.

This is a spell costing 0 SP. The windows give the ally a route for its own movement or attack.

**Frequency:** Once per round.

</details>

**Useful actions and improvements:**


**Known book spells:** Fire Bolt (Main Action; SP 0); Boil Liquid (Ritual; SP 1); Burning Hands (Main Action; SP 1); Heat Metal (Main Action; SP 2); Elementalism — Air (Maneuver; SP 0); Feather Fall (Reaction; SP 1); Vicious Mockery (Main Action; SP 0); Heroism (Main Action; SP 1); Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1); Scorching Ray (Main Action; SP 2); Wall of Fire (Main Action; SP 3); Fireball (Main Action; SP 3); Fire Shield (Main Action; SP 4); Fog Cloud (Main Action; SP 1); Gust of Wind (Main Action; SP 2).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 20/10/6/4 casts respectively; with the learned once-per-rest recovery it funds 21/10/7/4. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/sorcerer-level-7.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Flame I (`flame:0`) | 1 | 1 |
| Flame II (`flame:1`) | 2 | 1 |
| Air I (`air:0`) | 1 | 1 |
| Emotion I (`emotion:0`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Soul Capacity II (`spellcraft:soul-capacity:2`) | 2 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |
| Flame III (`flame:2`) | 2 | 3 |
| Heart of the Furnace (`flame:3`) | 3 | 3 |
| Soul Capacity III (`spellcraft:soul-capacity:3`) | 2 | 3 |
| Deep Reserves I (`spellcraft:soul-capacity:4`) | 3 | 3 |
| Air II (`air:1`) | 2 | 3 |
| Deep Reserves II (`spellcraft:soul-capacity:5`) | 4 | 7 |
| Deep Reserves III (`spellcraft:soul-capacity:6`) | 4 | 7 |
| Soul Wellspring (`spellcraft:soul-capacity:7`) | 5 | 7 |
| Fire Storm (`flame:4`) | 4 | 7 |
| Delayed Blast Fireball (`flame:5`) | 4 | 7 |
| Meteor Swarm (`flame:6`) | 5 | 7 |
| Air III (`air:2`) | 2 | 7 |
| Voice of the Tempest (`air:3`) | 3 | 7 |
| Emotion II (`emotion:1`) | 2 | 7 |
| Emotion III (`emotion:2`) | 2 | 7 |
| Heartstrings (`emotion:3`) | 3 | 7 |
| Recovery II (`spellcraft:recovery:2`) | 2 | 7 |

**Signature choices:** level 1: Bent Trajectory; level 3: Create a Window; level 7: Choose the Edge.

<details><summary>Bent Trajectory: complete signature component</summary>

**Action:** Passive · **Attribute:** None — no roll

**Target / range / shape:** One of your spell attacks; choose one visible, unoccupied square within 6 squares of you before rolling.

Choose one of your spell attacks. It can originate from any visible, unoccupied square within 6 squares of you. Determine cover and attack path from that square, but measure range from you. You must know the target’s location. Roll the spell attack normally.

**Duration:** For that spell.

**Equipment / acquisition:** None.

Use this shaping once on your turn. It changes the origin of an existing spell attack and uses that spell’s action, roll and SP; it is not a separate spell.

</details>

<details><summary>Create a Window: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (no roll)

**Target / range / shape:** One willing ally during their turn, before their chosen step or attack resolves. Choose two visible, unoccupied squares within 6 squares of you.

The two squares become connected windows until the end of the ally’s turn. The ally can use the windows once at any point during their turn, either to move through one and out the other, spending 1 square of movement, or to make one attack through one window, measuring range and cover from the other. The ally must be able to see the window they use. The windows vanish at the end of the ally’s turn. This movement does not provoke opportunity attacks.

**Duration:** Until the end of the ally’s turn.

**Equipment / acquisition:** A free hand for casting.

This is a spell costing 0 SP. The windows give the ally a route for its own movement or attack.

**Frequency:** Once per round.

</details>

<details><summary>Choose the Edge: complete signature component</summary>

**Action:** Reaction · **Attribute:** None (use each spell’s casting attribute)

**Target / range / shape:** Your own single-target, instantaneous spell that requires a roll, before its roll.

Once per scene, choose two distinct legal targets. Resolve the spell separately against each, paying its SP cost once. This shapes the original casting rather than casting a second spell. Take 2 Banes on defense rolls until the start of your next turn. Use the spell’s ordinary range, action, casting requirements and effects for both resolutions.

**Duration:** Spell resolves immediately; defense penalty ends at the start of your next turn.

**Equipment / acquisition:** None.

</details>

**Useful actions and improvements:**


**Known book spells:** Fire Bolt (Main Action; SP 0); Boil Liquid (Ritual; SP 1); Burning Hands (Main Action; SP 1); Heat Metal (Main Action; SP 2); Elementalism — Air (Maneuver; SP 0); Feather Fall (Reaction; SP 1); Vicious Mockery (Main Action; SP 0); Heroism (Main Action; SP 1); Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1); Scorching Ray (Main Action; SP 2); Wall of Fire (Main Action; SP 3); Fireball (Main Action; SP 3); Fire Shield (Main Action; SP 4); Fog Cloud (Main Action; SP 1); Gust of Wind (Main Action; SP 2); Fire Storm (Main Action; SP 5); Delayed Blast Fireball (Main Action; SP 5); Meteor Swarm (Main Action; SP 6); Levitate (Main Action; SP 2); Lightning Bolt (Main Action; SP 3); Fly (Main Action; SP 3); Wind Wall (Main Action; SP 4); Charm Person (Main Action; SP 1); Calm Emotions (Main Action; SP 2); Suggestion (Main Action; SP 2); Fear (Main Action; SP 3); Charm Monster (Main Action; SP 3); Confusion (Main Action; SP 4).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 38/19/12/7 casts respectively; with the learned once-per-rest recovery it funds 40/20/13/8. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 7: Recovery III — Costs 2 DP. You have 1 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
