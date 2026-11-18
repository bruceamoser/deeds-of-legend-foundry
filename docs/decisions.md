# Decision register

This register separates confirmed direction from proposed engineering choices. It does not reopen approved game rules. It is not necessary to answer every entry before starting the foundation work.

## Confirmed by Bruce

| ID | Decision | Evidence |
|---|---|---|
| D01 | Public repository `bruceamoser/heroes-of-legend-foundry`. | October 17, 2026 repository-name reply. |
| D02 | Current `design/player-book` plus `design/rules`; incorporate completed DA/bestiary book. | October 17, 2026 source-selection reply. |
| D03 | Automate core play where it helps; use native Foundry interactions and prioritize ease of play. Readable manual specialty references are accepted. | October 17, 2026 follow-up, superseded in scope by the later #129 correction. |
| D17 | The roll dialog supports use of applicable abilities and player-applied Boons/Banes. | October 17, 2026 interaction follow-up; details in [interaction design](interaction-design.md). |
| D18 | Creature attacks post descriptive chat with Defend; it opens a prefilled defense dialog that still allows applicable abilities. | Same follow-up; preserve normal attack/defense perspective. |
| D19 | Drag/drop is a primary system interaction. | Same follow-up; validated drop matrix in the interaction contract. |
| D20 | Preserve HOL's established look, feel and color theme. | Same follow-up; pinned book palette, typography and visual references. |
| D22 | Any player may open/use Defend and choose the defender; GM native multi-target selection at Attack time supplies immutable suggestions; DA adjudicates encounter-rule exceptions. | October 17, 2026 clarifications; #14/#22. |
| D21 | Full-featured creation and advancement charactermancer; ease of use paramount; eligible-first choices with visible disabled ineligible options and exact unmet requirements. | October 17, 2026 follow-ups; #18. |
| D23 | Use native Foundry targeting, a single prefilled effective −3…+3 Boon/Bane slider, no adjustment reason fields, and optional contextual controls defaulting off. Core playability is the release goal; every card nuance need not be automated. | Bruce's latest October 17, 2026 correction; #129. |
| D24 | Defend can be reopened and rolled repeatedly with changed abilities. Each fresh submission has its own identity; only retransmission of that same identity is deduplicated. No same-defender completed/unknown-result gate, repeat checkbox, reason or approval. | Bruce's later #129 correction, October 17, 2026. |

| D25 | Ordinary play uses table judgment without mandatory prose or adjudication questionnaires. Attack geometry and blockability are guidance; deliberate ability selection records intent. Single-condition Finish uses zero additional manual mitigation by default. Permissions, resources, source identity and operation receipts remain enforced. Creation/advancement retains strict eligible-first choices and visible disabled ineligible options. | Bruce’s October 17 ease-of-play correction; #133. |

| D26 | Tracked action counters, own-turn status and ordinary condition applicability are advice for deliberate actions, without extra DA approval. Clamp counters at zero; unfunded conversions create no resources and active benefits are reused without another charge. Owners may correct equipment arrangements during encounters. Real Item/HP costs, source identity, permissions, consent, uncertain writes and creation/acquisition eligibility remain strict. | Bruce’s subsequent October 17 no-gates correction; #140. |

## Proposed engineering defaults

Latest interface direction (October 17, 2026): bundle native rules journals and
open gameplay references locally; iterate character creation/sheet design in a
GitHub Pages builder with portable JSON and shared calculations. Keep a common
hero header above the content, a top-left Edit toggle, and minimal icon tabs
hanging off the left edge with hover/focus labels. Match the book's visual style
without requiring pixel fidelity. Do not add preview disclaimers to the product
interface. Bruce requested direct implementation without delegation for this
design work. Tracked in #155 and #156.

