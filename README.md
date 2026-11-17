# Heroes of Legend for Foundry VTT

Bruce Moser's **Heroes of Legend**, for Foundry Virtual Tabletop **V14**.
Version **3.0.0** brings the Character Workshop into native Foundry: guided creation, discipline learning and atlas, compact favorites and spellbooks, current HP/SP and recovery, and timed torch lighting. See the [implementation and test record](docs/native-workshop-port-325.md).

## Install and update

In Foundry **Setup → Game Systems → Install System**, paste this manifest URL:

```text
https://github.com/bruceamoser/heroes-of-legend-foundry/releases/latest/download/system.json
```

Select **Install**, then create a world using **Heroes of Legend**. The full release is published on [GitHub Releases](https://github.com/bruceamoser/heroes-of-legend-foundry/releases). No account on another service or external module is required.

Before updating, back up your world and return to Setup. Use the system's **Update** control when Foundry offers a newer version, then launch the world again.

For a local candidate, extract the ZIP directly into your isolated test data directory's `Data/systems/heroes-of-legend/`, with `system.json` immediately inside that directory. Never replace a running system's files. Public manifest/update checks and the exact-package isolated test are separate steps in the release checklist.

## Start playing

1. Install the system as described above, then create a Foundry V14 world using
   **Heroes of Legend**. For a local development build, follow
   [development setup](docs/development.md).
2. Join as the GM. A fresh world starts request processing automatically in the
   active GM's window; players do not need to enable a service or seek approval
   for ordinary actions. Keep that GM window connected while playing. World restarts recover recorded requests automatically;
   unrelated actions continue while an interrupted request is isolated.
3. Create a character with **Create hero**, complete the guided Workshop, then equip its owned Items
   and place its native Token. Legal creation and advancement options appear
   first; unavailable choices remain visible with their reasons.
4. Use the attack, roll or potion buttons on the relevant Actor or Item sheet
   for supported actions. Open other ability references from their rows or the
   roll dialog to read their effects; resolve specialty mechanics at the table
   unless a dedicated action button automates them. Select recipients with
   Foundry's native token targeting. Use the −3…+3 slider to adjust Boons/Banes;
   ordinary play does not require written reasons. Freely make a fresh defense
   roll when the table needs a correction.
5. Roll defense uses the player’s assigned character, or the GM’s selected token Actor.
   Missing or ambiguous selection gives a message. Numeric creature-attack damage
   is applied with the saved defense result.
6. For a healing potion, target one other Token or leave targets clear for
   self-use. Another owner's character receives a one-click consent offer.
   Encounter costs remain tracked during an active encounter; free play does
   not create a Combat or artificial action budgets.

If a Workshop use is interrupted, the character window’s **Reconcile pending
Workshop roll** command lets its owner review the saved resources and chat before
continuing. Remote shared-document coordination requires HTTPS; localhost is also
supported.

Prepare **The gathering** from Scenes or the system settings to create the editable
landing scene. It uses the Player’s Book artwork and links to the hero and rules
books. Activate it with Foundry’s normal scene controls when ready. See the
[landing scene guide](docs/landing-scene.md).

## Included content and manual resolution

- Import 757 current abilities/spells, 44 equipment entries and 192 creatures from the three content compendiums; 73 summon profiles are metadata for standard creature Actors. Creature action cards use their printed defense attribute and exact player-defense outcomes.
- Open the **Rules Library** for searchable local references: one Player’s Book with 391 pages and one DA book with 423 pages, using native sections, contents, search and paging. The DA can explicitly import the books; repeated imports preserve existing books and edits. Legacy imported entries remain untouched.
- Use the native character, NPC/creature and item cards, Favorites, spellbooks and discipline learning. Owners can select sheet portraits through Foundry’s image picker; selection saves immediately; custom item artwork is preserved when generic bag icons are refreshed.
- Creature artwork fits a 768px maximum edge with transparency retained. The 192 packaged portraits total 41.7 MB, 55.5% smaller than the previous derivatives.
- Use the implemented condition, HP/death, recovery, equipment, resupply, healing-potion and crafting workflows where applicable. Crafting records progress and catalog products and can check a selected carried material supply exactly once. The table still decides fictional time and tool requirements.

Workshop spell use pays its printed SP cost. Specialty action cards and optional ability references retain **manual effects** unless an explicit control performs them. They do not automatically interpret every condition, movement clause or special rule. Summons have distinct native reference profiles, portraits and attacker-oriented outcomes; spawning, controller commands, tether checks and lifecycle management remain with the DA. This release does not claim all-ability automation.

In **Game Settings**, choose which consumable types use supply checks. Use **Light torch** on an owned lighting bundle to light its token and start hourly game-time checks; **Extinguish torch** stops the clock. Item names can be changed in the inventory or Item editor without changing their rules.

Older characters are invalid for play under the current rules. Create a new hero in the Workshop. Stored old documents remain available for inspection/export; the system does not provide an older-rules mode.

World Actors and Items imported from compendiums are editable snapshots. Updating the system does not silently replace them with new compendium records. Review source changes before importing or applying an update to an existing world document.

## Development and sources

Use Node 24 (`.node-version`), `npm ci`, `npx playwright install --with-deps chromium`, then `npm run check`. Build output is `dist/heroes-of-legend/`; `npm run package:release` creates the install artifacts. Read [AGENTS.md](AGENTS.md), [development and native test evidence](docs/development.md), [data contracts](docs/data-contracts.md) and [acceptance scenarios](docs/acceptance-scenarios.md).

Rules are authored in the [Heroes of Legend book repository](https://github.com/bruceamoser/heroes-of-legend). The system uses the pinned approved player/DA source baseline recorded in [rules authority](docs/rules-authority.md) and the current journal/Forge source locks. [Interaction design](docs/interaction-design.md) and the [decision register](docs/decisions.md) describe the current scope.

Code and content licensing remain undecided. Retained source, artwork and provenance notices do not create additional license grants or assign a new license to the books or artwork.
