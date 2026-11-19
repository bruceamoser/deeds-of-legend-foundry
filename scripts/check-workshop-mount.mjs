import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const root = resolve("dist/workshop"),
  prefix = "/heroes-of-legend-foundry/";
const types = {
  ".html": "text/html",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith(prefix)) throw new Error("wrong base path");
    let file = resolve(
      root,
      url.pathname.slice(prefix.length) || "index.html",
    );
    if (!file.startsWith(root + "/")) throw new Error("invalid path");
    // Exercise current source without rebuilding the native runtime candidate.
    const relative=url.pathname.slice(prefix.length) || "index.html";
    if(process.env.HOL_TEST_DIST !== '1' && /^data\/(choices|inventory|wounds|forge|forge-references)\.json$/.test(relative)) file=resolve('static',relative);
    else if(process.env.HOL_TEST_DIST !== '1' && relative.startsWith('rules/') && extname(file)==='.mjs') file=resolve('src',relative);
    else if(process.env.HOL_TEST_DIST !== '1' && ['.mjs','.css','.html'].includes(extname(file))) file=resolve('web',relative);
    res.setHeader(
      "Content-Type",
      types[extname(file)] ?? "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
page.setDefaultTimeout(5000);
const failures = [];
page.on("pageerror", (e) => failures.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
});
try {
  await page.goto(`http://127.0.0.1:${server.address().port}${prefix}`);
  await page.waitForSelector('.hero-header');
  const wizard=JSON.parse(await readFile("Build-Offs/revised/builds/wizard-level-3.hol.json","utf8"));
  const result=await page.evaluate(async wizard=>{
    const {mountWorkshop}=await import('./workshop-mount.mjs');
    const initial=JSON.parse(localStorage.getItem('hol.workshop.v1'));
    const snapshot=localStorage.getItem('hol.workshop.v1');
    const first=document.createElement('div'),second=document.createElement('div');
    first.style.height=second.style.height='900px'; document.body.replaceChildren(first,second);
    const saved=[],actions=[],rolls=[],opened=[];
    const nativeHost={tracking:{food:false},onRoll:request=>{rolls.push(request);return Array(request.count).fill(4);},onChange:state=>saved.push(state),onAction:event=>{actions.push(event.action);if(event.action==='native-open-item')opened.push(event.id);return ['native-portrait','native-open-item'].includes(event.action);}};
    const a=await mountWorkshop(first,{initialState:initial,host:nativeHost});
    first.style.width='780px';
    const torchFits = [false,true].every(lit => {
      const label = lit ? 'Extinguish torch' : 'Light torch';
      nativeHost.itemActions = item => item.catalogId === 'item-lighting-bundle'
        ? [{action:'torch-toggle',label,lit}] : [];
      a.setState({...a.getState(),tab:'Main'});
      const torch = first.shadowRoot.querySelector(`[data-collapse="supplies"] button[aria-label="${label}"]`);
      const row = torch?.closest('.supply-row');
      if (!row) return false;
      const controls = row.querySelector('.supply-controls').getBoundingClientRect();
      const toggle = torch.getBoundingClientRect();
      const refill = row.querySelector('[data-action="resupply-dialog"]').getBoundingClientRect();
      return toggle.width <= 24 && toggle.top === refill.top &&
        controls.right <= row.getBoundingClientRect().right;
    });
    delete nativeHost.itemActions;
    first.style.width='';
    const bHost={};const b=await mountWorkshop(second,{initialState:initial,host:bHost});
    const original=b.getState().character.draft.name;
    const state=a.getState();state.character.draft.name='Isolated hero';a.setState(state);
    first.shadowRoot.querySelector('[data-action="edit"]').click();
    await new Promise(resolve=>setTimeout(resolve,100));
    const input=first.shadowRoot.querySelector('[data-field="name"]');
    input.value='Persisted hero';input.dispatchEvent(new Event('change',{bubbles:true}));
    await a.flush();
    first.shadowRoot.querySelector('.hero-mark').click();
    await new Promise(resolve=>setTimeout(resolve,50));
    first.shadowRoot.querySelector('[data-action="open-roll"]').click();
    await new Promise(resolve=>setTimeout(resolve,50));
    first.shadowRoot.querySelector('[data-action="roll-sheet"]').click();
    await new Promise(resolve=>setTimeout(resolve,50));
    const rollText=first.shadowRoot.querySelector('#recipe-roll-result').textContent;
    first.shadowRoot.querySelector('#reference').close();
    let unknownRejected=false;try{await a.useAbility('not-learned');}catch{unknownRejected=true;}
    first.shadowRoot.querySelector('[data-tab="Inventory"]').click();await a.settle();
    const rename=[...first.shadowRoot.querySelectorAll('[data-action="rename-item"]')].find(button=>button.getAttribute('aria-label').includes('Ordinary Melee Weapon'));
    rename.click();await a.settle();const renamedInstance=rename.dataset.instance;
    const nameInput=first.shadowRoot.querySelector('[data-item-name]');nameInput.value='Shared named blade';nameInput.dispatchEvent(new Event('change',{bubbles:true}));await a.flush();
    const renamed=a.getState().character.draft.play.inventory.overrides[renamedInstance].name;
    const food=first.shadowRoot.querySelector('[data-action="reference"][data-id="item-food-bundle"]').closest('tr');
    const untracked=food.children[3].textContent.includes('Untracked');
    const foodInstance=food.dataset.instance;const beforeDie=a.getState().character.draft.play.inventory?.overrides?.[foodInstance]?.inventoryDie;
    food.querySelector('[data-action="use-supply-dialog"]').click();await a.settle();
    first.shadowRoot.querySelector('[data-action="confirm-supply"]').click();await a.settle();
    const noDepletion=a.getState().character.draft.play.inventory?.overrides?.[foodInstance]?.inventoryDie===beforeDie;
    const supplyDialogClosed=!first.shadowRoot.querySelector('#reference').open;
    nativeHost.tracksItem=item=>item.catalogId==='item-food-bundle' ? true : undefined;
    a.setState({...a.getState(),tab:'Inventory'});
    const overrideTracked=!first.shadowRoot.querySelector('[data-action="reference"][data-id="item-food-bundle"]').closest('tr').children[3].textContent.includes('Untracked');
    const stats=first.shadowRoot.querySelectorAll('.inventory-stats strong');
    const originalBulk=Number(stats[1].textContent.split('/')[0]);
    nativeHost.nativeItems=()=>[{id:'custom-rock',name:'Bound Stone',type:'equipment',knownCatalog:false,quantity:2,bulk:20,carried:true},{id:'custom-ability',name:'Table Special',type:'ability',knownCatalog:false}];
    nativeHost.projectInventory=items=>({items,additional:[{catalogId:null,quantity:2,bulk:40,carried:true,worn:false,held:false}]});
    nativeHost.canDeleteItem=()=>false;
    a.setState({...a.getState(),tab:'Inventory'});
    const burdenBulk=Number(first.shadowRoot.querySelectorAll('.inventory-stats strong')[1].textContent.split('/')[0]);
    const burdenSpeed=Number(first.shadowRoot.querySelectorAll('.inventory-stats strong')[3].textContent);
    const fallbackEquipment=Boolean(first.shadowRoot.querySelector('[data-native-item="custom-rock"]'));
    const noMisleadingDelete=first.shadowRoot.querySelectorAll('[data-action="drop-item"]').length===0;
    nativeHost.readOnly=true;a.setState(a.getState());
    first.shadowRoot.querySelector('[data-native-item="custom-rock"] [data-action="native-open-item"]').click();await a.settle();
    a.setState({...a.getState(),tab:'Abilities'});
    const fallbackAbility=Boolean(first.shadowRoot.querySelector('[data-native-item="custom-ability"]'));
    first.shadowRoot.querySelector('[data-native-item="custom-ability"] [data-action="native-open-item"]').click();await a.settle();
    bHost.readOnly=true;b.setState(b.getState());
    const result={torchFits,overrideTracked,originalBulk,burdenBulk,burdenSpeed,fallbackEquipment,fallbackAbility,noMisleadingDelete,opened,unknownRejected,renamed,noDepletion,untracked,supplyDialogClosed,readOnly:[...second.shadowRoot.querySelectorAll('#app input,#app textarea')].every(node=>node.disabled),rollCount:rolls.length,rollText,name:b.getState().character.draft.name,original,saved:saved.at(-1)?.character.draft.name,
      storageUnchanged:snapshot===localStorage.getItem('hol.workshop.v1'),portrait:actions.includes('native-portrait'),
      nav:first.shadowRoot.querySelector('.site-header'),dialog:first.shadowRoot.querySelector('#reference')!==second.shadowRoot.querySelector('#reference')};
    bHost.readOnly=false;
    const castSaved=[];bHost.onChange=state=>castSaved.push(state);
    bHost.beforeUse=async()=>{await Promise.resolve();b.setState(b.getState());};
    b.setState({character:wizard,mode:'sheet'});
    const startingSp=Number(second.shadowRoot.querySelector('[aria-label="Current SP"]').value);
    await b.useAbility('spell:telekinesis:2');await b.flush();
    result.castSp=b.getState().character.draft.play.sp;
    result.savedCastSp=castSaved.at(-1).character.draft.play.sp;
    result.startingSp=startingSp;
    a.dispose();b.dispose();return result;
  },wizard);
  assert.equal(result.castSp,result.startingSp-1);assert.equal(result.savedCastSp,result.startingSp-1);
  assert(result.torchFits,"Both torch states fit with resupply on one row of the mounted sheet.");
  assert(result.overrideTracked);assert.equal(result.burdenBulk,result.originalBulk+40);assert.equal(result.burdenSpeed,0);assert(result.fallbackEquipment);assert(result.fallbackAbility);assert(result.noMisleadingDelete);assert.deepEqual(result.opened,['custom-rock','custom-ability']);
  assert(result.unknownRejected);assert.equal(result.renamed,'Shared named blade');assert(result.noDepletion);assert(result.untracked);assert(result.supplyDialogClosed);assert(result.readOnly);assert.equal(result.rollCount,1);assert.match(result.rollText,/4 · 4 · 4/);assert.equal(result.name,result.original);assert.equal(result.saved,'Persisted hero');
  assert(result.storageUnchanged);assert(result.portrait);assert(result.dialog);assert.equal(result.nav,null);
  assert.deepEqual(failures,[]);
  console.info('Shared Workshop: isolated mounts, host saves/actions, storage isolation and disposal passed.');
} finally {await browser.close();server.close();}
