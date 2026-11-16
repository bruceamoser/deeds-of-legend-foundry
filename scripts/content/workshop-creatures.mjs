import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import {
  parseCreature,
  parseMonsterAbility,
  summarizeCreatureCatalog,
} from "./creatures.mjs";

function changedRecords(base, current) {
  return current.filter((record, index) =>
    !isDeepStrictEqual({ ...record, source: { ...record.source, commit: base[index].source.commit } }, base[index]),
  );
}

export function workshopCreatureOverrides(base, sourceCommit, authored, files) {
  for (const [dir, records] of [
    ["design/bestiary/creatures", base.creatures],
    ["design/monster-abilities", base.monsterAbilities],
    ["design/bestiary/summons", base.summonLinks],
  ]) {
    assert.deepEqual(
      files(dir).filter((path) => !path.endsWith("/README.md")).sort(),
      records.map(({ source }) => source.path).sort(),
      `Workshop roster differs at ${sourceCommit}: ${dir}`,
    );
  }

  const manifest = JSON.parse(authored("design/da-book/source-manifest.json").markdown);
  const families = new Map(manifest.families.flatMap(({ name, sources }) =>
    sources.map((path) => [`design/${path}`, name]),
  ));
  const art = JSON.parse(authored("design/bestiary/art/manifest.json").markdown);
  const portraits = new Map(art.entries.map((entry) => [entry.id, entry]));
  assert.equal(portraits.size, base.creatures.length, "Workshop portrait roster changed");
  const summonLinks = base.summonLinks.map((link) => {
    const { source } = authored(link.source.path);
    return { ...link, source: { ...source, commit: sourceCommit } };
  });
  const summons = new Map(summonLinks.map((link) => [link.creatureId, link]));
  const monsterAbilities = base.monsterAbilities.map(({ id, path }) => {
    const { markdown, source } = authored(path);
    return parseMonsterAbility({ id, ...source }, markdown, sourceCommit);
  });
  const creatures = base.creatures.map(({ id, source: previous, portrait }) => {
    const { markdown, source } = authored(previous.path);
    const currentPortrait = portraits.get(id);
    assert.equal(currentPortrait?.illustration, portrait.path, `Workshop portrait path changed: ${id}`);
    assert.equal(currentPortrait.sha256, portrait.sha256, `Workshop portrait changed: ${id}`);
    return parseCreature({ id, ...source }, markdown, {
      commit: sourceCommit,
      family: families.get(source.path),
      portrait,
      summonLink: summons.get(id),
      abilityRecords: monsterAbilities,
    });
  });

  return {
    sourceCommit,
    baseCommit: base.source.commit,
    creatures: changedRecords(base.creatures, creatures),
    monsterAbilities: changedRecords(base.monsterAbilities, monsterAbilities),
    summonLinks: changedRecords(base.summonLinks, summonLinks),
  };
}

export function workshopCreatureCatalog(base, overrides, artwork, sourceCommit) {
  assert.equal(overrides.sourceCommit, sourceCommit, "Workshop creatures differ from the rulebook pin");
  assert.equal(overrides.baseCommit, base.source.commit, "Workshop creature overrides differ from the base catalog");
  assert.equal(artwork.sourceCommit, base.source.commit, "Workshop portraits differ from the base catalog");

  const apply = (key) => {
    const replacement = new Map(overrides[key].map((record) => [record.id, record]));
    assert.equal(replacement.size, overrides[key].length, `Duplicate Workshop ${key} override`);
    const records = base[key].map((record) => {
      const changed = replacement.get(record.id);
      if (changed) {
        assert.equal(changed.source.commit, sourceCommit, `Outdated Workshop source: ${record.id}`);
        replacement.delete(record.id);
        return changed;
      }
      return { ...record, source: { ...record.source, commit: sourceCommit } };
    });
    assert.equal(replacement.size, 0, `Unknown Workshop ${key} override`);
    return records;
  };
  const creatures = apply("creatures");
  const monsterAbilities = apply("monsterAbilities");
  const summonLinks = apply("summonLinks");
  const portraits = new Map(artwork.records.map((record) => [record.id, record.sourceSha256]));
  assert.equal(portraits.size, creatures.length, "Incomplete Workshop portrait roster");
  for (const { id, portrait } of creatures)
    assert.equal(portraits.get(id), portrait.sha256, `Workshop portrait mismatch: ${id}`);

  return {
    schemaVersion: base.schemaVersion,
    source: {
      repository: base.source.repository,
      commit: sourceCommit,
      portraitCommit: artwork.sourceCommit,
    },
    orientation: base.orientation,
    rights: base.rights,
    coverage: base.coverage,
    counts: {
      ...summarizeCreatureCatalog(creatures, summonLinks),
      monsterAbilitiesVerified: monsterAbilities.length,
    },
    creatures,
    monsterAbilities,
    summonLinks,
  };
}
