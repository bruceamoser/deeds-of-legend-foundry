# Thalen Reedwalker: druid after the rewrite

Pinned authored source `eba265e029d7143399d0dee70b18a2531fcc032b`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../druid.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Borrowed Shape supplies an actual early beast form. Its later adaptations and Great Shape cover aquatic, climbing and flying fantasies without resetting HP.

Only one transformation per scene and retained personal HP give different attrition from 5e Wild Shape. Shape prevents casting; decide when to be a beast and when to use the books.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 14 | 22 | 38 |
| SP | 7 | 11 | 19 |
| DP spent / total | 8 / 10 | 21 / 23 | 60 / 61 |
| Unspent DP | 2 | 2 | 1 |
| Learned action choices (Main / Maneuver / Reaction) | 2 / 1 / 0 | 2 / 1 / 0 | 2 / 3 / 0 |
| Known book spells (free / paid) | 10 (4 / 6) | 18 (4 / 14) | 29 (4 / 25) |
| Shared reserve: casts at 2 SP | 3 | 5 | 9 |
| Shared reserve: casts at 5 SP | 1 | 2 | 3 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Wood Elf**; class: **Shepherd**. Attributes: brawn +0, fortitude +0, agility +1, guile +0, knowledge +0, reason +2. Traits: Nature’s Whispers; Grace of the Elder Folk.

Starting disciplines: wilderness from culture, elements from background, and life from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Travel Pack; Food Bundle; Water Flask; Sleeping Roll; Rope Coil; Lighting Bundle. 14 starting coins remain. 

