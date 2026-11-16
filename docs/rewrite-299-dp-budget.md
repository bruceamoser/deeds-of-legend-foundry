# DP budget analysis for the seven-step rewrite

November 15, 2026 · #299 / #300 · **Analysis and recommendation, not approved prices or a live rules change.**

## Recommendation

Start testing the nonmagical branch at **1 / 2 / 2 / 3 / 2 / 3 / 4 DP**, with minimum levels **1 / 1 / 1 / 3 / 3 / 3 / 7**. This is candidate B below. It retains the existing first four prices, costs 13 DP to complete the six level-3-accessible steps, and 17 DP for the full seven-step branch. The proposed new prices are **2 / 3 / 4**, not a rule already approved by Bruce.

The middle curve makes the first advanced improvement affordable, charges more for the next improvement, and gives mastery a higher price than the level-3 branch ability. It preserves meaningful room for utility and a second branch without making the seven-step branch as cheap as candidate A. Candidate C has a stronger penalty for characters retaining a broad initial kit, especially hybrids. These are budget tradeoffs; the actual rewritten abilities must justify their prices.

This recommendation does **not** change starting DP, level awards, class entry costs, ancestry traits, spellbook costs, or the live catalog. It does not imply equal power between a spellbook and a nonmagical branch.

## Inputs and scope

- Six integer attributes each range from −2 through +2 and total +3.
- Starting DP is **8 + Guile + Knowledge + Reason**, plus any explicit trait benefit.
- Each later level awards **4 + the new level** DP. Unspent DP is retained.
- Three starting disciplines are free grants. Buying another discipline costs its class's current 1, 2, or 3 DP, once. Its first branch purchase then costs an additional 1 DP.
- The proposed nonmagical branch has seven ordered steps. Steps 4–6 require level 3; step 7 requires level 7. There are no new level-2, level-4, or level-5 gates.
- Magical books retain their four sections at **1 / 2 / 2 / 3 DP** in this comparison. Spellcraft training remains outside the proposed seven-step nonmagical model.
- Bruce removed inter-discipline intersection nodes. **No combined-ability purchase or prerequisite cost is included.** Capabilities from those nodes need relocation or rewriting rather than preserved intersection requirements.
- General ranges below omit ancestry bonuses. None of the thirteen published Build-Off characters selected a DP-granting trait. Existing Adaptable behavior would add +1 at creation and each later level, but the trait review may change it; it is not assumed as a universal bonus.

Sources: [current rule overlay](../src/rules/forge-playtest-catalog.mjs), [class-price record](workshop-learning-295.md), [Build-Off fixtures](../Build-Offs/hol-builds.json), and [reproducible analysis script](../scripts/analyze-progression-budget.mjs). The machine-readable output is [rewrite-299-dp-budget.json](rewrite-299-dp-budget.json).

## Exact feasible starting range

There are **1,246** labeled six-attribute assignments satisfying the bounds and total. Let M be the sum of the three mental attributes. The physical sum is 3 − M and cannot exceed +6 or fall below −6. Combining that with M's own −6…+6 bounds gives **M = −3…+6**, not −6…+6. Every integer in this range is achievable.

| Mental sum M | Starting DP | Valid assignments | Total DP by level 3 | Total DP by level 7 |
|---:|---:|---:|---:|---:|
| −3 | 5 | 10 | 18 | 56 |
| −2 | 6 | 45 | 19 | 57 |
| −1 | 7 | 108 | 20 | 58 |
| 0 | 8 | 190 | 21 | 59 |
| +1 | 9 | 270 | 22 | 60 |
| +2 | 10 | 270 | 23 | 61 |
| +3 | 11 | 190 | 24 | 62 |
| +4 | 12 | 108 | 25 | 63 |
| +5 | 13 | 45 | 26 | 64 |
| +6 | 14 | 10 | 27 | 65 |

The assignment counts are an enumeration, **not player probabilities**. Players deliberately choose stats. Examples: Brawn/Agility/Fortitude all +2 forces mental total −3 and 5 starting DP; mental attributes all +2 permits physical total −3 and 14 starting DP.

The later awards are 6, 7, 8, 9, 10, and 11 DP at levels 2 through 7. Therefore level 3 adds **13** to the starting pool and level 7 adds **51**. The nine-point gap between the mental extremes remains nine points; it does not compound under the current advancement formula.

### Class prerequisites narrow some extremes

These use the current class minimum attributes, before any class rewrite. Counts in the three price columns cover all 19 disciplines, not just starting options.

