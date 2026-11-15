# Cleric — Brunna Hearthward

A shrine-keeper who heals the wounded and stands between companions and supernatural danger.

**D&D level 2 ↔ HoL level 1. Strong healer and warder, but the selected kit does not reproduce the undead-turning/channel-divinity loop.**

[Comparison method](README.md) · [Import this HoL character](builds/cleric.hol.json) · [All findings](findings.md)

## Side-by-side build

| Choice | D&D | Heroes of Legend |
|---|---|---|
| Identity | Dwarf; Cleric, level 2 | Hill Dwarf; Shepherd, level 1 |
| Background | Acolyte | Cloister Valleys → Wards; Grave Attendant → Life; class → Medicine |
| Attributes | STR 13 (+1), DEX 10 (+0), CON 14 (+2), INT 8 (-1), WIS 17 (+3), CHA 13 (+1) | Brawn +0, Agility +0, Fortitude +1, Guile +0, Knowledge +0, Reason +2 |
| HP / defense | 19 HP; AC 15 (Chain Shirt 13 + DEX 0 + Shield 2) | 17 HP; trained light armor: physical resistance 1; player-rolled defense |
| Movement | 30 feet | 5 squares; carried Bulk 7/10 |
| Creation benefits | Magic Initiate (Cleric); Darkvision 120 ft; Poison resistance; Advantage to avoid/end Poisoned; Dwarven Toughness: +1 HP per level; +2 already included; Stonecunning: Bonus Action, 60 ft Tremorsense for 10 minutes while touching stone; 2 uses/Long Rest | Hard as Bedrock: Maximum HP +1.; Rooted in Stone: Stability +1. You gain 1 Boon to Guile rolls. |
| Class choices | Divine Order: Protector (martial weapons and heavy-armor training; starting gear remains chain shirt); Channel Divinity: Divine Spark or Turn Undead; Dwarven Resilience; Toughness; Stonecunning | Mend (free signature); exact effect below |
| Skills and training | Insight +5, Religion +1, Medicine +5, Persuasion +3 | Light Armor |
| Limited resources | Channel Divinity 2 uses: regain one/Short Rest, all/Long Rest; Divine Spark: 1d8+3 healing or damage with its save; Three level-1 slots/Long Rest; Stonecunning: 2 uses/Long Rest; 2d8 Hit Dice | 6 maximum SP; 1 lifetime Grit; 1 DP saved |
| Main attacks | Mace +3, 1d6+1 bludgeoning; Sacred Flame: DEX save DC 13, 1d8 radiant | Use the actual learned technique or spell shown below; Weak / Standard / Strong outcomes are not hit/miss rolls. |
| Spell selection | Ability: Wisdom; Attack: 5; Save Dc: 13; Cantrips: Sacred Flame; Light; Mending; Prepared: Healing Word; Guiding Bolt; Cure Wounds; Shield of Faith; Detect Magic; Slots: 1: 3; Additional: Source: Magic Initiate (Cleric); Ability: Wisdom; Cantrips: Guidance; Thaumaturgy; Prepared: Bless; Free Cast: Bless: once per Long Rest; also castable with spell slots. | 8 learned spells; 3 cost 0 SP. All listed below. |
| Equipment | Method: Class starting package A plus background package A; no assumed adventure treasure.; Class Package: Chain Shirt; Shield; Mace; Holy Symbol; Priest’s Pack; Background Package: Calligrapher’s Supplies; Prayer Book; Holy Symbol; 10 parchment sheets; Robe; Additions: —; Gold Remaining: 15; Initial Gold: 15; Coin Breakdown: Class Package: 7; Background Package: 8; Additional Purchases: 0; Remaining: 15 | 1 × Mace (held); 1 × Ordinary Light Armor (worn); 1 × Ordinary Shield (held); 1 × Travel Pack; 1 × Food Bundle; 1 × Water Flask; 1 × Sleeping Roll |
| Tools / languages / saves | Tools: Calligrapher’s Supplies; Languages: Common; Dwarvish; Elvish; Saves: Wis: 5; Cha: 3 | Languages: Common, Dwarven. Rolls use the named HoL attribute and explicit Boons/Banes. |

## D&D play loop and limits

Protect the front line with Bless or Shield of Faith, use healing or Divine Spark when needed, and confront undead with Channel Divinity.

- No subclass at level 2 under the 2024 class progression.
- Protector grants heavy-armor training, not free heavy armor; AC uses the actual starting chain shirt.
- Use normal free-hand, focus, armor and component rules; stow a held weapon when casting needs that hand.

**Construction check:** standard array Str: 13; Dex: 10; Con: 14; Int: 8; Wis: 15; Cha: 12; background increases Wis: 2; Cha: 1. HP calculation: 8 + 5 + 2 × CON 2 + 2 Dwarven Toughness. Proficiency bonus +2; initiative +0.

## HoL investment

Starting DP: **8 + Guile (+0) + Knowledge (+0) + Reason (+2) = 10**. Spent **9**, saved **1**. Starting coins **55**, spent **51**, remaining **4**; no coin override. The three starting disciplines above are grants. Additional disciplines below use the class’s actual entry price.

| Learn in this order | DP | What it adds |
|---|---:|---|
| Restoration I | 1 | Learn Spare the Dying, Cure Wounds |
| Restoration II | 2 | Learn Healing Word, Lesser Restoration |
| Protection I | 1 | Learn Sacred Flame, Shield |
| Sanctuary I | 1 | Learn Resistance, Sanctuary |
| Armor | 3 | Wear your protection as though it were part of you. |
| Light Armor | 1 | Passive. You can benefit from worn light armor. The suit provides physical resistance 1. |