The D&D baseline has **17 HP** and **AC 15 (Leather 11 + DEX 2 + Shield 2)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Creation remains **8 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `wilderness:animal-handling` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/druid-level-1.hol.json). 2 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Growth I (`growth:0`) | 1 | 1 |
| Growth II (`growth:1`) | 2 | 1 |
| Transformation I (`transformation:0`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |
| Earth I (`earth:0`) | 1 | 1 |
| Gentle Hand I (`wilderness:animal-handling:1`) | 1 | 1 |
| Read the Trail I (`wilderness:tracking:1`) | 1 | 1 |

**Signature choices:** level 1: Borrowed Shape.

<details><summary>Borrowed Shape: complete signature component</summary>

**Action:** Main Action · **Attribute:** None

**Target / range / shape:** Self.

**Magic:** Spell · **SP:** 1

Once per scene, assume the appearance of a familiar Small or Medium ground beast for 10 minutes. Keep your HP, attributes, conditions, resources and Speed. Your equipment melds and provides no effects or resistance. Your form has physical resistance 1 and a natural attack: Main Action, Brawn, adjacent target, 2/3/5 physical damage on Weak/Standard/Strong. You speak only animal calls and cannot cast spells or use equipment. Return to your own shape with a Maneuver or automatically at 0 HP. Changing form never restores HP.

**Duration:** Fixed 10 minutes; no Sustain.

**Equipment / acquisition:** A free hand to cast before transforming.

</details>

**Useful actions and improvements:**

- **Gentle Hand I:** Maneuver · Reason. Reassure one nonmagical animal within 2 squares that can perceive you and is already receptive to your presence; add 1/2/3 progress toward calming its immediate fear. An unfamiliar agitated animal takes 1 minute per attempt instead. Immediate danger or an implausible approach prevents progress.
- **Read the Trail I:** Main Action · Reason. Read tracks or signs immediately before you; add 1/2/3 progress toward identifying direction, approximate numbers and freshness. Following a trail to the next landmark takes 10 minutes per attempt instead. The DA defines each objective from accessible evidence.

**Known book spells:** Druidcraft (Maneuver; SP 0); Entangle (Main Action; SP 1); Goodberry (Ritual; SP 1); Speak with Plants (Main Action; SP 2); Hues (Maneuver; SP 0); Jump (Maneuver; SP 1); Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1); Enchanted Rope (Maneuver; SP 0); Loosen Earth (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 7/3/2/1 casts respectively; with the learned once-per-rest recovery it funds 7/3/2/1. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/druid-level-3.hol.json). 2 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Growth I (`growth:0`) | 1 | 1 |
| Growth II (`growth:1`) | 2 | 1 |
| Transformation I (`transformation:0`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |
| Earth I (`earth:0`) | 1 | 1 |
| Gentle Hand I (`wilderness:animal-handling:1`) | 1 | 1 |
| Read the Trail I (`wilderness:tracking:1`) | 1 | 1 |
| Growth III (`growth:2`) | 2 | 3 |
| Green Architecture (`growth:3`) | 3 | 3 |
| Transformation II (`transformation:1`) | 2 | 3 |
| Transformation III (`transformation:2`) | 2 | 3 |
| Gentle Hand II (`wilderness:animal-handling:2`) | 2 | 3 |
| Gentle Hand III (`wilderness:animal-handling:3`) | 2 | 3 |

**Signature choices:** level 1: Borrowed Shape; level 3: Shape of the Wild.

<details><summary>Borrowed Shape: complete signature component</summary>

**Action:** Main Action · **Attribute:** None

**Target / range / shape:** Self.

**Magic:** Spell · **SP:** 1

Once per scene, assume the appearance of a familiar Small or Medium ground beast for 10 minutes. Keep your HP, attributes, conditions, resources and Speed. Your equipment melds and provides no effects or resistance. Your form has physical resistance 1 and a natural attack: Main Action, Brawn, adjacent target, 2/3/5 physical damage on Weak/Standard/Strong. You speak only animal calls and cannot cast spells or use equipment. Return to your own shape with a Maneuver or automatically at 0 HP. Changing form never restores HP.

**Duration:** Fixed 10 minutes; no Sustain.

**Equipment / acquisition:** A free hand to cast before transforming.

</details>

<details><summary>Shape of the Wild: complete signature component</summary>

**Action:** Passive · **Attribute:** None

**Target / range / shape:** When casting Borrowed Shape.

Choose one adaptation when transforming: swim at your Speed and breathe water; climb at your Speed; or remain a ground beast and gain 1 Boon to tracking rolls that rely on scent. The adaptation lasts for that transformation. Changing it requires another casting and follows Borrowed Shape’s once-per-scene limit.

**Duration:** The transformation.

**Equipment / acquisition:** None.

</details>

**Useful actions and improvements:**

- **Gentle Hand I:** Maneuver · Reason. Reassure one nonmagical animal within 2 squares that can perceive you and is already receptive to your presence; add 1/2/3 progress toward calming its immediate fear. An unfamiliar agitated animal takes 1 minute per attempt instead. Immediate danger or an implausible approach prevents progress. Gentle Hand adds 1/3/4 progress. Gentle Hand may address three animals sharing the same cause of agitation as one objective.
- **Read the Trail I:** Main Action · Reason. Read tracks or signs immediately before you; add 1/2/3 progress toward identifying direction, approximate numbers and freshness. Following a trail to the next landmark takes 10 minutes per attempt instead. The DA defines each objective from accessible evidence.

**Known book spells:** Druidcraft (Maneuver; SP 0); Entangle (Main Action; SP 1); Goodberry (Ritual; SP 1); Speak with Plants (Main Action; SP 2); Hues (Maneuver; SP 0); Jump (Maneuver; SP 1); Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1); Enchanted Rope (Maneuver; SP 0); Loosen Earth (Ritual; SP 1); Spike Growth (Main Action; SP 2); Plant Growth (Ritual; SP 3); Tree Skin (Main Action; SP 3); Tree Stride (Main Action; SP 4); Longstrider (Main Action; SP 1); Alter Self (Main Action; SP 2); Enlarge/Reduce — Living (Main Action; SP 2); Darkvision (Main Action; SP 3).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 11/5/3/2 casts respectively; with the learned once-per-rest recovery it funds 11/5/3/2. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/druid-level-7.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Growth I (`growth:0`) | 1 | 1 |
| Growth II (`growth:1`) | 2 | 1 |
| Transformation I (`transformation:0`) | 1 | 1 |
| Water I (`water:0`) | 1 | 1 |
| Earth I (`earth:0`) | 1 | 1 |
| Gentle Hand I (`wilderness:animal-handling:1`) | 1 | 1 |
| Read the Trail I (`wilderness:tracking:1`) | 1 | 1 |
| Growth III (`growth:2`) | 2 | 3 |
| Green Architecture (`growth:3`) | 3 | 3 |
| Transformation II (`transformation:1`) | 2 | 3 |
| Transformation III (`transformation:2`) | 2 | 3 |
| Gentle Hand II (`wilderness:animal-handling:2`) | 2 | 3 |
| Gentle Hand III (`wilderness:animal-handling:3`) | 2 | 3 |
| Lead the Herd I (`wilderness:animal-handling:4`) | 3 | 7 |
| Lead the Herd II (`wilderness:animal-handling:5`) | 4 | 7 |
| Lead the Herd III (`wilderness:animal-handling:6`) | 4 | 7 |
| Wild Accord (`wilderness:animal-handling:7`) | 5 | 7 |
| Awaken (`growth:4`) | 4 | 7 |
| Wall of Thorns (`growth:5`) | 4 | 7 |
| Transport via Plants (`growth:6`) | 5 | 7 |
| Manyfold Body (`transformation:3`) | 3 | 7 |
| Water II (`water:1`) | 2 | 7 |
| Water III (`water:2`) | 2 | 7 |
| Winter’s Dominion (`water:3`) | 3 | 7 |

**Signature choices:** level 1: Borrowed Shape; level 3: Shape of the Wild; level 7: Great Shape.

<details><summary>Borrowed Shape: complete signature component</summary>

**Action:** Main Action · **Attribute:** None

**Target / range / shape:** Self.

**Magic:** Spell · **SP:** 1

