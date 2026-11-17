import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {runtimeSourceGraph} from '../scripts/runtime-source-graph.mjs';
const root=new URL('../',import.meta.url);
test('installed native module graph contains current PC sheet and no retired PC applications',async()=>{
 const graph=await runtimeSourceGraph(root),files=[...graph.modules];
 assert.ok(files.some(path=>path.endsWith('/src/sheets/workshop-character.mjs')));
 assert.ok(files.some(path=>path.endsWith('/src/sheets/creature-base.mjs')));
 for(const retired of ['sheets/character.mjs','sheets/character-view.mjs','applications/creation.mjs','applications/advancement.mjs','applications/language-picker.mjs','applications/authority.mjs','services/creation.mjs','services/advancement.mjs'])assert.ok(!files.some(path=>path.endsWith('/src/'+retired)),retired);
 for(const template of ['character.hbs','creation.hbs','advancement.hbs','language-picker.hbs','authority.hbs','wounds.hbs'])assert.ok(!graph.templates.has(template),template);
 for(const template of ['recovery.hbs','encounter.hbs','crafting.hbs','landing-setup.hbs'])assert.ok(graph.templates.has(template),template);
 for(const template of graph.templates)assert.ok((await stat(new URL(`static/templates/${template}`,root))).isFile());
 const manifest=JSON.parse(await readFile(new URL('static/system.json',root)));
 assert.ok(!manifest.styles.includes('styles/creation-parity.css'));
});

test('runtime graph follows re-exports, lazy and URL modules and fails on missing or computed edges',async t=>{
 const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{pathToFileURL}=await import('node:url');
 const directory=await mkdtemp(join(tmpdir(),'hol-runtime-graph-'));t.after(()=>rm(directory,{recursive:true,force:true}));await mkdir(join(directory,'src'));
 const fixtureRoot=pathToFileURL(directory+'/');
 await writeFile(join(directory,'src/entry.mjs'),`export {value} from './exported.mjs';\nawait import('./lazy.mjs');\nawait import(new URL('systems/heroes-of-legend/workshop/workshop-mount.mjs',document.baseURI).href);`);
 await writeFile(join(directory,'src/exported.mjs'),'export const value=1;');await writeFile(join(directory,'src/lazy.mjs'),'export default 1;');
 const graph=await runtimeSourceGraph(fixtureRoot,{entries:['entry.mjs'],publicModules:[]});assert.equal(graph.modules.size,3);assert.ok(graph.assets.has('workshop/workshop-mount.mjs'));
 await writeFile(join(directory,'src/lazy.mjs'),"const ID='heroes-of-legend'; export const template=`systems/${ID}/templates/recovery.hbs`;");
 assert.ok((await runtimeSourceGraph(fixtureRoot,{entries:['entry.mjs'],publicModules:[]})).templates.has('recovery.hbs'));
 await writeFile(join(directory,'src/lazy.mjs'),"export const template=`systems/${unknown}/templates/recovery.hbs`;");
 await assert.rejects(runtimeSourceGraph(fixtureRoot,{entries:['entry.mjs'],publicModules:[]}),/Unresolved native template package/);
 await writeFile(join(directory,'src/lazy.mjs'),`export * from './missing.mjs';`);await assert.rejects(runtimeSourceGraph(fixtureRoot,{entries:['entry.mjs'],publicModules:[]}),/Missing native runtime dependency/);
 await writeFile(join(directory,'src/lazy.mjs'),`await import(runtimePath);`);await assert.rejects(runtimeSourceGraph(fixtureRoot,{entries:['entry.mjs'],publicModules:[]}),/Unresolved dynamic native import/);
});
