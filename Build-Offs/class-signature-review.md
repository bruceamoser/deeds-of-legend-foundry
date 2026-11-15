# Class signature review — November 15, 2026

Review scope: all **90 current signatures**, three choices at each of levels 1, 3 and 7 for each of ten classes. Baseline is the published Workshop revision `27200945e033ca3d2e9eabeed312d9ed0f7911a1`, including the current playtest overlay. This is a review, not a mechanical patch or a claim that every ability is fully automated. The book and native Foundry are separate follow-through work.

The signatures mostly survived the revision. There is one clear always-hit wording remnant, several classification/selection ambiguities, and a handful of strong investment/value comparisons worth playtesting. None of the findings justifies silently removing an approved signature or charging SP merely because its fiction is magical.

## Authority and review method

- [Current character decisions](../docs/workshop-playtest-287.md) and [class prices/learning decisions](../docs/workshop-learning-295.md) supersede older staged-creation and flat-price prose.
- [Published signature/basic-action catalog](../static/data/forge.json), [embedded journals](../static/data/forge-journals.json), and [browser override](../src/rules/forge-playtest-catalog.mjs) establish actual web text. Signature records are unchanged by that override.
- [Creation/advancement validation](../src/rules/forge-character.mjs) grants one signature at each milestone, rather than charging DP. [Workshop reference mapping](../src/rules/workshop-forge-catalog.mjs) and [sheet rendering](../web/workshop.mjs) distinguish spellbook spells from ordinary signature records.
- Checked action cost, attribute, targets, equipment, range, duration, limits, resources, damage/conditions, universal-action overlap, learned-branch overlap, and whether earlier signatures are required. Read all 90 full effects, not just their names.

**Compatible** means no contradiction found in this static rules review. It is not a balance certificate or proof of Foundry automation. **Clarify** means a player-facing rule, selector, or classification needs a decision. **Balance** identifies a meaningful playtest comparison, not an established defect. **Editorial** removes obsolete wording without changing the intended outcome.

## Findings and recommended decisions

### S01 — Always-hit wording remains in Mark the Quarry

The signature grants Basic Ranged and then says the target is marked “if it hits.” A legal attack already hits. Say that after resolving the Basic Ranged attack, the target is marked. Damage immunity or resistance need not prevent the mark unless the designer explicitly wants a damage-dependent trigger. Preserve the one-day duration, once/day use and other effects for the build comparison.

### S02 — Two Unbalanced choices depend on a particular earlier signature

**Pain Feeds the Fire** and **Deathless Rage** only function while **Go Berserk** is active. The source Unbalanced description calls each signature an independent choice; the current browser shortens that introduction, but `forgeAdvancement` still accepts any of the milestone's listed choices without checking the earlier pick. A character who chose Charge or Grab and Hurl can therefore select a signature it cannot currently use.

Deathless Rage's 0HP reprieve is a previously approved rule; this audit does not reopen or replace it. Recommended immediate direction: tell players plainly in the selector that the choice works during Go Berserk. Then Bruce should choose whether to keep these as deliberate dependent choices, allow a defined retraining route, or make each self-contained. Do not automatically grant Go Berserk or invent a new prerequisite gate. The build-offs use Go Berserk where rage is the intended identity.

### S03 — Pocket Sand needs both roll perspectives

Pocket Sand triggers when an enemy makes an attack or skill roll and applies a Bane. Against a player, the normal procedure is a player defense roll, so an ordinary enemy attack does not satisfy the trigger literally. Specify an enemy attack declaration before the corresponding roll; give 1 Bane when the enemy's roll is made, or 1 Boon to the player's defense when that player rolls. Keep the post-resolution Blinded effect and once/scene limit. The Unseen Procession's next-attack Bane should use the same standard perspective conversion, though its trigger does not have this problem.

### S04 — Establish which magical signatures count as spells

The new spell system makes this distinction consequential: free hands, casting opportunity attacks, Counterspell/wards, spell-defense benefits, and the one-sustained-spell limit. The signature catalog has action/attribute/effect fields, but no universal classification that answers those interactions. Magical fiction alone is not enough to decide. Examples include Deliberate Spark, the Odd's spirit/portal abilities, Radiant Threshold, The Fold and Warden's nature attacks.

