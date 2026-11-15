// These choices apply to the browser playtest. The pinned book catalog is the source
// for every entry without an override and remains available to existing consumers.
const classOptions = {
  "class-arcanist": ["elements", "force", "invocation", "spellcraft"],
  "class-intellect": ["scholarship", "craft", "mentalism", "divination"],
  "class-odd": ["athletics", "subterfuge", "influence", "spellcraft"],
};

// Entry prices preserve existing mundane affinities and extend them to the new
// magical disciplines by class identity. Unlisted disciplines cost 3 DP.
const classAffinities = {
  "class-arcanist": [["elements", "force", "spellcraft"], ["invocation", "scholarship", "divination", "wards"]],
  "class-blade": [["arms", "marksmanship"], ["athletics", "subterfuge"]],
  "class-intellect": [["scholarship", "craft"], ["medicine", "mentalism", "divination", "force", "spellcraft"]],
  "class-leader": [["influence", "guard"], ["arms", "scholarship", "mentalism", "wards"]],
  "class-protector": [["armor", "guard"], ["arms", "medicine", "wards"]],
  "class-shadow": [["subterfuge", "marksmanship"], ["athletics", "mentalism", "divination"]],
  "class-shepherd": [["life", "wards"], ["medicine", "wilderness", "invocation", "spellcraft"]],
  "class-unbalanced": [["arms", "athletics"], ["armor", "elements"]],
  "class-warden": [["wilderness", "marksmanship"], ["arms", "athletics", "life", "divination"]],
};

const classAttributes = {
  "class-arcanist": "knowledge",
  "class-blade": "reason",
  "class-intellect": "knowledge",
  "class-leader": "guile",
  "class-odd": "guile",
  "class-protector": "reason",
  "class-shadow": "guile",
  "class-shepherd": "reason",
  "class-unbalanced": "knowledge",
  "class-warden": "knowledge",
};

const ancestryResources = {
  "ancestry-deep-dwarf": { spContribution: 1, coinContribution: 2 },
  "ancestry-gnome": { spContribution: 3, coinContribution: 0 },
  "ancestry-goblin": { spContribution: 1, coinContribution: 1 },
  "ancestry-halfling": { spContribution: 1, coinContribution: 3 },
  "ancestry-high-elf": { spContribution: 2, coinContribution: 1 },
  "ancestry-dwarf": { spContribution: 0, coinContribution: 2 },
  "ancestry-human": { spContribution: 1, coinContribution: 1 },
  "ancestry-oath-bound": { spContribution: 2, coinContribution: 0 },
  "ancestry-tallfolk": { spContribution: 0, coinContribution: 1 },
  "ancestry-elf": { spContribution: 1, coinContribution: 2 },
};

const secondOptions = {
  "origin-background-burglar": "athletics",
  "origin-background-dragon-dreamer": "mentalism",
  "origin-background-itinerant-tinker": "influence",
  "origin-background-weather-apprentice": "divination",
  "origin-culture-highland-holds": "wilderness",
};

const nodeChanges = {
  "armor:harness:1": {
    name: "Light Armor",
    effect:
      "Passive. You can benefit from worn light armor. The suit provides physical resistance 1.",
  },
  "armor:harness:2": {
    name: "Brace in Armor",
    effect:
      "When wearing armor you are trained to use, gain 1 Boon on a defense roll against an effect that would push, pull, or slide you.",
  },
  "armor:harness:3": {
    name: "Armor II",
    effect:
      "You can also benefit from worn medium armor. The suit provides physical resistance 2.",
  },
  "armor:harness:4": {
    name: "Heavy Armor",
    effect:
      "Maneuver · Ironbound Advance. Move up to 3 squares through nonmagical difficult terrain, ignoring its extra movement cost. Until your turn ends, gain Stability 2.\n\nYou can also benefit from worn heavy armor. The suit provides physical resistance 3.",
    action: "Maneuver",
  },
  "marksmanship:readiness:1": {
    effect:
      "Reaction. When a visible enemy finishes voluntary movement adjacent to one of your allies and within 6 squares of you, attack the enemy with Agility for 1/2/3 physical damage. You need a ready ranged weapon.",
  },
  "marksmanship:readiness:3": {
    effect:
      "Watchful Shot deals 1/2/4 physical damage instead of 1/2/3. You can trigger it when any visible enemy within range finishes voluntary movement.",
  },
};

