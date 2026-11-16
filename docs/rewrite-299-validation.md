# Rewrite 299 validation

## Source and publication

Canonical book source: `55cbd4c70f13704c684f7ba358f0d75bb62b1f30`, merged in [book PR #1331](https://github.com/bruceamoser/heroes-of-legend/pull/1331). Both books are published in [v17.0.0](https://github.com/bruceamoser/heroes-of-legend/releases/tag/v17.0.0). The final clean manifest identifies that commit; all uploaded asset digests match the local package.

The Player’s Book has 294 pages; the DA Guide has 310. Source, links, worked examples, complete spellbook spreads, entry-local transcription and PDF geometry checks passed. Six printed heroes passed 272 independent construction checks. The source repository's `design/revision/rewrite-299-pdf-quality.md` lists the inspected pages and exact audit scope.

## Workshop evidence

`npm run check` passed all **830 tests** under Node 24. Browser workflows below run separately through Playwright/Chromium, and are included in validation and Pages workflows.

- Source import validates all 19 disciplines, 329 training entries, 319 list spells, 20 mastery spells, 50 traits, 90 signature choices, 50 origins, 10 classes and six book heroes.
- All 39 revised Build-Offs are legal at levels 1, 3 and 7. Their validator independently reconciles DP/SP, class prices, gates, actual equipment and complete 21-DP primary paths; it also checks 30 deep and late-start signature compositions.
- Real Chromium workflows cover single-pool creation, discipline choice menus, class pricing, available-next learning and expanded planning, seven-step atlas paths and mastery, purchasing, favorites, inline mechanics, inventory, crafting, signature selection, level replay, saved characters, export/import and migration.
- Compact layout checks cover 900-pixel Foundry-sized use and narrow views down to 390 pixels (additional tools down to 320). Atlas checks exercise mouse pan/zoom, 20x close zoom, state colors, node shapes and keyboard controls.
- Casting checks cover signature SP costs, rituals, optional Soul Wellspring and Mind Palace payments, zero-SP sustained signatures, reload persistence, and safe-rest renewal. Fixed-duration spells preserve a different sustained spell; sustained replacements, expiration and unconsciousness end it as specified.
- First aid, lifetime Grit, Fortitude death marks, scars and Spellcraft recovery have functional tests. Debt tests distinguish dawn releasing unavailable HP from safe rest renewing the trait.
- NPC/creature/item previews, shared roll/chat previews, combat/journal/recovery/crafting tools and narrow layouts have browser regressions. Their current examples use the revised catalog.

Author review found and fixed omitted spellbook masteries, metadata-only signature spell costs, ritual timing detection, sustained signature persistence, Debt timing, stale crafting demonstration choices and a removed free-weapon assumption. Browser fixtures were revised to exercise the actual current rules, not merely to suppress failures.

These are construction, resource, rendering and interaction checks. They do not establish encounter balance, empirical class equivalence or native Foundry runtime parity. The native content lock, packs and world Actors are unchanged. Creature/encounter tuning remains deferred to the existing playtest issue.
