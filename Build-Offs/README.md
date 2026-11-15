# Build-Offs

A trope comparison of **D&D level 2** with **Heroes of Legend level 1**, using Bruce’s working scale of one HoL level to roughly two D&D levels. Prepared November 15, 2026, after reviewing ancestry traits and class signatures against the revised Workshop rules.

The question is whether each version lets a player be the same kind of fantasy hero. This is not a damage-per-round contest or a claim that the systems have equivalent encounter budgets. A good match can use different actions, resource systems, and class names. A missing defining capability is reported as a gap rather than supplied by invented rules.

## Read in this order

1. [Ancestry trait review](ancestry-trait-review.md): all 50 current traits.
2. [Class signature review](class-signature-review.md): all 90 current signatures.
3. [Build comparison index and findings](findings.md).
4. The thirteen individual class comparisons linked below.

<!-- BUILD-INDEX -->

- [Barbarian — Harka Stormshoulder](barbarian.md)
- [Bard — Lysa Silverstring](bard.md)
- [Cleric — Brunna Hearthward](cleric.md)
- [Druid — Thalen Reedwalker](druid.md)
- [Fighter — Corin Ashguard](fighter.md)
- [Monk — Sera Quietstep](monk.md)
- [Paladin — Aldren Vowkeeper](paladin.md)
- [Ranger — Eryn Mossarrow](ranger.md)
- [Rogue — Pip Nightjar](rogue.md)
- [Sorcerer — Ilyra Cinderblood](sorcerer.md)
- [Warlock — Vesper Ashpact](warlock.md)
- [Wizard — Vaelis Quillstar](wizard.md)
- [Artificer — Nim Coppercoil](artificer.md)

## Baselines and method

- **HoL:** the published Character Workshop at commit `27200945e033ca3d2e9eabeed312d9ed0f7911a1`, including its current browser playtest overlay. The pinned book catalog alone is insufficient: it lacks later approved creation, resource, armor, sustain, gate, and class-price corrections.
- **D&D:** revised fifth-edition core rules (2024, now labeled 5.5e on D&D Beyond), with the Artificer identified separately. These builds do not mix 2014 subclass timing into 2024 characters.
- **Coverage:** Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard, and Artificer. Third-party/partner classes and subclasses are outside “base classes” here.
- Each D&D build uses standard-array attributes, documented background increases, fixed-average level-2 HP, and ordinary starting resources. Each HoL build uses attributes from −2 to +2 totaling +3, two traits, three distinct granted disciplines, one level-1 signature, and the current DP/coin budgets. Class-based discipline entry prices apply to additional disciplines.
- A shared name and concept do not imply identical ancestry biology. Tallfolk maps to a Goliath concept; Oath-Bound maps to a Human with oath-bound fiction on the D&D side. No unlisted species powers are granted.
- Builds are representative specialists, not maximally optimized proofs. An inability of one build to do something is distinguished from an absent rule across the system. We identify alternatives and the costs of taking them where relevant.
- HoL improves named techniques cumulatively. A list of purchases is not a list of separate attack buttons. Spellbook purchases, however, can add multiple independently usable spells. Each document separates investment from the resulting play choices.
- All heroes retain universal actions. HoL attacks ordinarily deal at least 1 damage, with the approved immunity exception; ongoing condition damage can be reduced to 0. SP is paid when casting; sustaining spends a Maneuver and 0 SP. One lifetime Grit point is available at HoL level 1.
- Spell counts, slot counts and SP totals measure different things. D&D short-rest features and HoL safe-rest/Spellcraft procedures are shown separately; we do not assume two short rests per day or silently replenish HoL SP.

## Reproduce and play

The `builds/` directory contains thirteen HoL portable character files for import into the [Character Workshop](https://bruceamoser.github.io/heroes-of-legend-foundry/). `hol-builds.json` records derived resources, purchases, and abilities; `dnd-builds.json` records the D&D construction choices. These are review fixtures, not new default party members or automatic changes to saved characters.

Using Node 24, regenerate the HoL fixtures and comparison documents, then validate both sets:

```sh
node scripts/generate-build-offs.mjs
node scripts/render-build-offs.mjs
node scripts/validate-build-offs.mjs
```

Validation demonstrates legal construction, consistent arithmetic, and importability. It does not demonstrate combat balance, fun, or the correctness of unresolved wording. The two review documents call out those limits explicitly. No ancestry trait, signature, spell, price, or core mechanic is redesigned by this documentation set.

## Sources and attribution

The comparison documents link official class references and the actual HoL data/decision files. The official [D&D class index](https://www.dndbeyond.com/classes) establishes the thirteen-class scope. The [SRD 5.2.1](https://www.dndbeyond.com/srd) supplies the open revised-rules baseline; the Artificer is outside that SRD and has a separately identified source and verification scope. No commercial rulebook scans or copied spell chapters are included.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. Build choices, calculations, paraphrases, and comparisons are adaptations; they are not official Wizards of the Coast builds or endorsements.
