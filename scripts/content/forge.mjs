import assert from "node:assert/strict";
import { parseAbilityReference, parseAncestryReference } from "./choices.mjs";
import {forgeSignatureRecord} from "../../src/rules/forge-signatures.mjs";
import { SMALL_TALENT_IDS } from "../../src/rules/forge-rewrite.mjs";
import { FORGE_STARTING_DP } from "../../src/rules/forge-character.mjs";

const branchCosts = [1, 2, 2, 3, 4, 4, 5];
const branchLevels = [1, 1, 1, 3, 3, 3, 7];
const attributeName = "Brawn|Fortitude|Agility|Guile|Knowledge|Reason";
const flexibleRoll = new RegExp(`^(?:Main Action|Maneuver|Reaction) · ((?:${attributeName})(?: or (?:${attributeName}))+)[,.]`);
const sections = ["I", "II", "III", "IV", "V", "VI", "VII"];
const pages = ["1", "2", "3", "4", "5", "6", "7", "8", "A1", "A2", "A3"];
const pageSections = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6];
const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const title = (text) => match(text, /^# (.+)$/m, "title")[1];
const coins = (text) =>
  Number(
    match(
      text,
      /^\*\*Starting coin contribution:\*\* \+(\d+) coins/m,
      "starting coin",
    )[1],
  );

function match(text, pattern, label) {
  const result = text.match(pattern);
  assert.ok(result, `Missing or invalid ${label}`);
  return result;
}

function index(items, key, label) {
  const result = new Map(items.map((item) => [key(item), item]));
  assert.equal(result.size, items.length, `Duplicate ${label}`);
  return result;
}

function readSteps(text, disciplineId, path, training) {
  const steps = [];
  for (const [, name, dp, level, effect] of text.matchAll(
    /^### (.+)\nDP: (\d+) \| Level: (\d+)\n([\s\S]+?)(?=^### |(?![\s\S]))/gm,
  )) {
    steps.push({
      name,
      dp: Number(dp),
      level: Number(level),
      effect: effect.trim(),
    });
  }
  assert.equal(steps.length, 7, path.id);
  assert.deepEqual(steps.map(({ dp }) => dp), branchCosts, path.id);
  assert.deepEqual(steps.map(({ level }) => level), branchLevels, path.id);
  return steps.map((step, i) => {
    const improvement = [1, 2, 4, 5].includes(i);
    const node = {
      id: `${path.id}:${i + 1}`, ...step,
      kind: training ? "training" : improvement ? "improvement" : i === 6 ? "mastery" : "technique",
      disciplineId, pathId: path.id,
      requires: [i ? `${path.id}:${i}` : disciplineId],
      shape: i === 6 ? "diamond" : i >= 3 ? "triangle" : "circle",
    };
    if (improvement) node.improves = `${path.id}:${i < 3 ? 1 : 4}`;
    const attributes = step.effect.match(flexibleRoll)?.[1];
    if (attributes) node.attributeChoices = attributes.toLowerCase().split(" or ");
    if (disciplineId === "fencing") node.weaponRequirement = "one-handed-melee";
    if (path.id === "tactics:openings") node.weaponRequirement = "melee";
    if (training) {
      const capacity = step.effect.match(/Increase maximum SP by (?:another )?(\d+)/i);
      if (capacity) node.spCapacity = Number(capacity[1]);
      else {
        node.spRecovery = Number(match(step.effect, /recover (\d+) SP|restores (\d+) SP/i, step.name).slice(1).find(Boolean));
        node.recoveryMinutes = /30 uninterrupted minutes/.test(step.effect) ? 30 : 60;
      }
    }
    return node;
  });
}

function readSpellbook(text, bookId, discipline, endpoint, pathId) {
  const [, name, disciplineName, listName, sourceId, endpointName] = match(
    text,
    /^# (.+)\nDiscipline: (.+)\nList: (.+)\nID: ([\w-]+)\nEndpoint: (.+)\n/,
    `spellbook ${bookId} header`,
  );
  assert.equal(sourceId, bookId);
  assert.deepEqual(
    [disciplineName, listName, endpointName],
    [discipline.name, endpoint.list, endpoint.name],
  );
  const [table, profiles] = text.split("\n## Spells\n");
  assert.ok(profiles, `Missing spell profiles in ${bookId}`);
  const rows = [
    ...table.matchAll(/^\| (\d+|A\d+) \| (.+) \| (\d+) \| (I|II|III|IV|V|VI|VII) \|$/gm),
  ];
  assert.deepEqual(
    rows.map((row) => row[1]),
    pages,
    bookId,
  );
  const spells = profiles
    .split(/^### /m)
    .slice(1)
    .map((entry, i) => {
      const spellName = entry.split("\n")[0].trim();
      const fields = Object.fromEntries([...entry.matchAll(/^\*\*([^*]+):\*\* (.+)$/gm)].map(([, key, value]) => [key, value]));
      const { ID: id, Page: page, Action: actionText, SP: sp, Attribute: attribute, "Target / range": target, Duration: duration } = fields;
      const effect = entry.trim().split("\n\n").slice(2).join("\n\n").trim();
      assert.ok(id && page && actionText && sp !== undefined && attribute && target && duration && effect, `Incomplete spell profile ${bookId}/${spellName}`);
      const section = sections[pageSections[i]];
      assert.deepEqual([page, spellName, sp, section], rows[i]?.slice(1), id);
      assert.match(id, /^(?:spell:[a-z0-9-]+:[a-z0-9-]+|spell-mastery:[a-z0-9-]+)$/);
      const [action, detail] = actionText.split(" · ");
      const timing =
        action === "Reaction"
          ? { trigger: detail }
          : action === "Ritual"
            ? { ritualTime: detail }
            : {};
      assert.ok(
        ["Reaction", "Ritual", "Main Action", "Maneuver"].includes(action),
        action,
      );
      assert.equal(
        Boolean(detail),
        action === "Reaction" || action === "Ritual",
        id,
      );
      return {
        id,
        name: spellName,
        bookId,
        page,
        section,
        sp: Number(sp),
        action,
        actionText,
        ...timing,
        attribute,
        defense: fields.Defense ?? null, defenseAttribute: fields.Defense ?? null,
        holdAttribute: fields["Hold attribute"] ?? null,
        escapeAttribute: fields["Escape attribute"] ?? null,
        target,
        duration,
        effect,
      };
    });
  assert.equal(spells.length, pages.length, bookId);
  assert.equal(spells[0].sp, 0, bookId);
  assert.deepEqual(
    spells.slice(6).map((spell) => spell.name),
    endpoint.spells,
    endpoint.id,
  );
  const nodes = sections.map((section, i) => ({
    id: `${bookId}:${i}`,
    name: i === 3 ? endpointName : i >= 4 ? spells.find(spell => spell.section === section).name : `${listName} ${section}`,
    kind: "section",
    disciplineId: discipline.id,
    pathId,
    bookId,
    section,
    dp: branchCosts[i],
    level: branchLevels[i],
    shape: i === 6 ? "diamond" : i >= 3 ? "triangle" : "circle",
    requires: [i ? `${bookId}:${i - 1}` : discipline.id],
    spellIds: spells
      .filter((spell) => spell.section === section)
      .map((spell) => spell.id),
  }));
  const theme = table.split("\n\n")[1]?.trim();
  return {
    book: {
      id: bookId,
      name,
      listName,
      disciplineId: discipline.id,
      pathId,
      theme,
      spellIds: spells.map((spell) => spell.id),
    },
    spells,
    nodes,
  };
}

function readCard(text) {
  const reference = parseAbilityReference(text, { inlineRollOutcomes: false });
  const [, authoredId] = match(text, /^\*\*ID:\*\* ([\w-]+)$/m, "ability ID");
  const [, level, dp] = match(
    text,
    /^\*\*Tier \/ minimum level:\*\* (Universal|\d+) · \*\*DP:\*\* (Not purchased|Class choice|\d+) ·/m,
    authoredId,
  );
  const detail = (label) =>
    reference.rules.details.find((entry) => entry.label === label)?.value;
  return {
    id: `ability-${authoredId}`,
    name: title(text),
    level: level === "Universal" ? 0 : Number(level),
    dp: /^\d+$/.test(dp) ? Number(dp) : null,
    action: detail("Action"),
    attribute: detail("Attribute"),
    target: detail("Target / range / shape"),
    duration: detail("Duration"),
    equipment: detail("Equipment / acquisition"),
    limits: detail("Limits"),
    effect: text.split("\n## Rules\n")[1].split("\n---\n")[0].trim(),
    reference,
    referenceMarkdown: text,
  };
}

/** Only the current independent schema is accepted for source imports. */
export function normalizeSignatureDevelopment(source) {
  assert.equal(source.schemaVersion,2,"Current signature metadata schema 2 is required");
  assert.deepEqual(source.choiceLevels,[1,3,7]);
  const signatures=source.signatures.map(entry=>{
    for(const key of ['components','foundationId','includes','conditionalIncludes','upgradeFrom'])
      assert.ok(!Object.hasOwn(entry,key),`${entry.id}: independent signature metadata cannot contain ${key}`);
    const rulesMarkdown=entry.rulesMarkdown;
    assert.ok(typeof rulesMarkdown==='string' && rulesMarkdown.trim(),`${entry.id}: own signature rules missing`);
    assert.ok([1,3,7].includes(entry.level),`${entry.id}: invalid milestone`);
    return {id:entry.id,name:entry.name,classId:entry.classId,level:entry.level,
      ...(entry.lineId?{lineId:entry.lineId}:{}),rulesMarkdown};
  });
  index(signatures,entry=>entry.id,'independent signature');
  return {schemaVersion:2,choiceLevels:[1,3,7],signatures,displaced:source.displaced ?? []};
}

export function parseForge(read, list, sourceCommit) {
  const disciplines = [],
    nodes = [],
    spells = [],
    books = [];
  const development = read("design/development.md");
  assert.ok(development.includes(`**${FORGE_STARTING_DP} + Guile + Knowledge + Reason**`), "Current creation DP rules missing");
  const signatureSource = JSON.parse(read("design/signature-development.json"));
  const signatureDevelopment = normalizeSignatureDevelopment(signatureSource);
  assert.deepEqual(signatureDevelopment.choiceLevels, [1, 3, 7]);
  const signatureMetadata = index(signatureDevelopment.signatures, (entry) => entry.id, "signature development");
  const endpointEntries = [
    ...read("design/magic-endpoints.md").matchAll(
      /^## (.+)\nID: ([\w-]+:3)\nDiscipline: (.+)\nList: (.+)\nPages 7–8: (.+)\nAdvanced pages: (.+)$/gm,
    ),
  ].map(([, name, id, discipline, list, final, advanced]) => ({
    name,
    id,
    discipline,
    list,
    spells: `${final}; ${advanced}`.split("; "),
  }));
  const endpoints = index(
    endpointEntries,
    (endpoint) => endpoint.id,
    "magical endpoint",
  );
  for (const [, name, id] of read("design/disciplines.md").matchAll(
    /^- \[(.+)\]\(disciplines\/([\w-]+)\.md\)$/gm,
  )) {
    const text = read(`design/disciplines/${id}.md`);
    assert.equal(title(text), name);
    const discipline = { id, name, paths: [] };
    const theme = text
      .slice(text.indexOf("\n") + 1)
      .trim()
      .split("\n\n")[0]
      .trim();
    disciplines.push({ ...discipline, theme });
    nodes.push({
      id,
      name,
      kind: "discipline",
      dp: 1,
      level: 1,
      requires: [],
      effect: theme,
    });
    for (const [, pathName, body] of text.matchAll(
      /^## (.+)\n([\s\S]*?)(?=^## |(?![\s\S]))/gm,
    )) {
      if (!/^### /m.test(body)) continue;
      const path = { id: `${id}:${slug(pathName)}`, name: pathName };
      const entries = readSteps(body, id, path, id === "spellcraft");
      discipline.paths.push({
        ...path,
        steps: entries.map((entry) => entry.id),
        direction: ["north", "west", "east", "south"][discipline.paths.length],
      });
      nodes.push(...entries);
    }
    const linkedBooks = [
      ...text.matchAll(
        /^- \[([^\]]+)\]\(\.\.\/spellbooks\/([\w-]+)\.md\)\.$/gm,
      ),
    ];
    if (id === "spellcraft") linkedBooks.push([null, null, "channeling"]);
    for (const [, bookTitle, bookId] of linkedBooks) {
      const endpoint = endpoints.get(`${bookId}:3`);
      assert.ok(endpoint, `Missing endpoint for ${bookId}`);
      assert.equal(endpoint.discipline, name);
      const pathId = `${id}:${bookId}`;
      const parsed = readSpellbook(
        read(`design/spellbooks/${bookId}.md`),
        bookId,
        discipline,
        endpoint,
        pathId,
      );
      if (bookTitle) assert.equal(parsed.book.name, bookTitle);
      books.push(parsed.book);
      spells.push(...parsed.spells);
      nodes.push(...parsed.nodes);
      discipline.paths.push({
        id: pathId,
        name: endpoint.list,
        bookId,
        steps: parsed.nodes.map((node) => node.id),
      });
    }
    assert.equal(discipline.paths.length, 4, name);
  }

  const disciplineByName = index(
    disciplines,
    (discipline) => discipline.name,
    "discipline",
  );
  const nodeById = index(nodes, (node) => node.id, "learning node");
  const pathById = index(
    disciplines.flatMap((discipline) => discipline.paths),
    (path) => path.id,
    "path",
  );
  const endpointIds = new Set(
    [...pathById.values()].map((path) => path.steps.at(-1)),
  );
  assert.equal(endpointEntries.length, books.length);
  index(books, (book) => book.id, "spellbook");
  index(spells, (spell) => spell.id, "spell");

  const firstSteps = index(
    disciplines.flatMap(({ paths }) =>
      paths.map(({ steps, bookId }) => {
        const node = nodeById.get(steps[0]);
        const path = bookId
          ? `spellbooks/${bookId}.md`
          : `disciplines/${node.disciplineId}.md`;
        return { node, key: `${path}:${node.name}` };
      }),
    ),
    (entry) => entry.key,
    "first-step reference",
  );
  const findFirst = (path, name) => {
    const entry = firstSteps.get(`${path}:${name}`);
    assert.ok(entry, `Unknown first step ${name} in ${path}`);
    return entry.node;
  };
  const redirects = Object.fromEntries(
    Object.entries(
      JSON.parse(read("design/migration/learning-redirects.json")),
    ).map(([id, entry]) => [
      `ability-${id}`,
      findFirst(entry.target, entry.learning).id,
    ]),
  );

  const origins = list("design/origins").map((file) => {
    const text = read(file);
    const id = file.split("/").at(-1).replace(/\.md$/, "");
    const kind = id.split("-")[0];
    const choiceNames = match(text, /^\*\*Discipline choices:\*\* (.+)\.$/m, file)[1].split(", ");
    const sp = text.match(/\*\*Starting SP contribution:\*\* \+(\d+) maximum SP/);
    assert.equal(choiceNames.length, 2, file);
    const pairs = choiceNames.map((name) => {
      const discipline = disciplineByName.get(name);
      assert.ok(discipline, `Unknown discipline ${name} in ${file}`);
      return { disciplineId: discipline.id };
    });
    assert.ok(["culture", "background"].includes(kind), file);
    return {
      id: `origin-${id}`,
      name: title(text),
      kind,
      pairs,
      coinContribution: coins(text),
      ...(sp ? { spContribution: Number(sp[1]) } : {}),
      referenceMarkdown: text,
    };
  });

  const originRedirects = Object.fromEntries(
    Object.entries(JSON.parse(read("design/migration/origin-grants.json"))).map(([key, entry]) => {
      const originId = `origin-${key.split(":")[0].replace(/\.md$/, "")}`;
      const origin = origins.find((record) => record.id === originId);
      const disciplineId = disciplineByName.get(entry.discipline)?.id;
      assert.ok(origin && disciplineId, key);
      return [key, { originId, disciplineId }];
    }),
  );

  const signatures = [];
  const classes = list("design/classes").map((file) => {
    const text = read(file);
    const id = `class-${file.split("/").at(-1).replace(/\.md$/, "")}`;
    const name = title(text);
    const hp = match(text, /\*\*HP contribution:\*\* \+(\d+) at level 1/, `HP for ${id}`)[1];
    const spAttribute = match(text, /Starting SP contribution:\*\* Twice your positive (\w+)/, `SP for ${id}`)[1].toLowerCase();
    const castingAttribute = text.match(/^\*\*Casting attribute:\*\*\s*(\w+)/mi)?.[1]?.toLowerCase();
    if (castingAttribute) assert.equal(castingAttribute, spAttribute, `Casting and starting SP attributes for ${id}`);
    const choices = match(text, /^\*\*Starting disciplines:\*\* Choose one of ([^.]+)\./m, `disciplines for ${id}`)[1];
    const disciplineIds = choices.split(", ").map((choice) => {
      const discipline = disciplineByName.get(choice); assert.ok(discipline, choice); return discipline.id;
    });
    assert.equal(disciplineIds.length, 4, id);
    const minimumAttributes = /no attribute minimums/i.test(text) ? [] : match(text, /Minimum 0 in (\w+)(?:, | and )(\w+)/i, `attributes for ${id}`).slice(1).map((attribute) => attribute.toLowerCase());
    const costText = match(text, /^\*\*Learning costs:\*\* (.+)$/m, `class prices ${id}`)[1];
    const disciplineCosts = {};
    for (const [, cost, names] of costText.matchAll(/\*\*(1|2|3) DP:\*\* ([^.]+)\./g))
      for (const name of names.split(", ")) {
        const discipline = disciplineByName.get(name); assert.ok(discipline, name);
        assert.equal(disciplineCosts[discipline.id], undefined, `Duplicate class price ${id}/${name}`);
        disciplineCosts[discipline.id] = Number(cost);
      }
    assert.equal(Object.keys(disciplineCosts).length, disciplines.length, `Incomplete class prices ${id}`);
    const signatureChoices = Object.fromEntries(
      [...text.matchAll(/^## Level (\d+) choices\n\n((?:- .+\n)+)/gm)].map(
        ([, level, choices]) => {
          const ids = [
            ...choices.matchAll(
              /^- \[([^\]]+)\]\(\.\.\/cards\/([\w-]+)\.md\)$/gm,
            ),
          ].map(([, label, filename]) => {
            const card = readCard(read(`design/cards/${filename}.md`));
            assert.deepEqual(
              [card.name, card.level, card.dp],
              [label, Number(level), null],
              filename,
            );
            const metadata = signatureMetadata.get(filename);
            assert.ok(metadata, `Missing signature development ${filename}`);
            assert.equal(metadata.classId, id); assert.equal(metadata.level, card.level);
            if(signatureSource.schemaVersion===2) assert.equal(card.effect.trim(),metadata.rulesMarkdown.trim(),`${filename}: signature metadata must match its own card rules`);
            const own={...metadata,id:card.id};
            signatures.push(forgeSignatureRecord({signatureDevelopment:{schemaVersion:2,signatures:[own]}},{...card,classId:id}));
            return card.id;
          });
          assert.equal(ids.length, 3, `${id} level ${level} signatures`);
          return [level, ids];
        },
      ),
    );
    assert.deepEqual(Object.keys(signatureChoices), ["1", "3", "7"], id);
    return {
      id,
      name,
      disciplineIds,
      signatures: signatureChoices,
      minimumAttributes,
      hpContribution: Number(hp),
      spAttribute,
      spMultiplier: 2,
      disciplineCosts,
      coinContribution: coins(text),
      referenceMarkdown: text,
    };
  });

  const ancestryAliases = { "wood-elf": "elf", "hill-dwarf": "dwarf" };
  const ancestries = list("design/ancestries")
    .filter((file) => !file.includes("/trait-"))
    .map((file) => {
      const text = read(file);
      const filename = file.split("/").at(-1).replace(/\.md$/, "");
      const [, hp, speed] = match(
        text,
        /^\*\*Starting values:\*\* HP contribution \+(\d+) at creation and per level; base Speed (\d+)/m,
        file,
      );
      return {
        id: `ancestry-${ancestryAliases[filename] ?? filename}`,
        name: title(text),
        hpContribution: Number(hp),
        spContribution: Number(match(text, /\*\*Starting SP contribution:\*\* \+(\d+) maximum SP/, file)[1]),
        baseSpeed: Number(speed),
        coinContribution: coins(text),
        reference: parseAncestryReference(text, "ancestry"),
      };
    });

  const signatureIds = index(signatures, (card) => card.id, "signature");
  const basicActions = [];
  for (const [, label, filename] of read("design/catalog.md").matchAll(
    /^- \[([^\]]+)\]\(cards\/([\w-]+)\.md\)$/gm,
  )) {
    if (filename.startsWith("signature-") || signatureIds.has(`ability-${filename}`)) continue;
    const card = readCard(read(`design/cards/${filename}.md`));
    assert.equal(card.name, label, filename);
    assert.equal(card.level, card.dp === null ? 0 : 1, filename);
    if (card.dp === null) basicActions.push(card);
    else {
      assert.equal(card.dp, 1, filename);
      nodes.push({ ...card, kind: "talent", requires: [] });
    }
  }

  index(nodes, (node) => node.id, "node");
  const talents = nodes.filter((node) => node.kind === "talent").map(({ id }) => id);
  if (talents.length) assert.deepEqual(talents.sort(), [...SMALL_TALENT_IDS].sort(), "Legacy Small Talents catalog");
  index(spells, (spell) => spell.id, "spell including masteries");
  const allNodeIds = new Set(nodes.map((node) => node.id));
  for (const node of nodes) for (const prerequisite of node.requires ?? []) assert.ok(allNodeIds.has(prerequisite), `${node.id}: unknown prerequisite ${prerequisite}`);
  const abilityId = (id) => id ? `ability-${id}` : null;
  const importedDevelopment = {
    ...signatureDevelopment,
    signatures: signatureDevelopment.signatures.map((entry) => ({ ...entry,id:abilityId(entry.id) })),
    displaced: signatureDevelopment.displaced.map((entry) => ({ ...entry, id: abilityId(entry.id) })),
  };
  for (const entry of importedDevelopment.displaced) assert.ok(allNodeIds.has(entry.destination) || spells.some((spell) => spell.id === entry.destination), `Missing rehomed concept ${entry.id}: ${entry.destination}`);
  assert.deepEqual(
    [
      disciplines.length,
      books.length,
      spells.length,
      nodes.filter((node) => node.kind === "section" && node.level === 7).length,
      classes.length,
      signatures.length,
      origins.length,
      ancestries.length,
      basicActions.length,
    ],
    [21, 29, 319, 29, 10, 90, 52, 10, 19],
    "Forge catalog coverage",
  );
  return {
    schemaVersion: 1,
    rulesRevision: 299,
    spellbookProgressionRevision: 310,
    signatureDevelopment: importedDevelopment,
    migration: { disciplines: JSON.parse(read("design/discipline-migration.json")), signatureDispositions: importedDevelopment.displaced, learningRedirects: redirects, originRedirects },
    sourceCommit,
    disciplines,
    nodes,
    books,
    spells,
    origins,
    classes,
    signatures,
    ancestries,
    basicActions,
    redirects,
    originRedirects,
  };
}
