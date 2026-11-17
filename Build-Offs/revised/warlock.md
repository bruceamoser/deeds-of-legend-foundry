# Vesper Ashpact: warlock after the rewrite

Pinned authored source `f71eac4c46fce6906d6dfbd1638ee98b10a6c538`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../warlock.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

The Bargain adds an explicit patron/compact and reliable Pact Bolt; its line adds a declared slowing mode and a personal death reprieve.

No renewable short-rest Pact Magic pool: recovery remains once between overnight rests. The patron has fictional presence without authority to take away the player’s choices.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 15 | 23 | 39 |
| SP | 12 | 25 | 40 |
| DP spent / total | 8 / 9 | 21 / 22 | 58 / 60 |
| Unspent DP | 1 | 1 | 2 |
| Learned action choices (Main / Maneuver / Reaction) | 1 / 0 / 0 | 2 / 0 / 0 | 2 / 0 / 1 |
| Known book spells (free / paid) | 8 (4 / 4) | 12 (4 / 8) | 30 (4 / 26) |
| Shared reserve: casts at 2 SP | 6 | 12 | 20 |
| Shared reserve: casts at 5 SP | 2 | 5 | 8 |
| Extra SP from one recovery rest | 1 | 1 | 4 |

## Character choices

Ancestry: **Oath-Bound**; class: **Odd**. Attributes: brawn +0, fortitude +1, agility +1, guile +2, knowledge +0, reason -1. Traits: The Will That Made You; A Hand on the Rudder.

Starting disciplines: invocation from culture, mentalism from background, and spellcraft from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Travel Pack; Food Bundle; Water Flask; Sleeping Roll; Lighting Bundle. 16 starting coins remain. 

