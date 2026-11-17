import {readFile,writeFile,mkdir,readdir,rm} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import assert from "node:assert/strict";
import {workshopCreatureCatalog} from "./content/workshop-creatures.mjs";
import {creatureActorSource} from "./content/creature-packs.mjs";
export async function currentCreaturePack(root=new URL("../",import.meta.url)) {
 const read=async path=>JSON.parse(await readFile(new URL(path,root)));
 const [base,overrides,art]=await Promise.all(["static/data/creatures.json","static/data/forge-creatures.json","web/data/sheet-art.json"].map(read));
 const catalog=workshopCreatureCatalog(base,overrides,art,overrides.sourceCommit),templates=new Map(catalog.monsterAbilities.map(record=>[record.id,record]));
 const documents=[];
 for(const record of catalog.creatures){
  const old=await read(`content/packs/creatures/${record.id}.json`);
  const fresh=creatureActorSource(record,{sourceCommit:catalog.source.commit,portrait:{img:old.img,provenance:old.flags["heroes-of-legend"].portrait},abilityTemplates:record.abilitySources.map(source=>templates.get(source.id))});
  const {actions:oldActions,details:oldReference,...oldStats}=old.system;
  const {actions:newActions,details:newReference,...newStats}=fresh.system;
  assert.deepEqual(newStats,oldStats,`${record.id}: current prose publication cannot change native statistics`);
  for(const action of newActions.entries){const prior=oldActions.entries.find(entry=>entry.id===action.id);if(prior)for(const key of ["weak","standard","strong"])if(typeof prior.outcomes?.[key]==="number")assert.equal(action.outcomes?.[key],prior.outcomes[key],`${record.id}/${action.id}: changed damage`);}
  documents.push({...old,system:{...old.system,actions:newActions,details:newReference},flags:{...old.flags,"heroes-of-legend":{...old.flags["heroes-of-legend"],...fresh.flags["heroes-of-legend"]}}});
 }
 return documents;
}
export async function generateCurrentCreaturePack({root=new URL("../",import.meta.url),check=false}={}) {
 const documents=await currentCreaturePack(root),directory=new URL("content/current-packs/creatures/",root);
 if(!check){await rm(directory,{recursive:true,force:true});await mkdir(directory,{recursive:true});}
 for(const document of documents){const target=new URL(`${document.flags["heroes-of-legend"].catalogId}.json`,directory),bytes=JSON.stringify(document,null,2)+"\n";if(check){if(await readFile(target,"utf8")!==bytes)throw new Error(`Current creature drift: ${document.name}`);}else await writeFile(target,bytes);}
 if(check&&(await readdir(directory)).length!==documents.length)throw new Error("Unexpected current creature pack files.");
 return documents;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.info(`${(await generateCurrentCreaturePack({check:process.argv.includes("--check")})).length} current creature reference profiles verified`);