Improvements modify the same named ability. They do not create additional attacks or actions. Printed catalog level 0 means no milestone gate on these entries; this character is created once at level 1. Branch endpoints require level 3 and combined abilities level 7.

### Signature: Mend

**Action:** Main Action · **Attribute:** Reason

**Target / range / shape:** One living ally within 3 squares.

pay 1 SP before rolling. You must have enough SP to pay this cost. Requires a free hand. Make a Reason roll. Weak: restore 3 HP. Standard: restore 6 HP. Strong: restore 9 HP, and the target may stand without spending movement. Reduce the restored amount by the target's Life resistance, to a minimum of 1 if HP is missing, and never exceed maximum HP. A Dying or stabilized living creature can receive this healing. This does not erase scars or restore the dead.

**Duration:** Immediate.

**Equipment / acquisition:** A free hand.

**Use limit:** Repeatable; normal action economy applies.

### Learned spells

These are HoL effects, not the D&D spells’ full rules despite familiar names. Costs shown are paid when cast; ongoing sustain uses a Maneuver and 0 SP.

| Spell | SP | Timing / roll | Target / duration | Effect |
|---|---:|---|---|---|
| Spare the Dying | 0 | Maneuver; None | One adjacent Dying creature; Instant | Steady the creature's breathing. Stabilize it at 0 HP and clear both death roll tallies, following the normal stabilization procedure. |
| Cure Wounds | 1 | Main Action; Reason | One adjacent living creature; Instant | Close fresh injuries with a warm touch. Restore 3/5/7 HP, applying the recipient's Life resistance and maximum HP. |
| Healing Word | 1 | Maneuver; Reason | One living creature within 4 squares that can hear you; Instant | Speak a brief word of renewal. Restore 1/2/3 HP, applying Life resistance and maximum HP. |
| Lesser Restoration | 2 | Main Action; Reason | One adjacent living creature; Instant | Choose Poisoned, Blinded or Deafened. Reduce its temporary rating by 1/2/3. This also treats a lasting instance whose source specifically names Lesser Restoration as its remedy. |
| Sacred Flame | 0 | Main Action; Knowledge | One creature within 8 squares; Instant | Call a descending spark of sacred light. Deal 2/3/5 radiant damage. |
| Shield | 1 | Reaction · before you roll a defense against a visible attack; None | Self; The triggering defense | Raise a translucent shield. Gain 1 Boon to the defense, then reduce the attack's damage by 1 after resistance, minimum 1. |
| Resistance | 0 | Maneuver; None | One willing creature within 3 squares; Until your next turn ends | Choose fire, cold, lightning or poison. Grant resistance 1 to that type, using the highest matching resistance. |
| Sanctuary | 1 | Main Action; None | One willing creature within 3 squares; 1 minute | Give the recipient 1 Boon to defenses while it attends to healing, movement or other peaceful actions. Its first attack or harmful spell ends the ward after that action resolves. |

## At the table

**Suggested favorites:** Mend, Sacred Flame, Healing Word, Shield, Sanctuary; keep first aid and Stabilize among universal actions.

**Combat:** Choose between Sacred Flame offense and paid healing. Mend costs 1 SP and requires a free hand: with mace and shield held, free the weapon hand before using it. Shield is a spell Reaction and competes with other responses. Healing does not restore the dead or erase scars.

**Away from combat:** Restoration II adds condition treatment; Sanctuary and protective magic support rescue. Studying Medicine alone grants no learned treatment; ordinary first aid still needs suitable supplies. The priced catalog lacks a medical-supplies entry, so arrange those with the DA rather than invent free stock.

**Tradeoffs:** Armor is expensive for Shepherd: adding it costs 3 DP and learning light armor costs 1 more. That investment buys physical resistance 1, not medium/heavy armor. One DP is banked. Mend and Cure Wounds use the same reserve, so their overlap should be weighed when choosing the signature.

**Test this:** Run two rescues before overnight recovery. Does choosing Mend feel meaningfully different from a spellbook heal, and does the player remember the free hand?

### Gaps kept visible

- Mend overlaps Cure Wounds; healing remains paid from the same SP reserve.
- No Turn Undead or Divine Spark equivalent is selected; Sacred Flame supplies the divine attack identity.
- Medicine study is present but no learned first-aid ability is purchased; medical supplies have no priced catalog entry.

## Sources and verification

D&D: [Official SRD 5.2.1: class, species, background, feats, equipment and spells](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf), [Official 2024 Basic Rules — Character Classes](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), [Publisher 2024 Cleric class reference](https://www.dndbeyond.com/classes/2190877-cleric). Edition and any source limitation are recorded in [the D&D build data](dnd-builds.json). The chosen character’s stats and equipment arithmetic are construction choices, not claims of official sample-character status.

HoL: [current catalog](../static/data/forge.json), [browser rule overlay](../src/rules/forge-playtest-catalog.mjs), [class-price decisions](../docs/workshop-learning-295.md), [derived build record](hol-builds.json). The portable character passes the current Workshop validator and ready export/import; see [reproduction instructions](README.md). Review caveats remain in the [trait](ancestry-trait-review.md) and [signature](class-signature-review.md) audits. No unresolved ruling has been silently converted into a new benefit.
