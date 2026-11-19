import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { startingProvisions } from "../src/rules/training-equipment.mjs";
import { selectTestUser } from "./helpers/login.mjs";

const url = process.env.HOL_TEST_URL;
assert.equal(url, "http://localhost:30025");
assert.equal(process.env.HOL_TEST_ALLOW_WRITES, "1");
assert.equal(process.env.HOL_TEST_ISOLATED_WORLD, "1");
assert.equal(process.env.HOL_NATIVE_RUNTIME_LEASE, "workshop");

const portable = JSON.parse(await readFile("Build-Offs/revised/builds/fighter-level-1.hol.json"));
const provisioning = startingProvisions();
portable.draft.shopping = provisioning;
portable.draft.loadout = {};
portable.draft.startingProvisionsChosen = true;
portable.draft.name = "Playtest356 Inventory";
const expectedSystem = JSON.parse(await readFile("static/system.json")).version;
const browser = await chromium.launch();
let gm, player, fixture;
const errors = [];

async function join(name) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => localStorage.setItem("core.noCanvas", "true"));
  page.setDefaultTimeout(15000);
  page.on("pageerror", error => errors.push(`${name}: ${error.message}`));
  await page.goto(`${url}/join`);
  await selectTestUser(page, name);
  await page.locator('button[name="join"]').click();
  await page.waitForFunction(() => globalThis.game?.ready, null, { timeout: 60000 });
  await page.evaluate(() => foundry.nue.Tour.activeTour?.exit());
  return page;
}

try {
  gm = await join("Gamemaster");
  assert.deepEqual(await gm.evaluate(() => [game.world.id, game.system.version, game.release.build]),
    ["hol-native-325", expectedSystem, 370]);
  fixture = await gm.evaluate(async portable => {
    const f = globalThis.__holInventory356 = { sources: [] };
    const user = await User.create({ name: `Inventory356 owner ${foundry.utils.randomID(5)}`, role: CONST.USER_ROLES.TRUSTED });
    f.user = user.id;
    f.name = user.name;
    const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    const actor = await Actor.create({ name: portable.draft.name, type: "character", ownership });
    f.actor = actor.id;
    await actor.importFromJSON(JSON.stringify(portable));
    await user.update({ character: actor.id });

    const base = actor.items.find(item => item.system.catalogId === "item-ordinary-melee-weapon").toObject();
    delete base._id;
    const catalog = await Item.create({ ...base, name: "External steel blade", ownership });
    f.sources.push(catalog.id);
    const custom = await Item.create({ name: "Custom lantern frame", type: "equipment", ownership,
      system: { catalogId: "item-custom-lantern-frame", quantity: 1, bulk: 1 } });
    f.sources.push(custom.id);
    return f;
  }, portable);
  player = await join(fixture.name);
  const render = () => player.evaluate(async id => {
    const actor = game.actors.get(id);
    await actor.sheet.render({ force: true });
    await actor.sheet.mountReady;
  }, fixture.actor);
  await render();
  const sheet = player.locator(".hol-workshop-character");
  const rows = name => sheet.getByRole("row").filter({ has: player.getByRole("button", { name, exact: true }) });
  const coins = sheet.locator(".inventory-stats strong").first();
  const state = () => gm.evaluate(id => {
    const actor = game.actors.get(id);
    return {
      coins: actor.getFlag("heroes-of-legend", "development")?.coins,
      items: Object.fromEntries(actor.items.map(item => [item.name, item.id])),
    };
  }, fixture.actor);
  const tab = name => sheet.getByRole("tab", { name, exact: true }).click();
  const drop = name => rows(name).getByRole("button", { name: `Drop ${name}`, exact: true });

  await tab("Inventory");
  const initialCoins = (await state()).coins;
  const sell = rows("Lighting Bundle").getByRole("button", { name: "Sell Lighting Bundle for 2 coins", exact: true });
  const shopDialog = sheet.getByRole("dialog", { name: "Sell Lighting Bundle?" });
  await sell.click();
  await shopDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(coins).toHaveText(String(initialCoins));
  await expect(rows("Lighting Bundle")).toHaveCount(1);
  await sell.click();
  await shopDialog.getByRole("button", { name: "Sell item", exact: true }).click();
  await expect(coins).toHaveText(String(initialCoins + 2));
  await expect(rows("Lighting Bundle")).toHaveCount(0);
  const sold = await state();
  assert.equal(sold.coins, initialCoins + 2);
  assert(!sold.items["Lighting Bundle"]);

  async function checkDrop(name) {
    const before = (await state()).items[name];
    assert(before);
    const confirm = sheet.getByRole("dialog", { name: `Drop ${name}?`, exact: true });
    await drop(name).click();
    await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal((await state()).items[name], before);
    await drop(name).click();
    await confirm.getByRole("button", { name: "Drop item", exact: true }).click();
    await expect(rows(name)).toHaveCount(0);
    assert(!(await state()).items[name]);
  }
  await checkDrop("Water Flask");

  for (const [index, name] of ["External steel blade", "Custom lantern frame"].entries()) {
    await player.locator(".inventory-table").evaluate((table, itemId) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid: `Item.${itemId}` }));
      table.dispatchEvent(new DragEvent("drop", { bubbles: true, composed: true, cancelable: true, dataTransfer }));
    }, fixture.sources[index]);
    await expect(rows(name)).toHaveCount(1);
    const embeddedId = (await state()).items[name];
    assert(embeddedId);
    if (name === "External steel blade")
      assert.notEqual(embeddedId, (await state()).items["Ordinary Melee Weapon"]);
    await rows(name).getByRole("button", { name: `Edit ${name}`, exact: true }).click();
    const editor = player.locator(".hol-equipment-editor").filter({ has: player.getByLabel("Name", { exact: true }) });
    const nameField = editor.getByLabel("Name", { exact: true });
    await expect(nameField).toHaveValue(name);
    const renamed = `${name} edited`;
    await nameField.fill(renamed);
    await player.locator(".application.hol-equipment").getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(rows(renamed)).toHaveCount(1);
    assert.equal((await state()).items[renamed], embeddedId);
    await checkDrop(renamed);
  }

  await tab("Main");
  await sheet.locator('[data-action="close"]').click();
  await expect(sheet).toHaveCount(0);
  await render();
  await tab("Inventory");
  assert.equal((await state()).coins, initialCoins + 2);
  await expect(rows("Water Flask")).toHaveCount(0);
  await expect(rows("Ordinary Melee Weapon")).toHaveCount(1);
  assert.deepEqual(errors, []);
  console.info("Verified native cancel/sale, exact purse credit, managed drop, actual external Item drops, full editor on catalog and custom gear, stable embedded identity, and close/reopen.");
} finally {
  await player?.close();
  await gm?.evaluate(async () => {
    const f = globalThis.__holInventory356;
    if (!f) return;
    const messages = game.messages.filter(message => message.speaker?.actor === f.actor ||
      message.getFlag("heroes-of-legend", "nativeWorkshopRequest")?.actorUuid === `Actor.${f.actor}`).map(message => message.id);
    if (messages.length) await ChatMessage.deleteDocuments(messages);
    if (f.sources.length) await Item.deleteDocuments(f.sources);
    await game.actors.get(f.actor)?.delete();
    await game.users.get(f.user)?.delete();
  });
  await browser.close();
}
