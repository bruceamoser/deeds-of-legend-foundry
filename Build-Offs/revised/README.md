# Revised trope Build-Offs

Pinned authored source `d6a241b85446be95d6391603880e7788b3c92715`. Thirteen continuing characters are validated at HoL levels 1, 3 and 7: **39 ready portable characters**. The earlier [Build-Offs](../README.md) remain unchanged historical comparison material.

- [barbarian: Harka Stormshoulder](barbarian.md)
- [bard: Lysa Silverstring](bard.md)
- [cleric: Brunna Hearthward](cleric.md)
- [druid: Thalen Reedwalker](druid.md)
- [fighter: Corin Ashguard](fighter.md)
- [monk: Sera Quietstep](monk.md)
- [paladin: Aldren Vowkeeper](paladin.md)
- [ranger: Eryn Mossarrow](ranger.md)
- [rogue: Pip Nightjar](rogue.md)
- [sorcerer: Ilyra Cinderblood](sorcerer.md)
- [warlock: Vesper Ashpact](warlock.md)
- [wizard: Vaelis Quillstar](wizard.md)
- [artificer: Nim Coppercoil](artificer.md)

Run `node scripts/generate-revised-build-offs.mjs` under Node 24 after the pinned Forge import. `--working-tree` with `HOL_BOOK_REPOSITORY` is authoring-only validation and must be regenerated after pinning. Every run verifies legal purchases, three starting disciplines through the shared engine, resource and inventory budgets, ready export/import, exact purchase ledger totals and a complete 21-DP primary path at level 7. Spellbooks use the same seven-step cost and gate sequence, with one spell at each of the final three steps. These checks establish internal legality, not empirical balance or fun.