| Class | Starting DP range | Disciplines costing 1 DP | 2 DP | 3 DP |
|---|---:|---:|---:|---:|
| Arcanist | 5–14 | 3 | 4 | 12 |
| Blade | 5–13 | 2 | 2 | 15 |
| Intellect | 6–14 | 2 | 5 | 12 |
| Leader | 5–14 | 2 | 4 | 13 |
| Odd | 5–14 | 0 | 19 | 0 |
| Protector | 5–14 | 2 | 3 | 14 |
| Shadow | 5–14 | 2 | 3 | 14 |
| Shepherd | 6–14 | 2 | 4 | 13 |
| Unbalanced | 5–13 | 2 | 2 | 15 |
| Warden | 5–14 | 2 | 4 | 13 |

Blade and Unbalanced require two nonnegative physical attributes, so their mental total cannot reach +6. Intellect and Shepherd require two nonnegative mental attributes, so their mental total cannot reach −3. The class price matrix remains relevant even when the initial disciplines are free: a useful first purchase in a new discipline costs **2, 3, or 4 DP including entry**. For a 5-DP starting hero, those packages consume 40%, 60%, or 80% of the budget.

## Comparing the three advanced cost curves

| Candidate | All seven prices | Cumulative after each step | Cost through step 6 at level 3 | Full branch at level 7 |
|---|---|---|---:|---:|
| A: inexpensive advanced growth | 1 / 2 / 2 / 3 / **2 / 2 / 3** | 1 / 3 / 5 / 8 / 10 / 12 / 15 | 12 | 15 |
| **B: recommended starting test** | 1 / 2 / 2 / 3 / **2 / 3 / 4** | 1 / 3 / 5 / 8 / 10 / 13 / 17 | 13 | 17 |
| C: expensive mastery | 1 / 2 / 2 / 3 / **3 / 3 / 5** | 1 / 3 / 5 / 8 / 11 / 14 / 19 | 14 | 19 |

At level 1 all three candidates are identical: one branch's first three steps cost 5 DP. A second branch in a studied discipline starts at 1 DP; buying both improvements on the first branch costs 4 DP. A first purchase that adds a useful action or passive is therefore cheaper than polishing an existing one. The content and favorites workflow, not the advanced prices, determine whether that encourages interesting breadth or too many buttons.

With candidate B, a character who already learned steps 1–3 can spend **8 more DP** at level 3 for steps 4–6, leaving **5 of the 13 newly awarded DP** for another purpose. If the character stopped at step 2, finishing through step 6 costs 10 more; if it stopped at step 1, it costs 12 more. The mastery at level 7 is another 4 DP. Those are sequential purchases, not a bulk discount or a free upgrade.

For a new discipline, candidate B's complete costs are 14/15/16 DP through step 6 and 18/19/20 DP through step 7, depending on its class entry price. A second branch within that discipline avoids paying entry again. Class identity changes access cost; these candidate curves do not add a class multiplier to every learned step.

### Pure depth ceilings, before preserving a character's other choices

| Candidate | Complete six-step branches by level 3, using the 18–27 DP range | Complete seven-step branches by level 7, using the 56–65 DP range |
|---|---|---|
| A | 1–2 | 3–4 |
| B | 1–2 | 3 |
| C | 1 | 2–3 |

This idealized ceiling assumes enough relevant branches in the free disciplines and spends on nothing else. It is not a recommended build. Candidate B allows two six-step branches only at 26–27 total DP; candidate A allows two at 24+. Candidate C never reaches two by level 3 without an additional explicit DP benefit. At level 7, candidate B permits three complete branches throughout the base range but does not permit a fourth even at 65 DP.

## The thirteen existing Build-Off characters

These preserve all actual starting purchases, including magical books, capacity, and paid additional disciplines. Their total awards are exact; the original builds are not rewritten to optimize this analysis.

| Build | Starting pool | Spent / saved at level 1 | Total by level 3 | Total by level 7 | New spending available at level 3 / 7 |
|---|---:|---:|---:|---:|---:|
| Barbarian | 7 | 7 / 0 | 20 | 58 | 13 / 51 |
| Bard | 12 | 12 / 0 | 25 | 63 | 13 / 51 |
| Cleric | 10 | 9 / 1 | 23 | 61 | 14 / 52 |
| Druid | 10 | 10 / 0 | 23 | 61 | 13 / 51 |
| Fighter | 8 | 8 / 0 | 21 | 59 | 13 / 51 |
| Monk | 7 | 7 / 0 | 20 | 58 | 13 / 51 |
| Paladin | 8 | 8 / 0 | 21 | 59 | 13 / 51 |
| Ranger | 8 | 8 / 0 | 21 | 59 | 13 / 51 |
| Rogue | 9 | 9 / 0 | 22 | 60 | 13 / 51 |
| Sorcerer | 10 | 10 / 0 | 23 | 61 | 13 / 51 |
| Warlock | 9 | 9 / 0 | 22 | 60 | 13 / 51 |
| Wizard | 11 | 11 / 0 | 24 | 62 | 13 / 51 |
| Artificer | 10 | 10 / 0 | 23 | 61 | 13 / 51 |

