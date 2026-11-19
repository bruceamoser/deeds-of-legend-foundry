import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { selectTestUser } from './helpers/login.mjs';

const url = process.env.HOL_TEST_URL;
assert.equal(url, 'http://localhost:30025');
assert.equal(process.env.HOL_TEST_ALLOW_WRITES, '1');
assert.equal(process.env.HOL_TEST_ISOLATED_WORLD, '1');
assert.equal(process.env.HOL_NATIVE_RUNTIME_LEASE, 'workshop');
const { version } = JSON.parse(await readFile('static/system.json'));
const portable = JSON.parse(await readFile('Build-Offs/revised/builds/wizard-level-3.hol.json'));
portable.draft.name = 'Round-trip Workshop Hero';
portable.draft.play = { ...portable.draft.play, hp: 5, sp: 2 };
const output = 'test-results/foundry-workshop-followup';
await mkdir(output, { recursive: true });
const root = resolve('dist/workshop');
const types = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const file = resolve(root, new URL(request.url, 'http://localhost').pathname.slice(1) || 'index.html');
    if (!file.startsWith(`${root}/`)) throw new Error('Outside Workshop build');
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch {
    response.statusCode = 404;
    response.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1510, height: 1080 } });
const web = await context.newPage();
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
let id;
try {
  await web.goto(process.env.HOL_WORKSHOP_TEST_URL || `http://127.0.0.1:${server.address().port}/`);
  await web.evaluate(character => localStorage.setItem('hol.workshop.v1', JSON.stringify({ character, mode: 'sheet', tab: 'Main' })), portable);
  await web.reload();
  await expect(web.getByRole('heading', { name: portable.draft.name, exact: true })).toBeVisible();
  const downloaded = web.waitForEvent('download');
  await web.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const download = await downloaded;
  const path = `${output}/${download.suggestedFilename()}`;
  await download.saveAs(path);
  const exported = JSON.parse(await readFile(path));
  assert.equal(exported.draft.name, portable.draft.name);

  await page.goto(`${url}/join`);
  await selectTestUser(page, 'Gamemaster');
  await page.locator('button[name=join]').click();
  await page.waitForFunction(() => globalThis.game?.ready, null, { timeout: 60000 });
  assert.deepEqual(await page.evaluate(() => [game.world.id, game.system.version, game.release.build]), ['hol-native-325', version, 370]);
  id = await page.evaluate(async () => {
    foundry.nue.Tour.activeTour?.exit();
    globalThis.__followupActor = (await Actor.create({ name: 'Empty Workshop Hero', type: 'character' })).id;
    const actor = game.actors.get(__followupActor);
    await actor.sheet.render({ force: true });
    return actor.id;
  });
  const sheet = page.locator('.hol-workshop-character');
  await expect(sheet.getByRole('textbox', { name: 'Character name' })).toHaveValue('Empty Workshop Hero');
  await expect(sheet.getByRole('button', { name: 'Create hero in Workshop' })).toHaveCount(0);
  await sheet.screenshot({ path: `${output}/new-character.png` });
  console.info('Opening an empty actor immediately mounts the Identity step, with its Foundry name.');

  await page.evaluate(() => { ui.sidebar.expand(); ui.sidebar.activateTab('actors'); });
  const directoryEntry = page.locator(`#actors [data-entry-id="${id}"]`);
  await directoryEntry.click({ button: 'right' });
  await page.getByText('Import Data', { exact: true }).click();
  const importer = page.locator('.application').filter({ has: page.locator('input[type=file][name=data]') });
  await importer.locator('input[type=file][name=data]').setInputFiles(path);
  await importer.getByRole('button', { name: 'Import', exact: true }).click();
  await page.waitForFunction(({ id, name }) => game.actors.get(id)?.name === name, { id, name: exported.draft.name });
  const imported = await page.evaluate(id => {
    const actor = game.actors.get(id);
    return { uuid: actor.uuid, hp: actor.system.health.value, sp: actor.system.sp.value,
      draft: actor.getFlag('heroes-of-legend', 'nativeWorkshop').portable.draft,
      items: actor.items.map(item => item.system.catalogId || item.getFlag('heroes-of-legend', 'catalogId')) };
  }, id);
  assert.equal(imported.uuid, `Actor.${id}`);
  assert.equal(imported.hp, 5);
  assert.equal(imported.sp, 2);
  assert.deepEqual(imported.draft.attributes, exported.draft.attributes);
  assert.deepEqual(imported.draft.purchases, exported.draft.purchases);
  assert(imported.items.includes('spell:telekinesis:2'));
  assert(imported.items.includes('item-ordinary-melee-weapon'));
  await expect(sheet.getByRole('heading', { name: exported.draft.name, exact: true })).toBeVisible();
  console.info('Actual Workshop download imported through Actors → Import Data and replaced the blank sheet in place.');

  const pencil = sheet.getByRole('button', { name: 'Edit character name', exact: true });
  await pencil.click();
  const rename = page.locator('.application').filter({ has: page.locator('#hol-character-name') });
  await rename.getByLabel('Character name').fill('Canceled rename');
  await rename.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(sheet.getByRole('heading', { name: exported.draft.name, exact: true })).toBeVisible();
  await pencil.click();
  await rename.getByLabel('Character name').fill('Renamed Round-trip Hero');
  await rename.getByRole('button', { name: 'Save name', exact: true }).click();
  await expect(sheet.getByRole('heading', { name: 'Renamed Round-trip Hero', exact: true })).toBeVisible();
  assert.equal(await page.evaluate(id => game.actors.get(id).prototypeToken.name, id), 'Renamed Round-trip Hero');
  assert.deepEqual(await page.evaluate(id => game.actors.get(id).items.map(item => item.system.catalogId || item.getFlag('heroes-of-legend', 'catalogId')), id), imported.items);
  console.info('Name pencil cancels cleanly and saves Actor and prototype token names without recreating items.');

  const tokenizer = await page.evaluate(() => {
    const module = game.modules.get('vtta-tokenizer');
    return [module?.version, module?.active];
  });
  assert.deepEqual(tokenizer, ['5.0.3', true]);
  const portrait = sheet.getByRole('button', { name: 'Edit character portrait' });
  assert(await portrait.evaluate(image => image.getRootNode() === document && image.dataset.action === 'editImage' && image.dataset.edit === 'img'));
  const tokenizerWindow = page.locator('.window-app.tokenizer, .application.tokenizer, #tokenizer');
  await portrait.click();
  await expect(tokenizerWindow.first()).toBeVisible();
  await tokenizerWindow.first().screenshot({ path: `${output}/tokenizer.png` });
  await tokenizerWindow.first().locator('[data-action="close"], .header-button.close').click();
  await portrait.click({ modifiers: ['Shift'] });
  const picker = page.locator('form.application').filter({ has: page.locator('input[name=file]') });
  await expect(picker).toBeVisible();
  await picker.locator('[data-action="close"]').click();
  console.info('Actual Tokenizer 5.0.3 opens on portrait click; Shift opens Foundry’s Image Browser.');

  const readVitals = () => page.evaluate(id => {
    const actor = game.actors.get(id);
    return { hp: actor.system.health.value, maxHp: actor.system.health.max, sp: actor.system.sp.value, maxSp: actor.system.sp.max };
  }, id);
  const base = await readVitals();
  const speed = sheet.locator("[data-speed]");
  const baseSpeed = Number((await speed.innerText()).split("/")[0]);
  await sheet.getByRole('tab', { name: 'Inventory', exact: true }).click();
  await sheet.getByRole('button', { name: 'Edit Ordinary Melee Weapon', exact: true }).click();
  const editor = page.locator('.hol-equipment-editor');
  await editor.getByText('HP, SP and Speed', { exact: true }).click();
  await editor.getByLabel('Maximum HP', { exact: true }).fill('4');
  await editor.getByLabel('Maximum SP', { exact: true }).fill('3');
  await editor.getByLabel('Speed', { exact: true }).fill('2');
  await editor.getByText('Damage resistance', { exact: true }).click();
  await editor.getByLabel('Fire', { exact: true }).fill('2');
  const editorWindow = page.locator('.application.hol-equipment');
  assert((await editor.boundingBox()).height > 220, 'Expanded item editor has a usable scrolling area');
  await editorWindow.screenshot({ path: `${output}/item-editor.png` });
  await editorWindow.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect.poll(readVitals).toEqual({ ...base, maxHp: base.maxHp + 4, maxSp: base.maxSp + 3 });
  await page.locator('.application.hol-equipment').locator('[data-action="close"]').click();
  await sheet.getByRole('tab', { name: 'Main', exact: true }).click();
  await expect(sheet.getByText('Fire resistance', { exact: true })).toBeVisible();
  const fireDamage = await page.evaluate(async id => {
    const actor = game.actors.get(id);
    const { damageBasis, damagePreview } = await import('/systems/heroes-of-legend/services/damage.mjs');
    const basis = damageBasis(actor);
    const damage = damagePreview(actor, basis, { components: [{ type: 'fire', amount: 5 }] }, { isAttack: false });
    return damage.event.total;
  }, id);
  assert.equal(fireDamage, 3);
  await expect(speed).toHaveText(String(baseSpeed + 2));
  await page.evaluate(id => {
    const actor = game.actors.get(id);
    return actor.update({ 'system.health.value': actor.system.health.max, 'system.sp.value': actor.system.sp.max });
  }, id);
  await sheet.getByRole('tab', { name: 'Inventory', exact: true }).click();
  const weapon = sheet.getByRole('row').filter({ has: page.getByRole('button', { name: 'Ordinary Melee Weapon', exact: true }) });
  const held = weapon.getByRole('checkbox', { name: 'Hold Ordinary Melee Weapon', exact: true });
  await held.uncheck();
  await expect.poll(readVitals).toEqual({ ...base, hp: base.maxHp, sp: base.maxSp });
  await held.check();
  await expect.poll(readVitals).toEqual({ hp: base.maxHp, sp: base.maxSp, maxHp: base.maxHp + 4, maxSp: base.maxSp + 3 });
  console.info('Item editor saves HP, SP, Speed and typed DR. Fire damage uses the bonus, removing gear clamps resources, and equipping does not heal.');

  const setVitals = () => page.evaluate(id => game.actors.get(id).update({ 'system.health.value': 1, 'system.sp.value': 0 }), id);
  const rests = () => page.evaluate(id => game.messages.map(message => message.getFlag('heroes-of-legend', 'restResult'))
    .filter(result => result?.actorUuid === `Actor.${id}`), id);
  const brief = sheet.getByRole('button', { name: 'Brief Rest', exact: true });
  const restDialog = sheet.getByRole('dialog', { name: 'Brief Rest', exact: true });
  const completeBrief = () => restDialog.getByRole('button', { name: 'Complete Brief Rest', exact: true }).click();
  await setVitals();
  await brief.click();
  await restDialog.screenshot({ path: `${output}/brief-rest.png` });
  await completeBrief();
  await expect.poll(readVitals).toMatchObject({ hp: 7, sp: 3 });
  await brief.click();
  await completeBrief();
  await expect.poll(readVitals).toMatchObject({ hp: 13, sp: 6 });
  await expect.poll(async () => (await rests()).length).toBe(2);

  await setVitals();
  await brief.click();
  await restDialog.getByRole('checkbox', { name: 'First Aid', exact: true }).check();
  await restDialog.getByLabel('Healer', { exact: true }).selectOption('other');
  await restDialog.getByLabel('Healer’s Knowledge roll total', { exact: true }).fill('12');
  await restDialog.getByRole('checkbox', { name: /Spellcraft Recovery/ }).check();
  await completeBrief();
  await expect.poll(readVitals).toMatchObject({ hp: 11, sp: 4 });
  await expect.poll(async () => (await rests()).at(-1)).toMatchObject({ firstAid: { tier: 'standard', total: 12, restored: 4 }, spellcraftSp: 1 });

  await setVitals();
  await brief.click();
  await restDialog.getByRole('checkbox', { name: 'First Aid', exact: true }).check();
  await page.evaluate(() => {
    const original = CONFIG.Dice.randomUniform;
    let dice = 3;
    CONFIG.Dice.randomUniform = () => {
      if (--dice === 0) CONFIG.Dice.randomUniform = original;
      return 1 - 3.5 / 6;
    };
  });
  await completeBrief();
  await expect.poll(readVitals).toMatchObject({ hp: 11, sp: 3 });
  await expect.poll(async () => (await rests()).at(-1)).toMatchObject({ firstAid: { tier: 'standard', total: 14, restored: 4 } });

  await sheet.getByRole('button', { name: 'Night’s Rest', exact: true }).click();
  await expect(restDialog).toBeHidden();
  await expect.poll(readVitals).toEqual({ hp: base.maxHp + 4, sp: base.maxSp + 3, maxHp: base.maxHp + 4, maxSp: base.maxSp + 3 });
  await expect.poll(async () => (await rests()).at(-1)).toMatchObject({ kind: 'nights-rest' });
  console.info('Brief Rest restores 6 HP/3 SP, allows table-authorized repeat use, and can add a self or outside First Aid roll and Spellcraft. Night’s Rest restores full resources with a chat result.');
  await sheet.locator('[data-action=close]').click();
  await expect(sheet).toHaveCount(0);
  assert.deepEqual(errors, []);
} finally {
  await page.evaluate(async () => { if (globalThis.__followupActor) await game.actors.get(__followupActor)?.delete(); }).catch(error => console.error('Fixture cleanup:', error.message));
  await browser.close();
  server.close();
}
