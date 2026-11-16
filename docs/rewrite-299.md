# Books and Workshop rewrite — November 15, 2026

Bruce authorized this rewrite after reading the ancestry/signature audits and thirteen trope Build-Offs. [#299](https://github.com/bruceamoser/heroes-of-legend-foundry/issues/299) tracks delivery; [book #1328](https://github.com/bruceamoser/heroes-of-legend/issues/1328) tracks authored sources. Native Foundry follows completion of the books and published Workshop, rather than changing in parallel.

The source contract and draft reader explanations are authored in the book repository at `design/revision/rewrite-299-contract.md` and `design/revision/rewrite-299-player-rules-draft.md`. They separate Bruce's approved architecture from proposed numerical/content details. The Workshop's existing live engine is still the published baseline until those changes are integrated and tested.

## Work sequence

| Issue | Deliverable | Acceptance before completion |
|---|---|---|
| #300 | Decision contract and DP affordability | Exact legal attribute bounds; current-income simulations at 1/3/7; class-price breadth comparisons; explicit proposed branch prices |
| #301 | Ancestry traits and signatures | All 50 traits and 90 signature identities accounted for; characteristics/benefits/drawbacks; defining class capabilities and milestone upgrade choices |
| #302 | Directional disciplines and mastery | Three circles, three triangles, one diamond per nonmagical branch; useful noncombat reactions; old combined concepts accounted for |
| #303 | Spell duration, Sustain and escapes | Full spell audit; explicit casting/defense/escape attributes; player-only resolution; intentional hazard strategy preserved |
| #304 | Workshop implementation | Mancer/sheet/list/atlas and saved-character behavior agree with pinned reviewed source; no native publication |
| #305 | Cross-format validation and publication | Both PDFs built and visually checked; browser workflows and revised Build-Offs pass; reviewed source and web publication verified |

## Approved differences from the live baseline

- A trait's description carries its mechanics. Glowing low-light eyes impose a hiding **Bane**, not a Boon. Natural drawbacks are common but not compulsory.
- One signature selection at each of levels 1/3/7: develop a known line or select a new milestone-appropriate signature. Do not award both for one selection.
- Nonmagical steps: base, improvement, improvement at level 1; major development and two improvements at level 3; mastery at level 7. Costs for new advanced steps are under explicit budget analysis.
- North Main Action / west Maneuver / east Reaction / south wildcard. Scholarship, social and Craft reactions need real noncombat triggers and usage boundaries.
- Spellbooks retain their themed lists and separate progression; Spellcraft's three training paths and Channeling book remain distinct.
- Remove inter-discipline intersection purchases. Relocate useful mixed-theme concepts instead of requiring remote endpoint combinations.
- Atlas: circles/triangles/diamonds by gate; learned solid gold; available green with thick gold outline; unavailable green outline, with additional textual/status cues.
- Sustain is a Maneuver and 0 SP, distinct from duration and directing a lasting effect. One active Moonbeam per caster, Maneuver to move; corridors/forced movement are intentional strategy.
- Control spells explicitly name the player-caster attribute used when an NPC struggles and the player-target attribute used when escaping an NPC spell; neither is inferred from the casting attribute. Main Action attempt; Weak caster result or Strong player-target result releases only that target. Preserve physical Grappled 3.

## Implementation boundaries

The book source currently lags approved Workshop rules in staged creation, discipline entry prices, class/ancestry SP, level DP and sustain SP. Reconcile these against `docs/workshop-playtest-287.md` and `docs/workshop-learning-295.md`, not by restoring older source defaults. Keep class-priced discipline entry at 1/2/3 DP and current income unless a specific replacement is reviewed.

The current Workshop is built from `static/data/forge*.json` plus the playtest overlay. Import reviewed book sources with immutable provenance; reconcile each overlay rather than applying it blindly over new authored data. Do not move the native `content/source-lock.json`, regenerate native packs, alter world Actors or claim native parity in this phase.

Current characters require explicit tested mapping for changed/removed branches and signature dependencies, with conserved accounted spending or a clear rebuild path. Preserve live HP/SP, favorites and equipment where still valid. Do not fabricate newly learned abilities to repair removed intersection nodes.

Preserve the original `Build-Offs/` comparison baseline. New progression fixtures and milestone comparisons must be clearly identified as revised candidates. Legal construction and import tests are not combat playtesting. The audit questions from #296 remain tracked until their individual decisions are implemented and verified.

## Evidence record

First pass: reviewed latest book main `d4d4b79` and Workshop main `3a3313e`; identified active source discrepancies above. The DP analysis script/report accompany #300. Traits and signature plans live with the book source. No live catalog, published PDF, Pages bundle or native Foundry behavior is changed by this foundation record alone.
