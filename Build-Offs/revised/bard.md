# Lysa Silverstring: bard after the rewrite

Pinned authored source `bd2c0d0ec0e52a3d870be67d0b8435b8529ffcb6`. These HoL levels 1, 3 and 7 test the same trope over its development. The [original paired build](../bard.md) supplies the researched D&D 2024 level-2 baseline (2025 Artificer). It is not a claim that these later HoL levels numerically match higher D&D levels. Original HoL files are historical evidence, not current legal builds.

## What the rewrite changes

Musical Aid and commanded attacks coexist with emotion/perception utility. Negotiation develops one technique instead of accumulating three unrelated social buttons.

Bardic Inspiration remains an immediate coordinated contribution rather than a banked die. Social objectives still depend on the DA and the situation.

## At a glance

| Measure | HoL 1 | HoL 3 | HoL 7 |
|---|---|---|---|
| HP | 14 | 22 | 38 |
| SP | 7 | 11 | 19 |
| DP spent / total | 10 / 14 | 28 / 31 | 72 / 77 |
| Unspent DP | 4 | 3 | 5 |
| Learned action choices (Main / Maneuver / Reaction) | 1 / 2 / 0 | 2 / 3 / 0 | 4 / 4 / 0 |
| Known book spells (free / paid) | 8 (3 / 5) | 12 (3 / 9) | 33 (4 / 29) |
| Shared reserve: casts at 2 SP | 3 | 5 | 9 |
| Shared reserve: casts at 5 SP | 1 | 2 | 3 |
| Extra SP from one recovery rest | 0 | 0 | 0 |

## Character choices

Ancestry: **Human**; class: **Leader**. Attributes: brawn -1, fortitude +0, agility +0, guile +2, knowledge +1, reason +1. Traits: Ingenuity; The Impossible Streak.

Starting disciplines: influence from culture, mentalism from background, and guard from class. Each is a distinct free field of study; later discipline entry is paid at its class price.

Equipment: Ordinary Melee Weapon (held); Musical Instrument; Travel Pack; Food Bundle; Water Flask; Sleeping Roll. 21 starting coins remain. 

The D&D baseline has **15 HP** and **AC 13 (Leather 11 + DEX 2)** at level 2; HoL uses resistance and player defenses, so these are not equivalent durability measures. Learned action counts exclude universal actions and count signature passive modifications separately; spell choices are listed separately. A learned improvement changes an existing action, not another action button. Actual available actions still depend on equipment, targets and conditions.

Starting DP is **10 + Guile + Knowledge + Reason**, including negative scores, plus explicit ancestry benefits. From level 2 onward, each level grants **6 + new level** DP, plus any applicable ancestry benefits. The completed `influence:negotiation` path costs **1+2+2+3+4+4+5 = 21 DP**; discipline entry, if purchased, is separate. These are sample choices, not an optimizer or evidence of playtest balance.

## Level 1

[Import this ready character](builds/bard-level-1.hol.json). 4 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Emotion I (`emotion:0`) | 1 | 1 |
| Emotion II (`emotion:1`) | 2 | 1 |
| Perception I (`perception:0`) | 1 | 1 |
| Thought I (`thought:0`) | 1 | 1 |
| Make the Case I (`influence:negotiation:1`) | 1 | 1 |
| Make the Case II (`influence:negotiation:2`) | 2 | 1 |
| Steady Voice I (`influence:leadership:1`) | 1 | 1 |
| Sheltering Guard I (`guard:shelter:1`) | 1 | 1 |

**Signature choices:** level 1: Follow My Signal.

<details><summary>Follow My Signal: complete signature component</summary>

**Action:** Passive · **Attribute:** None (no roll)

**Target / range / shape:** Up to two allies within 3 squares that can see or hear your Aid signal.

When you use Aid, you may assist two allies instead of one. Name the task for each and explain how your signal helps. Each gains Aid’s normal 1 Boon to its next matching roll before the start of your next turn. Outside combat, Aid still replaces your own contribution to a group roll.

**Duration:** Each Boon expires when used or the start of your next turn.

**Equipment / acquisition:** None.

Your signal may be speech, signs or music the recipients can perceive.

**Frequency:** One two-recipient Aid on your turn.

</details>

**Useful actions and improvements:**

