import { runtimeSourceGraph } from "./runtime-source-graph.mjs";
import { generateCurrentCreaturePack } from "./generate-current-creature-pack.mjs";
import { generateCurrentAbilityPack } from "./generate-current-ability-pack.mjs";
import { generateWoundTables } from "./generate-wound-tables.mjs";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { validateNativeJournals } from "./validate-native-journals.mjs";
import {
  buildContentPackArtifacts,
  CONTENT_PACK_DEFINITIONS,
  readContentPackCatalogs,
  verifyAuthoredContentPacks,
} from "./content/content-packs.mjs";
import {
  formatCreatureArtReport,
  validateCreatureArt,
} from "./creature-art.mjs";

const root = new URL("../", import.meta.url);
const output = new URL("dist/heroes-of-legend/", root);
await validateNativeJournals(root);
await generateCurrentAbilityPack({root,check:true});
await generateCurrentCreaturePack({root,check:true});
await generateWoundTables(root, {check:true});
const artifacts = buildContentPackArtifacts(
  await readContentPackCatalogs(root),
);
await verifyAuthoredContentPacks(root, artifacts);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL("static/", root), output, { recursive: true });
// Creature and summon intake catalogs are build inputs; native play reads the
// Actor packs. Shared Workshop imports retain their pinned normalization inputs.
for (const name of ["creatures"])
  await rm(new URL(`data/${name}.json`, output));
const runtimeGraph=await runtimeSourceGraph(root);
await cp(new URL("src/", root), output, {recursive:true,filter:path=>!path.endsWith(".mjs") || runtimeGraph.modules.has(path)});
// Only the current native applications' templates belong in the installed package.
for(const filename of await (await import("node:fs/promises")).readdir(new URL("templates/",output)))
  if(filename.endsWith(".hbs")&&!runtimeGraph.templates.has(filename))await rm(new URL(`templates/${filename}`,output));
const creatureArt = await validateCreatureArt(output);
for (const pack of CONTENT_PACK_DEFINITIONS) {
  await compilePack(
    fileURLToPath(new URL(["abilities","creatures"].includes(pack.name) ? `content/current-packs/${pack.directory}/` : `content/packs/${pack.directory}/`, root)),
    fileURLToPath(new URL(pack.path, output)),
  );
}
for (const name of ["player-rules", "da-rules"]) {
  await compilePack(fileURLToPath(new URL(`content/journals/${name}/`, root)), fileURLToPath(new URL(`packs/${name}`, output)));
}
// Legacy wound table sources remain for migration fixtures; current distribution uses scars.
console.info(
  `Built ${fileURLToPath(output)} with ${formatCreatureArtReport(creatureArt)}`,
);
// The native PC surface mounts the same controller, styles and pinned data as
// the published Workshop. Keep its relative rule imports and assets intact.
await import('./build-workshop.mjs');
await cp(new URL('dist/workshop/', root), new URL('workshop/', output), {recursive:true,filter:source=>!source.endsWith('/.nojekyll')});

for(const asset of runtimeGraph.assets)await (await import("node:fs/promises")).access(new URL(asset,output));
