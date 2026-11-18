# Eryn Mossarrow: ranger after the rewrite

Pinned authored source `1c26a4aabec0b6652111ec7169cad8e239d3b29c`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../ranger.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Tracking and a disciplined bow line both gain substantive high-level destinations. Level-7 Mark the Quarry retains a tangible, removable mark instead of an impossible hit gate.

This hunter line chooses archery over the animal-companion line. It does not get both identities for one signature selection.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 15 | 23 | 39 |
| SP | 5 | 9 | 17 |
| DP spent / total | 8 / 8 | 21 / 21 | 57 / 59 |
| Unspent DP | 0 | 0 | 2 |
| Learned action choices (Main / Maneuver / Reaction) | 2 / 1 / 1 | 4 / 1 / 1 | 8 / 1 / 1 |
| Known book spells (free / paid) | 4 (2 / 2) | 4 (2 / 2) | 12 (2 / 10) |
| Shared reserve: casts at 2 SP | 2 | 4 | 8 |
| Shared reserve: casts at 5 SP | 1 | 1 | 3 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Wood Elf**; class: **Warden**. Attributes: brawn +0, fortitude +1, agility +2, guile -1, knowledge +1, reason +0. Traits: Footfall on the Leaves; Nature’s Whispers.

Starting disciplines: wilderness from culture, elements from background, and marksmanship from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Ranged Weapon (held); Ammunition Bundle; Travel Pack; Food Bundle; Water Flask; Sleeping Roll; Lighting Bundle. 5 starting coins remain. 

