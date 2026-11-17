# Version 3.0.0 — current Character Workshop in Foundry

This release brings the revised Heroes of Legend character rules and the published
Character Workshop into Foundry V14. The compact sheet, favorites, inline spell
details, guided creation, expandable learning list and full atlas use the same
controller as the web app.

## Character play

- Create and advance heroes using the current ancestry traits, signatures,
  class-priced disciplines and seven-step branches.
- Track current HP, SP, lifetime Grit, Fortitude death rolls and descriptive scars.
- Cast learned spells with their printed actions and SP costs; inspect improvements
  and spell details inline. Specialty effects still resolve at the table unless
  an explicit native control handles them.
- Preserve spent resources, equipment names and world edits through saves and
  advancement. Other connected owners’ conflicting changes are rejected rather
  than silently replacing their work.

## Equipment and encounters

Campaign settings independently control supply tracking for ammunition, lighting,
potions, food, water, crafting materials and other supplies. Custom equipment can
select its consumable type. Turning tracking off keeps item effects while skipping
supply checks and depletion.

Light an owned torch to illuminate its token within three squares. Its hourly
supply checks follow Foundry game time while lit, retaining partial hours through
extinguishing and relighting. Completed combat rounds advance six seconds.
Extinguishing restores previous light unless another effect or the DA has changed
it. Equipment names are editable without changing their underlying rules.

Native rules support separates damage and condition immunity, applies the minimum
one damage to attacks, and preserves immediate death-roll obligations. Equipment
attribute modifiers, exact-set values and curses affect play without changing
creation attributes or DP/SP calculations. Opening initiative and ambush use the
current alternating-side procedure.

## References and existing worlds

The bundled books and current ability/spell pack follow book commit
`f71eac4c46fce6906d6dfbd1638ee98b10a6c538`. Creature numeric budgets are unchanged.
Older characters are invalid for play. Create a new current hero; the old Actor
and its contents remain stored for inspection/export, without legacy gameplay support. Existing imported world documents remain editable
snapshots and are not silently overwritten.

## Validation

See [the acceptance ledger](native-workshop-port-325.md) for exact automated and
Foundry V14.370 runtime evidence. The release passed 856 automated tests, 19
browser/source checks and 30 native scenarios against the extracted release ZIP.
Author review corrected inventory preservation, shared supply operations, action
counters and packaged templates before publication.