Once per scene, assume the appearance of a familiar Small or Medium ground beast for 10 minutes. Keep your HP, attributes, conditions, resources and Speed. Your equipment melds and provides no effects or resistance. Your form has physical resistance 1 and a natural attack: Main Action, Brawn, adjacent target, 2/3/5 physical damage on Weak/Standard/Strong. You speak only animal calls and cannot cast spells or use equipment. Return to your own shape with a Maneuver or automatically at 0 HP. Changing form never restores HP.

**Duration:** Fixed 10 minutes; no Sustain.

**Equipment / acquisition:** A free hand to cast before transforming.

</details>

<details><summary>Great Shape: complete signature component</summary>

**Action:** Passive · **Attribute:** None

**Target / range / shape:** When casting Borrowed Shape.

You may choose a Large ground beast: its natural attack deals 3/4/6 physical damage and pushes 1 directly away on Strong. Alternatively choose a Small flying beast: gain fly Speed equal to your Speed and use the ordinary natural attack’s 2/3/5 damage. Keep your own HP and physical resistance 1. Choose a legal space large enough for the form. Returning to your own form while airborne leaves you subject to falling normally.

**Duration:** The transformation.

**Equipment / acquisition:** None.

</details>

<details><summary>Shape of the Wild: complete signature component</summary>

**Action:** Passive · **Attribute:** None

**Target / range / shape:** When casting Borrowed Shape.

Choose one adaptation when transforming: swim at your Speed and breathe water; climb at your Speed; or remain a ground beast and gain 1 Boon to tracking rolls that rely on scent. The adaptation lasts for that transformation. Changing it requires another casting and follows Borrowed Shape’s once-per-scene limit.

**Duration:** The transformation.

**Equipment / acquisition:** None.

</details>

**Useful actions and improvements:**

- **Gentle Hand I:** Maneuver · Reason. Reassure one nonmagical animal within 2 squares that can perceive you and is already receptive to your presence; add 1/2/3 progress toward calming its immediate fear. An unfamiliar agitated animal takes 1 minute per attempt instead. Immediate danger or an implausible approach prevents progress. Gentle Hand adds 1/3/4 progress. Gentle Hand may address three animals sharing the same cause of agitation as one objective.
- **Read the Trail I:** Main Action · Reason. Read tracks or signs immediately before you; add 1/2/3 progress toward identifying direction, approximate numbers and freshness. Following a trail to the next landmark takes 10 minutes per attempt instead. The DA defines each objective from accessible evidence.
- **Lead the Herd I:** Maneuver · Reason. Direct up to six calm nonmagical animals already cooperating with you toward a visible safe route; add 1/2/3 progress to the DA’s handling objective. Establishing initial cooperation takes 10 minutes per attempt instead. Completion gets them moving with you; danger or mistreatment ends cooperation. Lead the Herd adds 1/3/4 progress. Lead the Herd can guide twelve calm animals, and you gain 1 Boon on handling rolls to keep that herd together in ordinary travel.
- **Wild Accord:** Maneuver · Reason. Give a familiar, cooperative nonmagical animal group of up to twelve one understandable direction: follow, wait, scatter to safety or approach a named visible place. Add 3/5/7 progress to the DA’s objective for overcoming present fear or confusion; ordinary cooperation with a safe instruction needs no roll. Completion gets the group carrying out that direction. This grants no attacks or additional combat turns; serious danger or mistreatment ends cooperation.

**Known book spells:** Druidcraft (Maneuver; SP 0); Entangle (Main Action; SP 1); Goodberry (Ritual; SP 1); Speak with Plants (Main Action; SP 2); Hues (Maneuver; SP 0); Jump (Maneuver; SP 1); Ray of Frost (Main Action; SP 0); Create or Destroy Water (Ritual; SP 1); Enchanted Rope (Maneuver; SP 0); Loosen Earth (Ritual; SP 1); Spike Growth (Main Action; SP 2); Plant Growth (Ritual; SP 3); Tree Skin (Main Action; SP 3); Tree Stride (Main Action; SP 4); Longstrider (Main Action; SP 1); Alter Self (Main Action; SP 2); Enlarge/Reduce — Living (Main Action; SP 2); Darkvision (Main Action; SP 3); Awaken (Ritual; SP 5); Wall of Thorns (Main Action; SP 5); Transport via Plants (Ritual; SP 6); Polymorph (Main Action; SP 3); Freedom of Movement (Main Action; SP 4); Purify Food and Drink (Ritual; SP 1); Water Breathing (Main Action; SP 2); Water Walk (Main Action; SP 2); Control Water (Main Action; SP 3); Ice Storm (Main Action; SP 3); Wall of Ice (Main Action; SP 4).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 19/9/6/3 casts respectively; with the learned once-per-rest recovery it funds 19/9/6/3. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 7: Spellcraft — Costs 2 DP. You have 1 DP.
- Level 7: Spellcraft — Costs 2 DP. You have 1 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