The D&D baseline has **20 HP** and **AC 15 (Studded Leather 12 + DEX 3)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Creation remains **8 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `marksmanship:precision` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/ranger-level-1.hol.json). 0 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Shot I (`marksmanship:precision:1`) | 1 | 1 |
| Measured Shot II (`marksmanship:precision:2`) | 2 | 1 |
| Watchful Shot I (`marksmanship:readiness:1`) | 1 | 1 |
| Read the Trail I (`wilderness:tracking:1`) | 1 | 1 |
| Wild Harvest I (`wilderness:provisioning:1`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |
| Earth I (`earth:0`) | 1 | 1 |

**Signature choices:** level 1: Steady Aim.

<details><summary>Steady Aim: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self; one visible creature.

Aim at one visible creature. Until you move, you gain 1 Boon to all attacks you make against that creature and ignore partial cover from it.

**Duration:** Until you move.

**Equipment / acquisition:** A ranged weapon and ammunition.

The benefit ends when you aim at another target or the scene ends. You must still perceive your target to attack it.

</details>

**Useful actions and improvements:**

- **Measured Shot I:** Main Action · Agility. Attack one creature within 8 squares for 2/3/5 physical damage. Measured Shot deals 3/4/6 physical damage.
- **Watchful Shot I:** Reaction · Agility. When a visible enemy within 6 squares finishes voluntary movement adjacent to an ally, attack it for 1/2/3 physical damage. Resolve after the movement; you need a ready weapon.
- **Read the Trail I:** Main Action · Reason. Read tracks or signs immediately before you; add 1/2/3 progress toward identifying direction, approximate numbers and freshness. Following a trail to the next landmark takes 10 minutes per attempt instead. The DA defines each objective from accessible evidence.
- **Wild Harvest I:** 1 hour · Knowledge. Search an accessible area with plausible resources; gather 1/2/3 person-days of food, or that much drinkable water if a source exists. The DA defines the area before rolling. You can also spend 1 hour with available materials to shelter two people from ordinary rain and wind, without a roll.

**Known book spells:** Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1); Enchanted Rope (Maneuver; SP 0); Loosen Earth (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 5/2/1/1 casts respectively; with the learned once-per-rest recovery it funds 5/2/1/1. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/ranger-level-3.hol.json). 0 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Shot I (`marksmanship:precision:1`) | 1 | 1 |
| Measured Shot II (`marksmanship:precision:2`) | 2 | 1 |
| Watchful Shot I (`marksmanship:readiness:1`) | 1 | 1 |
| Read the Trail I (`wilderness:tracking:1`) | 1 | 1 |
| Wild Harvest I (`wilderness:provisioning:1`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |
| Earth I (`earth:0`) | 1 | 1 |
| Measured Shot III (`marksmanship:precision:3`) | 2 | 3 |
| Split the Flight I (`marksmanship:precision:4`) | 3 | 3 |
| Split the Flight II (`marksmanship:precision:5`) | 4 | 3 |
| Split the Flight III (`marksmanship:precision:6`) | 4 | 3 |

**Signature choices:** level 1: Steady Aim; level 3: Volley.

<details><summary>Steady Aim: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self; one visible creature.

Aim at one visible creature. Until you move, you gain 1 Boon to all attacks you make against that creature and ignore partial cover from it.

**Duration:** Until you move.

**Equipment / acquisition:** A ranged weapon and ammunition.

The benefit ends when you aim at another target or the scene ends. You must still perceive your target to attack it.

</details>

<details><summary>Volley: complete signature component</summary>

**Action:** Main Action · **Attribute:** Agility

**Target / range / shape:** A 2 × 2 area within 10 squares.

Requires a ranged weapon and ammunition. Make one Agility roll and apply it to each creature in the area. Weak: 1 physical damage. Standard: 2 physical damage. Strong: 3 physical damage. Roll once using the worst applicable Boon or Bane among the targets. Each target applies resistance separately. A creature can be affected once per use.

**Duration:** Immediate.

**Equipment / acquisition:** A ranged weapon and ammunition.

</details>

**Useful actions and improvements:**

- **Measured Shot I:** Main Action · Agility. Attack one creature within 8 squares for 2/3/5 physical damage. Measured Shot deals 3/4/6 physical damage. Measured Shot has range 12 squares.
- **Watchful Shot I:** Reaction · Agility. When a visible enemy within 6 squares finishes voluntary movement adjacent to an ally, attack it for 1/2/3 physical damage. Resolve after the movement; you need a ready weapon.
- **Read the Trail I:** Main Action · Reason. Read tracks or signs immediately before you; add 1/2/3 progress toward identifying direction, approximate numbers and freshness. Following a trail to the next landmark takes 10 minutes per attempt instead. The DA defines each objective from accessible evidence.
- **Wild Harvest I:** 1 hour · Knowledge. Search an accessible area with plausible resources; gather 1/2/3 person-days of food, or that much drinkable water if a source exists. The DA defines the area before rolling. You can also spend 1 hour with available materials to shelter two people from ordinary rain and wind, without a roll.
- **Split the Flight I:** Main Action · Agility. Attack up to three creatures within 8 squares. Roll once; each takes 1/2/4 physical damage. Each is struck once. Split the Flight has range 12 squares. Split the Flight deals 2/3/5 physical damage. You may also spend a Main Action observing one visible creature within 12 squares to mark a vulnerable part of its anatomy or construction for this scene; no roll. The DA identifies a plausible exposed part, or states that none is visible.

**Known book spells:** Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1); Enchanted Rope (Maneuver; SP 0); Loosen Earth (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 9/4/3/1 casts respectively; with the learned once-per-rest recovery it funds 9/4/3/1. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/ranger-level-7.hol.json). 2 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Measured Shot I (`marksmanship:precision:1`) | 1 | 1 |
| Measured Shot II (`marksmanship:precision:2`) | 2 | 1 |
| Watchful Shot I (`marksmanship:readiness:1`) | 1 | 1 |
| Read the Trail I (`wilderness:tracking:1`) | 1 | 1 |
| Wild Harvest I (`wilderness:provisioning:1`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |
| Earth I (`earth:0`) | 1 | 1 |
| Measured Shot III (`marksmanship:precision:3`) | 2 | 3 |
| Split the Flight I (`marksmanship:precision:4`) | 3 | 3 |
| Split the Flight II (`marksmanship:precision:5`) | 4 | 3 |
| Split the Flight III (`marksmanship:precision:6`) | 4 | 3 |
| Anatomist’s Volley (`marksmanship:precision:7`) | 5 | 7 |
| Read the Trail II (`wilderness:tracking:2`) | 2 | 7 |
| Read the Trail III (`wilderness:tracking:3`) | 2 | 7 |
| Cut Them Off I (`wilderness:tracking:4`) | 3 | 7 |
| Cut Them Off II (`wilderness:tracking:5`) | 4 | 7 |
| Cut Them Off III (`wilderness:tracking:6`) | 4 | 7 |
| Unerring Pursuit (`wilderness:tracking:7`) | 5 | 7 |
| Water II (`water:1`) | 2 | 7 |
| Water III (`water:2`) | 2 | 7 |
| Winter’s Dominion (`water:3`) | 3 | 7 |
| Earth II (`earth:1`) | 2 | 7 |
| Watchful Shot II (`marksmanship:readiness:2`) | 2 | 7 |

**Signature choices:** level 1: Steady Aim; level 3: Volley; level 7: Mark the Quarry.

<details><summary>Steady Aim: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self; one visible creature.

Aim at one visible creature. Until you move, you gain 1 Boon to all attacks you make against that creature and ignore partial cover from it.

**Duration:** Until you move.

**Equipment / acquisition:** A ranged weapon and ammunition.

The benefit ends when you aim at another target or the scene ends. You must still perceive your target to attack it.

</details>

<details><summary>Volley: complete signature component</summary>

**Action:** Main Action · **Attribute:** Agility

**Target / range / shape:** A 2 × 2 area within 10 squares.

Requires a ranged weapon and ammunition. Make one Agility roll and apply it to each creature in the area. Weak: 1 physical damage. Standard: 2 physical damage. Strong: 3 physical damage. Roll once using the worst applicable Boon or Bane among the targets. Each target applies resistance separately. A creature can be affected once per use.

**Duration:** Immediate.

**Equipment / acquisition:** A ranged weapon and ammunition.

</details>

<details><summary>Mark the Quarry: complete signature component</summary>

**Action:** Main Action · **Attribute:** Agility

**Target / range / shape:** One visible creature within 12 squares.

Requires a ranged weapon and ammunition. Make a Basic Ranged attack as part of this action. After the attack resolves, the target is marked for one day with the glowing dust of a cave mushroom. While marked, you and each ally who can see it gain 2 Boons to any attack against it, ignore partial cover from it, and the target cannot hide. The mark deals no additional damage.

**Duration:** One day.

**Equipment / acquisition:** A ranged weapon and ammunition.

This ordinary mark is a physical luminous substance. An attack always applies it unless the target cannot be reached; damage immunity does not prevent marking. Cleaning it off takes 1 minute. Completely covering the mark suspends its visual benefits until exposed.

**Frequency:** Once between safe overnight rests.

</details>

**Useful actions and improvements:**

- **Measured Shot I:** Main Action · Agility. Attack one creature within 8 squares for 2/3/5 physical damage. Measured Shot deals 3/4/6 physical damage. Measured Shot has range 12 squares.
- **Watchful Shot I:** Reaction · Agility. When a visible enemy within 6 squares finishes voluntary movement adjacent to an ally, attack it for 1/2/3 physical damage. Resolve after the movement; you need a ready weapon. Watchful Shot has range 8 squares.
- **Read the Trail I:** Main Action · Reason. Read tracks or signs immediately before you; add 1/2/3 progress toward identifying direction, approximate numbers and freshness. Following a trail to the next landmark takes 10 minutes per attempt instead. The DA defines each objective from accessible evidence. Read the Trail adds 1/3/4 progress. Read the Trail takes 5 minutes per attempt when following a trail.
- **Wild Harvest I:** 1 hour · Knowledge. Search an accessible area with plausible resources; gather 1/2/3 person-days of food, or that much drinkable water if a source exists. The DA defines the area before rolling. You can also spend 1 hour with available materials to shelter two people from ordinary rain and wind, without a roll.
- **Split the Flight I:** Main Action · Agility. Attack up to three creatures within 8 squares. Roll once; each takes 1/2/4 physical damage. Each is struck once. Split the Flight has range 12 squares. Split the Flight deals 2/3/5 physical damage. You may also spend a Main Action observing one visible creature within 12 squares to mark a vulnerable part of its anatomy or construction for this scene; no roll. The DA identifies a plausible exposed part, or states that none is visible.
- **Anatomist’s Volley:** Main Action · Agility. Attack up to three enemies within 12 squares whose vulnerable anatomy or construction you have observed through Split the Flight’s study or established evidence. Roll once; each takes 3/5/8 physical damage, ignoring up to 2 physical resistance. Immunity and other reductions still apply. Study does not create a vulnerability where none exists.
- **Cut Them Off I:** Main Action · Reason to interpret a visible junction on a trail you followed, or 10 minutes to scout a wider interception route. Add 1/2/3 progress toward finding a physically feasible interception. Completion reveals the route and travel time, not a guarantee of arriving first. Cut Them Off adds 1/3/4 progress. After completing Cut Them Off, you and up to four companions gain 1 Boon on travel rolls to traverse that identified route until its next landmark. Changed or blocked terrain requires a new route.
- **Unerring Pursuit:** Main Action · Reason at a visible junction, or 10 minutes to scout the surrounding area. From a trail you followed, add 3/5/7 progress toward predicting the quarry’s next reachable landmark from its tracks and known terrain. Completion identifies the best-supported destination and gaps in the evidence. You and up to six companions gain 2 Boons on pursuit and traversal rolls along that route until reaching it. This does not locate a quarry that left no readable evidence.

**Known book spells:** Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1); Enchanted Rope (Maneuver; SP 0); Loosen Earth (Ritual; SP 1); Purify Food and Drink (Ritual; SP 1); Water Breathing (Main Action; SP 2); Water Walk (Main Action; SP 2); Control Water (Main Action; SP 3); Ice Storm (Main Action; SP 3); Wall of Ice (Main Action; SP 4); Earthwall (Main Action; SP 1); Cracks Call (Main Action; SP 2).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 17/8/5/3 casts respectively; with the learned once-per-rest recovery it funds 17/8/5/3. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 3: Read the Trail II — Costs 2 DP. You have 0 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