The following is a grouped budget optimization: complete as many nonmagical branches as possible while retaining every original purchase. It charges a new discipline's actual class price once, allows its four branches, credits steps already learned, and respects the step-level gates. It can choose cheaper but thematically irrelevant branches; it proves affordability only.

| Existing build | Complete six-step branches at level 3: A / B / C | Complete seven-step branches at level 7: A / B / C |
|---|---|---|
| Barbarian | 1 / 1 / 1 | 3 / 3 / 3 |
| Bard | 1 / 1 / 1 | 3 / 3 / 2 |
| Cleric | 1 / 1 / 1 | 3 / 3 / 2 |
| Druid | 1 / 1 / 1 | 3 / 3 / 2 |
| Fighter | 1 / 1 / 1 | 3 / 3 / 3 |
| Monk | 1 / 1 / 1 | 3 / 3 / 3 |
| Paladin | 1 / 1 / 1 | 3 / 3 / 2 |
| Ranger | 1 / 1 / 1 | 3 / 3 / 2 |
| Rogue | 1 / 1 / 1 | 3 / 3 / 3 |
| Sorcerer | 0 / 0 / 0 | 3 / 2 / 2 |
| Warlock | 0 / 0 / 0 | 3 / 2 / 2 |
| Wizard | 1 / 1 / 1 | 3 / 3 / 2 |
| Artificer | 1 / 1 / 1 | 3 / 3 / 2 |

Sorcerer and Warlock start with no nonmagical discipline or branch purchases. Their 13 newly awarded DP cannot pay even the cheapest complete six-step branch **plus** a new nonmagical discipline's 2-DP entry. This is a switching cost, not proof that caster advancement is stalled: they can develop their existing spellbooks, and can begin a martial or utility branch without completing all six steps immediately.

Under candidate B, the Barbarian and Rogue can finish an already-deep branch through step 6 for 8 new DP, leaving 5. The Fighter and Monk can finish a branch already at step 2 for 10, leaving 3. That is a concrete reward for prior depth without deleting their other starting choices.

## Magical progression and the decision-load risk

A magical book still costs 5 DP for its first three sections, teaching six spells, and 8 DP for all four sections at level 3, teaching eleven spell entries. Candidate B's nonmagical branch costs the same 8 DP through its original level-3 step, then 5 more for the two proposed advanced steps and 4 more for mastery. Spell counts and technique-node counts measure different things; neither establishes combat or utility parity.

The breadth arithmetic exposes an existing risk:

- Three pure magical starting disciplines provide twelve books. Buying the first section of every book costs **12 DP and teaches 24 spell entries**, including twelve 0-SP first spells.
- A legal 14-DP Arcanist can start with Elements, Invocation and Force, buy those twelve first sections, then spend 1 DP to add Spellcraft and 1 DP for Channeling I: **26 spell entries**. This is an affordability example, not a recommended character. Culture Learning Houses → Elements, background Bone Tender → Invocation, and class → Force supply the three grants; the mental +6 stat array is legal for Arcanist.
- At level 7, ignoring all other purchases, 56–65 DP funds seven or eight complete 8-DP books within already-studied disciplines: 77–88 learned entries. SP, action competition, and available utility limit their use, but do not reduce the reference burden.

A deeper nonmagical branch may make improvement a more attractive expenditure, but its prices do not solve magical breadth by themselves. Keep this visible in testing. Favorites, collapsed book views, and stronger improvements may reduce table friction; changing first-section prices, spell counts, or preparation would be separate design decisions requiring approval.

## What the next playtest should decide

1. At level 1, give a 5–7 DP physical hero and a 12–14 DP mental hero the same encounter and exploration problem. Record useful decisions, not simply learned-node counts.
2. At level 3, test candidate B's six-step branch beside a broader character who stops several branches at their level-3 ability. Check whether advanced improvements are attractive without making the original ability mandatory or obsolete.
3. At level 7, compare two masteries plus utility against three financially optimized masteries. Check action competition, meaningful mastery use, and the value of remaining DP.
4. Run a utility scene as well as combat for spellbook users. Count time spent locating a spell and the number of favorites actually needed. The 24/26-spell starting cases should be tested deliberately.
5. Recalculate once ancestry traits, class signatures, and relocated intersection abilities have approved text. A mastery that replaces a weak option and one that adds a powerful repeatable action cannot be priced confidently by node position alone.

## Reproduce and verify

```sh
node scripts/analyze-progression-budget.mjs
node scripts/analyze-progression-budget.mjs --check
```

Use the repository's Node 24 runtime. The first command regenerates the analysis JSON only; `--check` compares it with the committed artifact. Assertions cover legal attribute ranges and counts, milestone awards, all class/discipline prices, the three cost curves, the thirteen fixture budgets, magical first-section counts, and nonnegative optimized balances. The script reads the current sources but changes no live engine, catalog, character build, or book.
