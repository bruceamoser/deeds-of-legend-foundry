# Native Workshop port — #325

## Authority and scope

Approved book: `f71eac4c46fce6906d6dfbd1638ee98b10a6c538`.
Published Workshop baseline: `0b0e792bdbe2553a31911fac06e8fd7afc4bd977`.
The PC sheet and creation flow, NPC, creature, item, roll, chat and tools pages
are all acceptance references. Compare equivalent content at matching window
widths and exercise actual interactions. Native Foundry retains its own targeting,
chat, document permissions and portrait picker.

## Decisions preserved

- Current creation, class-priced disciplines, seven-step learning and full atlas.
- Main sheet favorites, compact side tabs, full attribute names and inline details.
- Current HP, SP, lifetime Grit, Fortitude death rolls and descriptive scars.
- Sustain costs a Maneuver; printed spell duration and actions govern each spell.
- Preserve user-edited world documents and spent resources. Build drafts do not
  mutate committed characters; committing development is explicit.
- Current catalogs are authoritative; no edition selectors or rules-version menus.

## Implementation and validation

- #326: current Actor state, schema-7 import, full learned-node metadata and
  current reference packs are implemented. World edits and spent resources are
  retained; draft learning is separate from explicit committed advancement.
- #327: the actual shared Workshop controller mounts in an isolated native
  AppV2 surface. Native saves, dice, portrait editing, ownership and chat connect
  to Foundry document services.
- #328: current damage/condition immunity, attack-only minimum damage, native
  HP/death obligations, half-HP Grit, equipment attribute effects, opening
  initiative and completed-round game time are implemented.
- #329: consumable settings, native torch lighting/timed checks and equipment
  names are implemented and verified in the isolated runtime.

The final candidate passes **856/856 automated tests**, build/manifest validation,
and **19 browser/source checks**, including all ninety independent signatures,
39 legal trope builds, casting/Sustain, recovery, the atlas, shared native mount,
and NPC/creature/item/roll/chat/tool reference pages. The previous 915-test count
included retired-character tests removed with the corresponding unsupported code.

The native test server runs the extracted release ZIP, not the working source:
`1a7b8dc34d04b93fa9a24d7b4004de3ab1b6ec045b0e495991d5711ddba66859`
(SHA-256). The package contains 836 files and passed an extraction/byte comparison.
The isolated test runtime is Foundry **V14.370**, system **3.0.0**.

The final packaged PC runtime passed twelve scenarios: creation and commit,
portable import, native resource edits, external damage preserved through a queued
favorite save, compact layout, weapon renaming, equipped attribute bonuses,
learning and atlas, spell payment, Fortitude death obligations and reload.
No browser errors were recorded. All thirty native scenarios passed on this final ZIP: twelve PC, eight cards/items, seven play/encounter and three supply checks. Clean runs recorded zero browser and cleanup errors.

Current reference packs contain 757 ability/spell Items and 192 creatures;
creature numeric budgets are unchanged. Both reference journals use the approved
book pin (391 player / 423 DA logical pages). Retired wound tables are absent.
No campaign world was copied or modified.

Book PR #1355 corrected all ninety signatures. Both PDF audits passed (278/310
pages), including 159/159 ability/trait entries. The source and current packs
retain exactly the selected signatures, with optional synergies described separately.

## Native acceptance matrix

| Surface | Required verification | Status |
| --- | --- | --- |
| Character creation | Origins show discipline options, class prices, valid DP, equipment, commit/reload | Passed isolated V14.370 PC suite |
| Character Main | Favorites, full attributes, inline details, HP/SP, portrait, external updates | Passed isolated V14.370 PC suite |
| Learning | Available choices, expanded future steps, 3/7 gates, atlas zoom/pan | Passed isolated V14.370 PC suite |
| Spellbooks | Learned spells, printed actions/SP, cast costs, Sustain, rituals | Native Mage Hand payment/reload passed; shared browser casting suite passed |
| NPC / creature | Compact attributes/defenses, portrayal, actions, native defense targeting | Passed native cards and play suites |
| Item | Compact rules/properties, quantities/equipment, native editing, current spell cards | Passed native cards and play suites |
| Roll / chat | Actual Foundry dice, identical compact card, conditions/cover, replay | Passed automated and native play/multi-client checks |
| Tools | Opening roll, ambush, encounter turn sequence and recovery | Passed automated and native play/multi-client checks |
| Existing worlds | No automatic rebuild/reset; arbitrary Items/effects preserved | Automated and native custom-item preservation checks passed; real campaigns untouched |
| Permissions | Observer read, owner write, multiple clients and stale updates | Passed automated and native play/multi-client checks |

Specialty effects and forced movement remain table-resolved unless a native control
explicitly implements them. These checks do not claim complete effect automation.

Concurrent supply use reduced d8 to d6 to d4 while preserving unrelated Items.
Torch checks followed game time; untracked potions retained their effect without
a depletion roll. Loot and subsequent saves retained all original equipment
Items. Evidence was captured under `test-results/native-other-325/` and
`test-results/native-workshop-327/`.

## Final review corrections

- Fixed the shared roll dialog's condition-variable initialization before rendering.
- Kept each signature's complete own rules and normalized reference paragraphs;
  regenerated the same pinned catalog and verified all ninety rendered choices.
- Included constant-ID AppV2 templates in the runtime package graph, with required
  recovery, encounter, crafting and landing-template regression coverage.
- Serialized supply and torch operations through the GM coordinator. Concurrent
  owners consume d8 → d6 → d4; targeted Item updates preserve unrelated edits.
  Saved-result retries and nested torch recovery perform no additional die roll.
- Initialized native encounter budgets and refreshed Speed/action counters at turn
  selection; expired defense benefits mechanically and visually at the next own turn.
- Allowed valid cross-client requests to queue behind a running GM operation while
  retaining the authority-side block for genuinely interrupted actions.
- Loaded explicit catalogs before the first authority-side inventory overlay after
  import; removed the module-global catalog dependency. Sheet saves reject
  implicit equipment retirement before writing, while explicit deletion remains supported.
- Preserved spent budgets on roster changes and restored the retained-action choice
  for Dazed/Grappled turns.
- Installed Chromium before the Pages signature-rendering check.

The final package's 353 Workshop files match the files used for the nineteen
passing browser/source checks byte for byte. Native services and templates are
verified separately against the extracted release ZIP.