- **Make the Case I:** Main Action · Reason for a brief appeal, or one exchange for a longer discussion. Present a credible argument or offer to someone who understands you; add 1/2/3 progress toward the social objective established by the DA. Make the Case adds 1/3/4 progress.
- **Steady Voice I:** Maneuver. One willing ally within 4 squares who hears and understands your reassurance reduces Frightened by 1. No roll.
- **Sheltering Guard I:** Maneuver. Choose one willing adjacent ally. Until your next turn starts it gains 1 Boon on ranged defenses while adjacent. Reusing this technique replaces its previous effect. No roll.

**Known book spells:** Vicious Mockery (Main Action; SP 0); Heroism (Main Action; SP 1); Charm Person (Main Action; SP 1); Calm Emotions (Main Action; SP 2); Minor Illusion (Maneuver; SP 0); Silent Image (Main Action; SP 1); Message (Maneuver; SP 0); Comprehend Languages (Ritual; SP 1).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 7/3/2/1 casts respectively; with the learned once-per-rest recovery it funds 7/3/2/1. Zero-SP spells remain limited by actions and circumstances.

## Level 3

[Import this ready character](builds/bard-level-3.hol.json). 3 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Emotion I (`emotion:0`) | 1 | 1 |
| Emotion II (`emotion:1`) | 2 | 1 |
| Perception I (`perception:0`) | 1 | 1 |
| Thought I (`thought:0`) | 1 | 1 |
| Make the Case I (`influence:negotiation:1`) | 1 | 1 |
| Make the Case II (`influence:negotiation:2`) | 2 | 1 |
| Steady Voice I (`influence:leadership:1`) | 1 | 1 |
| Sheltering Guard I (`guard:shelter:1`) | 1 | 1 |
| Make the Case III (`influence:negotiation:3`) | 2 | 3 |
| Common Ground I (`influence:negotiation:4`) | 3 | 3 |
| Common Ground II (`influence:negotiation:5`) | 4 | 3 |
| Common Ground III (`influence:negotiation:6`) | 4 | 3 |
| Emotion III (`emotion:2`) | 2 | 3 |
| Heartstrings (`emotion:3`) | 3 | 3 |

**Signature choices:** level 1: Follow My Signal; level 3: Press the Opening.

<details><summary>Follow My Signal: complete signature component</summary>

**Action:** Passive · **Attribute:** None (no roll)

**Target / range / shape:** Up to two allies within 3 squares that can see or hear your Aid signal.

When you use Aid, you may assist two allies instead of one. Name the task for each and explain how your signal helps. Each gains Aid’s normal 1 Boon to its next matching roll before the start of your next turn. Outside combat, Aid still replaces your own contribution to a group roll.

**Duration:** Each Boon expires when used or the start of your next turn.

**Equipment / acquisition:** None.

Your signal may be speech, signs or music the recipients can perceive.

**Frequency:** One two-recipient Aid on your turn.

</details>

<details><summary>Press the Opening: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None

**Target / range / shape:** One willing ally within 4 squares that can perceive your signal.

Once per scene, the ally makes one Basic Melee or Basic Ranged attack with its actual weapon and ordinary range. The attack uses the ally’s roll and is part of your Maneuver. A Strong melee attack may also push its target 1 square directly away from the ally. A granted attack cannot grant another attack.

**Duration:** Immediate.

**Equipment / acquisition:** None.

</details>

**Useful actions and improvements:**

- **Make the Case I:** Main Action · Reason for a brief appeal, or one exchange for a longer discussion. Present a credible argument or offer to someone who understands you; add 1/2/3 progress toward the social objective established by the DA. Make the Case adds 1/3/4 progress. Once per objective, add 1 extra progress to Make the Case when you answer a listener’s concern with a new fact, concrete offer or demonstration.
- **Steady Voice I:** Maneuver. One willing ally within 4 squares who hears and understands your reassurance reduces Frightened by 1. No roll.
- **Sheltering Guard I:** Maneuver. Choose one willing adjacent ally. Until your next turn starts it gains 1 Boon on ranged defenses while adjacent. Reusing this technique replaces its previous effect. No roll.
- **Common Ground I:** Main Action · Reason for a brief proposal, or one exchange for detailed terms. Propose common terms to two willing negotiating sides who understand you. Roll once; add 1/2/3 progress to each side’s separate acceptance objective. Each side retains its established boundaries. Common Ground adds 1/3/4 progress to each objective. Common Ground can address three willing negotiating sides with separate objectives.

