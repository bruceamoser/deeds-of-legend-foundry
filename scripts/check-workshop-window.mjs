import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { selectTestUser } from './helpers/login.mjs';

const url = process.env.HOL_TEST_URL;
assert.equal(url, 'http://localhost:30025');
assert.equal(process.env.HOL_TEST_ALLOW_WRITES, '1');
assert.equal(process.env.HOL_TEST_ISOLATED_WORLD, '1');
assert.equal(process.env.HOL_NATIVE_RUNTIME_LEASE, 'workshop');
const { version } = JSON.parse(await readFile('static/system.json'));
const portable = JSON.parse(await readFile('Build-Offs/revised/builds/wizard-level-3.hol.json'));
portable.draft.name = 'Workshop Window Test Hero';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1510, height: 1080 } });
const errors = [];
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
const page = await context.newPage();
page.setDefaultTimeout(12000);
const sheet = page.locator('.hol-workshop-character');
let id;
try {
  await page.goto(`${url}/join`);
  await selectTestUser(page, 'Gamemaster');
  await page.locator('button[name=join]').click();
  await page.waitForFunction(() => globalThis.game?.ready, null, { timeout: 60000 });
  const runtime = await page.evaluate(() => ({
    world: game.world.id, version: game.system.version, build: game.release.build,
    popoutVersion: game.modules.get('popout')?.version, popoutActive: game.modules.get('popout')?.active,
  }));
  assert.deepEqual(runtime, { world: 'hol-native-325', version, build: 370, popoutVersion: '2.24', popoutActive: true });
  id = await page.evaluate(async () => {
    foundry.nue.Tour.activeTour?.exit();
    return (await Actor.create({ name: 'Workshop Window Test Hero', type: 'character' })).id;
  });
  await page.evaluate(async ({ id, portable }) => {
    const actor = game.actors.get(id);
    await actor.importFromJSON(JSON.stringify(portable));
    await actor.sheet.render({ force: true, position: { left: 0, top: 0 } });
  }, { id, portable });
  await expect(sheet.getByRole('heading', { name: portable.draft.name, exact: true })).toBeVisible();
  await page.locator('#notifications .notification').evaluateAll(nodes => nodes.forEach(node => node.lastElementChild?.click()));
  const header = await sheet.locator('.window-header').boundingBox();
  await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2);
  await page.mouse.down();
  await page.mouse.move(header.x + header.width / 2 + 160, header.y + header.height / 2 + 100, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await sheet.boundingBox()).x).toBeGreaterThan(100);
  await expect.poll(async () => (await sheet.boundingBox()).y).toBeGreaterThan(70);
  const dragPosition = await sheet.boundingBox();

  async function detach() {
    await sheet.locator('.window-header [data-action=toggleControls]').click();
    const popup = page.waitForEvent('popup');
    await page.getByText('Detach Window', { exact: true }).click();
    const detached = await popup;
    await expect(detached.locator('.hol-workshop-character').getByRole('heading', { name: portable.draft.name, exact: true })).toBeVisible();
    return detached;
  }

  await expect(sheet.locator('.popout-module-button')).toHaveCount(0);
  const detached = await detach();
  const poppedSheet = detached.locator('.hol-workshop-character');
  await expect(sheet).toHaveCount(0);
  await poppedSheet.getByRole('tab', { name: 'Inventory', exact: true }).click();
  await expect(poppedSheet.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  await poppedSheet.locator('.window-header [data-action=toggleControls]').click();
  const popupClosed = detached.waitForEvent('close');
  await detached.getByText('Re-attach Window', { exact: true }).click();
  await popupClosed;
  await expect(sheet.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  const returned = await sheet.boundingBox();
  await page.mouse.move(returned.x + returned.width / 2, returned.y + header.height / 2);
  await page.mouse.down();
  await page.mouse.move(returned.x + returned.width / 2 + 75, returned.y + header.height / 2 + 35, { steps: 6 });
  await page.mouse.up();
  await expect.poll(async () => (await sheet.boundingBox()).x).toBeGreaterThan(returned.x + 50);

  await sheet.locator('.window-header [data-action=close]').click();
  await expect(sheet).toHaveCount(0);
  await page.evaluate(id => game.actors.get(id).sheet.render({ force: true }), id);
  await expect(sheet.getByRole('heading', { name: portable.draft.name, exact: true })).toBeVisible();
  const reopenedPopup = await detach();
  await reopenedPopup.close({ runBeforeUnload: true });
  await expect.poll(() => page.evaluate(id => game.actors.get(id).sheet.rendered, id)).toBe(false);
  await page.evaluate(id => game.actors.get(id).sheet.render({ force: true }), id);
  await expect(sheet.getByRole('heading', { name: portable.draft.name, exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  console.info(`V14.370 with PopOut! 2.24 active: dragged from the top-left to (${dragPosition.x}, ${dragPosition.y}), detached, used Inventory, reattached, dragged again, closed and reopened in both windows.`);
} finally {
  try {
    if (id) await page.evaluate(async id => {
      const actor = game.actors.get(id);
      if (actor?.sheet.rendered) await actor.sheet.close();
      await actor?.delete();
    }, id);
  } finally {
    await browser.close();
  }
}
