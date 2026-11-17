/** All native gameplay uses the current Workshop catalog. */
export async function loadCatalogs() { return loadWorkshopCatalogs(); }

import { workshopCatalogs } from "../rules/workshop-forge-catalog.mjs";
import { applyForgePlaytest } from "../rules/forge-playtest-catalog.mjs";
let workshop;
export async function loadWorkshopCatalogs() {
  workshop ??= Promise.all(["choices", "inventory", "wounds", "forge", "forge-references"].map(async name => {
    const response = await fetch(`systems/heroes-of-legend/data/${name}.json`);
    if (!response.ok) throw new Error(`Cannot load ${name} catalog`);
    return response.json();
  })).then(([choices, inventory, wounds, forge, references]) => {
    const current = applyForgePlaytest(forge, references);
    const result=workshopCatalogs(choices, inventory, wounds, current.forge, current.references);
    result.inventory.currentActions=current.forge.basicActions;
    return result;
  }).catch(error => { workshop = null; throw error; });
  return workshop;
}
