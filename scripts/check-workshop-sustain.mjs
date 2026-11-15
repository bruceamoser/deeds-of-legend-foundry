import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium, expect } from "@playwright/test";

const root = resolve("dist/workshop");
const prefix = "/heroes-of-legend-foundry/";
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
};
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, "http://localhost").pathname;
    if (!path.startsWith(prefix)) throw new Error("Wrong base path");
    const file = resolve(root, path.slice(prefix.length) || "index.html");
    if (!file.startsWith(root + sep)) throw new Error("Invalid path");
    const contents = await readFile(file);
    response.setHeader("Content-Type", contentTypes[extname(file)] ?? "application/octet-stream");
    response.end(contents);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = process.env.HOL_WORKSHOP_URL ?? `http://127.0.0.1:${server.address().port}${prefix}`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failures = [];
page.on("pageerror", (error) => failures.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
});
page.on("dialog", (dialog) => dialog.accept());

try {
  // Choose the published Arcanist so the test exercises an actually learned spell.
  await page.route(url => url.pathname.endsWith("/data/example.json"), async route => {
    const response = await route.fetch({ url: new URL("data/party.json", base).href });
    const party = await response.json();
    const caster = party.find(({ id }) => id === "vaelis-emberglass");
    await route.fulfill({ json: caster.draft });
  });
  await page.goto(base);
  await page.getByRole("heading", { name: "Vaelis Emberglass", exact: true }).waitFor();
  const sp = page.getByRole("spinbutton", { name: "Current SP", exact: true });
  const status = page.locator(".action-groups").getByRole("region", { name: "Sustained Spell" });
  const control = name => status.getByRole("button", { name, exact: true });
  async function cast(spellId = "spell:flame:4") {
    await page.getByRole("tab", { name: "Spellbooks", exact: true }).click();
    await page.locator(`[data-action="reference"][data-id="${spellId}"]`).click();
    await page.getByRole("button", { name: "Cast", exact: true }).click();
    const roll = page.locator('[data-action="roll-sheet"]');
    if (await roll.count()) await roll.click();
    if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Main", exact: true }).click();
  }
  const artifacts = resolve("test-results/workshop");
  await mkdir(artifacts, { recursive: true });
  await page.getByRole("tab", { name: "Spellbooks", exact: true }).click();
  await expect(page.getByRole("region", { name: "Spellcasting reserve" })).toContainText("11 / 11 SP");
  await page.screenshot({ path: resolve(artifacts, "spellbooks-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator(".spellbooks-library").evaluate((element) => element.scrollWidth <= element.clientWidth + 1), true);
  await page.screenshot({ path: resolve(artifacts, "spellbooks-mobile.png") });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('[data-action="reference"][data-id="spell:farseeing:2"]').click();
  await page.getByRole("button", { name: "Begin Ritual", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("1 minute");
  await expect(page.getByRole("region", { name: "Sustained Spell" })).toHaveCount(0);
  await page.getByRole("button", { name: /Complete Ritual|Roll when the Ritual ends/ }).click();
  const ritualRoll = page.locator('[data-action="roll-sheet"]');
  if (await ritualRoll.count()) await ritualRoll.click();
  if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Sustained Spell" })).toContainText("Clairvoyance");
  await page.getByRole("region", { name: "Sustained Spell" }).getByRole("button", { name: "End spell", exact: true }).click();
  await page.getByRole("region", { name: "Sustained Spell" }).getByRole("button", { name: "End my turn", exact: true }).click();
  await sp.fill("2");
  await sp.press("Tab");
  await cast();
  await expect(sp).toHaveValue("0");
  await expect(status).toContainText("First upkeep is due next turn.");
  await expect(control("Sustain Spell")).toBeDisabled();
  await control("End my turn").click();
  await control("Mark Maneuver spent").click();
  await expect(control("Sustain Spell")).toBeDisabled();
  await control("Convert Main to Maneuver").click();
  await control("Sustain Spell").click();
  await expect(status).toContainText("Sustained this turn.");
  await expect(sp).toHaveValue("0");
  await page.reload();
  await expect(status).toContainText("Sustained this turn.");
  await expect(control("Sustain Spell")).toBeDisabled();
  await control("End my turn").click();
  await expect(status).toContainText("Spend a Maneuver before this turn ends.");
  await control("End my turn").click();
  await expect(status).toHaveCount(0);
  await sp.fill("5");
  await sp.press("Tab");
  await cast();
  await control("End my turn").click();
  await cast("spell:air:3");
  await expect(status.getByRole("button", { name: "Fog Cloud", exact: true })).toBeVisible();
  await expect(status.getByRole("button", { name: "Heat Metal", exact: true })).toHaveCount(0);
  await control("End spell").click();
  await expect(status).toContainText("Maneuver spent");
  await control("End my turn").click();
  await cast();
  const hp = page.getByRole("spinbutton", { name: "Current HP", exact: true });
  await hp.fill("0");
  await hp.press("Tab");
  await expect(status.getByRole("heading", { name: "Heat Metal" })).toHaveCount(0);
  await page.reload();
  await expect(hp).toHaveValue("0");
  assert.deepEqual(failures, []);
  console.info("PASS Sustain Spell first eligible turn, Maneuver conversion, zero-SP upkeep, reload, missed upkeep, replacement, explicit ending, Ritual completion, and unconsciousness.");
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
