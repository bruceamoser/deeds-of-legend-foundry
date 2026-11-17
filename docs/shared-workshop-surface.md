# Shared Workshop surface (#327)

`web/workshop-mount.mjs` exports `await mountWorkshop(elementOrShadowRoot, options)`.
The system build ships it at `workshop/workshop-mount.mjs` with the published
Workshop controller, styles, artwork and pinned data. It mounts the actual
character sheet, creation flow and learning atlas in a ShadowRoot. The published
`index.html` still boots its original document surface automatically.

Options:

- `initialState`: portable character or saved envelope `{character, mode, tab, step}`.
- `initialMode`: explicit `sheet` or `builder` initial view.
- `dataBaseUrl`: directory URL containing `data/`, CSS and `assets/`; defaults to the module directory.
- `data`: optional data objects by filename stem (`choices`, `inventory`, `references`, `example`, `wounds`, `forge`, `forge-references`). Missing entries load from the directory.
- `readOnly` or `host.readOnly`: disables mutations while retaining navigation and references. Document permissions remain the host's responsibility.
- `host.portraitUrl`, `host.commitLabel`: native portrait and creation completion label.
- `host.onChange(savedEnvelope, basis)`: serial asynchronous persistence; optional `host.captureSaveBase()` is cloned when a save is enqueued and passed unchanged as `basis`. Native mounts never use browser storage as persistence.
- `host.onCommit(portable)`: explicit completion from creation Review or development Done, after pending saves finish.
- `host.onAction(event)`: asynchronous interception. Return `true` when handled, otherwise the shared action proceeds. Event includes `action`, `id`, `dataset`, portable `state`, `preview`, `record`, `activeRoll` and dialog `values`. `native-portrait` requests the host's standard portrait editor.
- `host.onRoll(request)`: asynchronous Foundry dice adapter. Return an array of integer faces, exactly `count` entries in `1..sides`. Request includes `count`, `sides`, `kind` (`attribute`, `death`, `supply`), portable `state`, plus applicable `attribute`, `net`, `activeRoll`, `plan` or `item`. The host may post the native Roll/ChatMessage. The shared controller then applies its real costs, supply changes, death marks and results. Do not suppress these actions through `onAction` when using this adapter.

The returned controller provides `getState()`, `setState(savedEnvelopeOrPortable)`,
`useAbility(catalogId)`, `openRoll(settings)`, `flush()`, `settle()` and `dispose()`. `useAbility` validates learned/universal choices and invokes the same real control path. `flush` awaits queued persistence; `settle` awaits active actions and persistence before closing;
dispose removes listeners, timers, open dialogs and the mounted DOM. Multiple
mounts keep independent state, dialog IDs, queries, events and atlas interactions.

`node scripts/check-workshop-mount.mjs` checks two simultaneous mounts, an actual
field update persisted to the host, native portrait/dice interception, independent
dialogs, and absence of browser-storage writes. Existing Workshop browser checks
remain the regression evidence for the published controller. Native Foundry
permissions, live Actor persistence and complete visual acceptance need the
separate runtime checks; extraction tests do not establish those scenarios.

## Native Actor sheet integration

`WorkshopCharacterSheet` is the default character sheet. Blank Actors show an
explicit creation entry; previous native Actors offer inspection/export through
Foundry controls or recreation as a separate Actor. They have no alternate playable rules sheet. Current Actors mount the shared surface.
Native writes use revision-checked document services, identity edits use the
identity-only service, and explicit construction completion commits learned Items.
Live sheet reloads overlay native resources even when a damage/equipment change
does not increment the Workshop revision. Own pending writes preserve the live DOM.

Native chat uses the actual shared `chat-cards.mjs` renderer with native Roll dice
and V14 message visibility. Roll again opens the same Workshop dialog. Death rolls
acknowledge only the pending damage event captured before those dice were rolled.
`tests/workshop-character-sheet.test.mjs` checks lifecycle, permissions, identity
save boundaries, native chat/dice adapters and same-revision live refresh behavior.
These checks use mocked Foundry APIs and do not establish runtime visual parity.

Native spending/dice have a persistent operation marker before costs/evaluation.
Evaluated faces are recorded before chat. A failed acknowledgment leaves the marker
and blocks another use; the owner must explicitly reconcile the character/chat via
the window menu. Successful use acknowledgments leave a completion receipt.
This is an unresolved-operation block, not automatic replay or a claim of
exactly-once recovery after arbitrary network failure.

Open sheets accept authoritative imported/external name and story on refresh when
Edit is off. During Edit, they retain local pending identity while still refreshing
live resources. The focused tests `open native sheet refreshes imported name and
story outside Edit` and `native Edit retains local name and story while refreshing
live resources` in `tests/workshop-character-sheet.test.mjs` cover both branches
with an external revision change; they are mocked lifecycle checks, not a native
Import Data dialog runtime test.

## Owned native items and play burden

`host.nativeItems()` supplies fallback cards for custom equipment and abilities.
The shared Inventory and Abilities tabs open their real native Item cards, including
for observers. Other ability cards remain distinct from learned Workshop choices.
Known unmanaged catalog gear stays in its shared inventory row with an Open card
control; `host.canDeleteItem(item)` suppresses the shared removal control when
removal must happen on the original native document.

`host.projectInventory(items)` returns `{items, additional}` for play presentation.
The native adapter projects actual quantity, aggregate Bulk, hands and arrangement
onto matched shared items, and adds unmatched owned equipment solely to burden
calculation. The current ancestry, capacity, encumbrance and Speed calculation then
runs on that projection; no custom choice is inserted into the catalog or portable
construction. Native effective attributes affect carrying capacity while creation
pools, learned choices and maximum HP/SP retain their base rules. The adapter never
writes, adopts or replaces the original native documents.

`host.tracksItem(item)` overrides the category tracking map using the original
native Item's consumable type; unmatched creation drafts retain the category map.

Validation: `tests/native-inventory-projection.test.mjs` checks edited native Bulk,
quantity, torch hands, custom carried/stored burden, Speed, unchanged creation and
effective Brawn capacity. The source-mounted `scripts/check-workshop-mount.mjs`
checks fallback equipment/ability card access under read-only permissions, hidden
misleading removal controls, custom burden/Speed and per-item tracking overrides.
It serves current web/rule modules directly with staged pinned data, without
rebuilding or accessing the native runtime candidate.
