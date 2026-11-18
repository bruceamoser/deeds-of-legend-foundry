# Vaelis Quillstar: wizard after the rewrite

Pinned authored source `1004501fcf53d573b3346faf3f5ba55fbd693924`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../wizard.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Study the Pattern now gives usable, bounded information; its later cancellation insight and ward accompany growing books and reserve capacity.

Fixed book sections differ from learning or copying arbitrary individual 5e spells. Cancellation insight still needs an actual cancellation ability; this selection is not a universal Counterspell license.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 13 | 19 | 31 |
| SP | 10 | 22 | 40 |
| DP spent / total | 11 / 11 | 23 / 24 | 61 / 62 |
| Unspent DP | 0 | 1 | 1 |
| Learned action choices (Main / Maneuver / Reaction) | 1 / 1 / 0 | 1 / 2 / 0 | 1 / 3 / 0 |
| Known book spells (free / paid) | 12 (5 / 7) | 16 (5 / 11) | 32 (5 / 27) |
| Shared reserve: casts at 2 SP | 5 | 11 | 20 |
| Shared reserve: casts at 5 SP | 2 | 4 | 8 |
| Extra SP from one recovery rest | 1 | 1 | 4 |

## Character choices

Ancestry: **High Elf**; class: **Arcanist**. Attributes: brawn -1, fortitude +0, agility +1, guile +0, knowledge +2, reason +1. Traits: Starlight Eyes; The Weight of Centuries.

Starting disciplines: scholarship from culture, divination from background, and force from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Writing Kit; Travel Pack; Food Bundle; Water Flask; Sleeping Roll; Lighting Bundle. 22 starting coins remain. 