October 18 compact-tool refinement (#158): only the content pane scrolls;
header, icon tabs and learning DP remain visible. Culture/background names
include grants. Equipment exposes grants, supply dice, Bulk and equip/remove
controls. Rename Encounter to Main, use concise action tables grouped by timing,
show ancestry traits/defenses and recipe rolls, and expose basic-action visibility
in Edit mode. Add named local saves, explicit coin overspend override, DP totals
and reversible level plans with advancement learning. Keep creation history in
the web Development tab, not the eventual native one. No Wear Light Armor rule
exists in the inspected approved source; do not invent one.

| ID | Proposal | Reason / decision point |
|---|---|---|
| D04 | Package ID `heroes-of-legend`; V14 only; first runtime target 14.369. | Stable compact system identity; no V13 compatibility baggage. Confirm availability before package listing. |
| D05 | ES modules + JSDoc, Handlebars V2, scoped CSS, Node 24, small build scripts. | Familiar reference patterns without copying Neon Relic's domain/build complexity. Foundation issue may choose TypeScript if justified. |
| D06 | Separate `character`, `creature`, `summon` Actor types. | Explicit survival/control differences; shared schema fragments avoid repetition. |
| D07 | Focus automation on dependable core play; clearly label manual specialty handling. Keep DA rulings available without routine questionnaires. | Latest #129 direction supersedes the earlier full-automation default. |
| D08 | Native document requests/receipts and one GM authority; no mandatory socket module. | Ownership and retry behavior tested before mutation automation. Transport details are a technical spike. |
| D09 | Pinned Markdown intake, reviewed adapters, stable compendium IDs and explicit content updates. | Keeps the evolving books authoritative without overwriting user worlds. |

## Bounded remaining decisions

| ID | Question / constraint | Recommended treatment | Blocks |
|---|---|---|---|
| D10 | Both completed books confirmed October 17; reconciled to approved v16.1.0 at 9bc9b4f in content/source-lock.json (#72). | Use the pinned records and 192-entry artwork manifest; review subsequent source changes explicitly. | Production creature/DA content freeze. |
| D11 | Code license and separate rules/art distribution terms. | Bruce explicitly deferred license selection and authorized release on October 17; retain content/asset notices and provenance without inventing a license grant. No assumption that Neon Relic's MIT metadata licenses HOL content. | No release gate; rights remain undecided. |
| D12 | Which licensed Foundry installation/test world will host runtime validation? | Isolated development world on 14.369 and Node 24; never modify a live campaign for testing. | Runtime certification, not pure-rules implementation. |
| D13 | Cross-level distance, vertical tether measurement, airborne incapacitation and non-square grids are not fully specified by HOL sources. | Implement native levels/visibility; show geometry guidance without blocking ordinary attacks. Ask Bruce for universal rules before claiming full cross-level automation. | Manual geometry guidance; no ordinary attack gate. |
| D14 | Mid-round combat joins/removals, multiple opportunity ordering and rewind semantics need exact rules/operational policy. | Preserve acted history; present DA choices; write and approve deterministic policy before those branches auto-resolve. | Exceptional combat transitions. |
| D15 | A “day” for daily treatment limits needs a world-time boundary; scenes require an explicit narrative end. | World-time day key plus DA-controlled scene transition. Confirm offset/calendar policy in timekeeping issue. | Daily/scene resets. |
| D16 | Automatic authority failover during partial multi-document application needs proof. | Prototype receipts, serialized queues and stale-state checks; suspend ambiguous operations for reconciliation. | Cross-owner automatic mutation. |

## Already settled — do not list as open

- October 15 approval covers active catalog proposals, class pricing, creation details and manuscript mechanics; older labels do not nullify that approval.
- October 16: NPC-only attacks use defender rolls; handling dice does not change control.
- Highest resistance and numerical weakness by type, cap 3; weakness applied once before resistance.
- Fully resisted minimum-damage wound chooses among original damage types.
- Collision damage precedes new participant Stability; groups stop at the last legal arrangement without extra movement.
- Summons are tangible energy forms, unhealable, vanish at 0, with controller-paid healing and nearest-occupied-square tether.
- Interrupted action and additional cost timing, mixed temporary/starred tracking, and falling rounding are taught in the approved player manuscript; older proposal markers do not make them globally unresolved.

If later completed DA text conflicts with these records, flag the exact discrepancy for Bruce. Do not silently restore an older version because it appears in a PDF or an old open issue.


## October 18 sheet refinement (#162)

Bruce requested a Foundry-sized sheet, no pronouns field, tabular learned abilities,
editable inventory/languages/conditions, and independent signature selection.
Cap the web sheet at 900px, retain the fixed header and hanging icon rail, and
keep normal play controls available outside structural Edit mode. Every item can
be held or worn; a separate Carried checkbox controls encumbrance and is implied
by Held/Worn. Clearing Carried clears both. Development uses Spend DP whenever
current DP is positive; missing signatures have dedicated tier-specific screens.
Track browser play edits separately from creation receipts and preserve them in
portable schema 3. Native document application remains a later adaptation.

Bruce also corrected Walled Communities to Wear Light Armor and medium training
to multiple Armor ranks, authorizing inference of the rest. Book issue #1270 now
specifies the consistent proposed Armor 1/2/3, levels 1/3/7, DP 2/4/8, resistance
1/2/3 progression, with light's 10-coin price explicitly identified as inferred.
Keep that correction in canonical book review and then repin all dependent system
content together. The current pinned edition still contains the old armor grants.


## October 18 Main density follow-up (#164)

Bruce moved Passives and Ancestry traits into the right column above Defenses,
and Conditions into a box directly below Defenses. Remove the Main title and
Create / develop shortcut, tighten action rows and use Development as the creation
entry. Creation purchase removal belongs on the starting inventory row, retaining
item identity and refunding that purchase without touching same-type grants.
Bruce confirmed that the existing universal Shield Block / equipment-grant
explanation resolves his shield concern; no shield rule change is requested.


## October 18 Recipes and table density (#166)

Bruce requested a Recipes tab only for characters who own recipes, with no recipe
sections on Main or Inventory. Show owned recipes even when no matching crafting
ability is learned. Put known disciplines and ranks above the Abilities search,
and tighten Inventory and Abilities without removing their play controls or local
references. Label slider ends Banes (left) and Boons (right), retaining the existing
negative/positive roll convention. This pass changes the web workshop presentation.

## October 18 approved source update (#168, #169)

Bruce confirmed the book PRs approved/merging. Both #1272 (armor) and #1274 (six
one-DP abilities) are merged at 64089a1c8961d7faff172f179448a8b6e57827ef. Repin
all dependent catalogs/references together. Keep six one-DP exceptions explicit,
ordinary tier pricing unchanged, and Universal actions free. Persist selected
language/specialty and one memorized message. Use normal action budgets and
contextual Boons; leave fictional trigger adjudication to the table. Preserve
existing Actor snapshots and explicitly review old browser saves before adapting
the armor grant. See the source-update review for compatibility and scope.

## October 18 discipline/origin expansion (#171)

Bruce requested implementation of approved book PR #1278, v16.3.0. Import its
62 shared cards and 12 revised origins from d67e046. Preserve existing characters'
chosen grants; offer revised origin alternatives deliberately. High Guard replaces
Shield Block under its existing benefit key. Four pre-roll attribute substitutions
use the existing defense response. Other specialty triggers and outcomes remain
readable local rules with table adjudication, using established roll, condition,
movement and inventory rules rather than new global mechanics or approval gates.

## Current rules only (#173)

Bruce superseded the optional update behavior: the current book catalog is the
only rules version. Apply it automatically to web reloads, named saves, JSON
imports and creation drafts. Remove historical origin options, rules-update
confirmations and forced update-review screens. Previous saved markers are
ignored; origin selections use their current paired grants. Keep ordinary
character-editing controls and structural validation.


## October 18 creature actions and safe profile refresh (#175)

Import approved #1280 from bdfd18e with shared monster-template identities and
complete local references. Preserve Main Actions and base statistics. Specialty
Reactions and movement remain nonblocking DA reference workflows; primitive
action, damage and condition rules do not imply an automatic specialty resolver.
Current compendium updates may replace unchanged printed world-profile blocks,
using fingerprints of the previous published source, while preserving live
resources and divergent edits. No historical rules choice is introduced.


## October 20 live-table correction (#228–#230)

Bruce explicitly removed routine DA approval gates: player-owned actions should
complete when clicked and support correction. Safe-place confirmation, owned damage
and health corrections are player controls. Technical synchronization must be
invisible during normal play and cannot globally block the world because an old
request was interrupted. Shared document writes retain one automatic processor and
persistent duplicate protection; campaign milestones and other actors' permissions
are unchanged. Wound rolls become native RollTables with a type dialog, immediate
chat result/application and guarded Undo, including when no GM is connected.
Learning validation is step-scoped, and compact native chat/card density supersedes
literal web sizing where the narrow Foundry sidebar needs less space. Every printed
attribute ability has a configured roll entry independent of effect-adapter coverage.


## October 20 explicit actions supersede global automation (#232)

Bruce prefers deliberate button presses and easy correction over automatic chains
of consequences. Attacks and abilities show their roll, outcome and damage in chat;
Apply Damage affects the selected tokens only. HP remains editable and damage does
not automatically roll wounds, spend Grit, or advance death procedures. Add Wound
explicitly rolls and applies the selected type; Remove Wound removes that wound and
its own effects without reverting later unrelated changes. Owned edits must work
without a connected GM or global coordinator health. Only genuinely shared or
privileged document writes need a small automatic permission relay. Retain normal
Foundry permissions. Do not introduce DA approval gates.

Bruce clarified that using an ability **does spend its action**, with an easy reset
for mistakes. An encounter is not a prerequisite for rolling. These instructions
supersede the earlier broad automation preference; canonical game rules are unchanged.


## October 21 table-first corrections (#234–#237)

Bruce supersedes action spending/counters entirely: players and the DA track action
limits. Remove counters and reset controls from characters, creatures and encounters.
An encounter only records one chosen participant; other choices wait until that
participant finishes. No side order, round budget or automatic consequence chain.

Creature attacks, including mixed damage/conditions, declare with Defend. Player
defense yields an outcome card whose Apply Damage applies its supported printed
damage and conditions to the selected tokens. Player attack rolls keep their normal
rules perspective. Non-damage attribute abilities show the configured roll then an
outcome dialog with ability text; no-roll actions show their operative effect visibly
and link to full details. Remove generic how-to/automation/provenance text from play
cards. Dying rolls use the compact web presentation without an ability browser.

A ranged weapon must have assigned ammunition before its attack rolls. After a
successful attack roll, check that ammunition supply once and post the actual die
result/depletion card. Consumable dice similarly roll directly and step down on 1.
Keep canonical inventory-die arithmetic; a reduced die is not an exhausted item.
Condition changes name target, condition and rating. No source textbox is required;
removal must clear its token icon as well as its mechanical contribution.

Sheet controls follow the web list/popup interactions: favorite abilities in the
Abilities tab, attack rows first within Main/Maneuver, item-specific Held/Worn,
visible equipment market list with unavailable purchases disabled, language list
selection adds immediately, and passive/ancestry sidebar names open detail cards.
Remove the extra defenses play buttons and creature conditions/damage/equipment tabs.

Add level replaces award milestone and only increases level plus its canonical DP
grant. Remove level above level 1 reverses that level and grant. Bruce explicitly
allows a negative DP balance; validation flags overspending and instructs the player
to remove purchased abilities. Level changes do not silently remove purchases or
rebuild committed items. Safe-place confirmation is removed from this workflow.

## October 21 follow-up corrections (#239)

Bruce restores round participation tracking: one chosen participant at a time,
mark their completed turn, and advance/reset the round after all participants
finish. No action counters, side order or hand-use policing. Finish automatically
resolves canonical condition damage then temporary rating decay, with a durable
once-per-turn receipt. Starred, maintained and binary states retain their rules.
Numbered conditions combine; show their aggregate rating and clickable rules.
Creatures at zero HP gain Foundry’s Dead status; correcting HP removes only the
system’s automatic Dead effect.

Owned unlinked token actors may develop like world actors. Header HP accepts signed
relative corrections. Ordinary equipment names/descriptions remain editable without
changing catalog identity; arrangement is silent and table-controlled. Supplies
explain die-size reduction and permit explicit manual depletion. Roll ability lists
start closed and include only the initiating action and relevant modifier references;
physical/mental wound modifiers start selected for the matching attribute family,
remain visible and can be overridden for the specific context. Reaction cards show
triggers, damage cards show applied resistance, and wound names open full details.
The native V14 TokenRuler supplies movement costs/history and rendering; HOL only
colors its existing segments/highlights by Speed and twice Speed.

Blank rulebook section dividers become chapter contents with native links. Updating
existing world copies repairs only exact untouched old divider bodies, preserving
all source pages and user edits.

## October 21 inventory and persistent character follow-up (#241)

Bruce confirms player-character tokens must link to their Actor when placed;
creatures remain independent unlinked copies. Existing unlinked character edits
copy back before linking. Preserve the pre-conversion Actor and every original
token delta for recovery; merge unrelated token changes, and ask the DA which copy wins when
versions disagree (Foundry records no token edit order). Never convert creature or summon tokens.

Supplies use compact aligned controls; inventory edits use a pencil beside the
name. Ordinary equipment editing focuses on name, useful inventory values and a
readable description, without generated provenance, implementation or hand-use
fields. Equipment-backed attack cards use the weapon name. A wound at its recovery
value leaves its scar but ceases mechanical effects. Encounter participants group
as players and creatures with End combat at the bottom. A character's own level
change refreshes development without a false stale-ledger warning; real concurrent
changes still require reviewing the latest character state.

## Direct signature choices (#243)

Bruce's character-sheet level 3/7 signature buttons open the corresponding class
signature choice directly. This is a focused grant, separate from general learning:
only the selected tier is saved, other pending tiers remain available, and unfinished
purchase drafts are preserved without being committed by the signature button.
Existing class/tier eligibility and acquisition rules remain authoritative.

## Earned signature repair and switching (#245)

The 2.3.2 native test prepopulated pending markers and missed the actual Add level
path, which changed level/DP without unlocking its pending signature. Availability
must derive from earned level, class and actual grant ownership; missing legacy
markers cannot hide an unchosen signature. Explicit current slot ownership and
grant history prevent duplicate free choices on level correction.

Bruce also explicitly authorizes players to switch their class signatures. Each
earned tier (1/3/7) is editable; switching changes the free slot without spending or
refunding DP, removing separately paid alternatives, resetting equipment or
repeating acquisition grants. Preserve paid purchases and saved drafts. This
changes the Foundry interaction by the lead designer's direct instruction; no
canonical source document is silently rewritten.

## November 15, 2026 — Workshop learning and book follow-through

Bruce approved an available-now learning list with expandable full branches alongside a functional full atlas, class-priced discipline entry, and web testing/publication. See [the decision and price mapping record](workshop-learning-295.md) for exact scope and book integration notes. Follow-up #296 audits ancestry traits and class signatures against the new rules before revising their mechanics.

## November 15, 2026 — Trait/signature review and trope Build-Offs (#296, #297)

After publishing the learning list and expanded atlas, Bruce requested an audit of ancestry traits and class signatures, followed by paired D&D level-2 / HoL level-1 builds for every base class. [Build-Offs](../Build-Offs/README.md) contains all thirteen comparisons, including Artificer, the complete 50-trait/90-signature reviews, and importable HoL characters. The comparison baseline is revised 2024 D&D with the 2025 Artificer, and Workshop revision `27200945e033ca3d2e9eabeed312d9ed0f7911a1`.

These findings are recommendations and playtest questions, not approved rule changes. Keep #296 open for rulings and book follow-through. All thirteen HoL builds passed current construction/budget checks and actual browser import at 1000×800, with matching HP/SP and no page errors. This establishes construction and importability, not combat balance or native Foundry behavior.

## November 15, 2026 — Seven-step progression and character identity rewrite (#299)

Bruce authorized the next books/Workshop rewrite after the Build-Off review. [The delivery record](rewrite-299.md) links the six workstreams and distinguishes agreed architecture from candidate costs and mechanics. Nonmagical branches retain three initial circles, then a level-3 endpoint and two improvements (triangles), then level-7 mastery (diamond). Inter-discipline intersection purchases are removed in the new design; spellbooks retain themed-list progression. Traits carry descriptive benefits/side effects, signatures may develop at milestones, and spell-specific escape attributes are explicit. Fixed-duration hazards preserve positional strategy; Sustain remains a Maneuver at 0 SP. Both books and the web app precede native Foundry. The first contract/budget PR does not itself switch the live catalog.


## November 16 — completed progression rewrite (#299–#305)

Bruce corrected nonmagical branch prices to **1 / 2 / 2 / 3 / 4 / 4 / 5 DP**. Adopted exactly: three level-1 entries, three level-3 entries and a level-7 mastery, totaling 21 DP. Additional disciplines retain class-specific 1/2/3 DP prices. Spellbook sections retain 1/2/2/3 DP, and single-book master spells remain separately priced at level 7.

One creation pool, three starting disciplines, DP 8 + Guile + Knowledge + Reason, later DP 4 + new level, and twice the positive class mental attribute for SP are now canonical book rules as well as Workshop behavior. Full implementation and validation notes: [rewrite record](rewrite-299.md). Current-only saved-character migration preserves live resources and equipment and returns changed learning purchases to the DP ledger for reselection; it never silently teaches a different ability.

Signatures are one free choice at each of 1/3/7, developing a known line or beginning another. A late-start line supplies its foundation; intermediate conditional developments apply only when selected. Sustain is a universal Maneuver costing 0 SP. Fixed durations and directing a hazard are distinct from Sustain; printed hold and escape attributes preserve player-only rolls. Ancestry characteristics carry their modest benefits and natural side effects.

The revised books and Workshop are the acceptance target. Native Foundry remains pinned to its existing source until the separate integration phase. Playtest-dependent encounter balance remains deferred.


## November 16 — consistent spellbook atlas geometry (#308)

Bruce found the spellbook fans confusing and approved bringing them into the standard discipline layout. The four spellbook sections retain the same inner loops as other disciplines. A book with mastery spells uses one curved advanced tail, following the standard shoulder and outer mastery band; its short final branches distinguish independent choices. The shared junction is purely visual, not an extra purchase or prerequisite.

Circles, triangles and diamonds continue to identify level-1, level-3 and level-7 entries. Each mastery still requires only its own book's section IV. Costs, spells and learning order are unchanged. Learned and selected states apply to the shared tail and each individual choice separately. The inspector identifies “Master spells · Level 7,” explains that each is a separate choice, and lets the player inspect siblings. This also distinguishes them from the advanced spells learned with section IV.

Validation covers all 29 real book loops and their actual prerequisite graph, master-choice spacing, shared-tail highlighting, legal purchases and reload, and rendered Elements/Life/Invocation/Spellcraft at compact and narrow sizes. The change is confined to the published Workshop; canonical rules and native Foundry remain on their existing pins.

## November 16 — seven-section spellbooks (#310)

Bruce corrected the underlying uneven progression after inspecting Life's four-mastery fan. Spellbooks now follow the martial construction: seven sequential steps, DP **1/2/2/3/4/4/5**, gates **1/1/1/3/3/3/7**, and spell grants **2/2/2/2/1/1/1**. His final clarification makes each of the 4/4/5-DP steps a single spell. Every book has three initial circles, three level-3 triangles and one level-7 diamond. This supersedes the four-section/independent-master-spell decisions and #308's visual-only adjustment.

The 29 themed lists remain eleven spells each, including Channeling. Existing recognizable spells supply the progression; adapted 5e, Rolemaster and HARP concepts take precedence over invented names or unrelated effects added merely to fill the tree. Canonical source audit in book #1332 explicitly accounts for replaced slots, consolidated effects and retired folios. A surviving spell retains its identity even when its position changes.

Portable schema 7 applies the learning transition once: old fourth-section purchases and separate mastery purchases return to the available DP ledger for relearning. Earlier sections, live resources, equipment and valid favorites remain. Current purchases survive subsequent saves/reloads. The updated books, learning list, atlas, spell library and revised Build-Offs use the same source; native Foundry stays on its existing pin.

Bruce's follow-up on Mordain's intellects: the four enchantments have Knowledge +1/+2/+3/+4 and communicate telepathically with their caster within six squares. The caster may use that fixed score for Knowledge rolls, including casting; chosen attributes still govern DP, class qualification and maximum SP. This is an intentional HoL adaptation of Rolemaster Enchanting Ways. Bruce confirmed the Rolemaster source is fine; his question about 5e concerned provenance. Canonical follow-up: book #1334.

## November 17 — readable SP formula and complete spell procedures (#322, #323)

Bruce simplified maximum SP to **2 × level + ancestry SP + 2 × positive class mental attribute + Spellcraft bonuses + other explicit SP bonuses**. This is algebraically the same reserve; negative or zero class attributes still contribute zero. Soul Capacity and Mind Capacity provide Spellcraft increases. Level gains enlarge capacity without refilling spent SP.

Goodberry now heals **1 HP per berry**, with a Maneuver to eat one and the healing-potion recipient rules when feeding another. Plant Growth becomes a **Main Action** that creates **difficult terrain**, with clear paths chosen when casting; it retains 3 SP and its printed area/range/duration. Bruce explicitly rejected a separate movement multiplier in favor of the existing terrain mechanic. Harvest improvement is removed. Mending, Fabricate, Shapechange and stored-spell runes now state their repair, completion, attack or attribute procedures clearly.

The Workshop receives the canonical descriptions, actions and reader-facing book edits, including the relocated objectives/social rules. Native Foundry remains on its prior pin pending its separate integration phase. These are rule/reference synchronization changes, not new automated terrain, healing or action-enforcement systems.

Workshop source is pinned to book commit `87f5141bd6e0da74a10c07b3239e975c7656430a` (book PRs #1351/#1353). Local acceptance passed 836 tests, Forge source validation, spell-atlas rendering and sheet casting/reload regressions. Plant Growth spends 3 SP once with no ritual or Sustain; its favorite, purchases and spent reserve survive reload. Rendered formula and inline Growth spell details were inspected at a compact desktop size. The updated creature overlays preserve the effective 192-creature/126-ability/73-summon roster and its numeric stats.


## November 17 — native Workshop and consumable controls (#325–#329)

Bruce authorized bringing the approved books and published Workshop into native
Foundry, using the Workshop’s NPC, creature, item, roll, chat and tool pages as
references alongside the PC sheet and character creator. The source for this
port is book commit `87f5141bd6e0da74a10c07b3239e975c7656430a`.
Implementation and acceptance status are recorded in [the port ledger](native-workshop-port-325.md).

Bruce also requested independent campaign checkboxes for tracking consumable
types: ammunition, lighting, potions, food, water, crafting materials and other
supplies. An unchecked type still requires an owned item and applies its usual
effect, but does not roll or deplete its supply die. These settings default to
tracking. Renaming an owned item changes its displayed name while preserving its
catalog identity, mechanics and acquisition history.

Lighting a torch is a Maneuver requiring a free hand. It occupies that hand and
lights the bearer’s square and three squares around them. While lit, its lighting
bundle receives one supply check per hour of **Foundry game time**. Extinguished
time does not count; partial hours carry forward. A completed combat round adds
six seconds. Disabled lighting tracking pauses consumption, not illumination.
Extinguishing or depletion restores the preceding token light when another
effect or the DA has not changed it in the meantime. These controls do not reveal
hidden tokens or automate environmental visibility rulings.


## November 17 — no old-character compatibility

Bruce clarified that this remains a playtest: do not maintain code to support old
characters. A character must migrate into the current rules or be invalid. This
release marks older native Actors invalid for play and requires a new current
hero. Their stored documents remain untouched for inspection/export; that is data
preservation, not a playable older edition. Legacy character creation, advancement,
wound and survival registrations are removed. Current gameplay services reject
unsupported old characters, and the retired portable-character importer is removed.
Only current Workshop normalization is supported.

## Independent signature choices — #330

Bruce clarified that signatures are individual choices at levels 1, 3 and 7, with no required order or automatically granted earlier abilities. Brief optional interactions with another separately learned signature are welcome. Full earlier ability text must not be copied inside later cards. Book PR #1355 corrected all ninety choices and the shared teaching; the reviewed source is `f71eac4c46fce6906d6dfbd1638ee98b10a6c538`. The engine, native Items and reference packs use each selected signature’s own complete rules and retain all selections. Seventeen higher-level procedures needed standalone activation/effect details; optional synergies remain prose conditions, never grants. Native and Workshop follow-through is tracked in #330.

## November 17 — Fencing, Tactics and Arms attributes (#333)

Playtest feedback called for Agility swordplay, Knowledge-based attacks and
support, and broader attribute choices within Arms. Fencing develops mobile
one-handed attacks, footwork, parries and weapon control. Tactics gives
Knowledge-based melee attacks and techniques for preparing a roll, helping an
ally or coordinating movement. Use the highest Tactics or Aid boon grant on a
roll. Measured Cut, Riposte and Duelist’s Boundary give a choice of Brawn or
Agility before rolling. Sweeping Blade and Iron Tempest use Brawn. The two
new starting backgrounds are Salle Student and Company Runner. Book PRs #1357
and #1359 supply the reviewed text. In the Fencing damage pass (#1361), Direct
Thrust I deals 1/2/4 and offers a step on Standard or Strong, and Direct Thrust
III makes that step safe from movement reactions. Measured Cut I deals 2/3/5
and offers its step on Strong. Fencing's other mobile attacks and counters
also give up damage for safer movement and positioning.
