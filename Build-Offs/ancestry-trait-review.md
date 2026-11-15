# Ancestry trait review

Reviewed November 15, 2026 for #296, against the published Workshop baseline `27200945e033ca3d2e9eabeed312d9ed0f7911a1`. This is a design/content audit, not an instruction to change mechanics. **All 50 currently selectable traits, five for each of ten ancestries, were inspected.** Status counts: 32 Compatible; 17 Clarify; 1 Obsolete wording.

“Compatible” means the trait can operate under the revised rules, not that its balance is proven or every use is automated. “Clarify” includes ambiguous procedure and balance-review candidates. “Obsolete wording” identifies a direct superseded-rule reference. Recommendations below are not approved rules changes.

## What changed the comparison

Creation now happens once at HoL level 1: two ancestry traits, three granted disciplines from culture/background/class, one class signature, and 8 + Guile + Knowledge + Reason DP before explicit benefits. Entry into additional disciplines costs the class price, 1/2/3 DP. Learned steps cost 1/2/2/3 DP, with endpoints at level 3 and combined abilities at level 7. Maximum HP grows from a fixed base and ancestry/class contributions; ancestry SP/coins now vary; class SP is twice its positive mental attribute. Death uses Fortitude, Grit is lifetime-limited, and Sustain Spell uses a Maneuver with zero SP.

