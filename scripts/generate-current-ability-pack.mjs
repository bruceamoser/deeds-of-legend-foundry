import {readFile,writeFile,mkdir,readdir,rm} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import {workshopCatalogs} from "../src/rules/workshop-forge-catalog.mjs";
import {applyForgePlaytest} from "../src/rules/forge-playtest-catalog.mjs";
import {currentWorkshopItemSource} from "../src/rules/current-workshop-items.mjs";
import {stableFoundryId} from "./content/item-packs.mjs";
export async function currentAbilityPack(root=new URL("../",import.meta.url)) {
 const read=async name=>JSON.parse(await readFile(new URL(`static/data/${name}.json`,root)));
 const [choices,inventory,wounds,forge,references]=await Promise.all(["choices","inventory","wounds","forge","forge-references"].map(read));
 const current=applyForgePlaytest(forge,references),catalogs=workshopCatalogs(choices,inventory,wounds,current.forge,current.references);
 const documents=[...catalogs.choices.filter(record=>record.kind==="ability").map(record=>currentWorkshopItemSource(record,catalogs)),...catalogs.forge.spells.map(record=>currentWorkshopItemSource(record,catalogs,{spell:true}))].map(item=>{const id=stableFoundryId(item.flags["heroes-of-legend"].catalogId);return {_key:`!items!${id}`,_id:id,...item,effects:[]};});
 if(new Set(documents.map(item=>item._id)).size!==documents.length)throw new Error("Duplicate current ability pack identities.");
 return documents;
}
export async function generateCurrentAbilityPack({root=new URL("../",import.meta.url),check=false}={}) {
 const documents=await currentAbilityPack(root),directory=new URL("content/current-packs/abilities/",root);
 if(!check){await rm(directory,{recursive:true,force:true});await mkdir(directory,{recursive:true});}
 for(const document of documents){const target=new URL(`${document._id}.json`,directory),bytes=JSON.stringify(document,null,2)+"\n";if(check){if(await readFile(target,"utf8")!==bytes)throw new Error(`Current ability drift: ${document.name}`);}else await writeFile(target,bytes);}
 if(check&&(await readdir(directory)).length!==documents.length)throw new Error("Unexpected current ability pack files.");
 return documents;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.info(`${(await generateCurrentAbilityPack({check:process.argv.includes("--check")})).length} current ability/spell Items verified`);