**The Fold** already sustains for a Maneuver without SP: that agrees with the new upkeep cost. The unresolved question is whether it occupies the same single sustain slot as a spell. The Workshop's sustain lookup currently searches learned spellbook spells, so it will not track The Fold as that slot automatically. **Choose the Edge** explicitly duplicates a single-target rolled spell while paying once; clarify that two casts of a sustained spell still obey the one-spell limit unless this signature intentionally overrides it.

**Out of Body** uses “mundane attacks” immunity rather than a named damage immunity; define what makes an attack mundane/magical before applying that exception. A physical damage type by itself does not answer it. **The Shepherd's Call** is a ten-minute magical working, so give it the consistent Ritual timing label if it is intended as spell casting. Ordinary medical treatment and investigation are not automatically Rituals merely because they take time.

Recommendation: add a small, explicit spell/other-magical/ordinary classification only after deciding these interactions. Keep listed costs. Mend and Triage already spend SP1/SP2; the current sheet derives these costs from their text, so this review does **not** claim the app forgets their SP charges.

### S05 — Go Berserk uses untyped DR

The rage grants DR1. Current armor language is physical resistance, with highest-source use and a cap of3. If physical resistance1 is intended, say so. That makes it clear that light armor1 and rage1 do not total2. Do not interpret this as resistance1 to every damage type. This is a wording decision to confirm, not permission to change the value or stack it.

### S06 — Arcane Deflection needs an exact damage reference

The reaction is declared before defending, then grants no spell damage and pushes using the spell's “raw damage before your defense or resistance.” Damage is determined by the resolution band, so “before your defense” does not identify a unique number in an NPC defense-outcome table. Specify the damage from the triggering resolved outcome before reductions, or a different explicit quantity if intended. Its promise of no damage is also a specific exception to the ordinary attack minimum and should be worded as preventing that event, not reducing it below1 accidentally. Keep collateral push/collision effects distinct.

### S07 — Diagnose the Failure should resolve a reroll once

Weak results already cause damage or progress. State that the reroll replaces the original result before applying its effects, and say whether the reroll must be kept. Otherwise a player could read the reaction as resolving the Weak effect and then gaining another attack/progress effect. A shared reroll convention could resolve this for the entire book; do not assume failure means “nothing happened.”

### S08 — Long nonmagical work should show its real time

Make the Connection and Test the Hypothesis are indexed as Main Action but require one minute in the body. Common rules already prevent finishing timed work in one combat action; therefore this is a compact-display clarity issue, not permission to make them instantaneous. Put “1 minute” alongside their names/timing. Mend the Wound is ten-minute treatment and should remain treatment, not become a Ritual merely for visual consistency.

### S09 — Call the Wild needs a command budget

The signature deliberately calls a real living beast, permits healing, and gives the DA control until a Maneuver commands it. That is an explicit exception to ordinary summoned energy forms, not necessarily obsolete text. However, it does not specify whether the Maneuver grants a full beast turn, Main+Maneuver, or the universal Maneuver-command allowance (Maneuver+movement). Decide that budget, timing, and number of commands. State whether any tether applies. Do not quietly impose the ordinary summoned-form disappearance rule on a real creature that the signature says remains for the scene.

### S10 — Test signature value against paid branches and other classes

These are comparisons to investigate, not numerical changes in this review:

- **Reckless Charge:** Basic Melee2/3/5 plus1/2/3 gives **3/5/8** as a Maneuver, leaving a Main Action. The defense Bane and approach restriction matter, but this is a major level1 action-economy benefit.
- **Angle of Attack:** a free level1 signature supplies **3/5/7** with Knowledge. A five-DP Measured CutIII gives **3/4/6**, a Strong movement option and Strong Bleeding1. Knowledge also improves starting DP and Intellect SP, creating very efficient investment. Compare whole-turn and utility value, not only damage.
- **Study the Pattern:** automatic origin/purpose/duration/ending knowledge in a Maneuver can supersede much of paid divination play. Identify is a3SP Ritual giving1/2/3 item facts. Their legal targets differ; retain those differences in any trial.
- **Stand Together:** two defense Boons for self and adjacent ally are much broader than early ranged-only Sheltering Guard. A signature should be distinctive, but verify this leaves a reason to learn the guard path.
- **A Better Angle** versus **Press the Opening:** same level3 Maneuver slot, but the former supplies safe movement plus a basic melee **or ranged** attack; the latter is melee-only with Strong push1. Measure whether the push compensates for that flexibility.
- **Open the Way:** repeated Main Action2/3/5 progress, no sound and no trace compete with the paid level3 Open under Pressure endpoint's1/2/3 progress and prior examination requirement. This can be a signature-strength exception, but make the opportunity cost deliberate.