The D&D baseline has **14 HP** and **AC 12 normally; 15 with Mage Armor (costs one level-1 slot)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Creation remains **8 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. Later awards are **4 + new level**. The completed `spellcraft:soul-capacity` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/wizard-level-1.hol.json). 0 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Telekinesis I (`telekinesis:0`) | 1 | 1 |
| Telekinesis II (`telekinesis:1`) | 2 | 1 |
| Shaping I (`shaping:0`) | 1 | 1 |
| Animation I (`animation:0`) | 1 | 1 |
| Imbuement I (`imbuement:0`) | 1 | 1 |
| Detection I (`detection:0`) | 1 | 1 |
| Read the Evidence I (`scholarship:investigation:1`) | 1 | 1 |
| Spellcraft (`spellcraft`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |

**Signature choices:** level 1: Study the Pattern.

<details><summary>Study the Pattern: complete signature component</summary>

**Action:** Maneuver · **Attribute:** Reason

**Target / range / shape:** One known ongoing magical effect within 5 squares.

**Magic:** Spell · **SP:** 0

Study the effect once per scene. Roll Reason and learn 1/2/3 facts on Weak/Standard/Strong, chosen from its purpose, its remaining duration, and the category of its source (creature, object, place or independent spell). Gain 1 Boon to your next roll applying a learned fact this scene. The DA describes what the effect reveals, not unknown true names or hidden personal history.

**Duration:** Facts remain known; the Boon expires when used or at scene end.

**Equipment / acquisition:** A free hand for casting.

</details>

**Useful actions and improvements:**

- **Read the Evidence I:** Main Action · Reason. Examine one accessible clue within reach; add 1/2/3 progress toward a concrete question about it. Searching a scene instead takes 10 minutes per attempt. You may also recall a relevant fact about a subject or reliable description: 1 minute, Knowledge, 1/2/3 progress toward a question set before rolling.

**Known book spells:** Arcane Bolt (Main Action; SP 0); Mage Hand (Maneuver; SP 1); Magic Missile (Main Action; SP 1); Staying (Main Action; SP 2); Mending (Ritual; SP 0); Grease (Main Action; SP 1); Prestidigitation (Maneuver; SP 0); Unseen Servant — Workshop (Main Action; SP 1); Light (Maneuver; SP 0); Magic Weapon (Main Action; SP 1); Detect Magic (Maneuver; SP 0); Detect Poison and Disease (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 10/5/3/2 casts respectively; with the learned once-per-rest recovery it funds 11/5/3/2. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/wizard-level-3.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Telekinesis I (`telekinesis:0`) | 1 | 1 |
| Telekinesis II (`telekinesis:1`) | 2 | 1 |
| Shaping I (`shaping:0`) | 1 | 1 |
| Animation I (`animation:0`) | 1 | 1 |
| Imbuement I (`imbuement:0`) | 1 | 1 |
| Detection I (`detection:0`) | 1 | 1 |
| Read the Evidence I (`scholarship:investigation:1`) | 1 | 1 |
| Spellcraft (`spellcraft`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |
| Telekinesis III (`telekinesis:2`) | 2 | 3 |
| Invisible Architecture (`telekinesis:3`) | 3 | 3 |
| Soul Capacity II (`spellcraft:soul-capacity:2`) | 2 | 3 |
| Soul Capacity III (`spellcraft:soul-capacity:3`) | 2 | 3 |
| Deep Reserves I (`spellcraft:soul-capacity:4`) | 3 | 3 |

**Signature choices:** level 1: Study the Pattern; level 3: Reading the Weave.

<details><summary>Study the Pattern: complete signature component</summary>

**Action:** Maneuver · **Attribute:** Reason

**Target / range / shape:** One known ongoing magical effect within 5 squares.

**Magic:** Spell · **SP:** 0

Study the effect once per scene. Roll Reason and learn 1/2/3 facts on Weak/Standard/Strong, chosen from its purpose, its remaining duration, and the category of its source (creature, object, place or independent spell). Gain 1 Boon to your next roll applying a learned fact this scene. The DA describes what the effect reveals, not unknown true names or hidden personal history.

**Duration:** Facts remain known; the Boon expires when used or at scene end.

**Equipment / acquisition:** A free hand for casting.

</details>

<details><summary>Reading the Weave: complete signature component</summary>

**Action:** Maneuver · **Attribute:** Reason

**Target / range / shape:** One known ongoing magical effect within 5 squares.

Study the effect once per scene. Roll Reason and learn 1/2/3 facts on Weak/Standard/Strong, chosen from its purpose, remaining duration, and source category (creature, object, place or independent spell). Gain 1 Boon to your next roll applying a learned fact this scene. The DA describes what the effect reveals, not unknown true names or hidden personal history.

Your next cancellation roll against that effect this scene also gains 1 Boon. The examination reveals whether a specific remedy exists and the kind of evidence needed to discover it. Use the learned facts with your cancellation abilities or to seek the remedy.

**Duration:** Facts remain known; each Boon expires when used or at scene end.

**Equipment / acquisition:** A free hand for casting.

This is a spell costing 0 SP.

</details>

**Useful actions and improvements:**

- **Read the Evidence I:** Main Action · Reason. Examine one accessible clue within reach; add 1/2/3 progress toward a concrete question about it. Searching a scene instead takes 10 minutes per attempt. You may also recall a relevant fact about a subject or reliable description: 1 minute, Knowledge, 1/2/3 progress toward a question set before rolling.

**Known book spells:** Arcane Bolt (Main Action; SP 0); Mage Hand (Maneuver; SP 1); Magic Missile (Main Action; SP 1); Staying (Main Action; SP 2); Mending (Ritual; SP 0); Grease (Main Action; SP 1); Prestidigitation (Maneuver; SP 0); Unseen Servant — Workshop (Main Action; SP 1); Light (Maneuver; SP 0); Magic Weapon (Main Action; SP 1); Detect Magic (Maneuver; SP 0); Detect Poison and Disease (Ritual; SP 1); Levitate — Objects (Main Action; SP 2); Shatter (Main Action; SP 3); Telekinesis (Main Action; SP 3); Resilient Sphere (Main Action; SP 4).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 22/11/7/4 casts respectively; with the learned once-per-rest recovery it funds 23/11/7/4. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/wizard-level-7.hol.json). 1 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Telekinesis I (`telekinesis:0`) | 1 | 1 |
| Telekinesis II (`telekinesis:1`) | 2 | 1 |
| Shaping I (`shaping:0`) | 1 | 1 |
| Animation I (`animation:0`) | 1 | 1 |
| Imbuement I (`imbuement:0`) | 1 | 1 |
| Detection I (`detection:0`) | 1 | 1 |
| Read the Evidence I (`scholarship:investigation:1`) | 1 | 1 |
| Spellcraft (`spellcraft`) | 1 | 1 |
| Soul Capacity I (`spellcraft:soul-capacity:1`) | 1 | 1 |
| Recovery I (`spellcraft:recovery:1`) | 1 | 1 |
| Telekinesis III (`telekinesis:2`) | 2 | 3 |
| Invisible Architecture (`telekinesis:3`) | 3 | 3 |
| Soul Capacity II (`spellcraft:soul-capacity:2`) | 2 | 3 |
| Soul Capacity III (`spellcraft:soul-capacity:3`) | 2 | 3 |
| Deep Reserves I (`spellcraft:soul-capacity:4`) | 3 | 3 |
| Deep Reserves II (`spellcraft:soul-capacity:5`) | 4 | 7 |
| Deep Reserves III (`spellcraft:soul-capacity:6`) | 4 | 7 |
| Soul Wellspring (`spellcraft:soul-capacity:7`) | 5 | 7 |
| Shaping II (`shaping:1`) | 2 | 7 |
| Shaping III (`shaping:2`) | 2 | 7 |
| Masterwork Forms (`shaping:3`) | 3 | 7 |
| Detection II (`detection:1`) | 2 | 7 |
| Detection III (`detection:2`) | 2 | 7 |
| The Unhidden (`detection:3`) | 3 | 7 |
| Recovery II (`spellcraft:recovery:2`) | 2 | 7 |
| Recovery III (`spellcraft:recovery:3`) | 2 | 7 |
| Quiet Renewal I (`spellcraft:recovery:4`) | 3 | 7 |
| Animation II (`animation:1`) | 2 | 7 |
| Animation III (`animation:2`) | 2 | 7 |

**Signature choices:** level 1: Study the Pattern; level 3: Reading the Weave; level 7: Open the Circle.

<details><summary>Study the Pattern: complete signature component</summary>

**Action:** Maneuver · **Attribute:** Reason

**Target / range / shape:** One known ongoing magical effect within 5 squares.

**Magic:** Spell · **SP:** 0

Study the effect once per scene. Roll Reason and learn 1/2/3 facts on Weak/Standard/Strong, chosen from its purpose, its remaining duration, and the category of its source (creature, object, place or independent spell). Gain 1 Boon to your next roll applying a learned fact this scene. The DA describes what the effect reveals, not unknown true names or hidden personal history.

**Duration:** Facts remain known; the Boon expires when used or at scene end.

**Equipment / acquisition:** A free hand for casting.

</details>

<details><summary>Reading the Weave: complete signature component</summary>

**Action:** Maneuver · **Attribute:** Reason

**Target / range / shape:** One known ongoing magical effect within 5 squares.

Study the effect once per scene. Roll Reason and learn 1/2/3 facts on Weak/Standard/Strong, chosen from its purpose, remaining duration, and source category (creature, object, place or independent spell). Gain 1 Boon to your next roll applying a learned fact this scene. The DA describes what the effect reveals, not unknown true names or hidden personal history.

Your next cancellation roll against that effect this scene also gains 1 Boon. The examination reveals whether a specific remedy exists and the kind of evidence needed to discover it. Use the learned facts with your cancellation abilities or to seek the remedy.

**Duration:** Facts remain known; each Boon expires when used or at scene end.

**Equipment / acquisition:** A free hand for casting.

This is a spell costing 0 SP.

</details>

<details><summary>Open the Circle: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None (no roll)

**Target / range / shape:** Self and willing allies within 2 squares when used.

Each recipient gains 1 Boon to defenses against spells until the start of your next turn. During that time, each recipient gains Stability 2.

**Duration:** Until the start of your next turn.

**Equipment / acquisition:** A free hand for casting.

This is a spell costing 0 SP. If you also know Study the Pattern or Reading the Weave, you can communicate facts already learned with either while creating the ward; others learn exactly the facts you know.

**Frequency:** A new ward replaces your previous ward.

</details>

**Useful actions and improvements:**

- **Read the Evidence I:** Main Action · Reason. Examine one accessible clue within reach; add 1/2/3 progress toward a concrete question about it. Searching a scene instead takes 10 minutes per attempt. You may also recall a relevant fact about a subject or reliable description: 1 minute, Knowledge, 1/2/3 progress toward a question set before rolling.

**Known book spells:** Arcane Bolt (Main Action; SP 0); Mage Hand (Maneuver; SP 1); Magic Missile (Main Action; SP 1); Staying (Main Action; SP 2); Mending (Ritual; SP 0); Grease (Main Action; SP 1); Prestidigitation (Maneuver; SP 0); Unseen Servant — Workshop (Main Action; SP 1); Light (Maneuver; SP 0); Magic Weapon (Main Action; SP 1); Detect Magic (Maneuver; SP 0); Detect Poison and Disease (Ritual; SP 1); Levitate — Objects (Main Action; SP 2); Shatter (Main Action; SP 3); Telekinesis (Main Action; SP 3); Resilient Sphere (Main Action; SP 4); Enlarge/Reduce — Objects (Main Action; SP 1); Unlocking Ways (Ritual; SP 2); Heat Metal — Forge (Ritual; SP 2); Stone Shape — Craft (Ritual; SP 3); Fabricate (Ritual; SP 3); Earthen Transmutations (Ritual; SP 4); Detect Evil and Good (Main Action; SP 1); Find Traps (Main Action; SP 2); See Invisibility (Main Action; SP 2); Identify (Ritual; SP 3); True Seeing (Main Action; SP 3); Analysis (Ritual; SP 4); Enchanted Rope — Rigging (Ritual; SP 1); Dancing Weapon (Main Action; SP 2); Animate Objects (Main Action; SP 2); Low Intelligence (Ritual; SP 3).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 40/20/13/8 casts respectively; with the learned once-per-rest recovery it funds 44/22/14/8. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

- Level 3: Shaping II — Costs 2 DP. You have 1 DP.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