The D&D baseline has **15 HP** and **AC 13 (Leather 11 + DEX 2)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Creation remains **8 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `spellcraft:soul-capacity` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/warlock-level-1.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Spirits I (`spirits:0`) | 1 | 1 |
| Binding I (`binding:0`) | 1 | 1 |
| Perception I (`perception:0`) | 1 | 1 |
| Calling I (`calling:0`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Soul Capacity II (`spellcraft:soul-capacity:2`) | 2 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |

**Signature choices:** level 1: The Bargain.

<details><summary>The Bargain: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One visible creature within 8 squares.

**Magic:** Spell · **SP:** 0

Choose a patron or supernatural compact with the DA when learning this signature; your choices remain your own. Cast Pact Bolt for 2/3/5 force damage on Weak/Standard/Strong. Once per scene, before this roll, you may accept 1 Bane to defenses until the start of your next turn to gain 1 Boon on the bolt’s roll.

**Duration:** Attack immediate; accepted defense penalty until your next turn.

**Equipment / acquisition:** A free hand.

</details>

**Useful actions and improvements:**


**Known book spells:** Chill Touch (Main Action; SP 0); Gentle Repose (Ritual; SP 1); Thaumaturgy (Maneuver; SP 0); Command (Main Action; SP 1); Minor Illusion (Maneuver; SP 0); Silent Image (Main Action; SP 1); Familiar (Ritual; SP 0); Find Familiar (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 12/6/4/2 casts respectively; with the learned once-per-rest recovery it funds 13/6/4/2. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/warlock-level-3.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Spirits I (`spirits:0`) | 1 | 1 |
| Binding I (`binding:0`) | 1 | 1 |
| Perception I (`perception:0`) | 1 | 1 |
| Calling I (`calling:0`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Soul Capacity II (`spellcraft:soul-capacity:2`) | 2 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |
| Soul Capacity III (`spellcraft:soul-capacity:3`) | 2 | 3 |
| Deep Reserves I (`spellcraft:soul-capacity:4`) | 3 | 3 |
| Deep Reserves II (`spellcraft:soul-capacity:5`) | 4 | 3 |
| Binding II (`binding:1`) | 2 | 3 |
| Binding III (`binding:2`) | 2 | 3 |

**Signature choices:** level 1: The Bargain; level 3: Pact’s Claim.

<details><summary>The Bargain: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One visible creature within 8 squares.

**Magic:** Spell · **SP:** 0

Choose a patron or supernatural compact with the DA when learning this signature; your choices remain your own. Cast Pact Bolt for 2/3/5 force damage on Weak/Standard/Strong. Once per scene, before this roll, you may accept 1 Bane to defenses until the start of your next turn to gain 1 Boon on the bolt’s roll.

**Duration:** Attack immediate; accepted defense penalty until your next turn.

**Equipment / acquisition:** A free hand.

</details>

<details><summary>Pact’s Claim: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One visible creature within 8 squares.

Cast a binding bolt for 2/3/5 force damage on Weak/Standard/Strong. Before rolling, you may choose to bind as well as wound: on Standard, reduce the damage by 1 and apply Slowed 1; on Strong, reduce the damage by 1 and apply Slowed 2. Weak deals its ordinary damage. Apply resistance and attack minimum normally; Slowed decays normally.

**Duration:** Attack immediate; Slowed uses ordinary decay.

**Equipment / acquisition:** A free hand.

This is a spell costing 0 SP. If you also know The Bargain, you may use its once-per-scene defense-Bane bargain on this bolt; that remains the same limited use.

</details>

**Useful actions and improvements:**


**Known book spells:** Chill Touch (Main Action; SP 0); Gentle Repose (Ritual; SP 1); Thaumaturgy (Maneuver; SP 0); Command (Main Action; SP 1); Minor Illusion (Maneuver; SP 0); Silent Image (Main Action; SP 1); Familiar (Ritual; SP 0); Find Familiar (Ritual; SP 1); Hold Person (Main Action; SP 1); Magic Circle (Ritual; SP 2); Banishment (Main Action; SP 2); Planar Binding (Ritual; SP 3).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 25/12/8/5 casts respectively; with the learned once-per-rest recovery it funds 26/13/8/5. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/warlock-level-7.hol.json). 2 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Spirits I (`spirits:0`) | 1 | 1 |
| Binding I (`binding:0`) | 1 | 1 |
| Perception I (`perception:0`) | 1 | 1 |
| Calling I (`calling:0`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Soul Capacity II (`spellcraft:soul-capacity:2`) | 2 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |
| Soul Capacity III (`spellcraft:soul-capacity:3`) | 2 | 3 |
| Deep Reserves I (`spellcraft:soul-capacity:4`) | 3 | 3 |
| Deep Reserves II (`spellcraft:soul-capacity:5`) | 4 | 3 |
| Binding II (`binding:1`) | 2 | 3 |
| Binding III (`binding:2`) | 2 | 3 |
| Deep Reserves III (`spellcraft:soul-capacity:6`) | 4 | 7 |
| Soul Wellspring (`spellcraft:soul-capacity:7`) | 5 | 7 |
| Covenants (`binding:3`) | 3 | 7 |
| Spirits II (`spirits:1`) | 2 | 7 |
| Spirits III (`spirits:2`) | 2 | 7 |
| Beyond the Veil (`spirits:3`) | 3 | 7 |
| Calling II (`calling:1`) | 2 | 7 |
| Calling III (`calling:2`) | 2 | 7 |
| The Answering Court (`calling:3`) | 3 | 7 |
| Recovery II (`spellcraft:recovery:2`) | 2 | 7 |
| Recovery III (`spellcraft:recovery:3`) | 2 | 7 |
| Quiet Renewal I (`spellcraft:recovery:4`) | 3 | 7 |
| Perception II (`perception:1`) | 2 | 7 |
| Perception III (`perception:2`) | 2 | 7 |

**Signature choices:** level 1: The Bargain; level 3: Pact’s Claim; level 7: The Price Deferred.

<details><summary>The Bargain: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One visible creature within 8 squares.

**Magic:** Spell · **SP:** 0

Choose a patron or supernatural compact with the DA when learning this signature; your choices remain your own. Cast Pact Bolt for 2/3/5 force damage on Weak/Standard/Strong. Once per scene, before this roll, you may accept 1 Bane to defenses until the start of your next turn to gain 1 Boon on the bolt’s roll.

**Duration:** Attack immediate; accepted defense penalty until your next turn.

**Equipment / acquisition:** A free hand.

</details>

<details><summary>Pact’s Claim: complete signature component</summary>

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One visible creature within 8 squares.

Cast a binding bolt for 2/3/5 force damage on Weak/Standard/Strong. Before rolling, you may choose to bind as well as wound: on Standard, reduce the damage by 1 and apply Slowed 1; on Strong, reduce the damage by 1 and apply Slowed 2. Weak deals its ordinary damage. Apply resistance and attack minimum normally; Slowed decays normally.

**Duration:** Attack immediate; Slowed uses ordinary decay.

**Equipment / acquisition:** A free hand.

This is a spell costing 0 SP. If you also know The Bargain, you may use its once-per-scene defense-Bane bargain on this bolt; that remains the same limited use.

</details>

<details><summary>The Price Deferred: complete signature component</summary>

**Action:** Reaction · **Attribute:** None

**Target / range / shape:** Self, when you would receive your third death failure.

**Magic:** Magical pact reprieve (not a spell)

Once between safe overnight rests, delay your death until the start of your next turn. You remain at 0 HP with three failures and make no further death rolls during this delay. Stabilization or healing above 0 clears the danger under ordinary recovery rules. At the start of your next turn, if you still have three failures, you die unless you spend Grit immediately. You can use this specific Reaction while Dying, even if unconscious.

**Duration:** Until the start of your next turn.

**Equipment / acquisition:** None.

</details>

**Useful actions and improvements:**


**Known book spells:** Chill Touch (Main Action; SP 0); Gentle Repose (Ritual; SP 1); Thaumaturgy (Maneuver; SP 0); Command (Main Action; SP 1); Minor Illusion (Maneuver; SP 0); Silent Image (Main Action; SP 1); Familiar (Ritual; SP 0); Find Familiar (Ritual; SP 1); Hold Person (Main Action; SP 1); Magic Circle (Ritual; SP 2); Banishment (Main Action; SP 2); Planar Binding (Ritual; SP 3); Geas (Ritual; SP 3); Hold Monster (Main Action; SP 4); Speak with Dead (Ritual; SP 1); Spirit Guardians (Main Action; SP 2); Lifekeeping (Reaction; SP 2); Animate Dead (Main Action; SP 3); Control Undead (Main Action; SP 3); Contact Other Plane (Ritual; SP 4); Unseen Servant (Main Action; SP 1); Summon Animal (Main Action; SP 2); Phantom Steed (Ritual; SP 2); Conjure Animals (Main Action; SP 3); Conjure Elemental (Main Action; SP 3); Summon Dragon (Main Action; SP 4); Disguise Self (Main Action; SP 1); Mirror Image (Main Action; SP 2); Invisibility (Main Action; SP 2); Major Image (Main Action; SP 3).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 40/20/13/8 casts respectively; with the learned once-per-rest recovery it funds 44/22/14/8. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

Every planned choice was affordable when scheduled.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