The build-offs should use existing costs and outcomes and record these advantages. Do not nerf a class mid-comparison or declare a build equivalent merely because it can produce damage.

### Cross-reference remnants outside the signature records

The current magic journal still begins with flat1DP magical-discipline entry, and the recovery journal retains the old1+1+1+3 startingSP formula; the overlay updates other chapters but not those passages. Both conflict with current class prices/ancestry-and-attribute SP. They are reference cleanup work, not proof that the actual character calculations use those obsolete values.

## Complete signature matrix

The link on each name points to its actual catalog record. Stable IDs remain visible so renamed signatures can be traced to their source.

### Arcanist

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Bent Trajectory](../static/data/forge.json#L13205)<br>`ability-signature-arcanist-bent-trajectory` | Compatible | Changes origin/cover, explicitly keeps caster range; a useful caster identity without another attack. |
| 1 | [Deliberate Spark](../static/data/forge.json#L13268)<br>`ability-signature-arcanist-deliberate-spark` | Clarify S04 | Distinct no-roll Maneuver push with collision risk; decide magical-signature classification. |
| 1 | [Study the Pattern](../static/data/forge.json#L13331)<br>`ability-signature-arcanist-study-the-pattern` | Balance S10 | Automatic origin/purpose/duration/ending information is much broader and faster than paid Identify. |
| 3 | [Siphon Cast](../static/data/forge.json#L13394)<br>`ability-signature-arcanist-cast-and-scatter` | Compatible | Main rolled spell trigger, Bane, ended turn and temporary absence are explicit; no extra SP cost is implied. |
| 3 | [Create a Window](../static/data/forge.json#L13457)<br>`ability-signature-arcanist-leave-a-window` | Compatible | Reaction supplies one ally one movement/attack window, not another action; legal squares and duration are explicit. |
| 3 | [Arcane Deflection](../static/data/forge.json#L13520)<br>`ability-signature-arcanist-arcane-deflection` | Clarify S06 | Specify which resolved damage value drives the push and make the zero-damage exception explicit. |
| 7 | [Folded Aegis](../static/data/forge.json#L13583)<br>`ability-signature-arcanist-fold-the-distance` | Compatible | Explicit training-free resistance3 exception, once/day; highest matching resistance and cap are stated. |
| 7 | [Choose the Edge](../static/data/forge.json#L13646)<br>`ability-signature-arcanist-choose-the-edge` | Clarify S04 | Paid-once double casting is explicit; classify interaction with the one-sustained-spell limit. |
| 7 | [Open the Circle](../static/data/forge.json#L13709)<br>`ability-signature-arcanist-open-the-circle` | Compatible | One Maneuver for short-lived spell-defense Boon and Stability; strongest-source rules prevent stacking. |

### Blade

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Reckless Charge](../static/data/forge.json#L13772)<br>`ability-signature-blade-cut-and-turn` | Balance S10 | Basic Melee2/3/5 plus1/2/3 gives3/5/8 as a Maneuver, leaving Main available; defense Bane is the tradeoff. |
| 1 | [Cleave](../static/data/forge.json#L13835)<br>`ability-signature-blade-pressure-point` | Compatible | All adjacent creatures including allies,1 damage plus movement/collisions; distinct from learned Sweeping Blade. |
| 1 | [Measured Guard](../static/data/forge.json#L13898)<br>`ability-signature-blade-measured-guard` | Compatible | Reaction defense Boon with Strong-only Basic Melee counter; inherited weapon requirement applies. |
| 3 | [Twitch Reflexes](../static/data/forge.json#L13961)<br>`ability-signature-blade-sweeping-entry` | Compatible | Explicit additional Reaction is a valid specific exception to the ordinary budget. |
| 3 | [Return Stroke](../static/data/forge.json#L14024)<br>`ability-signature-blade-return-stroke` | Compatible | Standard/Strong defense trigger and weapon requirement define a reliable counterattack distinct from Measured Guard. |
| 3 | [Not So Fast](../static/data/forge.json#L14087)<br>`ability-signature-blade-fell-the-balance` | Compatible | Entrance trigger, Basic Melee and explicit movement stop are clear; inherited melee-weapon requirement applies. |
| 7 | [Dance Through Steel](../static/data/forge.json#L14150)<br>`ability-signature-blade-dance-through-steel` | Compatible | Up to3 distinct targets, least-favorable roll,4/4/6 damage; complete one-attack procedure. |
| 7 | [Relentless Pursuit](../static/data/forge.json#L14232)<br>`ability-signature-blade-relentless-pursuit` | Compatible | Reaction pursuit then basic attack plus Slowed; normal free-attack non-chaining rule still applies. |
| 7 | [Get Out of Here](../static/data/forge.json#L14295)<br>`ability-signature-blade-perfect-placement` | Compatible | Free hand/size limits and directional throw explicitly differ from basic Push; collisions remain normal. |

### Intellect

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Spot the Leverage](../static/data/forge.json#L14358)<br>`ability-signature-intellect-spot-the-leverage` | Compatible | Maneuver information plus one-use allied Boons, limited once/target/scene; objective progress terminology fits. |
| 1 | [Make the Connection](../static/data/forge.json#L14421)<br>`ability-signature-intellect-make-the-connection` | Clarify S08 | One-minute procedure is clear in body but indexed Main Action; expose actual duration in compact action views. |
| 1 | [Angle of Attack](../static/data/forge.json#L14488)<br>`ability-signature-intellect-prepared-explanation` | Balance S10 | Free Knowledge3/5/7 attack competes with a5-DP martial branch while Knowledge also raises DP and classSP. |
| 3 | [A Better Angle](../static/data/forge.json#L14551)<br>`ability-signature-intellect-a-better-angle` | Balance S10 | Repeatable Maneuver grants ally3-square safe move and basic melee/ranged attack; compare other ally-action signatures. |
| 3 | [Diagnose the Failure](../static/data/forge.json#L14614)<br>`ability-signature-intellect-diagnose-the-failure` | Clarify S07 | State reroll replaces original outcome and resolves once; avoid duplicate always-hit damage/progress. |
| 3 | [Predict the Motion](../static/data/forge.json#L14677)<br>`ability-signature-intellect-predict-the-motion` | Compatible | Explicit Knowledge substitution for Brawn/Agility physical defense; no extra attribute bonus is granted. |
| 7 | [A Route for Everyone](../static/data/forge.json#L14740)<br>`ability-signature-intellect-a-route-for-everyone` | Compatible | Main grants safe reposition and next-defense Boon to four recipients; unique endpoints stated. |
| 7 | [Test the Hypothesis](../static/data/forge.json#L14803)<br>`ability-signature-intellect-test-the-hypothesis` | Clarify S08 | One-minute evidence-based planning works; compact Main Action label must retain time requirement. |
| 7 | [Shatter the Guard](../static/data/forge.json#L14870)<br>`ability-signature-intellect-expose-the-mechanism` | Compatible | Knowledge attack and one resistance reduction/target/scene fit current system; does not remove immunity. |

### Leader

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Follow My Signal](../static/data/forge.json#L14933)<br>`ability-signature-leader-follow-my-signal` | Compatible | Improves universal Aid to two recipients with clear signaling range; does not replace allies’ actions. |
| 1 | [Lead the Way](../static/data/forge.json#L14996)<br>`ability-signature-leader-lead-the-step` | Compatible | Maneuver extends normal movement to nearby allies,2-square cap and ordinary opportunity rules. |
| 1 | [Stand Together](../static/data/forge.json#L15059)<br>`ability-signature-leader-stand-together` | Balance S10 | Repeatable2 defense Boons to self+ally outperforms early Sheltering Guard; adjacency is its main constraint. |
| 3 | [Press the Opening](../static/data/forge.json#L15122)<br>`ability-signature-leader-press-the-opening` | Balance S10 | Valid melee-only ally attack; benchmark against Intellect A Better Angle at same milestone. |
| 3 | [Lead by Example](../static/data/forge.json#L15185)<br>`ability-signature-leader-orderly-withdrawal` | Compatible | Guile weapon attack plus explicit choices fits; active choice is intentional rather than an automatic branch upgrade. |
| 3 | [Blow the Horn](../static/data/forge.json#L15255)<br>`ability-signature-leader-hold-your-nerve` | Compatible | Maneuver group fear/daze follows condition decay; on-turn Dazed timing is an approved feature. |
| 7 | [Coordinated Rush](../static/data/forge.json#L15318)<br>`ability-signature-leader-coordinated-rush` | Compatible | Main grants sequential moves/basic attacks to two allies; free attacks do not trigger further free attacks. |
| 7 | [Refuse the Rout](../static/data/forge.json#L15381)<br>`ability-signature-leader-refuse-the-rout` | Compatible | Explicit multi-recipient condition reduction, defense Boon and movement; ordinary-condition boundary stated. |
| 7 | [Watch the Rear](../static/data/forge.json#L15444)<br>`ability-signature-leader-watch-the-rear` | Compatible | Reaction2 defense Boons plus post-attack safe movement; ally must remain able. |

### Odd

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Borrowed Tongue](../static/data/forge.json#L15507)<br>`ability-signature-odd-sideways-thinking` | Compatible | Temporary spoken-language access explicitly excludes literacy; spirit flavor need not grant another discipline. |
| 1 | [Use Their Voice](../static/data/forge.json#L15570)<br>`ability-signature-odd-useful-interruption` | Compatible | Maneuver distraction grants ally movement/next-attack Boon; no enemy roll or compelled action beyond turning. |
| 1 | [Pocket Sand](../static/data/forge.json#L15633)<br>`ability-signature-odd-always-a-way-around` | Clarify S03 | Enemy-roll wording misses usual player-defense resolution; give the equivalent defense Boon and exact trigger. |
| 3 | [Foul Wind](../static/data/forge.json#L15699)<br>`ability-signature-odd-unlikely-assistant` | Clarify S04 | Poison attack with ally-prone avoidance is mechanically complete; classify whether this is a spell or ordinary signature. |
| 3 | [A Door Where There Wasn’t](../static/data/forge.json#L15762)<br>`ability-signature-odd-change-the-question` | Clarify S04 | Nonmagical barrier/one-square thickness and self-only crossing are explicit; magical classification affects wards/counterspells. |
| 3 | [Out of Body](../static/data/forge.json#L15825)<br>`ability-signature-odd-wrong-place-for-that` | Clarify S04 | Mundane-attack immunity needs a defined test; spirit movement/Manifest limits are otherwise explicit. |
| 7 | [Borrowed Life](../static/data/forge.json#L15903)<br>`ability-signature-odd-strange-but-effective` | Compatible | Scene-limited3 Boons using chosen expertise, within normal cap; not a numerical skill grant. |
| 7 | [The Unseen Procession](../static/data/forge.json#L15966)<br>`ability-signature-odd-an-unexpected-exit` | Compatible | One-use allied defense/enemy attack modifiers and short movement fit; apply attack Bane as defense Boon when players defend. |
| 7 | [Not Quite Yet](../static/data/forge.json#L16029)<br>`ability-signature-odd-one-last-remark` | Compatible | Uses third-failure, stabilization and lifetime Grit; specific delayed death exception is explicit. |

### Protector

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [In the Gap](../static/data/forge.json#L16092)<br>`ability-signature-protector-set-your-feet` | Compatible | Maneuver creates conditional frontage while standing/conscious; no free attack or armor assumption. |
| 1 | [Step Between](../static/data/forge.json#L16155)<br>`ability-signature-protector-between-them` | Compatible | Pre-roll single-target swap and legal-square check; distinct position-changing version of later Take the Blow. |
| 1 | [Hand on the Collar](../static/data/forge.json#L16218)<br>`ability-signature-protector-close-the-gap` | Compatible | Willing-only Pull toward self, safe movement and adjacent endpoint match forced-movement definitions. |
| 3 | [Break the Charge](../static/data/forge.json#L16281)<br>`ability-signature-protector-break-their-advance` | Compatible | Reaction trigger and Brawn2/2/4 attack with higher-band control; no outdated hit check. |
| 3 | [Over My Body](../static/data/forge.json#L16344)<br>`ability-signature-protector-shelter-the-fallen` | Compatible | Already updated/approved:0HP and two failure marks, once/scene intervention, stay1HP. Preserve ruling. |
| 3 | [Make a Refuge](../static/data/forge.json#L16407)<br>`ability-signature-protector-make-a-refuge` | Compatible | Once/scene Maneuver reposition plus short defense/Stability benefits; same-source defenses do not add. |
| 7 | [The Long Road](../static/data/forge.json#L16470)<br>`ability-signature-protector-unbroken-passage` | Compatible | Safe group movement and carrying a Dying ally use current recovery vocabulary. |
| 7 | [Take the Wound](../static/data/forge.json#L16533)<br>`ability-signature-protector-defiant-rescue` | Compatible | Despite evocative name, text redirects damage/conditions and uses Dying, not the removed wound subsystem. |
| 7 | [Radiant Threshold](../static/data/forge.json#L16596)<br>`ability-signature-protector-drive-back-the-circle` | Clarify S04 | Persistent radiant zone has once/turn damage limit; classify magical signature/spell interactions. |

### Shadow

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Blade in the Back](../static/data/forge.json#L16659)<br>`ability-signature-shadow-soft-landing` | Compatible | Agility conditional melee attack with additive Bleeding; strong rogue trope and clear equipment requirement. |
| 1 | [Fade Behind](../static/data/forge.json#L16722)<br>`ability-signature-shadow-fade-behind` | Compatible | Explicitly combines universal Disengage with ordinary Hide under concealment; not redundant with either alone. |
| 1 | [Fast Talk](../static/data/forge.json#L16785)<br>`ability-signature-shadow-turn-their-eye` | Compatible | Maneuver social progress2/3/5 retains DA-set objective and listener limits; global new-contribution rule still applies. |
| 3 | [Hamstring](../static/data/forge.json#L16848)<br>`ability-signature-shadow-strike-and-vanish` | Compatible | Signature Agility/ranged-capable variant differs from Arms Hamstring branch; distinguish by class label in catalogs. |
| 3 | [Open the Way](../static/data/forge.json#L16911)<br>`ability-signature-shadow-open-the-way` | Balance S10 | Main Action2/3/5 progress plus no trace strongly exceeds learned Open under Pressure; compare investment/value. |
| 3 | [Read the Room](../static/data/forge.json#L16974)<br>`ability-signature-shadow-pass-the-guard` | Compatible | One intent plus tiered social Boon, once/scene/creature; does not grant mind control. |
| 7 | [The Half-Second](../static/data/forge.json#L17037)<br>`ability-signature-shadow-exploit-confusion` | Compatible | Explicit action interruption on Standard/Strong; weapon still needs legal reach/range under common rules. |
| 7 | [One with the Dark](../static/data/forge.json#L17100)<br>`ability-signature-shadow-unseen-passage` | Compatible | Dim-light/darkness requirement, concealment plausibility and3-Boon cap are stated. |
| 7 | [The Cutting Word](../static/data/forge.json#L17163)<br>`ability-signature-shadow-leave-no-pursuit` | Compatible | Scene-limited control Maneuver uses ordinary condition decay and explicit Reaction restriction. |

### Shepherd

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Mend](../static/data/forge.json#L17226)<br>`ability-signature-shepherd-gentle-return` | Compatible | SP1, free hand,3/6/9HP, Life resistance and dying healing all use current rules; privileged healer signature is deliberate. |
| 1 | [Steady Voice](../static/data/forge.json#L17289)<br>`ability-signature-shepherd-ease-the-burden` | Compatible | Maneuver Frightened/Dazed care exceeds universal condition care in a useful healer niche. |
| 1 | [Come Back](../static/data/forge.json#L17352)<br>`ability-signature-shepherd-hear-me-still` | Compatible | Reaction movement plus stabilization improves universal adjacent Maneuver, with current tallies and scars. |
| 3 | [Triage](../static/data/forge.json#L17415)<br>`ability-signature-shepherd-careful-transfer` | Compatible | SP2 and one/two-target healing use Life resistance/maxHP; no obsolete wounds or free recharge. |
| 3 | [Mend the Wound](../static/data/forge.json#L17478)<br>`ability-signature-shepherd-quiet-the-tremor` | Compatible | Name is flavor; actual effect isHP treatment, shared first-aid allowance and temporary condition care. |
| 3 | [The Fold](../static/data/forge.json#L17541)<br>`ability-signature-shepherd-bring-them-near` | Clarify S04 | Maneuver-only sustain already fits new zeroSP upkeep; decide whether it shares the one-spell sustain slot. |
| 7 | [The Shared Cup](../static/data/forge.json#L17604)<br>`ability-signature-shepherd-restore-composure` | Compatible | Conserves HP, donor stays positive, explicit Life-resistance exception and current death-tally clearing. |
| 7 | [The Shepherd's Call](../static/data/forge.json#L17667)<br>`ability-signature-shepherd-a-hand-in-darkness` | Clarify S04 | Ten-minute magical sigil should have consistent Ritual classification; specific once/day stay1HP effect is clear. |
| 7 | [Not My Flock](../static/data/forge.json#L17730)<br>`ability-signature-shepherd-shared-resolve` | Clarify S04 | Scene-limited radiant attack/control is coherent; decide spell-like triggers rather than inferring from divine flavor. |

### Unbalanced

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Charge](../static/data/forge.json#L17793)<br>`ability-signature-unbalanced-shoulder-through` | Compatible | Movement and2/3/5 attack pluspush require2-square approach; normal collisions/opportunity attacks. |
| 1 | [Go Berserk](../static/data/forge.json#L17856)<br>`ability-signature-unbalanced-wild-approach` | Clarify S05 | Current ending-onDying and attack/defense tradeoff work; replace untyped DR1 with explicit damage type if physical intended. |
| 1 | [Grab and Hurl](../static/data/forge.json#L17919)<br>`ability-signature-unbalanced-laugh-at-the-fall` | Compatible | Weak is Grappled, higher results are throws; treat as its printed control action rather than inventing damage on every band. |
| 3 | [Rampage](../static/data/forge.json#L17982)<br>`ability-signature-unbalanced-crush-the-barrier` | Compatible | Explicit Main+movement expenditure, once/scene area impact and final attack; fixed barriers use common collision rules. |
| 3 | [Pain Feeds the Fire](../static/data/forge.json#L18045)<br>`ability-signature-unbalanced-raging-recoil` | Clarify S02 | Only works with Go Berserk, although signature milestones are otherwise advertised as independent. |
| 3 | [Over the Top](../static/data/forge.json#L18108)<br>`ability-signature-unbalanced-fling-the-captive` | Compatible | Willing ally throw, safe landing and explicit granted Basic Melee; free-attack non-chaining still applies. |
| 7 | [Earthbreaker](../static/data/forge.json#L18171)<br>`ability-signature-unbalanced-scatter-the-line` | Compatible | Once/scene area damage/push/prone; doubles object damage but uses current object HP/resistance procedure. |
| 7 | [Deathless Rage](../static/data/forge.json#L18234)<br>`ability-signature-unbalanced-break-their-grip` | Clarify S02 | Current0HP reprieve was explicitly approved; retain it, but expose dependency on Go Berserk in selection. |
| 7 | [The Cannonball](../static/data/forge.json#L18297)<br>`ability-signature-unbalanced-crash-down` | Compatible | Self-damage and conditions are explicit costs; current damage resistance/minimum rules apply by event type. |

### Warden

| Level | Signature / stable ID | Finding | Review note |
|---:|---|---|---|
| 1 | [Steady Aim](../static/data/forge.json#L18360)<br>`ability-signature-warden-keep-the-quarry-close` | Compatible | Maneuver aim ends on movement; partial-cover exception is meaningful under current banes/boons. |
| 1 | [Beast Speech](../static/data/forge.json#L18423)<br>`ability-signature-warden-read-the-passing` | Compatible | Scene communication with ordinary animal limits; captures nature utility without mandatory pet mechanics. |
| 1 | [Twin Strike](../static/data/forge.json#L18486)<br>`ability-signature-warden-follow-my-footsteps` | Compatible | Two light weapons, two1/2/3 attacks and defense Boon; dual wield identity without extra Main Action. |
| 3 | [Volley](../static/data/forge.json#L18549)<br>`ability-signature-warden-stay-on-the-scent` | Compatible | Single worst-modifier roll, individual resistance, once/creature rule; current multi-target procedure. |
| 3 | [Entangling Growth](../static/data/forge.json#L18612)<br>`ability-signature-warden-through-bramble-and-stone` | Clarify S04 | At-will Knowledge attack/control is complete; classify magical signature interactions. |
| 3 | [The Green Spear](../static/data/forge.json#L18675)<br>`ability-signature-warden-a-watchful-rest` | Clarify S04 | At-will Knowledge3/5/7 attack is complete; free-hand/casting interactions need explicit magical classification. |
| 7 | [Mark the Quarry](../static/data/forge.json#L18738)<br>`ability-signature-warden-turn-the-hunt` | Editorial S01 | Remove obsolete if-it-hits qualifier; Basic Ranged always hits a legal target. |
| 7 | [Call the Wild](../static/data/forge.json#L18801)<br>`ability-signature-warden-bring-them-through` | Clarify S09 | Real-beast exception is explicit, but a Maneuver command does not define its granted action budget. |
| 7 | [Death from the Blind Spot](../static/data/forge.json#L18864)<br>`ability-signature-warden-know-what-you-hunt` | Compatible | Main+movement, reachable endpoint, melee weapon, prior tracking/hit and once/scene limits fit. |

## Useful level1 signature candidates for the trope comparisons

These are candidates, not mandatory class equivalences. A build still needs legal origins, attributes, discipline choices, paid learning and equipment.

| D&D trope | HoL signature candidate | What it captures / what remains |
|---|---|---|
| Barbarian | Unbalanced — Go Berserk | Rage with an offensive/defensive tradeoff; confirm physical meaning ofDR1. |
| Bard | Leader — Follow My Signal; Shadow — Fast Talk | Party encouragement or social improvisation; music is character expression unless a learned feature says otherwise. |
| Cleric | Shepherd — Mend | Resource-limited divine healing; add relevant spellbooks for utility/control. |
| Druid | Warden — Beast Speech; Shepherd — Mend | Nature communion or caretaker; neither supplies Wild Shape, which must be honestly evaluated elsewhere. |
| Fighter | Blade — Measured Guard or Reckless Charge | Trained counterfighter or aggressive action economy; learned Arms/Armor establish equipment role. |
| Monk | Blade — Measured Guard, or Unbalanced — Grab and Hurl | Partial martial movement/control. Basic Melee specifically needs a weapon, so do not rename it unarmed to fake equivalence. |
| Paladin | Protector — Step Between | Protecting companions; holy attack/healing needs learned magic or another supported feature. |
| Ranger | Warden — Steady Aim, Beast Speech or Twin Strike | Archer, naturalist or dual-wielder; only one signature is free atlevel1. |
| Rogue | Shadow — Blade in the Back or Fade Behind | Opportunistic attack or elusive maneuvering; learned Subterfuge fills the other role. |
| Sorcerer | Arcanist — Bent Trajectory | Personal shaping of magic; no automatic metamagic equivalence or bonus spell choices. |
| Warlock | Odd — Borrowed Tongue, or Arcanist — Bent Trajectory | Otherworldly relationship or unusual blasting; neither recreates pact-resource refresh. |
| Wizard | Arcanist — Study the Pattern | Analytical magical expertise; books and SP supply actual repertoire. |
| Artificer | Intellect — Angle of Attack or Make the Connection | Intelligence-led fighting/investigation; tools, crafting and magical item creation need separate support. |

Review completion does not mean findings are resolved. Keep issue#296 open until Bruce decides the clarifications and any mechanical adjustments, then update the browser and book in their authorized sequence.
