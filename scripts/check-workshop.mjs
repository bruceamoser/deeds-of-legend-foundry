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
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith(prefix)) throw new Error("wrong base path");
    const file = resolve(
      root,
      url.pathname.slice(prefix.length) || "index.html",
    );
    if (!file.startsWith(root + "/")) throw new Error("invalid path");
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
const failures = [];
page.on("pageerror", (e) => failures.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
});
const dialogs = [];
page.on("dialog", (d) => {
  dialogs.push(d.message());
  d.accept();
});
const output = resolve("test-results/workshop");
await mkdir(output, { recursive: true });
async function picker(kind) {
  if (await page.locator("#picker[open]").count()) return;
  await page
    .getByRole("button", {
      name: kind === "equipment" ? "Buy inventory items" : "Learn abilities",
      exact: true,
    })
    .click();
}
async function closePicker() {
  if (await page.locator("#picker[open]").count())
    await page
      .getByRole("button", { name: "Close selection", exact: true })
      .click();
}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}${prefix}`);
  await page
    .getByRole("heading", { name: "Borin Bridgekeeper", exact: true })
    .waitFor();
  assert.equal(await page.getByRole("tab").count(), 5);
  assert.equal(
    await page.getByRole("tab", { name: "Crafting", exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByRole("heading", { name: "Main", exact: true }).count(),
    0,
  );
  assert.equal(await page.locator('[data-action="builder"]').count(), 0);
  assert.deepEqual(
    (
      await page
        .locator(".play-summary > .box > summary > h3")
        .allTextContents()
    )
      .slice(0, 4)
      .map((s) => s.trim()),
    ["Defenses", "Conditions", "Movement & carrying", "Supplies"],
  );
  assert.equal(
    await page
      .locator(".action-groups .trait-table, .action-groups .passive-table")
      .count(),
    0,
  );
  await page.locator('[data-collapse="passives"] > summary').click();
  await page.locator(".passive-table [data-action=reference]").first().click();
  assert(await page.getByRole("dialog").isVisible());
  await page.keyboard.press("Escape");
  await page.locator('[data-collapse="ancestry-traits"] > summary').click();
  await page.locator(".trait-table [data-action=reference]").first().click();
  assert(await page.getByRole("dialog").isVisible());
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Abilities", exact: true }).focus();
  await page.keyboard.press("Home");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "tab-Main",
  );

  const edge = await page
    .getByRole("tab", { name: "Abilities", exact: true })
    .boundingBox();
  const sheet = await page.locator("#app").boundingBox();
  assert(sheet.width <= 900, "sheet must fit a Foundry-sized window");
  assert.equal(await page.getByLabel("Pronouns", { exact: true }).count(), 0);
  assert(
    edge.x < sheet.x && edge.x + edge.width <= sheet.x + 1,
    "tabs must hang outside the sheet",
  );
  await page.getByRole("tab", { name: "Abilities", exact: true }).hover();
  assert(
    await page
      .getByRole("tab", { name: "Abilities", exact: true })
      .locator(".nav-tooltip")
      .isVisible(),
  );
  await page.locator(".brand").hover();
  await page.screenshot({
    path: `${output}/desktop-encounter.png`,
    fullPage: true,
  });
  for (const width of [900, 970]) {
    await page.setViewportSize({ width, height: 800 });
    assert(
      (await page.getByRole("tab", { name: "Main", exact: true }).boundingBox())
        .x >= 0,
      "edge tabs remain on screen",
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page.setViewportSize({ width: 900, height: 800 });
  await page.screenshot({ path: `${output}/foundry-sized-sheet.png` });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole("tab", { name: "Abilities", exact: true }).click();
  await page.locator('#results [data-action-row="arms:bladework:1"] .expand-action').click();
  const drivingBlow = page.locator('[data-detail-id="arms:bladework:1"]');
  assert.match(await drivingBlow.innerText(), /Measured Cut II.*3\/4\/6 physical damage/s);
  assert.doesNotMatch(await drivingBlow.innerText(), /Measured Cut III/);
  await page.locator(".brand").hover();
  await page.screenshot({ path: `${output}/desktop-abilities.png` });
  await page.getByRole("tab", { name: "Abilities", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page
      .getByRole("tab", { name: "Inventory", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  // Equipment changes update play statistics, while grants and dice remain visible.
  const armorRow = page
    .locator(".inventory-table tr")
    .filter({ hasText: "Ordinary Light Armor" });
  assert.match(await armorRow.innerText(), /Training equipment/);
  assert.match(await page.locator(".inventory-table").innerText(), /d8/);
  assert(await page.getByLabel("Wear Ordinary Light Armor", { exact: true }).isChecked());
  assert.equal(
    await page
      .locator(".vital")
      .filter({ hasText: "Armor DR" })
      .locator("strong")
      .innerText(),
    "1",
  );
  await page.getByLabel("Wear Ordinary Light Armor", { exact: true }).uncheck();
  assert.equal(
    await page
      .locator(".vital")
      .filter({ hasText: "Armor DR" })
      .locator("strong")
      .innerText(),
    "0",
  );
  await page
    .getByLabel("Carry Ordinary Light Armor", { exact: true })
    .uncheck();
  assert.match(await page.locator(".inventory-stats").innerText(), /8 \/ 13/);
  await page.getByLabel("Carry Ordinary Light Armor", { exact: true }).check();
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  await page.getByRole("tab", { name: "Abilities", exact: true }).click();
  const basicMelee = page.locator('#results [data-action-row="ability-basic-melee"] .star-button');
  if (await basicMelee.getAttribute("aria-pressed") === "true") await basicMelee.click();
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  assert.equal(await page.locator('[data-action-row="ability-basic-melee"]').count(), 0);
  await page.getByRole("tab", { name: "Abilities", exact: true }).click();
  await basicMelee.click();
  assert.equal(await basicMelee.getAttribute("aria-pressed"), "true");
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  assert(await page.locator('[data-action-row="ability-basic-melee"]').isVisible());
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  assert.equal(await page.locator('[data-dp="spent"]').innerText(), "8");
  await page
    .getByRole("button", { name: "Increase level", exact: true })
    .click();
  assert.equal(await page.locator('[data-dp="current"]').innerText(), "10");
  await page.getByRole("button", { name: "Spend DP", exact: true }).click();
  await page.locator('[data-action="forge-view"][data-id="columns"]').click();
  assert.match(await page.locator(".forge-studied").innerText(), /Armor/);
  assert.match(await page.locator(".forge-studied").innerText(), /Guard/);
  assert.equal(await page.locator(".forge-other-learning").count(), 0);
  await page.locator('[data-action="forge-learn"][data-id="guard:watchfulness:1"]').click();
  assert.equal(await page.locator("[data-dp-remaining]").innerText(), "9 DP remaining");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  assert.equal(await page.locator('[data-dp="spent"]').innerText(), "9");
  await page
    .getByRole("button", { name: "Decrease level", exact: true })
    .click();
  assert.equal(await page.locator('[data-dp="current"]').innerText(), "2");
  await page
    .getByRole("button", { name: "Increase level", exact: true })
    .click();
  assert.equal(await page.locator('[data-dp="current"]').innerText(), "9");
  await page
    .getByRole("button", { name: "Decrease level", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .click();
  await page.getByLabel("Save name", { exact: true }).fill("Borin original");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await page.getByRole("tab", { name: "Character", exact: true }).click();
  await page.getByRole("button", { name: "✎ Edit", exact: true }).click();
  await page
    .getByLabel("Story", { exact: true })
    .fill("Borin guards the bridge.");
  await page.getByLabel("Story", { exact: true }).press("Tab");
  await page.getByRole("button", { name: "✓ Done", exact: true }).click();
  assert.equal(
    await page.getByLabel("Story", { exact: true }).inputValue(),
    "Borin guards the bridge.",
  );
  assert.equal(await page.getByLabel("Player", { exact: true }).count(), 0);
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  await page.getByRole("button", { name: "Basic Melee", exact: true }).click();
  const meleeRules = page.locator('[data-detail-id="ability-basic-melee"]');
  assert(await meleeRules.isVisible());
  assert.equal(await meleeRules.locator('a[href*="github.com"]').count(), 0);
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit creation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "5 Learning", exact: true })
    .click();
  assert.match(await page.locator(".forge-studied").innerText(), /Armor/);
  // The focused columns can fit without scrolling at full desktop height.
  // Open the training plan in a shorter window so overflow is guaranteed.
  await page.setViewportSize({ width: 1440, height: 670 });
  await page.getByText("Learning at this level", { exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  const headerBefore = await page.locator(".creation-summary").boundingBox();
  const panelScrolled = await page.locator("#panel").evaluate((panel) => {
    panel.scrollTo({ top: 600, behavior: "instant" });
    return panel.scrollTop > 0;
  });
  assert(panelScrolled);
  assert.equal((await page.locator(".creation-summary").boundingBox()).y, headerBefore.y);
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: `${output}/desktop-learning.png` });

  await page.getByRole("button", { name: "6 Equipment", exact: true }).click();
  const beforePurchase = await page.locator(".context-strip .inventory-stats").innerText();
  const shieldRows = page.locator(".inventory-table tbody tr").filter({ hasText: "Ordinary Shield" });
  assert.equal(await shieldRows.count(), 1);
  assert.match(await shieldRows.innerText(), /Training equipment/);
  await picker("equipment");
  await page.getByLabel("Search equipment", { exact: true }).fill("Ordinary Shield");
  await page.locator('[data-action="equipment"][data-id="item-ordinary-shield"]').click();
  await closePicker();
  assert.equal(await shieldRows.count(), 1);
  assert.match(await shieldRows.innerText(), /Purchased/);
  await shieldRows.getByRole("button", { name: "Remove purchased Ordinary Shield", exact: true }).click();
  assert.equal(await shieldRows.count(), 1);
  assert.match(await shieldRows.innerText(), /Training equipment/);
  assert.equal(await page.locator(".context-strip .inventory-stats").innerText(), beforePurchase);
  await page.screenshot({ path: `${output}/desktop-equipment.png` });
  await page.getByRole("button", { name: "7 Review", exact: true }).click();
  assert(
    await page
      .getByRole("button", { name: "Export character JSON", exact: true })
      .isEnabled(),
  );
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export character JSON", exact: true })
    .click();
  const download = await downloaded;
  const file = `${output}/borin.hol.json`;
  await download.saveAs(file);
  const exported = JSON.parse(await readFile(file, "utf8"));
  assert.equal(exported.draft.profile.story, "Borin guards the bridge.");
  // Play controls change the sheet directly and survive autosave/JSON transfer.
  await page
    .getByRole("button", { name: "View character sheet", exact: true })
    .click();
  await page.getByRole("tab", { name: "Abilities", exact: true }).click();
  assert(await page.locator("#results .action-table").first().isVisible());
  const lightArmorRules = page.locator('#results [data-action-row="armor:harness:1"] .expand-action');
  await lightArmorRules.click();
  assert(await page.locator('[data-detail-id="armor:harness:1"]').isVisible());
  await page.getByRole("tab", { name: "Inventory", exact: true }).click();
  await page.getByLabel("Wear Food Bundle", { exact: true }).check();
  await page.getByLabel("Hold Food Bundle", { exact: true }).check();
  await page.getByLabel("Carry Food Bundle", { exact: true }).uncheck();
  assert(
    !(await page.getByLabel("Wear Food Bundle", { exact: true }).isChecked()),
  );
  assert(
    !(await page.getByLabel("Hold Food Bundle", { exact: true }).isChecked()),
  );
  await page.getByLabel("Hold Food Bundle", { exact: true }).check();
  assert(
    await page.getByLabel("Carry Food Bundle", { exact: true }).isChecked(),
  );
  await page.getByLabel("Carry Food Bundle", { exact: true }).uncheck();
  await page.getByLabel("Wear Food Bundle", { exact: true }).check();
  assert(
    await page.getByLabel("Carry Food Bundle", { exact: true }).isChecked(),
  );
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.locator("#play-item").selectOption("item-small-tent");
  await page.locator("#play-quantity").fill("2");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add item", exact: true })
    .click();
  assert.equal(
    await page
      .locator(".inventory-table tr")
      .filter({ hasText: "Small Tent" })
      .locator("td")
      .nth(1)
      .locator("input")
      .inputValue(),
    "2",
  );
  await page
    .getByRole("button", { name: "Drop Ordinary Light Armor", exact: true })
    .click();
  await page.getByRole("dialog", { name: "Drop Ordinary Light Armor?" })
    .getByRole("button", { name: "Drop item", exact: true }).click();
  assert.equal(
    await page.getByLabel("Wear Ordinary Light Armor", { exact: true }).count(),
    0,
  );
  await page.getByRole("tab", { name: "Character", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove language Common", exact: true })
    .click();
  await page.getByRole("button", { name: "Add language", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("River Sign");
  await page.getByLabel("Form", { exact: true }).selectOption("signed");
  await page.getByLabel("Read & write", { exact: true }).uncheck();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add language", exact: true })
    .click();
  assert.match(
    await page.locator(".language-table").innerText(),
    /River Sign.*Signed/s,
  );
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  await page
    .getByRole("button", { name: "Add condition", exact: true })
    .click();
  await page.getByLabel("Condition", { exact: true }).selectOption("burning");
  await page.locator("#condition-rating").fill("2");
  await page.getByLabel("Starred", { exact: true }).check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add condition", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add condition", exact: true })
    .click();
  await page.getByLabel("Condition", { exact: true }).selectOption("prone");
  assert(!(await page.locator("#condition-rating").isVisible()));
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add condition", exact: true })
    .click();
  assert.match(await page.locator(".condition-bar").innerText(), /Burning 2/);
  assert.match(await page.locator(".condition-bar").innerText(), /Prone/);
  await page.reload();
  await page
    .getByRole("heading", { name: "Borin Bridgekeeper", exact: true })
    .waitFor();
  assert.match(await page.locator(".condition-bar").innerText(), /Burning 2/);
  await page.screenshot({ path: `${output}/play-main.png` });
  await page.getByRole("button", { name: "Remove Prone", exact: true }).click();
  assert.doesNotMatch(
    await page.locator(".condition-bar").innerText(),
    /Prone/,
  );
  await page.getByRole("tab", { name: "Inventory", exact: true }).click();
  assert.equal(
    await page.getByLabel("Wear Ordinary Light Armor", { exact: true }).count(),
    0,
  );
  assert(
    await page.getByLabel("Wear Food Bundle", { exact: true }).isChecked(),
  );
  await page.screenshot({ path: `${output}/play-inventory.png` });
  await page
    .getByRole("button", { name: "Drop Small Tent", exact: true })
    .click();
  await page.getByRole("dialog", { name: "Drop Small Tent?" })
    .getByRole("button", { name: "Drop item", exact: true }).click();
  assert.equal(
    await page.getByLabel("Wear Small Tent", { exact: true }).count(),
    0,
  );
  await page.getByRole("tab", { name: "Character", exact: true }).click();
  assert.match(await page.locator(".language-table").innerText(), /River Sign/);
  assert.doesNotMatch(
    await page.locator(".language-table").innerText(),
    /Common/,
  );
  // Standard language definitions can be restored after removing them.
  await page.getByRole("button", { name: "Add language", exact: true }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("common");
  assert.equal(
    await page.getByLabel("Name", { exact: true }).inputValue(),
    "Common",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add language", exact: true })
    .click();
  assert.match(await page.locator(".language-table").innerText(), /Common/);
  await page
    .getByRole("button", { name: "Remove language River Sign", exact: true })
    .click();
  assert.doesNotMatch(
    await page.locator(".language-table").innerText(),
    /River Sign/,
  );
  // A missed signature has its own flow, independent of spending at the current level.
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  await page
    .getByRole("button", { name: "Increase level", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Increase level", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Increase level", exact: true })
    .click();
  const beforeSignature = await page.locator('[data-dp="current"]').innerText();
  assert(
    await page
      .getByRole("button", { name: "Choose level 3 signature", exact: true })
      .isVisible(),
  );
  await page.getByRole("button", { name: "Spend DP", exact: true }).click();
  assert.equal(
    await page.locator('[data-action="advance-signature"]').count(),
    0,
  );
  assert(await page.locator("[data-dp-remaining]").isVisible());
  await closePicker();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Choose level 3 signature", exact: true })
    .click();
  assert.equal(await page.locator("[data-dp-remaining]").count(), 0);
  await page.locator('[data-action="advance-signature"]').first().click();
  await page.screenshot({ path: `${output}/signature-choice.png` });
  await closePicker();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Choose level 3 signature", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page.locator('[data-dp="current"]').innerText(),
    beforeSignature,
  );
  const playDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const playFile = `${output}/borin-play.hol.json`;
  await (await playDownload).saveAs(playFile);
  const played = JSON.parse(await readFile(playFile, "utf8"));
  assert.equal(played.schemaVersion, 7);
  assert.equal(played.draft.play.conditions[0].key, "burning");
  assert(played.draft.progression.levels[3].signatures[3]);
  await page.locator("#import-file").setInputFiles(playFile);
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  assert.match(await page.locator(".condition-bar").innerText(), /Burning 2/);
  await page.locator("#import-file").setInputFiles(file);
  await page.getByRole("button", { name: "View character sheet", exact: true }).click();
  await page.getByRole("button", { name: "New hero", exact: true }).click();
  assert(
    await page
      .getByRole("heading", { name: "New hero", exact: true })
      .isVisible(),
  );
  await page.getByLabel("Character name", { exact: true }).fill("Moss Rowan");
  await page.getByLabel("Character name", { exact: true }).press("Tab");
  await page.reload();
  await page
    .getByRole("heading", { name: "Moss Rowan", exact: true })
    .waitFor();
  await page.locator("#import-file").setInputFiles(file);
  await page
    .getByRole("heading", { name: "Borin Bridgekeeper", exact: true })
    .waitFor();
  assert(
    await page
      .getByRole("button", { name: "Export character JSON", exact: true })
      .isEnabled(),
  );
  await page
    .getByRole("button", { name: "View character sheet", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/mobile-sheet.png`, fullPage: true });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "mobile overflow",
  );
  await page.getByRole("tab", { name: "Abilities", exact: true }).click();
  await page.getByLabel("Search abilities", { exact: true }).fill("shield");
  assert(await page.locator("#results").innerText());
  await page.screenshot({
    path: `${output}/mobile-abilities.png`,
    fullPage: true,
  });
  // Use the current crafting example to exercise recipes and persisted projects.
  await page.setViewportSize({ width: 1440, height: 1050 });
  const response = await page.request.get(`http://127.0.0.1:${server.address().port}${prefix}data/party.json`);
  const crafter = (await response.json()).find((entry) => entry.id === "oren-brass");
  crafter.draft.progression = {level: 2, levels: {2: {
    purchases: [1,2,3].map(step => ({id: `craft:workshop:${step}`})), signatures: {},
    acquisitions: {
      "craft:workshop:1": {recipes: ["recipe-travel-food", "recipe-bound-torches"]},
      "craft:workshop:2": {recipes: ["recipe-twisted-cord", "recipe-wooden-brace"]},
    },
  }}};
  await page.locator("#import-file").setInputFiles({
    name: "oren.hol.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ format: "heroes-of-legend-character", schemaVersion: 6, draft: crafter.draft })),
  });
  await page.getByRole("heading", {name:"Oren Brass",exact:true}).waitFor();
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  assert(
    await page
      .getByRole("heading", { name: "Ancestry traits", exact: true })
      .count(),
  );
  assert.equal(await page.getByRole("tab").count(), 7);
  assert.equal(await page.locator(".recipe-table").count(), 0);
  await page.getByRole("tab", { name: "Inventory", exact: true }).click();
  assert.equal(await page.locator(".recipe-table").count(), 0);
  assert.equal(
    await page.getByRole("heading", { name: "Crafting", exact: true }).count(),
    0,
  );
  await page.getByRole("tab", { name: "Inventory", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page
      .getByRole("tab", { name: "Crafting", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  // Older saves retain their selected tab after Recipes becomes Crafting.
  await page.evaluate(() => {
    const key = "hol.workshop.v1";
    const saved = JSON.parse(localStorage.getItem(key));
    saved.tab = "Recipes";
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await page.getByRole("heading", { name: "Crafting", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("tab", { name: "Crafting", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  await page.locator(".brand").hover();
  await page.screenshot({ path: `${output}/desktop-recipes.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({ path: `${output}/mobile-recipes.png` });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page
    .getByRole("button", { name: "Start Travel Food", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start Bound Torches", exact: true })
    .click();
  assert.equal(await page.locator(".crafting-projects tbody tr").count(), 2);
  assert.equal(
    await page
      .getByRole("button", { name: "Start Travel Food", exact: true })
      .count(),
    0,
  );
  const recipe = page.locator('[data-project="recipe-travel-food"]');
  const craftingDie = await recipe.locator("svg").first().boundingBox();
  assert(craftingDie.width <= 18 && craftingDie.height <= 18);
  await recipe.locator('[data-action="recipe-roll"]').first().click();
  assert.equal(await page.locator("#roll-net-value").innerText(), "Even");
  assert.deepEqual(
    await page.locator(".hol-net-heading span").allTextContents(),
    ["Banes", "Boons"],
  );
  await page.locator("#recipe-net").fill("-3");
  assert.equal(await page.locator("#roll-net-value").innerText(), "3 Banes");
  await page.locator("#recipe-net").fill("3");
  assert.equal(await page.locator("#roll-net-value").innerText(), "3 Boons");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Roll", exact: true })
    .click();
  assert.match(
    await page.locator("#recipe-roll-result").innerText(),
    /Weak|Standard|Strong/,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Record attempt", exact: true })
      .count(),
    0,
  );
  const crafted = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft.play,
  );
  assert.equal(crafted.crafting["recipe-travel-food"].attempts, 1);
  const product = crafted.inventory.added.find(
    (i) => i.id === "item-food-bundle",
  );
  assert(product);
  assert(
    [4, 6, 8].includes(
      crafted.inventory.overrides[product.instanceId].inventoryDie,
    ),
  );
  assert.equal(crafted.crafting["recipe-bound-torches"].attempts, 0);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("heading", { name: "Crafting", exact: true }).waitFor();
  assert.equal(
    await page.locator('[data-project="recipe-bound-torches"]').count(),
    1,
  );
  if (crafted.crafting["recipe-travel-food"].active)
    assert.match(
      await page.locator('[data-project="recipe-travel-food"]').innerText(),
      /1 attempts/,
    );
  else
    assert.equal(
      await page
        .getByRole("button", { name: "Start Travel Food", exact: true })
        .count(),
      1,
    );
  await page.screenshot({ path: `${output}/crafting-projects.png` });
  await page.getByRole("tab", { name: "Inventory", exact: true }).click();
  assert.match(await page.locator(".inventory-table").innerText(), /Added/);
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit creation", exact: true })
    .click();
  await closePicker();
  await page.getByRole("button", { name: "6 Equipment", exact: true }).click();
  await picker("equipment");
  await page.getByLabel("Search equipment", { exact: true }).fill("Small Tent");
  await page.getByLabel("Quantity Small Tent", { exact: true }).fill("100");
  await page
    .locator('[data-action="equipment"][data-id="item-small-tent"]')
    .click();
  assert(
    dialogs.some((message) => /exceeds your available coins/.test(message)),
  );
  await closePicker();
  assert.match(
    await page.locator(".inventory-table").innerText(),
    /Small Tent/,
  );
  assert.match(
    await page.locator(".inventory-stats").innerText(),
    /-[0-9]+ coins/,
  );
  await closePicker();
  await page.getByRole("button", { name: "7 Review", exact: true }).click();
  assert(
    await page
      .getByRole("button", { name: "Export character JSON", exact: true })
      .isEnabled(),
  );
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .click();
  await page.getByLabel("Save name", { exact: true }).fill("Reed crafting");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load character", exact: true })
    .click();
  assert.equal(await page.locator(".saved-characters article").count(), 2);
  await page.screenshot({ path: `${output}/saved-characters.png` });
  await page
    .locator(".saved-characters article")
    .filter({ hasText: "Borin original" })
    .getByRole("button", { name: "Load", exact: true })
    .click();
  assert(
    await page
      .getByRole("heading", { name: "Borin Bridgekeeper", exact: true })
      .isVisible(),
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Borin Bridgekeeper", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Load character", exact: true })
    .click();
  await page
    .locator(".saved-characters article")
    .filter({ hasText: "Reed crafting" })
    .getByRole("button", { name: "Load", exact: true })
    .click();
  assert(
    await page.getByRole("heading", { name: "Oren Brass", exact: true }).isVisible(),
  );
  // Import a ranged character and inspect its creation grants, not just the sheet.
  const ranged = {
    ...exported,
    draft: (await response.json()).find((h) => h.id === "lira-ashbow").draft,
  };
  await page.locator("#import-file").setInputFiles({
    name: "Lira.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(ranged)),
  });
  await page
    .getByRole("heading", { name: "Lira Ashbow", exact: true })
    .waitFor();
  await closePicker();
  await page.getByRole("button", { name: "6 Equipment", exact: true }).click();
  const rangedInventory = await page.locator(".inventory-table").innerText();
  assert.match(rangedInventory, /Ordinary Ranged Weapon/);
  assert.match(rangedInventory, /Ammunition Bundle/);
  assert.match(rangedInventory, /d8/);
  await page.evaluate(() => {
    const key = "hol.workshop.v1",
      saved = JSON.parse(localStorage.getItem(key));
    saved.mode = "sheet";
    saved.tab = "Recipes";
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await page
    .getByRole("heading", { name: "Lira Ashbow", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("tab", { name: "Crafting", exact: true }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("tab", { name: "Main", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );

  // A late signature grants only itself; Twitch Reflexes has no acquisition
  // grant. Selecting the milestone spends no DP and persists.
  const blade = structuredClone(ranged);
  blade.draft.signatureId = "ability-signature-blade-measured-guard";
  blade.draft.attributes.knowledge = 1;
  blade.draft.attributes.guile = -1;
  blade.draft.purchases[1] = [];
  blade.draft.shopping = [];
  blade.draft.progression = { level: 7, levels: {} };
  await page.locator("#import-file").setInputFiles({
    name: "Blade.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(blade)),
  });
  await page.getByRole("button", { name: "Choose level 7 signature", exact: true }).click();
  await page.locator('[data-action="advance-signature"][data-id="ability-signature-blade-sweeping-entry"]').click();
  assert.equal(await page.getByLabel("Melee weapon hands", {exact:true}).count(),0);
  await closePicker();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  assert.equal(await page.getByRole("button", {name:"Choose level 7 signature",exact:true}).count(),0);
  await page.reload();
  await page.getByRole("heading", {name:"Lira Ashbow",exact:true}).waitFor();
  assert.equal(await page.getByRole("button", {name:"Choose level 7 signature",exact:true}).count(),0);
  const signatureSelection = await page.evaluate(() => {
    const saved=JSON.parse(localStorage.getItem("hol.workshop.v1"));
    return saved.character.draft.progression.levels[7];
  });
  assert.equal(signatureSelection.signatures[7],"ability-signature-blade-sweeping-entry");
  assert.equal(signatureSelection.acquisitions["ability-signature-blade-sweeping-entry"],undefined);
  // Unknown imported IDs remain inert text and repairable choices.
  const odd = { ...exported, draft: structuredClone(exported.draft) };
  odd.draft.classId = "ability-wear-medium-armor";
  odd.draft.culture = { id: "ability-wear-medium-armor", pair: 0 };
  odd.draft.traitIds[0] = 'trait-unknown" data-injected="yes';
  await page.locator("#import-file").setInputFiles({
    name: "unknown-trait.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(odd)),
  });
  await page
    .getByRole("heading", { name: "Borin Bridgekeeper", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "View character sheet", exact: true })
    .click();
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  assert.equal(await page.locator("[data-injected]").count(), 0);
  assert.match(await page.locator(".trait-table").innerText(), /trait-unknown/);
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit creation", exact: true })
    .click();
  await page.getByRole("button", { name: "3 Origins", exact: true }).click();
  await page
    .getByLabel("Culture", { exact: true })
    .selectOption("origin-culture-walled-communities");
  await page.getByLabel("Culture discipline", { exact: true }).selectOption("0");
  assert.match(
    await page.locator(".origin-grants").first().innerText(),
    /Armor/,
  );
  await page.getByRole("button", { name: "4 Class", exact: true }).click();
  await page.getByRole("combobox", { name: "Class", exact: true }).selectOption("class-protector");
  assert.match(await page.locator(".creation-summary").innerText(), /Protector/);
  // A schema-7 character can enter the current Workshop with now-retired talents.
  const utility = structuredClone(exported);
  assert.equal(utility.schemaVersion, 7);
  utility.draft.purchases = {
    0: [],
    1: [{ id: "guard:shelter:1" }, { id: "ability-another-tongue" }],
  };
  utility.draft.acquisitions = { "ability-another-tongue": { languageId: "goblin" } };
  utility.draft.progression = {
    level: 2,
    levels: {
      2: { purchases: [{ id: "ability-a-party-piece" }], acquisitions: { "ability-a-party-piece": { instrument: "flute" } } },
    },
  };
  utility.draft.play = { hp: 9, sp: 1, favorites: { abilities: ["ability-quick-exit", "ability-basic-melee"], items: [] } };
  await page.locator("#import-file").setInputFiles({
    name: "older-talent-build.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(utility)),
  });
  await page.getByText("DP spent on removed choices is available again.", { exact: false }).waitFor();
  const savedUtility = await page.evaluate(
    () => JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft,
  );
  assert.deepEqual(savedUtility.purchases[1], [{ id: "guard:shelter:1" }]);
  assert.deepEqual(savedUtility.progression.levels[2].purchases, []);
  assert.deepEqual(savedUtility.acquisitions, {});
  assert.deepEqual(savedUtility.progression.levels[2].acquisitions, {});
  assert.deepEqual(savedUtility.play.favorites.abilities, ["ability-basic-melee"]);
  assert.equal(savedUtility.play.hp, 9);
  assert.equal(savedUtility.play.sp, 1);
  // Every saved/imported hero uses the current catalog immediately, without a version choice.
  const previous = structuredClone(exported);
  previous.sourceCommit = "64089a1c8961d7faff172f179448a8b6e57827ef";
  previous.draft.culture = {
    id: "origin-culture-cloister-valleys",
    pair: 0,
    retainedFrom: previous.sourceCommit,
  };
  const beforeUpdateDialogs = dialogs.length;
  const previousLibraryCount = await page.evaluate((character) => {
    const key = "hol.workshop.library.v1";
    const entries = JSON.parse(localStorage.getItem(key) ?? "[]");
    entries.push({
      id: "current-rules-save",
      name: "Current rules hero (before rules update)",
      updated: "2026-10-18",
      character,
    });
    localStorage.setItem(key, JSON.stringify(entries));
    localStorage.setItem(
      "hol.workshop.v1",
      JSON.stringify({
        character,
        mode: "sheet",
        tab: "Abilities",
        saveId: "current-rules-save",
      }),
    );
    return entries.length;
  }, previous);
  await page.reload();
  await page.getByRole("tab", { name: "Abilities", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("tab", { name: "Abilities", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  assert.equal(dialogs.length, beforeUpdateDialogs);
  const refreshed = await page.evaluate(() => ({
    saved: JSON.parse(localStorage.getItem("hol.workshop.v1")),
    library: JSON.parse(localStorage.getItem("hol.workshop.library.v1")),
  }));
  assert.equal(refreshed.library.length, previousLibraryCount);
  assert.equal(
    refreshed.library.find((entry) => entry.id === "current-rules-save").name,
    "Current rules hero",
  );
  assert.notEqual(
    refreshed.saved.character.sourceCommit,
    previous.sourceCommit,
  );
  assert.deepEqual(refreshed.saved.character.draft.culture, {
    id: "origin-culture-cloister-valleys",
    pair: 0,
  });
  // The current Cloister Valleys choice grants Wards. It no longer supports
  // the armor technique. Keep the purchases supported by the other disciplines.
  assert(previous.draft.purchases[1].some(entry => entry.id === "armor:harness:1"));
  const connected = {
    ...previous.draft.purchases,
    1: previous.draft.purchases[1].filter(entry => entry.id !== "armor:harness:1"),
  };
  assert.deepEqual(refreshed.saved.character.draft.purchases, connected);
  assert.deepEqual(
    refreshed.library.find(entry => entry.id === "current-rules-save").character.draft.purchases,
    connected,
  );
  assert.equal(refreshed.saved.saveId, "current-rules-save");
  assert.equal(
    refreshed.library.find((entry) => entry.id === "current-rules-save")
      .character.sourceCommit,
    refreshed.saved.character.sourceCommit,
  );
  await page
    .getByRole("button", { name: "Load character", exact: true })
    .click();
  await page
    .locator(".saved-characters article")
    .filter({ hasText: "Current rules hero" })
    .getByRole("button", { name: "Load", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("tab", { name: "Main", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  assert.equal(dialogs.length, beforeUpdateDialogs);
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit creation", exact: true })
    .click();
  await page.getByRole("button", { name: "3 Origins", exact: true }).click();
  const culture = page.getByLabel("Culture", { exact: true });
  assert.equal(await culture.inputValue(), "origin-culture-cloister-valleys");
  assert.match(
    await page.getByLabel("Culture discipline", { exact: true }).locator("option:checked").innerText(),
    /Wards/,
  );
  assert(
    (await culture.locator("option").allTextContents()).every(
      (text) => !/retained choice|Cloister Valleys.*Athletics 1/.test(text),
    ),
  );
  await page.locator(".brand").hover();
  await page.screenshot({ path: `${output}/current-origin.png` });
  // Import old files directly under the current rules, including obsolete retention markers.
  await page.locator("#import-file").setInputFiles({
    name: "previous-origin.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(previous)),
  });
  await page.getByRole("heading", { name: "Review", exact: true }).waitFor();
  const importedCurrent = await page.evaluate(
    () => JSON.parse(localStorage.getItem("hol.workshop.v1")).character,
  );
  assert.deepEqual(importedCurrent.draft.culture, {
    id: "origin-culture-cloister-valleys",
    pair: 0,
  });
  assert.equal(
    importedCurrent.sourceCommit,
    refreshed.saved.character.sourceCommit,
  );
  assert.deepEqual(importedCurrent.draft.purchases, connected);
  assert(
    !dialogs
      .slice(beforeUpdateDialogs)
      .some((text) => /rules update|updated rules|rules edition/i.test(text)),
  );
  assert.deepEqual(failures, []);
  console.info(
    "Workshop passed: fixed scrolling, live attributes, grants, armor/Bulk/supply, grouped actions, crafting rolls, level replay, independent/revisitable signatures, play inventory/languages/conditions, coin override, named saves, schema-7 export/import and 390px layout; no browser errors.",
  );
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  console.error("Browser errors:", failures);
  throw error;
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
