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
  const status = page.getByRole("region", { name: "Sustained Spell" });
  const control = name => status.getByRole("button", { name, exact: true });
  const play = () => page.evaluate(() => JSON.parse(localStorage.getItem("hol.workshop.v1")).character.draft.play);
  const openSpellbook = () => page.getByRole("tab", { name: "Spellbooks", exact: true }).click();
  const openMain = () => page.getByRole("tab", { name: "Main", exact: true }).click();
  const castButton = (id) => page.locator(`[data-action="cast-spell"][data-id="${id}"]`);
  async function cast(spellId = "spell:flame:4") {
    await openSpellbook();
    await castButton(spellId).click();
    const roll = page.getByRole("dialog").locator('[data-action="roll-sheet"]');
    if (spellId === "spell:flame:4") {
      await expect(roll).toHaveText("Cast and roll · 2 SP");
      await roll.click();
      await page.keyboard.press("Escape");
    }
    await openMain();
  }
  const artifacts = resolve("test-results/workshop");
  await mkdir(artifacts, { recursive: true });
  await openSpellbook();
  await expect(sp).toHaveValue("11");
  await expect(sp).toHaveAttribute("max", "11");
  const ritualRow = page.locator('[data-action-row="spell:farseeing:2"]');
  await ritualRow.getByRole("button", { name: "Expand Clairvoyance", exact: true }).click();
  await expect(page.locator('[data-detail-id="spell:farseeing:2"]')).toContainText("Ritual · 1 minute");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: resolve(artifacts, "spellbooks-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator(".spellbooks-library").evaluate((element) => element.scrollWidth <= element.clientWidth + 1), true);
  await page.screenshot({ path: resolve(artifacts, "spellbooks-mobile.png") });
  await page.setViewportSize({ width: 1280, height: 900 });
  await castButton("spell:farseeing:2").click();
  const ritual = page.getByRole("dialog");
  await expect(ritual).toContainText("1 minute");
  await expect(sp).toHaveValue("10");
  assert.equal((await play()).sustain, undefined);
  await ritual.getByRole("button", { name: "Complete Ritual", exact: true }).click();
  await openMain();
  await expect(status).toContainText("Clairvoyance");
  await control("End spell").click();
  await expect(status).toContainText("None active");
  await sp.fill("2");
  await sp.press("Tab");
  await cast();
  await expect(sp).toHaveValue("0");
  await expect(status).toContainText("Heat Metal");
  await expect(status).toContainText("Maneuver · 0 SP · Sustained, up to 1 minute");
  await expect(status.getByRole("button")).toHaveCount(2);
  const { castTurn } = (await play()).sustain;
  await control("Sustain Spell").click();
  assert.equal((await play()).sustain.maintainedTurn, castTurn + 1);
  await expect(sp).toHaveValue("0");
  await page.reload();
  await expect(status).toContainText("Heat Metal");
  assert.equal((await play()).sustain.maintainedTurn, castTurn + 1);
  for (let round = 2; round < 10; round++) {
    await control("Sustain Spell").click();
    assert.equal((await play()).sustain.maintainedTurn, castTurn + round);
  }
  await control("Sustain Spell").click();
  await expect(status).toContainText("None active");
  await expect(sp).toHaveValue("0");
  assert.equal((await play()).sustain, undefined);

  await openSpellbook();
  await expect(castButton("spell:flame:4")).toBeDisabled();
  await sp.fill("5");
  await sp.press("Tab");
  await cast();
  await expect(sp).toHaveValue("3");
  const replacementTurn = (await play()).workshopTurn;
  await cast("spell:air:3");
  assert.equal((await play()).workshopTurn, replacementTurn);
  await expect(sp).toHaveValue("2");
  await expect(status.getByRole("heading", { name: "Fog Cloud", exact: true })).toBeVisible();
  assert.equal((await play()).sustain.spellId, "spell:air:3");
  await control("End spell").click();
  await expect(status).toContainText("None active");
  await cast();
  await expect(status).toContainText("Heat Metal");
  const hp = page.getByRole("spinbutton", { name: "Current HP", exact: true });
  await hp.fill("0");
  await hp.press("Tab");
  await expect(status).toContainText("None active");
  await page.reload();
  await expect(hp).toHaveValue("0");
  await expect(status).toContainText("None active");
  assert.equal((await play()).sustain, undefined);
  assert.deepEqual(failures, []);
  console.info("PASS Spellbook inline rules, Ritual completion, SP costs, zero-SP manual upkeep, reload, duration expiry, replacement, explicit ending, and unconsciousness.");
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
