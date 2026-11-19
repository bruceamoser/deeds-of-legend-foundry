import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";
import { selectTestUser } from "./helpers/login.mjs";

const url = process.env.HOL_TEST_URL;
if (url !== "http://localhost:30025" || process.env.HOL_TEST_ALLOW_WRITES !== "1" ||
    process.env.HOL_TEST_ISOLATED_WORLD !== "1" || process.env.HOL_NATIVE_RUNTIME_LEASE !== "workshop")
  throw new Error("Requires the workshop lease and isolated http://localhost:30025 Foundry world.");

const output = resolve("test-results/playtest-gaps-345");
await mkdir(output, { recursive: true });
const expectedVersion = JSON.parse(await readFile("static/system.json", "utf8")).version;
const browser = await chromium.launch();
const evidence = { checks: [], errors: [] };
let gm, player, fixture;

async function join(name) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => localStorage.setItem("core.noCanvas", "true"));
  page.setDefaultTimeout(15000);
  page.on("pageerror", error => evidence.errors.push(`${name}: ${error.message}`));
  await page.goto(`${url}/join`);
  await selectTestUser(page, name);
  await page.locator('button[name="join"]').click();
  await page.waitForFunction(() => globalThis.game?.ready, null, { timeout: 60000 });
  await page.evaluate(() => foundry.nue.Tour.activeTour?.exit());
  return page;
}

function pass(check) {
  evidence.checks.push(check);
  console.info(check);
}

async function purse() {
  return gm.evaluate(id => game.actors.get(id).getFlag("heroes-of-legend", "development")?.coins, fixture.actor);
}