Sources: [approved web decisions](../docs/workshop-learning-295.md), [playtest rules](../docs/workshop-playtest-287.md), [trait merging into the current catalog](../src/rules/workshop-forge-catalog.mjs#L64), [permanent benefits](../src/rules/ancestry.mjs#L70), [creation DP](../src/rules/forge-character.mjs#L80), [HP/SP formulas](../src/rules/forge-vitals.mjs#L7). The current catalog merges the legacy trait identities with pinned Forge references before the browser overlay; scanning only `choices.json` would produce false positives.

## Findings to resolve first

1. **Adaptable has obsolete creation prose, not an obsolete benefit.** Its printed “including level 0” conflicts with the single creation pool. The implementation correctly adds one DP once at level 1, then one per later level. Recommended text: “Gain 1 additional DP when you create your hero and whenever you gain a level.” Do not award a second creation bonus. See [current reference](../static/data/forge-references.json#L634), [benefit](../src/rules/ancestry.mjs#L96), and [creation application](../src/rules/forge-character.mjs#L87).
2. **A Foot in Two Worlds needs the new resource boundary stated.** It grants a foreign trait and language, not the other ancestry’s HP, Speed, SP, or coins. The current text only names HP/Speed. The implementation keeps the chosen Human resource record and validates the borrowed trait separately. Recommended clarification: retain all Human ancestry statistics and resources. See [selection validation](../src/rules/ancestry.mjs#L37) and [resource calculation](../src/rules/forge-vitals.mjs#L7).
3. **Still Water should not invent a concentration subsystem.** Its Reason Boon can apply to concentration as an ordinary task when the DA calls for a roll. There is no routine concentration roll in the current Sustain procedure, and this trait does not pay, waive, or strengthen that Maneuver. Preserve the deception benefit and clarify the focus clause, or deliberately redesign it after deciding what magical focus should do.
4. **Four Oath-Bound invocation traits have a very broad undefined trigger.** If simply saying “I call upon my oath holder” is sufficient, they are nearly unconditional attribute Boons. That is a large benefit relative to situational traits. Define the shared trigger once, including whether it is possible while Dying; do not silently impose an action or resource cost.
5. **Several traits need a fresh power-budget comparison.** Hard as Bedrock gives only +1 HP while Human/Halfling HP traits add another benefit. Endless Pockets gives +1 Bulk versus Broad Back’s +3. A Lifetime Ago gives one daily Boon versus daily two- or three-Boon alternatives. Small Target gives an always-on defense Boon. These are meaningful choices under the new HP and DP economy, not proven bugs. Test entire ancestry packages as well as traits, because HP/SP/coins differ. Human borrowing makes unequal trait value easier to exploit across packages.
6. **Ingenuity needs execution detail.** Preserve improvisation, but state assembly timing and the resulting ordinary weapon/tool profile. A temporary object should not silently grant training, recipes, a free attack, or an extra action.

## Exhaustive trait matrix

### Deep Dwarf

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [Eyes for the Dark](../static/data/forge-references.json#L389)<br>`trait-deep-dwarf-eyes-for-the-dark` | Compatible | Low-Light Vision 2 still removes lighting Banes; it does not grant sight in total darkness. |
| [The Stone Tells You](../static/data/forge-references.json#L410)<br>`trait-deep-dwarf-stone-tells-you` | Compatible | Six-square Seismic Vision has a shared definition and clear targeting limits. |
| [A Sense of Depth](../static/data/forge-references.json#L403)<br>`trait-deep-dwarf-never-off-the-map` | Compatible | Orientation plus an underground-navigation Boon works with ordinary objective progress. |
| [A Patient Breath](../static/data/forge-references.json#L396)<br>`trait-deep-dwarf-holds-its-own` | Compatible | Conditional Fortitude Boon fits environmental checks; it grants neither poison immunity nor automatic condition removal. |
| [Through the Narrow Places](../static/data/forge-references.json#L417)<br>`trait-deep-dwarf-where-tall-folk-cannot-stand` | Clarify | Define the boundary between squeezing/crouching and Prone/crawling. “Normally” should not accidentally waive the new universal crawl cost or condition penalties. |

### Hill Dwarf

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [Hard as Bedrock](../static/data/forge-references.json#L431)<br>`trait-dwarf-deep-constitution` | Clarify | Fixed +1 maximum HP works; markedly less attractive beside +1 HP plus a conditional Boon on other traits. Rebalance only after testing. |
| [Stone Mason](../static/data/forge-references.json#L452)<br>`trait-dwarf-stone-reader` | Compatible | Stone-related Boon and ordinary clue recognition remain useful utility without adding another combat action. |
| [Rooted in Stone](../static/data/forge-references.json#L438)<br>`trait-dwarf-low-center` | Clarify | Stability 1 plus an unrestricted Guile Boon is broad compared with narrower social traits. Confirm that breadth; Boons do not increase the Guile score or creation DP. |
| [An Honest Maker’s Hand](../static/data/forge-references.json#L445)<br>`trait-dwarf-maker-s-eye` | Compatible | One daily crafting/repair result upgrade fits Weak/Standard/Strong objective progress; does not grant recipes or bypass tools/time. |
| [A Grudge Well Kept](../static/data/forge-references.json#L424)<br>`trait-dwarf-carved-history` | Clarify | Mechanically valid, but permanent unlimited grudge tracking is a bookkeeping exception to the simplification goal. Decide whether persistent enemies are worth a dedicated list. |

### Wood Elf

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [Footfall on the Leaves](../static/data/forge-references.json#L473)<br>`trait-elf-light-tread` | Clarify | Forest difficult-terrain immunity plus conditional Speed remains legal. Clarify whether magical roots/areas count; natural terrain examples alone do not settle the opening broad sentence. |
| [A Lifetime Ago](../static/data/forge-references.json#L459)<br>`trait-elf-age-of-memory` | Clarify | Once-daily 1 Boon to Knowledge/Reason is a weak budget beside several daily 2–3 Boon traits. Keep legal but review appeal. |
| [Nature’s Whispers](../static/data/forge-references.json#L466)<br>`trait-elf-leaf-listener` | Clarify | “Interpreting living signs” needs examples so players know when the Boon applies; no new numerical rule is required. |
| [Grace of the Elder Folk](../static/data/forge-references.json#L487)<br>`trait-elf-unhurried-grace` | Compatible | Permanent +1 base Speed is implemented and remains distinct from conditional terrain movement. |
| [Dream beneath the Stars](../static/data/forge-references.json#L480)<br>`trait-elf-star-familiar` | Compatible | Reverie substitutes for sleep; it does not shorten the safe eight-hour rest or remove its once-per-24-hour limit. |

### Gnome

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [What’s It Made Of?](../static/data/forge-references.json#L522)<br>`trait-gnome-whats-it-made-of` | Compatible | Knowledge Boon to analyze mechanisms/mixtures gives utility rather than free crafting capability. |
| [Eyes from Elsewhere](../static/data/forge-references.json#L508)<br>`trait-gnome-one-more-question` | Compatible | Reason Boon against illusions still fits current magic and player-rolled defenses. |
| [Fingers in the Works](../static/data/forge-references.json#L501)<br>`trait-gnome-fingers-in-the-works` | Compatible | Mechanical construction/repair/disable Boon fits ordinary checks and learned Craft improvements. |
| [Small Target](../static/data/forge-references.json#L515)<br>`trait-gnome-small-target` | Clarify | Unconditional defense Boon is implemented and legal but a major evergreen combat benefit. Compare it with flat +1 HP before declaring ancestry choices balanced. |
| [Bright Idea](../static/data/forge-references.json#L494)<br>`trait-gnome-bright-idea` | Compatible | Daily 2 Boons with an unconventional approach fits the current roll system; does not grant DP or SP. |

### Goblin

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [Waste Nothing](../static/data/forge-references.json#L557)<br>`trait-goblin-scavenger` | Compatible | Repair/salvage Boon works with tools and objective progress; does not create free equipment or recipes. |
| [Better Together](../static/data/forge-references.json#L529)<br>`trait-goblin-more-of-us-than-you` | Compatible | First-attack-per-turn Boon with two adjacent allies is clear and does not grant another action. |
| [Quick on Your Feet](../static/data/forge-references.json#L550)<br>`trait-goblin-run-away-better` | Compatible | Permanent +1 base Speed remains implemented under the current trait name. |
| [The Other Side of the Fire](../static/data/forge-references.json#L543)<br>`trait-goblin-other-side-of-the-fire` | Compatible | Negotiation Boon fits social objective rolls; it does not compel concession or replace DA judgment. |
| [Quick Hands](../static/data/forge-references.json#L536)<br>`trait-goblin-never-where-you-aim` | Compatible | Sleight-of-hand Guile Boon supports ordinary interaction and relevant learned improvements. |

### Halfling

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [Bigger on the Inside](../static/data/forge-references.json#L592)<br>`trait-halfling-stout-heart` | Compatible | +1 HP and a Boon on Frightened-affected rolls survive the new rules; the Boon offsets normally rather than granting fear immunity. |
| [Under Their Noses](../static/data/forge-references.json#L585)<br>`trait-halfling-small-passage` | Compatible | A hiding Boon plus an explicit hiding opportunity complements universal hiding; the interposed-creature requirement still matters. |
| [Quick Tongue](../static/data/forge-references.json#L571)<br>`trait-halfling-quiet-company` | Compatible | Negotiation/argument Boon and enhanced advocacy Boon fit the social objective rules. |
| [A Little Luck](../static/data/forge-references.json#L564)<br>`trait-halfling-good-cheer` | Clarify | Any attribute roll includes the new Fortitude death roll. Confirm that intended daily survival use and compare its unrestricted 3 Boons with weaker daily traits. |
| [Endless Pockets](../static/data/forge-references.json#L578)<br>`trait-halfling-resilient` | Clarify | +1 Bulk capacity is implemented but substantially smaller than Broad Back’s +3 for the same trait-selection cost. Review across ancestry resource packages. |

### High Elf

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [The Practised Hand](../static/data/forge-references.json#L613)<br>`trait-high-elf-practised-hand` | Compatible | Crafting Knowledge Boon preserves tools and time, and does not teach a recipe. |
| [Still Water](../static/data/forge-references.json#L606)<br>`trait-high-elf-old-courtesies` | Clarify | Deception recognition works. “Maintain concentration” must mean a DA-called Reason task, not an invented routine check for Sustain Spell. |
| [Starlight Eyes](../static/data/forge-references.json#L620)<br>`trait-high-elf-starlight-eyes` | Compatible | Low-Light Vision 1 remains defined; assess it with the full ancestry package rather than equating it to Deep Dwarf rating 2. |
| [Measured Strength](../static/data/forge-references.json#L599)<br>`trait-high-elf-name-that-opens-doors` | Compatible | Object-focused Brawn Boon remains useful; does not raise Brawn or Bulk capacity. |
| [The Weight of Centuries](../static/data/forge-references.json#L627)<br>`trait-high-elf-weight-of-centuries` | Compatible | Daily 2 Boons for personally encountered Knowledge/Reason tasks has a clear narrative condition. |

### Human

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [Never Quite Finished](../static/data/forge-references.json#L662)<br>`trait-human-weathered` | Compatible | Current Forge reference correctly gives +1 HP and 1 Boon to Fortitude death rolls; browser applies the death Boon automatically. |
| [Adaptable](../static/data/forge-references.json#L634)<br>`trait-human-far-walker` | Obsolete wording | “Including level 0” conflicts with single-stage level-1 creation. Engine already grants one extra starting DP and one at each later level. |
| [A Foot in Two Worlds](../static/data/forge-references.json#L641)<br>`trait-human-many-homes` | Clarify | Borrowed trait/language works; text preserves Human HP/Speed but should also explicitly preserve Human starting SP and coins under the new ancestry resource split. |
| [Ingenuity](../static/data/forge-references.json#L655)<br>`trait-human-shared-table` | Clarify | Temporary-tool fantasy fits. Define assembly action/time, ordinary weapon profile, and unsuitable-material limits so it does not evade equipment investment or grant free combat actions. |
| [The Impossible Streak](../static/data/forge-references.json#L648)<br>`trait-human-practiced-patience` | Compatible | Daily noncombat 3 Boons remains legal; it excludes combat/death-roll use unless the DA rules the particular roll ordinary and noncombat. |

### Oath-Bound

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [The Answering Voice](../static/data/forge-references.json#L697)<br>`trait-oath-bound-the-mark` | Clarify | Same shared invocation clarification for Reason tasks/defenses; does not create a Sustain check or increase class SP. |
| [Borrowed Knowing](../static/data/forge-references.json#L683)<br>`trait-oath-bound-read-the-oath` | Clarify | Same shared invocation clarification; a Boon changes the roll, not Knowledge-based starting DP/SP. |
| [The Debt Comes Due](../static/data/forge-references.json#L690)<br>`trait-oath-bound-the-debt-comes-due` | Compatible | HP-paid reroll is supported by current recovery rules: must leave 1 HP, recovery ceiling reduced until dawn, then availability returns. Cannot pay while Dying at 0. |
| [The Will That Made You](../static/data/forge-references.json#L669)<br>`trait-oath-bound-bound-by-your-word` | Clarify | Define “call upon your oath holder”: narrative declaration, required communication, or a limited trigger? As written it can be a broad Fortitude Boon including death rolls. |
| [A Hand on the Rudder](../static/data/forge-references.json#L676)<br>`trait-oath-bound-neither-here-nor-there` | Clarify | Same shared invocation clarification; otherwise it can cover nearly every Agility attack, defense, and task. |

### Tallfolk

| Trait and stable ID | Status | Assessment |
|---|---|---|
| [Long Reach](../static/data/forge-references.json#L725)<br>`trait-tallfolk-long-reach` | Compatible | Two-square object/non-attack-touch reach has explicit shared rules; ordinary action costs apply and attack range stays printed. |
| [Broad Back](../static/data/forge-references.json#L711)<br>`trait-tallfolk-broad-back` | Compatible | +3 Bulk capacity is implemented; useful for equipment-heavy builds without granting equipment. |
| [A Big Shadow](../static/data/forge-references.json#L704)<br>`trait-tallfolk-a-big-shadow` | Compatible | Conditional social Guile Boon works with social objectives, with the DA deciding whether physical presence is useful. |
| [Built for the Weather](../static/data/forge-references.json#L718)<br>`trait-tallfolk-built-for-the-weather` | Compatible | Environmental Fortitude Boon remains clear and does not imply damage/condition immunity. |
| [Long Stride](../static/data/forge-references.json#L732)<br>`trait-tallfolk-you-take-the-blow` | Compatible | Current Long Stride grants +1 base Speed; its historical stable ID is not evidence of an obsolete damage-taking rule. |

## Existing rules that already solve apparent problems

- **Never Quite Finished is already migrated.** The older choices file says “resist death marks,” but the current Forge reference says Fortitude death rolls. The browser explicitly applies that Boon. Treat this as compatible; do not regress to the legacy wording. [Current reference](../static/data/forge-references.json#L662), [browser application](../web/workshop.mjs#L1558).
- **The Debt Comes Due survives the new recovery system.** The shared ancestry procedure requires HP spending to leave at least 1 HP, separates unavailable recovery from scars/maximum HP, and releases it at dawn. The Workshop tracks and persists that ceiling. Dawn unlocks recovery; it does not heal the missing point automatically. [Recovery implementation](../src/rules/recovery.mjs#L20), [regressions](../tests/ancestry-persistence-recovery.test.mjs).
- **Long Reach does not increase melee-attack range.** Its current scope is object interactions and non-attack touch abilities, with the original action cost. The shared journal already explains this. [Range benefits](../src/rules/ancestry.mjs#L86).
- **Dream beneath the Stars does not create a short rest.** It changes sleep posture/awareness, not rest duration, safety, or frequency.
- **Boons do not raise attributes.** Rooted in Stone, Oath-Bound invocations, and other roll Boons grant no additional creation DP, class SP, Bulk capacity, or maximum HP.
- **No reviewed trait grants a discipline, a legacy starter ability, refreshed Grit, or wound HP.** The removal of ancestry discipline grants therefore does not require deleting any of these fifty trait effects. Historical stable IDs are intentionally retained.

## Software evidence and limits

Permanent benefits are keyed explicitly by stable ID in `ancestryBenefits`: HP, base Speed, Bulk, additional DP, Stability, defense Boon, senses, and non-attack reach. Conditional narrative Boons generally require player/DA judgment; absence of automatic application is not proof that the trait has stopped working. The browser automatically handles Small Target on defense and Never Quite Finished on death rolls. Debt recovery has dedicated controls/tests.

The trait-reference merger parses changed Markdown into body paragraphs. The current Human death trait also brings footer metadata (Ancestry, Duration, ID, ancestry link) into that body. This is a presentation-cleanup candidate, distinct from a mechanics error. [Merger](../src/rules/workshop-forge-catalog.mjs#L64).

This review inspected current data, shared calculators, browser roll setup, ancestry/recovery procedures, and existing regression coverage. It does not certify every conditional trait in a live Foundry session or replace table playtesting.

## Consequences for the build-off

Use the current published rules and engine totals. Adaptable contributes exactly one starting DP. Borrowing keeps Human resources. Treat all conditional benefits as conditional, never as attribute increases. Do not grant old level-0 abilities or claim routine Sustain checks. Use straightforward, compatible traits where possible; explicitly annotate any build that relies on an ambiguity above. No balance recommendation in this review has been applied to the comparison characters.