const counterspellTrigger =
  "when a visible caster within 4 squares finishes a non-Ritual spell costing 1 SP or less";

const spellChanges = {
  "spell:dreams:2": {
    effect:
      "Send drowsiness over the target. Apply Slowed 1/2/3. On Strong, the target also falls Asleep 1 if it is willing or already helpless. Damage or ordinary waking ends Asleep.",
  },
  "spell:binding:3": {
    effect:
      "Bands of pale light grip the target’s limbs. Apply Slowed 1/2/3. On Strong, it also loses Reactions until the start of its next turn.",
  },
  "spell:dreams:5": {
    effect:
      "Weave a mesmerizing display. Apply Dazed 1 to each chosen target. On Strong, increase Dazed to 2 for one of them.",
  },
  "spell:unraveling:2": {
    actionText: "Reaction · " + counterspellTrigger,
    trigger: counterspellTrigger,
    target: "The triggering spell",
    effect:
      "Add 1/2/3 cancellation progress. The target is 2 plus the spell’s printed SP cost. If you meet it, the spell ends before resolving. Otherwise the caster takes 1 Bane on its resolution roll and the progress expires.",
  },
  "spell:passage:4": {
    target:
      "Self and one adjacent willing creature; visible destination within 4 squares",
    effect:
      "Step through a brief doorway together with your carried gear. Each traveler arrives in an unoccupied supported square next to the destination. Both ends need enough room for both travelers. If a teleportation ward intervenes or either traveler cannot arrive, both remain at the origin.",
  },
  "spell:passage:5": {
    actionText: "Ritual · 10 minutes",
    ritualTime: "10 minutes",
    target:
      "Self and up to three adjacent willing creatures; a known destination within 50 squares",
  },
  "spell:flame:4": {
    effect:
      "Heat the item until it glows. Its wearer or holder takes 2/3/5 fire damage when cast. Each later round you sustain it, a creature still touching the item takes 1 fire damage. A holder may drop it immediately after damage. Worn items take their normal removal time.",
  },
  "spell:channeling:a3": {
    effect:
      "Choose a donor and recipient. On casting, and on each later upkeep, transfer up to 6 existing SP if both consent, or roll for 2/4/6 if either is unwilling. Use the donor’s current reserve and recipient’s missing SP as limits. The bridge ends if either moves beyond 6 squares of you. Pay the casting cost separately.",
  },
  "spell:growth:2": {
    target:
      "Every grounded creature in a 1-square-radius area of soil within 6 squares",
    effect:
      "Roots grasp through soil. Apply Slowed 1/2/3 to affected creatures. The area is difficult terrain while sustained. Each upkeep renews Slowed 1 on creatures still in the area. Ordinary decay applies after they leave.",
  },
};

const armor = {
  "item-ordinary-light-armor": { name: "Light Armor", physicalResistance: 1 },
  "item-ordinary-medium-armor": { name: "Armor II", physicalResistance: 2 },
  "item-ordinary-heavy-armor": { name: "Heavy Armor", physicalResistance: 3 },
};

const sustainRule =
  "Once per turn, use a Maneuver by the end of your turn to keep one sustained spell active through the end of your following turn, up to its printed maximum duration. Sustain costs 0 SP and includes the spell’s listed upkeep effects.";

const sustain = {
  id: "ability-sustain-spell",
  name: "Sustain Spell",
  level: 0,
  dp: null,
  sp: 0,
  action: "Maneuver",
  attribute: "None",
  target: "One spell you are sustaining",
  duration: "Through the end of your following turn",
  effect: sustainRule,
  reference: {
    flavor: [],
    rules: {
      details: [
        { label: "Action", value: "Maneuver" },
        { label: "SP", value: "0" },
        {
          label: "Target / range / shape",
          value: "One spell you are sustaining",
        },
        { label: "Duration", value: "Through the end of your following turn" },
      ],
      body: [{ text: sustainRule }],
      notes: [],
    },
  },
};

