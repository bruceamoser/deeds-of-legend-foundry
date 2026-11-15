# Compact Character Workshop (#289)

This web-first revision implements the November 15 approved Figcraft layouts. Native Foundry sheets and the books remain separate work under #272/#287.

## Approved behavior

- Retain the original hanging icon tabs and existing sheet styling. Use thin borders and compact tables; details expand inline from the row arrow. Main contains favorites, alongside defenses, conditions, sustaining, movement/carrying, supplies and collapsible passive/ancestry references.
- Star learned abilities, universal actions, spells, and inventory items for Main. Item-derived rows keep their inventory favorite source. Favorites persist in the existing portable character format. Old sheets without a favorite collection receive a small initial selection; deliberately empty favorites remain empty.
- Attribute roll buttons use signed two-letter labels, including +0. Spell names include `(SP: X)` without a separate SP column. Abilities supports learned/basic/favorites filters; Spellbooks groups learned spells into collapsible books with discipline/timing/search filters.
- Preserve full rules, learned improvements, instrument choice and memorized-message controls inline. Casting still opens the actual roll workflow when a roll is required. Current HP/SP, lifetime Grit, recovery, first aid and supply rules are unchanged.
- The sheet has no target selection, round display, End turn or action-budget controls. Foundry/the table owns encounter timing. In this browser-only Workshop, Sustain records the next upkeep when the player spends their Maneuver at the table, costs 0 SP, and advances the spell's duration counter; it does not implement a second encounter clock or enforce the Foundry turn budget. Clear the spell when it ends at the table. Core Foundry/sustain rules are unchanged.
- Creator retains numbered stages. Its persistent summary uses current choices, attributes and actual DP ledger; no future class/vitals appear before class selection. Origins includes discipline options in dropdowns and inline context. Class preserves origin discipline visibility and uses compact signatures with inline mechanics.
- Learning keeps studied disciplines, source and learned counts visible, exposes all four paths, and shows exact requirements and costs on sequential named steps. `+ Add discipline` opens a searchable chooser. Paths and Atlas remain available, with mouse pan and cursor-anchored wheel zoom in Atlas. Book unlocks show learned spells, not player-facing page counts.
- Apply the previously approved Goblin correction: 1 ancestry SP, down from 2. No other ancestry formula changed.

## Validation

The compact UI check runs in both PR validation and Pages deployment. It exercises favorites/reload, inline details, signed rolls, spell filters/casting/upkeep, creation, learning purchases/level gates and chooser persistence. Captures are written to `test-results/workshop-compact` at 900 × 720.

Existing browser suites retain resource, recovery, ancestry, equipment, creation and unrelated page coverage, with selectors updated for the new controls. Unit tests cover raw spell timing and Goblin SP. Release evidence and the author-review result are recorded on issue #289 and its PR; these checks do not claim native Foundry runtime validation.
