import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
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

const actorName = "Workshop Forge Check";
const action = (name, id) => page.locator(
  `[data-action="${name}"]${id === undefined ? "" : `[data-id="${id}"]`}`,
);
const stage = (index) => page.locator(`[data-action="step"][data-step="${index}"]`);
const heading = (name) => page.getByRole("heading", { name, exact: true });
const balance = (dp) => expect(page.locator(".forge-balance strong")).toHaveText(`${dp} of 10`);
const findDiscipline = (id) => action("forge-filter", id).click();
const select = async (id) => {
  const atlas = page.getByRole("dialog", { name: "Discipline atlas", exact: true });
  if (await atlas.isVisible()) {
    const node = atlas.locator(`[data-action="forge-select"][data-id="${id}"]`);
    await node.scrollIntoViewIfNeeded();
    await node.click();
  } else {
    const showAll = action("forge-show-all", "toggle");
    if (await showAll.getAttribute("aria-pressed") === "false") await showAll.click();
    const pathId = id.startsWith("air:") ? "elements:air" : id.split(":").slice(0, 2).join(":");
    const path = action("forge-path", pathId);
    if (await path.getAttribute("aria-expanded") === "false") await path.click();
    const row = action("forge-step", id);
    if (await row.getAttribute("aria-expanded") === "false") await row.click();
  }
  await expect(page.locator("#forge-selection:visible")).toBeVisible();
};

const learn = async (id) => {
  await select(id);
  const button = action("forge-learn", id);
  await expect(button).toBeEnabled();
  await button.click();
  await select(id);
  await expect(page.locator("#forge-selection .forge-meta")).toContainText("Learned");
};
const data = async () => page.evaluate(() => JSON.parse(localStorage.getItem("hol.workshop.v1")));
const openDevelopment = async () => page.getByRole("tab", { name: "Development", exact: true }).click();

