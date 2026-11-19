import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { workshopCreatureOverrides } from "./content/workshop-creatures.mjs";

const root = new URL("../", import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const graph = await read("static/data/forge.json");
const inventory = await read("static/data/inventory.json");
const legacy = await read("tests/fixtures/reference-heroes.json");
const repository = process.env.HOL_BOOK_REPOSITORY;
assert(repository, "Set HOL_BOOK_REPOSITORY");
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" });
const files = (dir) => git("ls-tree", "-r", "--name-only", graph.sourceCommit, dir).trim().split("\n").filter((path) => path.endsWith(".md"));
const authored = (path) => {
  const markdown = git("show", `${graph.sourceCommit}:${path}`);
  return { markdown, source: { path, sha256: createHash("sha256").update(markdown).digest("hex") } };
};
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const bookJournals = new Map([
  ["design/development.md", "development"],
  ["design/player-book/manuscript/06-playing.md", "playing"],
  ["design/player-book/manuscript/10-equipment.md", "equipment"],
]);
const journals = [...files("design/rules"), ...bookJournals.keys()].map((path) => {
  const record = authored(path);
  return { id: "rule-" + (bookJournals.get(path) ?? path.split("/").at(-1).slice(0, -3)), title: record.markdown.match(/^# (.+)/m)[1], ...record };
});
const current = [
  ...files("design/equipment"),
  ...files("design/recipes"),
  ...files("design/ancestries").filter((path) => path.includes("/trait-")),
  ...files("design/monster-abilities"),
  "design/market.md",
].map(authored);
const records = Object.fromEntries(current.map((record) => {
  const file = record.source.path.split("/").at(-1).slice(0, -3);
  const id = record.markdown.match(/\*\*ID:\*\* ([a-z0-9-]+)/)?.[1] ?? file;
  return [id, record];
}));
const equipment = current.filter((record) => record.source.path.startsWith("design/equipment/")).map(({ markdown, source }) => {
  const id = markdown.match(/\*\*ID:\*\* ([a-z0-9-]+)/)?.[1];
  const previous = inventory.equipment.find((record) => record.id === id);
  const price = Number(markdown.match(/\*\*Market price:\*\* (\d+) coins/)?.[1]);
  const bulk = Number(markdown.match(/\*\*Bulk:\*\* (\d+)/)?.[1]);
  const supplyDie = Number(markdown.match(/\*\*Supply die:\*\* d(4|6|8|10|12|20)\b/i)?.[1]) || undefined;
  const isHealingPotion = /^item-(lesser|greater|superior)-healing-bottle$/.test(id);
  const healing = Number(markdown.match(/restore (\d+) HP before Life resistance/)?.[1]);
  assert(id && Number.isInteger(price) && Number.isInteger(bulk), source.path);
  if (isHealingPotion) assert(Number.isInteger(healing) && healing > 0, source.path);
  return {
    ...previous,
    id, name: markdown.match(/^# (.+)/)[1], price, bulk, source,
    ...(isHealingPotion ? { healing } : {}),
    ...(markdown.match(/\*\*Physical resistance when worn:\*\* (\d+)/) ? { physicalResistance: Number(markdown.match(/\*\*Physical resistance when worn:\*\* (\d+)/)[1]) } : {}),
    specialOrder: markdown.includes("special-order benchmark"),
    handChoices: previous?.handChoices ?? [],
    inventoryDie: supplyDie ?? (id === "item-first-aid-supplies" ? 6 : id === "item-smoke-supply" ? null : previous?.inventoryDie ?? null),
  };
});
const recipes = current.filter((record) => record.source.path.startsWith("design/recipes/")).map(({ markdown, source }) => {
  const id = markdown.match(/\*\*ID:\*\* ([a-z0-9-]+)/)?.[1];
  const name = markdown.match(/^# (.+)/)?.[1];
  const previous = inventory.recipes.find((record) => record.id === id);
  const [, count, unit] = markdown.match(/\*\*Time(?: per attempt)?:\*\* (one|\d+) (hour|minute)s?\b/i) ?? [];
  const maximumDie = Number(markdown.match(/\bmaximum d(\d+)\b/i)?.[1] ?? 0);
  const target = Number(markdown.match(/\btarget(?::\*\*)? (\d+)\b/i)?.[1] ?? 0);
  assert(id && name && previous && count, `Incomplete recipe metadata: ${source.path}`);
  assert(Boolean(maximumDie) !== Boolean(target), `Expected a supply cap or progress target: ${source.path}`);
  const attemptMinutes = (count.toLowerCase() === "one" ? 1 : Number(count)) * (unit.toLowerCase() === "hour" ? 60 : 1);
  const { maximumDie: oldMaximumDie, target: oldTarget, ...compatibility } = previous;
  return {
    ...compatibility,
    id, name, source, attemptMinutes,
    ...(maximumDie ? { maximumDie } : { target }),
  };
});
const party = graph.rulesRevision === 299
  ? JSON.parse(authored("design/characters/examples.json").markdown).party
  : legacy.characters.map(({ id, draft: original }) => {
  const { markdown } = authored(`design/characters/${id}.md`);
  const draft = structuredClone(original);
  const originText = markdown.split("## Level 0")[1].split("## Level 1")[0];
  const classText = markdown.split("## Level 1")[1].split("## Learned")[0];
  for (const kind of ["culture", "background"]) {
    const origin = graph.origins.find((record) => record.id === draft[kind].id);
    assert(origin, id);
    const line = originText.split("\n").find((row) => row.includes(`../origins/${origin.id.slice(7)}.md`));
    assert(line, origin.id);
    draft[kind].pair = origin.pairs.findIndex((pair) => {
      const node = graph.nodes.find((entry) => entry.id === pair.entryId);
      return line.includes(`[${node.name}]`);
    });
    assert(draft[kind].pair >= 0, line);
  }
  draft.classDisciplines = classText.match(/Gain \*\*(.+?) access\*\*/)[1].split(" and ").map((part) => {
    const discipline = graph.disciplines.find((entry) => entry.name === part);
    assert(discipline, part);
    return discipline.id;
  });
  draft.acquisitions = id === "oren-brass" ? {
    "craft:supplies:1": { recipes: ["recipe-bound-torches", "recipe-twisted-cord"] },
    "craft:supplies:2": { recipes: ["recipe-travel-food", "recipe-wooden-brace"] },
  } : {};
  for (const [stage, text] of [originText, classText].entries()) {
    draft.purchases[stage] = [...text.matchAll(/^\| \[([^\]]+)\]\([^)]+\) \| [^|]+ \| (\d+) \|/gm)].map(([, label, cost]) => {
      const node = graph.nodes.find((entry) => entry.name === label.replace(/ access$/, ""));
      assert(node && node.dp === Number(cost), `${id}: ${label}`);
      return { id: node.id };
    });
  }
  const held = new Set(["item-ordinary-melee-weapon", "item-ordinary-ranged-weapon", "item-ordinary-shield"]);
  draft.loadout = {};
  draft.shopping = [...markdown.split("## Equipment")[1].matchAll(/^\| \[([^\]]+)\]\(\.\.\/([^)]*)\) \| (\d+) \|/gm)].map(([, name, path, price], index) => {
    const itemId = path.startsWith("equipment/") ? `item-${path.slice(10, -3)}` : `item-${slug(name)}`;
    const item = equipment.find((record) => record.id === itemId);
    assert(item && item.price === Number(price), `${id}: ${itemId}`);
    const instanceId = `shop-example-${index}`;
    draft.loadout[instanceId] = { carried: true, worn: itemId === "item-ordinary-light-armor", held: held.has(itemId) };
    return { id: itemId, quantity: 1, hands: item.handChoices[0] ?? 0, instanceId };
  });
  return { id, draft };
});

assert.ok(Array.isArray(party) && party.length > 0, "Current authored Workshop examples must contain a nonempty party array");
if (graph.rulesRevision === 299) {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const signatureIds = new Set(graph.signatures.map((signature) => signature.id));
  const partyIds = new Set();
  for (const { id, draft } of party) {
    assert.ok(id && !partyIds.has(id), `Duplicate or missing example id ${id}`); partyIds.add(id);
    assert.ok(draft && graph.ancestries.some((choice) => choice.id === draft.ancestryId), `Invalid ancestry in ${id}`);
    assert.ok(graph.classes.some((choice) => choice.id === draft.classId), `Invalid class in ${id}`);
    assert.equal(draft.classDisciplines?.length, 1, `${id}: choose one class discipline`);
    assert.ok(signatureIds.has(draft.signatureId), `Unknown signature in ${id}`);
    assert.equal(draft.purchases?.[0]?.length ?? 0, 0, `${id}: obsolete level-0 purchases`);
    for (const purchases of Object.values(draft.purchases ?? {})) for (const purchase of purchases)
      assert.ok(nodeIds.has(purchase.id), `${id}: unknown learning ${purchase.id}`);
    for (const kind of ["culture", "background"]) {
      const origin = graph.origins.find((choice) => choice.id === draft[kind]?.id);
      assert.ok(origin?.pairs[draft[kind]?.pair], `${id}: invalid ${kind} choice`);
    }
  }
}

const creatureOverrides = workshopCreatureOverrides(
  await read("static/data/creatures.json"), graph.sourceCommit, authored, files,
);
const filesToWrite = {
  "static/data/forge-journals.json": { sourceCommit: graph.sourceCommit, rulesRevision: graph.rulesRevision, records: journals },
  "static/data/forge-references.json": { sourceCommit: graph.sourceCommit, rulesRevision: graph.rulesRevision, records, equipment, recipes },
  "static/data/forge-party.json": { sourceCommit: graph.sourceCommit, rulesRevision: graph.rulesRevision, party },
  "static/data/forge-creatures.json": creatureOverrides,
};
for (const [path, data] of Object.entries(filesToWrite)) {
  const target = new URL(path, root);
  const text = JSON.stringify(data, null, 2) + "\n";
  if (process.argv.includes("--check")) assert.equal(await readFile(target, "utf8"), text, path);
  else await writeFile(target, text);
}
const tokens = ["divination", "elements", "fencing", "force", "invocation", "mentalism", "spellcraft", "tactics", "wards"];
for (const id of tokens) {
  const token = authored(`design/player-book/art/tokens/${id}.svg`).markdown;
  const target = new URL(`web/assets/${id}.svg`, root);
  if (process.argv.includes("--check")) assert.equal(await readFile(target, "utf8"), token);
  else await writeFile(target, token);
}
console.log(`Verified ${party.length} example heroes, ${journals.length} journals, ${equipment.length} equipment records, and ${recipes.length} recipes for Character Workshop.`);
console.log(`Verified Workshop bestiary source with ${creatureOverrides.creatures.length} creature and ${creatureOverrides.monsterAbilities.length} monster ability overrides.`);