**Known book spells:** Vicious Mockery (Main Action; SP 0); Heroism (Main Action; SP 1); Charm Person (Main Action; SP 1); Calm Emotions (Main Action; SP 2); Minor Illusion (Maneuver; SP 0); Silent Image (Main Action; SP 1); Message (Maneuver; SP 0); Comprehend Languages (Ritual; SP 1); Suggestion (Main Action; SP 2); Fear (Main Action; SP 3); Charm Monster (Main Action; SP 3); Confusion (Main Action; SP 4).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 11/5/3/2 casts respectively; with the learned once-per-rest recovery it funds 11/5/3/2. Zero-SP spells remain limited by actions and circumstances.

## Level 7

[Import this ready character](builds/bard-level-7.hol.json). 5 DP remains available. Starting inventory is carried forward; no unpriced level-up equipment, gold or magic items are assumed.

| Learned purchase | DP paid | Character level |
|---|---:|---:|
| Emotion I (`emotion:0`) | 1 | 1 |
| Emotion II (`emotion:1`) | 2 | 1 |
| Perception I (`perception:0`) | 1 | 1 |
| Thought I (`thought:0`) | 1 | 1 |
| Make the Case I (`influence:negotiation:1`) | 1 | 1 |
| Make the Case II (`influence:negotiation:2`) | 2 | 1 |
| Steady Voice I (`influence:leadership:1`) | 1 | 1 |
| Sheltering Guard I (`guard:shelter:1`) | 1 | 1 |
| Make the Case III (`influence:negotiation:3`) | 2 | 3 |
| Common Ground I (`influence:negotiation:4`) | 3 | 3 |
| Common Ground II (`influence:negotiation:5`) | 4 | 3 |
| Common Ground III (`influence:negotiation:6`) | 4 | 3 |
| Emotion III (`emotion:2`) | 2 | 3 |
| Heartstrings (`emotion:3`) | 3 | 3 |
| A Treaty in Common Words (`influence:negotiation:7`) | 5 | 7 |
| Dreams I (`dreams:0`) | 1 | 7 |
| Dreams II (`dreams:1`) | 2 | 7 |
| Dreams III (`dreams:2`) | 2 | 7 |
| Oneiric Paths (`dreams:3`) | 3 | 7 |
| Lord Dream (`dreams:4`) | 4 | 7 |
| Weird (`dreams:5`) | 4 | 7 |
| Astral Projection (`dreams:6`) | 5 | 7 |
| Perception II (`perception:1`) | 2 | 7 |
| Perception III (`perception:2`) | 2 | 7 |
| Waking Phantasms (`perception:3`) | 3 | 7 |
| Thought II (`thought:1`) | 2 | 7 |
| Thought III (`thought:2`) | 2 | 7 |
| Sheltering Guard II (`guard:shelter:2`) | 2 | 7 |
| Sheltering Guard III (`guard:shelter:3`) | 2 | 7 |
| Shield Canopy I (`guard:shelter:4`) | 3 | 7 |

**Signature choices:** level 1: Follow My Signal; level 3: Press the Opening; level 7: Coordinated Rush.

<details><summary>Follow My Signal: complete signature component</summary>

**Action:** Passive · **Attribute:** None (no roll)

**Target / range / shape:** Up to two allies within 3 squares that can see or hear your Aid signal.

When you use Aid, you may assist two allies instead of one. Name the task for each and explain how your signal helps. Each gains Aid’s normal 1 Boon to its next matching roll before the start of your next turn. Outside combat, Aid still replaces your own contribution to a group roll.

**Duration:** Each Boon expires when used or the start of your next turn.

**Equipment / acquisition:** None.

Your signal may be speech, signs or music the recipients can perceive.

**Frequency:** One two-recipient Aid on your turn.

</details>

<details><summary>Press the Opening: complete signature component</summary>

**Action:** Maneuver · **Attribute:** None

**Target / range / shape:** One willing ally within 4 squares that can perceive your signal.

Once per scene, the ally makes one Basic Melee or Basic Ranged attack with its actual weapon and ordinary range. The attack uses the ally’s roll and is part of your Maneuver. A Strong melee attack may also push its target 1 square directly away from the ally. A granted attack cannot grant another attack.

**Duration:** Immediate.

**Equipment / acquisition:** None.

</details>

<details><summary>Coordinated Rush: complete signature component</summary>

**Action:** Main Action · **Attribute:** None (no roll)

**Target / range / shape:** Two willing allies within 4 squares that can perceive your signal.

