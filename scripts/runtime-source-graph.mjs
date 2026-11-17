import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
// Public card/macro entry points are intentionally retained even if a UI stops
// importing one directly. They are current native APIs, not archived PC flows.
export const PUBLIC_RUNTIME_MODULES=Object.freeze(['services/shortcuts.mjs','services/reference-play.mjs','services/native-workshop-coordinator.mjs','dialogs/attribute-roll.mjs','applications/crafting.mjs']);
/** Follow import/export-from, literal dynamic imports and explicit URL imports. */
export async function runtimeSourceGraph(root=new URL('../',import.meta.url),{entries=['heroes-of-legend.mjs'],publicModules=PUBLIC_RUNTIME_MODULES}={}) {
 const modules=new Set(),templates=new Set(),assets=new Set(),queue=[...entries,...publicModules].map(path=>new URL(`src/${path}`,root));
 const add=(specifier,importer)=>{
  if(specifier.startsWith('.')){queue.push(new URL(specifier,importer));return;}
  const installed=specifier.match(/^\/?systems\/heroes-of-legend\/(.+\.mjs)$/)?.[1];
  if(installed){if(installed.startsWith('workshop/'))assets.add(installed);else queue.push(new URL(`src/${installed}`,root));return;}
  throw new Error(`Cannot package native module dependency ${specifier} from ${fileURLToPath(importer)}`);
 };
 while(queue.length){
  const url=queue.pop(),path=fileURLToPath(url);if(modules.has(path))continue;
  let source;try{source=await readFile(url,'utf8');}catch(error){throw new Error(`Missing native runtime dependency: ${path}`,{cause:error});}modules.add(path);
  for(const match of source.matchAll(/(?:from\s*|import\(\s*|import\s*)["']([^"']+\.mjs)["']/g))add(match[1],url);
  for(const match of source.matchAll(/import\(\s*new URL\(\s*["']([^"']+\.mjs)["']/g))add(match[1],url);
  // Every computed import must name a literal URL handled above. A new dynamic
  // path requires an explicit packaging decision instead of being omitted.
  const checked=source.replace(/import\(\s*["'][^"']+["']\s*\)/g,'').replace(/import\(\s*new URL\(\s*["'][^"']+["'][\s\S]*?\)\.href\s*\)/g,'');
  if(/\bimport\s*\(/.test(checked))throw new Error(`Unresolved dynamic native import in ${path}`);
  // AppV2 parts also use the module's constant package ID in template literals.
  const templateSource=/\bconst\s+ID\s*=\s*["']heroes-of-legend["']/.test(source)
    ? source.replaceAll('systems/${ID}/templates/','systems/heroes-of-legend/templates/') : source;
  for(const match of templateSource.matchAll(/systems\/heroes-of-legend\/templates\/([a-z0-9-]+\.hbs)/g))templates.add(match[1]);
  if(/systems\/\$\{[^}]+\}\/templates\//.test(templateSource))throw new Error(`Unresolved native template package in ${path}`);
 }
 return {modules,templates,assets};
}