function originChoice(origin, disciplines) {
  const alternate = secondOptions[origin.id];
  const pairs = alternate
    ? [origin.pairs[0], { disciplineId: alternate }]
    : origin.pairs;
  const names = pairs.map(({ disciplineId }) => disciplines.get(disciplineId));
  const prose = origin.referenceMarkdown.split("\n## Rules")[0];
  return {
    ...origin,
    pairs,
    ...(alternate ? { bookPairs: origin.pairs } : {}),
    referenceMarkdown:
      prose +
      `\n## Rules\n\nBegin studying either **${names[0]}** or **${names[1]}**. Add ${origin.coinContribution} starting coins and 1 maximum SP.\n`,
  };
}

function classChoice(record, disciplines) {
  const disciplineIds = classOptions[record.id] ?? record.disciplineIds;
  const spAttribute = classAttributes[record.id];
  const attribute = spAttribute[0].toUpperCase() + spAttribute.slice(1);
  const source = record.referenceMarkdown
    .replace(/^\*\*Agreed:\*\* minimum 0 in (.+?); HP contribution (.+?)\. No multiclassing\.$/m,
      "**Attributes:** Start with at least 0 in $1. **HP:** $2.")
    .replace(/## Signature identity in play\n[\s\S]*?(?=- \*\*Level 1:\*\*)/, "## Signatures in play\n\n")
    .replace(
      /^\*\*Starting SP contribution:\*\* .+$/m,
      `**Starting SP contribution:** Twice your positive ${attribute}.\n`,
    )
    .replace(
      /^\*\*Starting disciplines:\*\* .+$/m,
      `**Starting disciplines:** Begin studying one of ${disciplineIds.map((id) => disciplines.get(id)).join(", ")}.\n`,
    );
  const [close = [], related = []] = classAffinities[record.id] ?? [];
  const disciplineCosts = Object.fromEntries([...disciplines.keys()].map(id => [id,
    record.id === "class-odd" ? 2 : close.includes(id) ? 1 : related.includes(id) ? 2 : 3,
  ]));
  const prices = [1, 2, 3].map(cost => {
    const names = [...disciplines].filter(([id]) => disciplineCosts[id] === cost).map(([, name]) => name);
    return names.length ? `**${cost} DP:** ${names.join(", ")}.` : "";
  }).filter(Boolean).join(" ");
  return { ...record, spAttribute, disciplineIds, disciplineCosts, referenceMarkdown: source.replace(
    /^\*\*Learning costs:\*\* .+$/m,
    `**Learning costs:** ${prices} Learned steps cost 1/2/2/3 DP; the last requires level 3. Combined abilities require level 7 and cost 3/4/5 DP for two/three/four disciplines.`,
  ) };
}

function armorReference(record, training, resistance) {
  return {
    ...record,
    markdown: record.markdown
      .replace(
        /^- \*\*Requirements \/ supply:\*\* .+$/m,
        `- **Training:** Learn ${training} to benefit from this suit.\n- **Physical resistance when worn:** ${resistance}`,
      )
      .replace(
        / The training card grants physical resistance \d; no additional resistance from this item\./,
        "",
      ),
  };
}

export function applyForgePlaytest(graph, references) {
  const disciplines = new Map(
    graph.disciplines.map(({ id, name }) => [id, name]),
  );
  const records = { ...references.records };
  const equipment = references.equipment.map((item) => {
    const suit = armor[item.id];
    if (!suit) return item;
    records[item.id] = armorReference(
      records[item.id],
      suit.name,
      suit.physicalResistance,
    );
    return { ...item, physicalResistance: suit.physicalResistance };
  });
  return {
    forge: {
      ...graph,
      playtest: true,
      ancestries: graph.ancestries.map((record) => ({
        ...record,
        ...ancestryResources[record.id],
      })),
      classes: graph.classes.map((record) => classChoice(record, disciplines)),
      origins: graph.origins.map((origin) => originChoice(origin, disciplines)),
      nodes: graph.nodes.map((node) => ({
        ...node,
        ...nodeChanges[node.id],
      })),
      spells: graph.spells.map((spell) => ({
        ...spell,
        ...spellChanges[spell.id],
      })),
      basicActions: [...graph.basicActions, sustain],
    },
    references: { ...references, records, equipment },
  };
}

function playtestMagic(markdown) {
  return markdown
    .replace(
      "Starting on the turn after you cast it, spend a Maneuver and 1 SP by the end of each turn to maintain it through the end of your following turn, within the printed maximum duration. Perform that upkeep once per turn.",
      "Starting on the turn after you cast it, use the Sustain Spell Maneuver by the end of each turn. " +
        sustainRule,
    )
    .replace(
      "Casting and upkeep costs are paid separately from any SP moved.",
      "Pay casting costs separately from any SP moved.",
    )
    .replace(
      "any extra SP spent transferring or sustaining it",
      "any extra SP spent transferring it",
    );
}

function playtestLearning(markdown) {
  return markdown.replace("Spend 1 DP to begin studying it", "Spend its class price (1, 2 or 3 DP) to begin studying it").replace(
    /^You may learn disciplines and their first three steps during level-0 or level-1 development\. The final ability requires character level 3\./m,
    "From level 1, learn the first three steps of each discipline path in order. The final step requires level 3. Combined abilities require level 7 and their named branch endpoints. Pay each step’s DP cost.",
  );
}

function playtestEquipment(markdown) {
  return markdown.replace(
    /\| Training \| Requirement \| DP \| Physical resistance \|[\s\S]*?(?=## Bulk and hands)/,
    [
      "| Training | Requirement | DP | Worn suit |",
      "|---|---|---:|---|",
      "| Light Armor | Study Armor | 1 | Light: physical resistance 1 |",
      "| Brace in Armor | Light Armor | 2 | Defensive Boon against forced movement |",
      "| Armor II | Brace in Armor | 2 | Medium: physical resistance 2 |",
      "| Heavy Armor | Armor II and level 3 | 3 | Heavy: physical resistance 3 |",
      "",
      "Use the highest applicable resistance. Attacks deal at least 1 damage after resistance if any damaging component survives immunity.",
      "",
      "",
    ].join("\n"),
  );
}

function playtestDevelopment(markdown) {
  return markdown
    .replace(
      /## Level 0[\s\S]*?(?=## Learning and spellbooks)/,
      [
        "## Create a hero at level 1",
        "Assign Brawn, Fortitude, Agility, Guile, Knowledge and Reason from −2 through +2, totaling +3. Choose an ancestry and two traits, then choose culture and background.",
        "Choose one starting discipline from each of your culture, background and class. Choose three different disciplines. Meet the class’s attribute minimums and choose one level-1 signature.",
        "Start with **8 + Guile + Knowledge + Reason DP** and any explicit ancestry benefits. Include negative attributes. Spend from this one pool to learn available steps or study another discipline for its class price (1, 2 or 3 DP). Keep any unspent DP for later learning.",
        "",
      ].join("\n\n"),
    )
    .replace(
      "At level 0, use 10 + ancestry contribution + Fortitude + fixed benefits. ",
      "",
    )
    .replace(
      /^Ancestry, culture and background each contribute .+$/m,
      "Starting maximum SP equals your ancestry’s SP, +1 SP each from culture and background, twice the positive part of your class’s SP attribute, and any learned capacity or explicit benefits. Gain +2 maximum SP at each later level. Your current SP stays the same when your maximum rises. Safe overnight rest restores your full reserve.",
    )
    .replace("gain 8 + the new level in DP", "gain 4 DP plus your new level")
    .replaceAll(
      /^\| (\d+) \| \d+ \|/gm,
      (_, level) => `| ${level} | ${4 + Number(level)} |`,
    );
}

export function applyForgePlaytestJournals(payload) {
  const revisions = {
    "rule-magic": playtestMagic,
    "rule-learning": playtestLearning,
    "rule-development": playtestDevelopment,
    "rule-equipment": playtestEquipment,
  };
  return {
    ...payload,
    records: payload.records.map((record) =>
      revisions[record.id]
        ? { ...record, markdown: revisions[record.id](record.markdown) }
        : record,
    ),
  };
}