try {
  await page.goto(base);
  await heading("Borin Bridgekeeper").waitFor();
  await action("new").click();
  await page.getByLabel("Character name", { exact: true }).fill(actorName);
  await page.getByLabel("Character name", { exact: true }).blur();
  for (const [attribute, value] of [["Fortitude", "1"], ["Knowledge", "1"], ["Reason", "1"]]) {
    const field = page.getByLabel(attribute, { exact: true });
    await field.fill(value);
    await field.blur();
  }
  assert.deepEqual((await data()).character.draft.attributes, {
    brawn: 0, fortitude: 1, agility: 0, guile: 0, knowledge: 1, reason: 1,
  });

  await stage(1).click();
  await action("ancestry", "ancestry-dwarf").click();
  await page.locator('input[data-list="traitIds"][value="trait-dwarf-deep-constitution"]').check();
  await page.locator('input[data-list="traitIds"][value="trait-dwarf-carved-history"]').check();
  await page.getByLabel("Home language", { exact: true }).selectOption("dwarven");

  await stage(2).click();
  await page.getByLabel("Culture", { exact: true }).selectOption("origin-culture-walled-communities");
  await page.getByLabel("Culture discipline", { exact: true }).selectOption("0");
  await page.getByLabel("Background", { exact: true }).selectOption("origin-background-household-guard");
  await page.getByLabel("Background discipline", { exact: true }).selectOption("0");

  await stage(3).click();
  await page.getByRole("combobox", { name: "Class", exact: true }).selectOption("class-protector");
  await expect(action("class-discipline", "armor")).toBeDisabled();
  await expect(action("class-discipline", "arms")).toBeDisabled();
  await action("class-discipline", "guard").click();
  await action("signature", "ability-signature-protector-between-them").click();

  await stage(4).click();
  await expect(page.locator(".forge-controls")).toBeVisible();
  await balance(10);
  await expect(action("forge-view", "columns")).toHaveAttribute("aria-pressed", "true");
  assert.equal(await page.locator(".forge-studied .forge-discipline").count(), 3);
  await findDiscipline("arms");
  await learn("arms:bladework:1");
  await learn("arms:bladework:2");
  await learn("arms:bladework:3");
  await select("arms:bladework:4");
  await expect(action("forge-learn", "arms:bladework:4")).toHaveCount(0);
  await expect(page.locator("#forge-selection:visible")).toContainText("Available at level 3");
  await balance(5);

  await action("forge-chooser", "open").click();
  await action("forge-candidate", "elements").click();
  await expect(action("forge-learn", "elements")).toBeEnabled();
  await action("forge-learn", "elements").click();
  await expect(page.locator("#forge-discipline-chooser")).toBeHidden();
  await expect(action("forge-filter", "elements")).toBeVisible();
  await learn("air:0");
  await select("air:1");
  await expect(page.locator("#forge-selection:visible")).toContainText("Costs 2 DP. You have 1 DP.");
  await balance(1);
  await stage(6).click();
  assert.match(await page.locator("#panel").innerText(), /Creation complete/);
  const spExplanation = page.locator("details").filter({
    has: page.locator("summary").getByText("How maximum SP is calculated", { exact: true }),
  });
  await spExplanation.locator("summary").click();
  await expect(spExplanation).toContainText("2 base SP");
  await expect(spExplanation).toContainText("Soul Capacity and Mind Capacity are paths in the Spellcraft discipline");
  const creation = (await data()).character.draft;
  assert.deepEqual(creation.classDisciplines, ["guard"]);
  assert.deepEqual(creation.purchases[0], []);
  assert.deepEqual(creation.purchases[1].map(({ id }) => id), [
    "arms:bladework:1", "arms:bladework:2", "arms:bladework:3", "elements", "air:0",
  ]);

  await action("sheet").filter({ hasText: "View character sheet" }).click();
  await openDevelopment();
  await expect(page.locator('[data-dp="current"]')).toHaveText("1");
  await action("level-up").click();
  await expect(page.locator('[data-dp="current"]')).toHaveText("7");
  for (let level = 3; level <= 7; level++) await action("level-up").click();
  for (const tier of [3, 7]) {
    await page.locator(`[data-action="choose-signature"][data-tier="${tier}"]`).click();
    await page.locator(`[data-action="advance-signature"][data-tier="${tier}"]`).first().click();
    await action("sheet-development").filter({ hasText: "Back to development" }).click();
  }
  await action("advance").click();
  await heading("Level 7 learning").waitFor();
  await action("forge-view", "atlas").click();
  const atlas = page.getByRole("dialog", { name: "Discipline atlas", exact: true });
  await expect(atlas).toBeVisible();
  await select("air:6");
  const selected = page.locator("#forge-selection:visible");
  await expect(selected).toContainText("Earlier learning");
  await expect(selected).not.toContainText("Sweeping Blade");
  await expect(atlas.locator('[data-action="forge-learn"][data-id="air:6"]')).toBeDisabled();
  const edges = await page.locator('.forge-branch[data-to="air:6"]').evaluateAll(
    (elements) => elements.map((element) => element.dataset.from),
  );
  assert.deepEqual(edges, ["air:5"]);
  // Buy through the Atlas inspector, then verify the shared list state.
  await page.locator('.forge-map [data-action="forge-select"][data-id="air:1"]').click();
  await expect(selected).toContainText("2 DP");
  const atlasLearn = atlas.locator('[data-action="forge-learn"][data-id="air:1"]');
  await expect(atlasLearn).toBeEnabled();
  await atlasLearn.click();
  await expect(page.locator('.forge-map [data-id="air:1"]')).toHaveClass(/is-learned/);
  await page.keyboard.press("Escape");
  await expect(atlas).toHaveCount(0);
  await findDiscipline("elements");
  await select("air:1");
  await expect(selected.locator(".forge-meta")).toContainText("Learned");
  await learn("air:2");
  await learn("air:3");
  assert.equal(await selected.locator(".forge-spell").count(), 2);
  await findDiscipline("arms");
  await findDiscipline("elements");
  for (const step of [4,5,6]) await learn(`air:${step}`);
  await findDiscipline("arms");
  for (const step of [4,5,6,7]) await learn(`arms:bladework:${step}`);

  await action("sheet-development").filter({ hasText: "Back to development" }).click();
  await page.getByRole("tab", { name: "Spellbooks", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Zephyra/ })).toBeVisible();
  assert.equal(await page.locator(".spellbook-sheet tbody tr[data-action-row]").count(), 11);
  const airMastery = JSON.parse(await readFile("static/data/forge.json", "utf8")).nodes.find(node => node.id === "air:6").spellIds[0];
  await expect(page.locator(`[data-action-row="${airMastery}"]`)).toBeVisible();
  await page.getByRole("button", { name: "Expand Elementalism — Air", exact: true }).click();
  await expect(page.locator('[data-detail-id="spell:air:1"]')).toContainText("Maneuver");
  const sp = Number(await page.getByRole("spinbutton", { name: "Current SP" }).inputValue());
  await action("cast-spell", "spell:air:1").click();
  assert.equal(Number(await page.getByRole("spinbutton", { name: "Current SP" }).inputValue()), sp);
  await page.getByRole("button", { name: "Expand Fog Cloud", exact: true }).click();
  await expect(page.locator('[data-action-row="spell:air:3"]')).toContainText("Fog Cloud");
  await action("cast-spell", "spell:air:3").click();
  if (await page.locator('#reference [data-action="roll-sheet"]').isVisible())
    await page.locator('#reference [data-action="roll-sheet"]').click();
  assert.equal(Number(await page.getByRole("spinbutton", { name: "Current SP" }).inputValue()), sp - 1);
  if (await page.locator("#reference").isVisible()) await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Main", exact: true }).click();
  await expect(page.getByRole("region", {name:"Sustained Spell",exact:true})).toContainText("None active");
  await page.getByRole("tab", { name: "Spellbooks", exact: true }).click();
  await action("cast-spell", "spell:air:4").click();
  await expect(page.getByLabel("Roll attribute", { exact: true })).toBeDisabled();
  const cast = page.locator('#reference [data-action="roll-sheet"]');
  await expect(cast).toHaveText("Cast and roll · 2 SP");
  await cast.click();
  await expect(cast).toBeDisabled();
  await expect(page.getByRole("spinbutton", { name: "Current SP" })).toHaveValue(String(sp - 3));
  await page.keyboard.press("Escape");
  await openDevelopment();
  await action("save").click();
  await page.getByRole("dialog").getByLabel("Save name").fill("Forge hybrid");
  await action("save-confirm").click();
  await expect(page.locator("#notice")).toContainText("Saved Forge hybrid");

  const [download] = await Promise.all([page.waitForEvent("download"), action("export").click()]);
  const exported = await readFile(await download.path());
  const portable = JSON.parse(exported);
  assert.equal(portable.draft.progression.level, 7);
  assert.equal(portable.draft.play.sp, sp - 3);
  assert.deepEqual(portable.draft.progression.levels[7].purchases.map(({ id }) => id), [
    "air:1", "air:2", "air:3", "air:4", "air:5", "air:6", "arms:bladework:4", "arms:bladework:5", "arms:bladework:6", "arms:bladework:7",
  ]);
  await page.reload();
  await heading(actorName).waitFor();
  await action("library").click();
  await expect(page.getByRole("dialog").getByText("Forge hybrid")).toBeVisible();
  await action("load-saved").click();
  await expect(page.locator("#notice")).toContainText("Loaded Forge hybrid");

  await page.locator("#import-file").setInputFiles({
    name: "forge-hybrid.hol.json", mimeType: "application/json", buffer: exported,
  });
  await expect(page.locator("#notice")).toContainText("Character imported");
  await page.setViewportSize({ width: 390, height: 800 });
  await action("advance").click();
  await action("forge-view", "columns").click();
  await findDiscipline("elements");
  await select("air:6");
  await expect(selected.locator(".forge-meta")).toContainText("Learned");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("body *")].flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > innerWidth + 2 && rect.width ? [[element.tagName, element.className, rect.right]] : [];
    }).slice(0, 25))),
  );
  // Auxiliary published pages share this catalog and must survive revised techniques.
  await page.setViewportSize({width:1100,height:800});
  await page.goto(new URL("roll.html", base).href);
  await expect(page.getByRole("heading", {name:"Measured Cut I",exact:true})).toBeVisible();
  const previewEffects = await page.evaluate(async () => {
    const {previewExample} = await import(new URL("roll-preview.mjs", location.href).href);
    return ["weak","standard","strong"].map(tier=>previewExample.effect("ability",tier));
  });
  assert.deepEqual(previewEffects, ["3 physical damage.","4 physical damage.","6 physical damage. You may move 1 square after the attack."]);
  for (const file of ["chat.html","combat.html","crafting.html","creature.html","item.html","journal.html","npc.html","recovery.html"]) {
    await page.goto(new URL(file,base).href, {waitUntil:"networkidle"});
    assert((await page.locator("body").innerText()).trim().length>30, `${file} renders content`);
  }
  assert.deepEqual(failures, []);
  console.log("PASS Workshop Forge: single creation pool and distinct origin/class access, level gates, seven-step spellbook and martial mastery, save/reload/import, and narrow layout.");
} catch (error) {
  console.error("Browser errors:", failures);
  throw error;
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