Each ally may move up to 3 squares without provoking, then make one Basic Melee or Basic Ranged attack against a legal target with its actual weapon. Resolve one ally completely before the other. On a Strong melee result, the attack may also push its target 1 directly away from the attacking ally.

**Duration:** Immediate movement and attacks.

**Equipment / acquisition:** None.

Use once per scene. Granted attacks cannot grant further attacks.

</details>

**Useful actions and improvements:**

- **Make the Case I:** Main Action · Reason for a brief appeal, or one exchange for a longer discussion. Present a credible argument or offer to someone who understands you; add 1/2/3 progress toward the social objective established by the DA. Make the Case adds 1/3/4 progress. Once per objective, add 1 extra progress to Make the Case when you answer a listener’s concern with a new fact, concrete offer or demonstration.
- **Steady Voice I:** Maneuver. One willing ally within 4 squares who hears and understands your reassurance reduces Frightened by 1. No roll.
- **Sheltering Guard I:** Maneuver. Choose one willing adjacent ally. Until your next turn starts it gains 1 Boon on ranged defenses while adjacent. Reusing this technique replaces its previous effect. No roll. Sheltering Guard can protect two adjacent allies. Sheltering Guard also gives each protected ally Stability 1 while adjacent.
- **Common Ground I:** Main Action · Reason for a brief proposal, or one exchange for detailed terms. Propose common terms to two willing negotiating sides who understand you. Roll once; add 1/2/3 progress to each side’s separate acceptance objective. Each side retains its established boundaries. Common Ground adds 1/3/4 progress to each objective. Common Ground can address three willing negotiating sides with separate objectives.
- **A Treaty in Common Words:** Main Action · 30 minutes · Reason. With willing representatives of up to three sides and a working language, interpreter or shared reference text, formulate one concrete agreement. Roll once; add 3/5/7 progress to each side’s acceptance objective. On completion the DA states that side’s commitments and known reservations plainly. A shared reference permits simple terms; complex terms need adequate translation. No side accepts impossible terms, and the agreement is not magical enforcement.
- **Shield Canopy I:** Maneuver. Until your next turn starts, you and up to three willing adjacent allies reduce ranged attack damage by 2 after resistance while they remain adjacent. Reusing this technique replaces its previous effect. No roll.

**Known book spells:** Vicious Mockery (Main Action; SP 0); Heroism (Main Action; SP 1); Charm Person (Main Action; SP 1); Calm Emotions (Main Action; SP 2); Minor Illusion (Maneuver; SP 0); Silent Image (Main Action; SP 1); Message (Maneuver; SP 0); Comprehend Languages (Ritual; SP 1); Suggestion (Main Action; SP 2); Fear (Main Action; SP 3); Charm Monster (Main Action; SP 3); Confusion (Main Action; SP 4); Dreams (Maneuver; SP 0); Sleep (Main Action; SP 1); Dream Message (Ritual; SP 1); Phantasmal Force (Main Action; SP 2); Hypnotic Pattern (Main Action; SP 2); Phantasmal Killer (Main Action; SP 3); Dream (Ritual; SP 3); Sign of Sleep (Ritual; SP 4); Lord Dream (Ritual; SP 5); Weird (Main Action; SP 5); Astral Projection (Ritual; SP 6); Disguise Self (Main Action; SP 1); Mirror Image (Main Action; SP 2); Invisibility (Main Action; SP 2); Major Image (Main Action; SP 3); Greater Invisibility (Main Action; SP 3); Hallucinatory Terrain (Ritual; SP 4); Detect Thoughts (Main Action; SP 1); Tongues (Main Action; SP 2); Sending (Ritual; SP 2); Telepathic Bond (Ritual; SP 3).

**Spell output:** Alternative uses of the same reserve, not simultaneous allocations. Assumes SP is spent before recovery; time, spell-specific limits, components and maintained actions still apply. Signature spells and conditional discounts are described separately. At costs 1/2/3/5 SP, the full reserve funds 19/9/6/3 casts respectively; with the learned once-per-rest recovery it funds 19/9/6/3. Zero-SP spells remain limited by actions and circumstances.

## Deferred choices

Every planned choice was affordable when scheduled.

## Playtest questions

- Can a player find the usual Main Action, Maneuver and Reaction without searching the full learned list?
- Does the level-3 development change an interesting decision, and is the level-7 mastery worth its completed 21-DP path?
- Which spell, positional restriction or equipment requirement was forgotten during play?
- Does the resource tradeoff preserve the trope over a full adventuring day rather than only one ideal turn?
