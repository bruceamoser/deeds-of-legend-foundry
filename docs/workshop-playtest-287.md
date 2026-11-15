# Character Workshop playtest (#287)

This rules pass is available in the browser Workshop. The printed book and
native Foundry still follow the book revision in `content/forge-source-lock.json`.
The build verifies that revision before applying the Workshop overrides in
`src/rules/forge-playtest-catalog.mjs`. The same overlay supplies the creator,
character sheet, roll/utility pages, and rules references.

- Build the hero at level 1. Pick two ancestry traits, one discipline from
  culture, one from background, and one discipline and a signature from class.
  Start with three distinct disciplines. The Learning screen opens on these
  paths, and the whole atlas is available.
- Start with 8 + Guile + Knowledge + Reason DP, counting negative values. Bank
  unused points. Each later level adds 4 + that level in DP. Traits that
  explicitly grant DP still apply.
- Starting SP comes from ancestry (0–3), culture (1), background (1), and twice
  the positive part of the class attribute. Use Knowledge for Arcanist,
  Intellect, Unbalanced, and Warden; Guile for Leader, Odd, and Shadow; Reason
  for Blade, Protector, and Shepherd. Later levels add +2 maximum SP without
  refilling current SP. Learned Spellcraft can add capacity or aid recovery.
- The Harness path is Light Armor → Brace in Armor → Armor II → Heavy Armor.
  Heavy training is level 3 and includes Ironbound Advance. The worn, trained
  suit supplies physical resistance 1/2/3. The first three steps of every path use only ordered prerequisites and DP costs;
  section IV and final path abilities open at level 3. Combined
  abilities keep their named endpoints and their level-7 costs of 3/4/5 DP.
- Sustain Spell uses a Maneuver and costs 0 SP. On the sheet, use **End my
  turn** to move the spell’s timer, and resolve its printed upkeep at the
  table. The Workshop tracks a hero’s spell, not the table’s initiative.

The six bundled examples have new learning plans. Saved and imported
characters are recalculated under the current rules; old choices that exceed
the new levels or budget remain available to review and remove. Current HP,
SP, scars, inventory and progression choices are carried across.

The automated examples include a 6-DP physical Arcanist (8 pages, 3 SP), a
10-DP battle caster (10 pages, 11 SP with Spellcraft), and a 13-DP generalist
who learns four recipes, several field techniques, and utility magic. These
are examples of reachable builds. At the table, compare how often the
techniques and spells matter, how many paid spells the party casts in a day,
and whether the earlier choices stay useful after later upgrades.

## November 15 correction (#293)

Only branch endpoints (level 3) and combined abilities (level 7) have level gates.
The earlier browser-only level-2 gates on spellbook section III, Spellcraft capacity,
and Watchful Shot III were unapproved and have been removed, along with
intermediate level-3 capacity gates. Ordered prerequisites and DP costs still apply.
The current sheet records manual sustain upkeep as described in
[the compact Workshop decisions](workshop-compact-289.md); the earlier End my turn
control described above has been removed.