try {
  gm = await join(process.env.HOL_TEST_USER ?? "Gamemaster");
  evidence.runtime = await gm.evaluate(() => ({ world: game.world.id, build: game.release.build, system: game.system.version }));
  assert.deepEqual(evidence.runtime, { world: process.env.HOL_TEST_WORLD ?? "hol-native-325", build: 370, system: expectedVersion });
  fixture = await gm.evaluate(async () => {
    const state = globalThis.__holPlaytest345Gaps = {};
    const user = await User.create({ name: `Gap345 owner ${foundry.utils.randomID(5)}`, role: CONST.USER_ROLES.TRUSTED });
    state.user = user.id;
    state.name = user.name;
    const actor = await Actor.create({
      name: "Gap345 fencing shadow", type: "character",
      ownership: { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    });
    state.actor = actor.id;
    await user.update({ character: actor.id });
    return state;
  });

  player = await join(fixture.name);
  await player.evaluate(async id => game.actors.get(id).sheet.render({ force: true }), fixture.actor);
  const sheet = player.locator(".hol-workshop-character");
  const stage = n => sheet.locator(`[data-action="step"][data-step="${n}"]`).click();
  const controller = () => player.evaluate(id => game.actors.get(id).sheet.controller.settle(), fixture.actor);
  const row = (label) => sheet.getByRole("row").filter({ has: player.getByRole("button", { name: label, exact: true }) });
  await sheet.getByRole("button", { name: "Create hero in Workshop", exact: true }).click();
  for (const [attribute, value] of [["Agility", "2"], ["Guile", "1"]]) {
    const input = sheet.getByLabel(attribute, { exact: true });
    await input.fill(value);
    await input.press("Tab");
  }
  await stage(1);
  await sheet.locator('[data-action="ancestry"][data-id="ancestry-halfling"]').click();
  const traits = sheet.locator(".creation-trait");
  for (const index of [0, 1]) {
    await traits.nth(index).locator("summary").click();
    await traits.nth(index).locator("input").check();
  }
  const home = sheet.getByLabel("Home language", { exact: true });
  const homeValue = await home.locator('option:enabled:not([value=""])').first().getAttribute("value");
  await home.selectOption(homeValue);

  await stage(2);
  const culture = sheet.getByLabel("Culture", { exact: true });
  const background = sheet.getByLabel("Background", { exact: true });
  await expect(culture.locator('option[value="origin-culture-oasis-cities"]')).toContainText("Fencing");
  await expect(culture.locator('option[value="origin-culture-border-marches"]')).toContainText("Tactics");
  await expect(background.locator('option[value="origin-background-duelist-s-second"]')).toContainText("Fencing");
  await expect(background.locator('option[value="origin-background-company-runner"]')).toContainText("Tactics");
  await culture.selectOption("origin-culture-border-marches");
  await sheet.getByLabel("Culture discipline", { exact: true }).selectOption("1");
  await background.selectOption("origin-background-confidence-artist");
  await sheet.getByLabel("Background discipline", { exact: true }).selectOption("1");

  await stage(3);
  const classMenu = sheet.getByRole("combobox", { name: "Class", exact: true });
  await classMenu.selectOption("class-leader");
  await expect(sheet.locator('[data-action="class-discipline"][data-id="tactics"]')).toBeVisible();
  await classMenu.selectOption("class-shadow");
  const fencing = sheet.locator('[data-action="class-discipline"][data-id="fencing"]');
  await expect(fencing).toBeEnabled();
  await fencing.click();
  await sheet.locator('[data-action="signature"][data-id="ability-signature-shadow-turn-their-eye"]').click();
  pass("#1 Fencing and Tactics are visible on native class, culture and background menus.");

  await stage(4);
  for (const id of ["fencing:pointwork:1", "fencing:pointwork:2", "fencing:blade-contact:1", "subterfuge:locks:1"])
    await sheet.locator(`[data-action="forge-learn"][data-id="${id}"]`).click();
  await stage(5);
  const provisions = ["Food Bundle", "Water Flask", "Lighting Bundle", "Lesser Healing Bottle"];
  for (const name of provisions) {
    await expect(row(name)).toContainText("Purchased");
    await expect(row(name).getByRole("button", { name: `Remove purchased ${name}` })).toBeVisible();
  }
  for (const name of ["Ordinary Melee Weapon", "Lock Tools"]) {
    await expect(row(name)).toHaveCount(1);
    await expect(row(name)).toContainText("Training equipment");
  }
  await sheet.screenshot({ path: resolve(output, "fencing-creation-equipment.png") });

  await stage(6);
  await expect(sheet.locator(".error-list")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Create hero", exact: true }).click();
  await expect(sheet.getByRole("tab", { name: "Inventory", exact: true })).toBeVisible();
  await sheet.getByRole("tab", { name: "Inventory", exact: true }).click();
  for (const name of provisions) await expect(row(name).getByRole("button", { name: new RegExp(`Sell ${name} for `) })).toBeVisible();
  await expect(row("Ordinary Melee Weapon")).toContainText("Training equipment");
  await expect(row("Lock Tools")).toContainText("Training equipment");
  const water = row("Water Flask");
  await expect(water).toContainText("d8");
  await water.getByRole("button", { name: "Resupply Water Flask", exact: true }).click();
  const supplyDialog = sheet.getByRole("dialog", { name: "Resupply Water Flask" });
  await expect(supplyDialog).toContainText("Water Flask is at the maximum d8.");
  await supplyDialog.getByRole("button", { name: "Close", exact: true }).click();
  await player.evaluate(() => {
    const original = CONFIG.Dice.randomUniform;
    CONFIG.Dice.randomUniform = () => {
      CONFIG.Dice.randomUniform = original;
      return 0.99;
    };
  });
  await water.getByRole("button", { name: "Use Water Flask", exact: true }).click();
  const useWater = sheet.getByRole("dialog", { name: "Water Flask", exact: true });
  await useWater.getByRole("button", { name: "Use & roll supply", exact: true }).click();
  await expect(useWater).toBeHidden();
  await expect(water).toContainText("d6");
  const waterState = () => gm.evaluate(id => {
    const actor = game.actors.get(id);
    const item = actor.items.find(i => i.system.catalogId === "item-water-flask");
    const rolls = game.messages.filter(message => message.speaker?.actor === id && message.getFlag("heroes-of-legend", "nativeWorkshopRoll")?.kind === "supply");
    return {die:item.system.inventoryDie, rolls:rolls.length};
  }, fixture.actor);
  await expect.poll(waterState).toEqual({die:6, rolls:1});
  await water.getByRole("button", { name: "Resupply Water Flask", exact: true }).click();
  await supplyDialog.getByRole("button", { name: "Resupply", exact: true }).click();
  await expect(supplyDialog).toBeHidden();
  await expect(water).toContainText("d8");
  await expect.poll(waterState).toEqual({die:8, rolls:1});
  await controller();
  pass("Foundry starts Water Flask at d8, posts exactly one supply roll, closes its dialog, and updates supply on replenishment.");

  const beforeSale = await purse();
  assert.equal(beforeSale, 40 + 3 + 7 + 7 + 3 - (9 + 3 + 5 + 20));
  const sellLight = row("Lighting Bundle").getByRole("button", { name: /Sell Lighting Bundle for/ });
  const salePrice = Number((await sellLight.getAttribute("aria-label")).match(/for (\d+) coins/)[1]);
  player.once("dialog", popup => popup.accept());
  await sellLight.click();
  await expect(row("Lighting Bundle")).toHaveCount(0);
  await expect.poll(purse).toBe(beforeSale + salePrice);
  await controller();
  pass("#17 Selling a starter lighting bundle removes the native Item and credits the actual purse.");

  await sheet.getByRole("tab", { name: "Main", exact: true }).click();
  const hp = sheet.getByRole("spinbutton", { name: "Current HP" });
  const sp = sheet.getByRole("spinbutton", { name: "Current SP" });
  const full = [await hp.inputValue(), await sp.inputValue()];
  for (const input of [hp, sp]) {
    await input.fill("-1");
    await input.press("Enter");
    await controller();
  }
  await sheet.getByRole("button", { name: "Recovery", exact: true }).click();
  const recovery = sheet.getByRole("dialog", { name: "Recovery", exact: true });
  await expect(recovery.getByRole("heading", { name: "Brief Rest", exact: true })).toBeVisible();
  await expect(recovery.getByRole("heading", { name: "Night’s Rest", exact: true })).toBeVisible();
  await expect(recovery.getByRole("button", { name: "Begin first aid", exact: true })).toBeVisible();
  await recovery.getByRole("button", { name: "Complete Night’s Rest", exact: true }).click();
  await controller();
  await expect(hp).toHaveValue(full[0]);
  await expect(sp).toHaveValue(full[1]);
  await recovery.getByRole("button", { name: "Close", exact: true }).click();
  await expect(recovery).toHaveCount(0);
  await expect(sheet).toBeVisible();
  pass("#23 Native Recovery uses Brief Rest and Night’s Rest, and a completed Night’s Rest restores HP/SP.");

  const armorName = await gm.evaluate(async id => {
    const actor = game.actors.get(id);
    const pack = game.packs.get("heroes-of-legend.equipment");
    const template = (await pack.getDocuments()).find(item => item.system.catalogId === "item-ordinary-light-armor");
    const source = template.toObject();
    delete source._id;
    Object.assign(source.system, { worn: true, carried: true });
    const [armor] = await actor.createEmbeddedDocuments("Item", [source]);
    return armor.name;
  }, fixture.actor);
  await sheet.getByRole("tab", { name: "Inventory", exact: true }).click();
  await expect(row(armorName).getByRole("checkbox", { name: `Wear ${armorName}` })).toBeChecked();
  await expect(sheet.locator(".inventory-stats")).toContainText(/Armor DR\s*1/);
  await row("Ordinary Melee Weapon").getByRole("checkbox", { name: "Hold Ordinary Melee Weapon", exact: true }).check();
  await controller();
  await sheet.getByRole("tab", { name: "Abilities", exact: true }).click();
  await expect(sheet.getByRole("button", { name: /^Roll Direct Thrust/ })).toHaveText("Ag +1");
  await sheet.getByRole("button", { name: "Basic actions", exact: true }).click();
  for (const [id, label] of [["unarmed", "Basic Unarmed"], ["ranged", "Basic Ranged"], ["throw", "Basic Throw"]]) {
    await sheet.getByRole("button", { name: `Expand ${label}`, exact: true }).click();
    await expect(sheet.locator(`[data-detail-id="ability-basic-${id}"]`))
      .toContainText(/Weak.*1 physical damage.*Standard.*1 physical damage.*Strong.*2 physical damage/s);
  }
  pass("#24 Native untrained light armor retains DR 1 and applies −1 effective Agility; untrained Basic Unarmed, Ranged and Throw show 1/1/2.");

  const learned = () => gm.evaluate(id => {
    const scope = "heroes-of-legend";
    const actor = game.actors.get(id);
    const saved = actor.getFlag(scope, "nativeWorkshop").portable.draft;
    return {
      discipline: saved.classDisciplines[0],
      purchases: saved.purchases[1].map(entry => entry.id),
      abilities: actor.items.filter(item => item.type === "ability").map(item => item.getFlag(scope, "catalogId")).sort(),
      draft: actor.getFlag(scope, "nativeWorkshopDraft") ?? null,
      weapon: actor.items.find(item => item.system.catalogId === "item-ordinary-melee-weapon")?.id,
    };
  }, fixture.actor);
  const beforeSwap = await learned();
  assert.equal(beforeSwap.discipline, "fencing");
  assert(beforeSwap.abilities.includes("fencing:pointwork:1"));
  assert(beforeSwap.abilities.includes("fencing:blade-contact:1"));
  assert(beforeSwap.abilities.includes("subterfuge:locks:1"));
  const development = sheet.getByRole("tab", { name: "Development", exact: true });
  await development.click();
  await sheet.getByRole("button", { name: "Edit creation", exact: true }).click();
  await stage(3);
  await sheet.locator('[data-action="class-discipline"][data-id="athletics"]').click();
  await stage(4);
  await expect(sheet.getByRole("button", { name: "Unlearn Direct Thrust I", exact: true })).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "Unlearn Patient Hand I", exact: true })).toBeVisible();
  await stage(6);
  await expect(sheet.locator(".error-list")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Save character changes", exact: true }).click();
  await expect(development).toBeVisible();
  await expect.poll(learned).toEqual({
    ...beforeSwap,
    discipline: "athletics",
    purchases: beforeSwap.purchases.filter(id => !id.startsWith("fencing:")),
    abilities: beforeSwap.abilities.filter(id => !id.startsWith("fencing:")),
    draft: null,
  });
  const afterSwap = await learned();
  await player.reload();
  await player.waitForFunction(() => globalThis.game?.ready, null, { timeout: 60000 });
  await player.evaluate(async id => game.actors.get(id).sheet.render({ force: true }), fixture.actor);
  await expect(development).toBeVisible();
  assert.deepEqual(await learned(), afterSwap);
  pass("#9/#11 Replacing starting Fencing removes its dependent purchases and owned ability Items on save and reload. Lock training and owned gear remain.");

  await sheet.getByRole("tab", { name: "Abilities", exact: true }).click();
  await sheet.getByRole("button", { name: "Basic actions", exact: true }).click();
  await sheet.getByRole("button", { name: "Expand Basic Melee", exact: true }).click();
  await expect(sheet.locator('[data-detail-id="ability-basic-melee"]'))
    .toContainText(/Weak.*1 physical damage.*Standard.*1 physical damage.*Strong.*2 physical damage/s);
  pass("#24 Basic Melee now shows the untrained 1/1/2 profile with that same sword.");

  assert.deepEqual(evidence.errors, []);
  await rm(resolve(output, "failure.png"), { force: true });
} catch (error) {
  evidence.failure = error.stack;
  await player?.screenshot({ path: resolve(output, "failure.png") }).catch(() => {});
  throw error;
} finally {
  await player?.close();
  try {
    await gm?.evaluate(async () => {
      const state = globalThis.__holPlaytest345Gaps;
      if (!state) return;
      const actorUuid = `Actor.${state.actor}`;
      const receipts = game.messages.filter(message =>
        message.getFlag("heroes-of-legend", "nativeWorkshopRequest")?.actorUuid === actorUuid).map(message => message.id);
      if (receipts.length) await ChatMessage.deleteDocuments(receipts);
      await game.actors.get(state.actor)?.delete();
      await game.users.get(state.user)?.delete();
    });
  } catch (error) {
    evidence.cleanupFailure = error.stack;
    process.exitCode = 1;
  }
  await writeFile(resolve(output, "evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
  await browser.close();
}
