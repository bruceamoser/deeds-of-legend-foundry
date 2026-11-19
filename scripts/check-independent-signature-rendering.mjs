import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from '@playwright/test';
const repo=resolve('.'),prefix='/signatures/';
const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.webp':'image/webp','.svg':'image/svg+xml'};
// Read current source and pinned data; do not rebuild or contact a Foundry world.
const server=createServer(async(req,res)=>{
 try {
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith(prefix))throw Error('prefix');const relative=path.slice(prefix.length);
  if(relative==='audit.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body><div id="surface" style="height:900px"></div><div id="native"></div></body></html>');return;}
  let file;
  if(process.env.HOL_TEST_DIST === '1')file=resolve('dist/workshop',relative);
  else if(relative.startsWith('rules/'))file=resolve('src',relative);
  else if(relative.startsWith('data/')) {
   const name=relative.slice(5);
   file=resolve(['choices.json','inventory.json','wounds.json','forge.json','forge-references.json'].includes(name)?'static/data':name==='references.json'?'web/data':'dist/workshop/data',name);
  }else if(relative.startsWith('fonts/'))file=resolve('static',relative);
  else file=resolve('web',relative);
  if(!file.startsWith(repo+'/'))throw Error('path');res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.end(await readFile(file));
 }catch{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const manifest=JSON.parse(await readFile('Build-Offs/revised/builds.json','utf8'));
const fixtures={};for(const build of manifest.builds.filter(build=>build.level===7)){
 const portable=JSON.parse(await readFile(`Build-Offs/revised/builds/${build.id}-level-7.hol.json`,'utf8'));
 fixtures[portable.draft.classId]??=portable;
}
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1200,height:1000}});const errors=[];
page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}${prefix}audit.html`);
 const result=await page.evaluate(async fixtures=>{
  const {mountWorkshop}=await import('./workshop-mount.mjs');
  const {workshopCatalogs}=await import('./rules/workshop-forge-catalog.mjs');
  const {signatureProse}=await import('./rules/forge-signatures.mjs');
  const {forgeSpellCastingLabel,isForgeSpell}=await import('./rules/forge-casting.mjs');
  const {currentWorkshopItemSource}=await import('./rules/current-workshop-items.mjs');
  const load=async name=>(await fetch(`data/${name}.json`)).json();
  const [choices,inventory,wounds,graph,refs]=await Promise.all(['choices','inventory','wounds','forge','forge-references'].map(load));
  const catalogs=workshopCatalogs(choices,inventory,wounds,graph,refs);
  const controller=await mountWorkshop(document.querySelector('#surface'),{host:{},initialState:{character:Object.values(fixtures)[0],mode:'sheet'}});
  const root=controller.root,check=(value,message)=>{if(!value)throw Error(message);};
  const plain=text=>String(text).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\*\*/g,'').replace(/\*/g,'').replace(/^#{1,6}\s*/gm,'').replace(/^[-*]\s*/gm,'').replace(/\s+/g,' ').trim();
  let inlineCount=0,referenceCount=0,nativeCount=0,creatorCount=0;
  for(const entry of graph.signatureDevelopment.signatures){
   const portable=structuredClone(fixtures[entry.classId]);check(portable,`Missing fixture ${entry.classId}`);
   if(entry.level===1)portable.draft.signatureId=entry.id;
   else portable.draft.progression.levels[entry.level].signatures[entry.level]=entry.id;
   controller.setState({character:portable,mode:'sheet',tab:'Abilities'});
   const row=root.querySelector(`[data-action-row="${entry.id}"]`);check(row,`Missing learned row ${entry.name}`);
   row.querySelector('[data-action="inline-action"]').click();await controller.settle();
   const detail=root.querySelector(`[data-detail-id="${entry.id}"]`),inline=detail.innerText;
   check(!inline.includes('**'),`Inline raw markdown ${entry.name}`);
   const paragraphs=signatureProse({effect:entry.rulesMarkdown}).split(/\n\s*\n/).filter(Boolean);
   for(const paragraph of paragraphs)check(plain(inline).includes(plain(paragraph)),`Inline missing prose ${entry.name}`);
   inlineCount++;
   const open=document.createElement('button');open.type='button';open.dataset.action='reference';open.dataset.id=entry.id;root.querySelector('#app').append(open);open.click();await controller.settle();
   const reference=root.querySelector('#reference .reference-body').innerText;
   check(!reference.includes('**'),`Reference raw markdown ${entry.name}`);
   for(const paragraph of paragraphs)check(plain(reference).includes(plain(paragraph)),`Reference missing prose ${entry.name}`);
   const record=catalogs.choices.find(record=>record.id===entry.id);
   const casterClass=catalogs.choices.find(record=>record.id===entry.classId);
   const expectedField=(field,cls)=>field.label==='Attribute'&&isForgeSpell(record)?forgeSpellCastingLabel(record,cls):field.value;
   for(const field of record.reference.rules.details)check(plain(reference).toLowerCase().includes(plain(expectedField(field,casterClass)).toLowerCase()),`Reference missing ${field.label}: ${entry.name}`);
   referenceCount++;root.querySelector('#reference').close();
   const native=document.querySelector('#native');native.innerHTML=currentWorkshopItemSource(record,catalogs).system.description;
   check(!native.innerText.includes('**'),`Native raw markdown ${entry.name}`);
   for(const paragraph of paragraphs)check(plain(native.innerText).includes(plain(paragraph)),`Native missing prose ${entry.name}`);
   for(const field of record.reference.rules.details)check(plain(native.innerText).toLowerCase().includes(plain(expectedField(field)).toLowerCase()),`Native missing ${field.label}: ${entry.name}`);
   check(native.querySelectorAll(':scope > :is(p, ul, ol, table)').length>=paragraphs.length,`Native flattened paragraphs or lists ${entry.name}`);nativeCount++;
   if(entry.level===1){
    controller.setState({character:portable,mode:'builder',step:3});
    const selected=root.querySelector('.creation-signature-detail');check(selected,`Creator missing selected own rules ${entry.name}`);
    check(!selected.innerText.includes('**'),`Creator raw markdown ${entry.name}`);
    for(const paragraph of paragraphs)check(plain(selected.innerText).includes(plain(paragraph)),`Creator missing prose ${entry.name}`);
    creatorCount++;
   }
  }
  const spark=graph.signatureDevelopment.signatures.find(entry=>entry.name==='Deliberate Spark');
  const portable=structuredClone(fixtures[spark.classId]);portable.draft.signatureId=spark.id;portable.draft.play??={};portable.draft.play.favorites={abilities:[spark.id],items:[]};
  controller.setState({character:portable,mode:'sheet',tab:'Main'});
  const summary=root.querySelector(`[data-action-row="${spark.id}"] .effect-cell .brief`).textContent;
  check(!/Action:|Attribute:|\*\*/.test(summary),'Compact summary contains metadata');check(summary.startsWith('Choose a corner'),'Compact summary does not start with effect prose');
  const protector=structuredClone(fixtures['class-protector']);protector.draft.signatureId='ability-signature-protector-oathstrike';
  controller.setState({character:protector,mode:'sheet',tab:'Abilities'});
  const before=Number(root.querySelector('[aria-label="Current SP"]').value);
  await controller.useAbility('ability-signature-protector-oathstrike');await controller.flush();
  check(controller.getState().character.draft.play.sp===before-1,'Paid modifier did not spend exactly1SP');
  check(!root.querySelector('#reference').open,'Paid modifier opened a casting/roll dialog');
  controller.dispose();return {inlineCount,referenceCount,nativeCount,creatorCount,paidModifier:true};
 },fixtures);
 assert.deepEqual(result,{inlineCount:90,referenceCount:90,nativeCount:90,creatorCount:30,paidModifier:true});assert.deepEqual(errors,[]);
 console.info('PASS: all90 selected inline/full reference/native cards and30 creator selections render own formatted rules, complete detail fields/prose/paragraphs; compact summary omits metadata; paid modifier spends1SP without casting dialog.');
}finally{await browser.close();server.close();}
