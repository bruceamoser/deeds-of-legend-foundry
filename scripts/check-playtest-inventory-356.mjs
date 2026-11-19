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
portable.draft.name = "Playtest360 Inventory";
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
    const f = globalThis.__holInventory360 = { sources: [] };
    const user = await User.create({ name: `Inventory360 owner ${foundry.utils.randomID(5)}`, role: CONST.USER_ROLES.TRUSTED });
    f.user = user.id;
    f.name = user.name;
    const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    const actor = await Actor.create({ name: portable.draft.name, type: "character", ownership });
    f.actor = actor.id;
    await actor.importFromJSON(JSON.stringify(portable));
    await user.update({ character: actor.id });

    const trainingWeapon = actor.items.find(item => item.system.catalogId === "item-ordinary-melee-weapon");
    if (!trainingWeapon?.getFlag("heroes-of-legend", "acquisitionInstance")?.startsWith("inventory-learned-"))
      throw new Error("Expected an embedded training weapon on the test hero.");
    f.trainingWeapon = trainingWeapon.id;
    const base = trainingWeapon.toObject();
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
      hp: actor.system.health.value,
      items: Object.fromEntries(actor.items.map(item => [item.name, item.id])),
      equipment: actor.items.filter(item => item.type === "equipment").map(item => ({ id: item.id, catalogId: item.system.catalogId, quantity: item.system.quantity })),
    };
  }, fixture.actor);
  const tab = name => sheet.getByRole("tab", { name, exact: true }).click();
  const drop = name => rows(name).getByRole("button", { name: `Drop ${name}`, exact: true });
  const settle = () => player.evaluate(id => game.actors.get(id).sheet.controller.settle(), fixture.actor);
  const drag = uuid => player.locator(".inventory-table").evaluate((table, uuid) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid }));
    table.dispatchEvent(new DragEvent("drop", { bubbles: true, composed: true, cancelable: true, dataTransfer }));
  }, uuid);

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

  async function editAndDrop(name) {
    const embeddedId = (await state()).items[name];
    assert(embeddedId);
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

  await drag(`Item.${fixture.sources[0]}`);
  await expect(rows("External steel blade")).toHaveCount(1);
  const blade = (await state()).items["External steel blade"];
  assert(blade && blade !== fixture.trainingWeapon);
  // The new blade can satisfy the training rule while the original grant is still an owned Item.
  // Exercise regular saves with both weapons still present.
  await tab("Abilities");
  await settle();
  await tab("Main");
  const hp = sheet.getByRole("spinbutton", { name: "Current HP", exact: true });
  const newHp = (await state()).hp - 1;
  await hp.fill(String(newHp));
  await hp.dispatchEvent("change");
  await settle();
  await expect.poll(async () => (await state()).hp).toBe(newHp);

  await tab("Inventory");
  await expect(rows("Ordinary Melee Weapon")).toHaveCount(1);
  await sheet.getByRole("button", { name: "Add item", exact: true }).click();
  const addDialog = sheet.getByRole("dialog", { name: "Add item" });
  await addDialog.getByLabel("Item", { exact: true }).selectOption("item-first-aid-supplies");
  await addDialog.getByLabel("Quantity").fill("2");
  await addDialog.getByRole("button", { name: "Add item", exact: true }).click();
  await settle();
  await expect(rows("First-Aid Supplies")).toHaveCount(1);
  await expect(rows("First-Aid Supplies").getByRole("spinbutton", { name: "Quantity First-Aid Supplies" })).toHaveValue("2");
  const afterAddition = await state();
  const medical = afterAddition.equipment.filter(item => item.catalogId === "item-first-aid-supplies");
  assert.equal(medical.length, 1);
  assert.equal(medical[0].quantity, 2);
  assert.equal(afterAddition.items["Ordinary Melee Weapon"], fixture.trainingWeapon);
  assert.equal(afterAddition.items["External steel blade"], blade);

  for (const name of ["Rope Coil", "Lock Tools"]) {
    const uuid = await gm.evaluate(async name => {
      const pack = game.packs.get("heroes-of-legend.equipment");
      const entry = (await pack.getIndex()).find(item => item.name === name);
      return (await pack.getDocument(entry._id)).uuid;
    }, name);
    await drag(uuid);
    await expect(rows(name)).toHaveCount(1);
    await tab("Abilities");
    await settle();
    await tab("Inventory");
    await editAndDrop(name);
  }
  await editAndDrop("External steel blade");
  await drag(`Item.${fixture.sources[1]}`);
  await expect(rows("Custom lantern frame")).toHaveCount(1);
  await editAndDrop("Custom lantern frame");

  await tab("Main");
  await sheet.locator('[data-action="close"]').click();
  await expect(sheet).toHaveCount(0);
  await render();
  await tab("Inventory");
  assert.equal((await state()).coins, initialCoins + 2);
  assert.equal((await state()).items["First-Aid Supplies"], medical[0].id);
  assert.equal((await state()).items["Ordinary Melee Weapon"], fixture.trainingWeapon);
  assert.equal((await state()).hp, newHp);
  await expect(rows("Water Flask")).toHaveCount(0);
  await expect(rows("Ordinary Melee Weapon")).toHaveCount(1);
  const failures = await gm.evaluate(id => game.messages.filter(message => {
    const request = message.getFlag("heroes-of-legend", "nativeWorkshopRequest");
    const status = message.getFlag("heroes-of-legend", "nativeWorkshopStatus");
    return request?.actorUuid === `Actor.${id}` && status?.status === "failed";
  }).map(message => message.getFlag("heroes-of-legend", "nativeWorkshopStatus").error), fixture.actor);
  assert.deepEqual(failures, []);
  assert.deepEqual(errors, []);
  console.info("Verified native sale and drop, training gear beside a dragged duplicate, First-Aid Supplies added through Inventory, real Rope Coil and Lock Tools compendium drops, custom gear, tab and HP saves, and stable ownership after reopening.");
} finally {
  await player?.close();
  await gm?.evaluate(async () => {
    const f = globalThis.__holInventory360;
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
