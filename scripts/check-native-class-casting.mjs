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
const flags = 'heroes-of-legend';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const ids = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => localStorage.setItem('core.noCanvas', 'true'));

async function createHero(build, name, customize) {
  const portable = JSON.parse(await readFile(`Build-Offs/revised/builds/${build}-level-1.hol.json`));
  portable.draft.name = name;
  customize(portable.draft);
  const id = await page.evaluate(async name => (await Actor.create({ name, type: 'character' })).id, name);
  ids.push(id);
  await page.evaluate(async ({ id, portable }) => {
    const actor = game.actors.get(id);
    await actor.importFromJSON(JSON.stringify(portable));
    await actor.sheet.render({ force: true });
    await actor.sheet.mountReady;
  }, { id, portable });
  return id;
}

const sheet = page.locator('.hol-workshop-character');
try {
  await page.goto(`${url}/join`);
  await selectTestUser(page, 'Gamemaster');
  await page.locator('button[name=join]').click();
  await page.waitForFunction(() => globalThis.game?.ready, null, { timeout: 60000 });
  assert.deepEqual(await page.evaluate(() => [game.world.id, game.system.version, game.release.build]), ['hol-native-325', version, 370]);
  await page.evaluate(() => foundry.nue.Tour.activeTour?.exit());
  for (const [build, name, key] of [
    ['wizard', 'Arcanist Casting Test', 'knowledge'],
    ['cleric', 'Shepherd Casting Test', 'reason'],
    ['rogue', 'Shadow Casting Test', 'guile'],
  ]) {
    const id = await createHero(build, name, draft => {
      draft.purchases[1] = [{ id: 'elements' }, { id: 'flame:0' }];
    });
    await expect(sheet.getByRole('heading', { name, exact: true })).toBeVisible();
    await sheet.getByRole('tab', { name: 'Spellbooks', exact: true }).click();
    const fire = sheet.locator('[data-action-row="spell:flame:1"]');
    const book = fire.locator('xpath=ancestor::details[1]');
    if (await book.getAttribute('open') === null) await book.locator(':scope > summary').click();
    await fire.getByRole('button', { name: 'Expand Fire Bolt', exact: true }).click();
    const detail = sheet.locator('[data-detail-id="spell:flame:1"]');
    await expect(detail).toContainText('One creature within 12 squares');
    await expect(detail).toContainText(key[0].toUpperCase() + key.slice(1));
    await fire.getByRole('button', { name: 'Cast Fire Bolt', exact: true }).click();
    const dialog = sheet.getByRole('dialog', { name: 'Fire Bolt', exact: true });
    await expect(dialog.getByLabel('Roll attribute', { exact: true })).toHaveValue(key);
    await expect(dialog.getByLabel('Roll attribute', { exact: true })).toBeDisabled();
    const slider = dialog.locator('#recipe-net');
    await expect(slider).toHaveValue('0');
    await slider.press('ArrowLeft');
    await expect(slider).toHaveValue('-1');
    await dialog.getByRole('button', { name: 'Cast and roll', exact: true }).click();
    await expect(dialog).toBeHidden();
    const readRoll = () => page.evaluate(({ id, flags }) => game.messages.map(message => message.getFlag(flags, 'roll'))
      .find(roll => roll?.actorUuid === `Actor.${id}` && roll.ability?.name === 'Fire Bolt'), { id, flags });
    await expect.poll(readRoll).toMatchObject({ attributeKey: key, attribute: 2, count: 4, net: -1 });
    await sheet.locator('.window-header [data-action=close]').click();
    await expect(sheet).toHaveCount(0);
  }
  console.info('Foundry rolled the same Fire Bolt with Knowledge, Reason and Guile for Arcanist, Shepherd and Shadow, preserving the manual Bane slider.');

  const blade = await createHero('fighter', 'Blade Reserve Test', draft => {
    draft.attributes = { ...draft.attributes, brawn: 0, knowledge: 2 };
  });
  const max = await page.evaluate(async ({ blade, flags }) => {
    const actor = game.actors.get(blade);
    const max = actor.toObject().system.sp.max;
    await actor.update({ 'system.sp.value': 1, 'system.sp.max': max - 4, [`flags.${flags}.-=bladeCastingSpUpdated`]: null });
    Hooks.callAll('userConnected', game.user, true);
    return max;
  }, { blade, flags });
  const reserve = () => page.evaluate(({ blade, flags }) => {
    const actor = game.actors.get(blade);
    return { value: actor.system.sp.value, max: actor.toObject().system.sp.max, migrated: actor.getFlag(flags, 'bladeCastingSpUpdated') };
  }, { blade, flags });
  await expect.poll(reserve).toEqual({ value: 1, max, migrated: true });
  await page.evaluate(() => Hooks.callAll('userConnected', game.user, true));
  assert.deepEqual(await reserve(), { value: 1, max, migrated: true });
  assert.deepEqual(errors, []);
  console.info('Existing Blade reserve updated exactly once using Knowledge while leaving spent SP spent.');
} finally {
  try {
    if (ids.length) await page.evaluate(async ({ ids, flags }) => {
      const uuids = new Set(ids.map(id => `Actor.${id}`));
      const messages = game.messages.filter(message => ids.includes(message.speaker?.actor) ||
        uuids.has(message.getFlag(flags, 'nativeWorkshopRequest')?.actorUuid)).map(message => message.id);
      if (messages.length) await ChatMessage.deleteDocuments(messages);
      for (const id of ids) {
        const actor = game.actors.get(id);
        if (actor?.sheet.rendered) await actor.sheet.close();
        await actor?.delete();
      }
    }, { ids, flags });
  } finally {
    await browser.close();
  }
}
