# Learning list, atlas, and class prices — November 15, 2026

Issues: #291 (origin labels), #293 (level gates), #294 (class costs and chooser), #295 (learning views). Book integration is pending; this revision changes the web Workshop first.

## Decisions from Bruce

- Default learning shows only what the character can purchase now: sufficient DP, prerequisites, and level. One next choice per branch, grouped by discipline. Show the branch, next ability, cost, Learn now button, and actual mechanics.
- After a purchase, that branch advances to its next choice. Expand the same branch to inspect learned and future choices. Provide Show all branches for planning when the next purchase is unavailable.
- Keep the complete interactive atlas alongside the compact list. Use the same purchases, prerequisites, and prices. Preserve expansion and scroll during learning.
- Adding a discipline uses class-based 1/2/3 DP prices. Starting culture, background, and class disciplines remain grants. Four branch purchases remain 1/2/2/3 DP for this implementation: entry, two improvements, endpoint. Bruce questioned these step prices; reconsidering them remains a balance topic, not an approved replacement formula.
- Level gates are 3 (branch endpoints) and 7 (combined abilities), with no additional intermediate gates.
- Culture and background dropdowns show their discipline options before selection.

## Complete entry-price mapping used for web testing

The existing mundane affinities are preserved. New magical affinities extend each class's role. All disciplines not listed cost 3 DP. Odd retains its original generalist price of 2 DP for every discipline. These mappings are implementation balance choices under Bruce's instruction to price all disciplines by class identity; they are not a claim of an individually approved book table.

| Class | 1 DP | 2 DP |
|---|---|---|
| Arcanist | Elements, Force, Spellcraft | Invocation, Scholarship, Divination, Wards |
| Blade | Arms, Marksmanship | Athletics, Subterfuge |
| Intellect | Scholarship, Craft | Medicine, Mentalism, Divination, Force, Spellcraft |
| Leader | Influence, Guard | Arms, Scholarship, Mentalism, Wards |
| Protector | Armor, Guard | Arms, Medicine, Wards |
| Shadow | Subterfuge, Marksmanship | Athletics, Mentalism, Divination |
| Shepherd | Life, Wards | Medicine, Wilderness, Invocation, Spellcraft |
| Unbalanced | Arms, Athletics | Armor, Elements |
| Warden | Wilderness, Marksmanship | Arms, Athletics, Life, Divination |
| Odd | — | Every discipline |

Costs come from the shared eligibility engine, including charging, affordability, ledger replay, refund-by-removal, chooser, atlas, and list. Existing browser drafts recalculate under current rules; a now-unaffordable purchase is reported for repair rather than silently deleted.

## Book follow-through

Before updating the manuscript, reconcile this file with `workshop-playtest-287.md` and `workshop-compact-289.md`. Update character creation, advancement, class tables, and learning explanations together; keep player prose about learning rather than implementation terminology.

**Required follow-up: #296.** Review every ancestry trait and class signature against revised rules. Some no longer make sense. Audit grants, resources, actions, obsolete mechanics, overlap, and balance; present mechanical changes for Bruce's decision. This UI release does not claim that audit is complete or silently rewrite those traits/signatures.

Native Foundry and the book are not changed by this revision.

## Validation record

Node 24 build and repository validation passed with all 816 tests, including the ledger/export/refund regression. Browser suites passed for compact learning, full Forge flow, character creation, ancestry, play, sustain, resources, recovery, builder/equipment, sheet prototypes, roll/chat previews, and tools. Reviewed rendered 900×720 list, expanded branch, atlas, and chooser captures; narrow layouts are covered by browser checks. Final budget review uses successful ledger purchases, so invalid saved choices cannot inflate the displayed pool. GitHub CI supplies the final aggregate test count and deployment evidence.

## Atlas refinement before publication

Bruce's follow-up: open the atlas in a large popup rather than constraining it to the learning pane. Make learned versus unlearned nodes clearly distinguishable and allow substantially closer zoom. The compact list remains the underlying working view; atlas purchases update the same character. Modal close/Escape returns to the list without losing branch expansion or discipline filter. The atlas supports up to 20× zoom, shows ability labels at close zoom, and distinguishes learned choices with gold fill and check marks, available choices with green borders, and future choices with dashed outlines. Its own inspector remains available alongside the map (stacked on narrow screens).
