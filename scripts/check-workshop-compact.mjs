import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, rm } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium, expect } from "@playwright/test";

const root = resolve("dist/workshop");
const prefix = "/heroes-of-legend-foundry/";
const output = resolve("test-results/workshop-compact");
const types = {
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
    const data = await readFile(file);
    response.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
    response.end(data);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await mkdir(output, { recursive: true });
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}${prefix}`;
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 720 } });
  page.setDefaultTimeout(5000);
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });

  const panel = page.locator("#panel");
  const action = (name, id, scope = page) => scope.locator(
    `[data-action="${name}"]${id === undefined ? "" : `[data-id="${id}"]`}`,
  );
  const heading = (name, scope = page) => scope.getByRole("heading", { name, exact: true });
  const byLabel = (name) => page.getByLabel(name, { exact: true });
  const tab = (name) => page.getByRole("tab", { name, exact: true }).click();
  const stage = (index) => page.locator(`[data-action="step"][data-step="${index}"]`).click();
  const row = (id) => panel.locator(`[data-action-row="${id}"]`);
  const dialog = page.getByRole("dialog");
  const noOverflow = async (surface) => {
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `${surface} overflows the 900 px viewport`);
  };
  const capture = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: resolve(output, `${name}.png`),
      ...(name === "failure" ? {} : { style: "#notice { visibility: hidden; }" }),
    });
  };
  const setFavorite = async (control, flag) => {
    if ((await control.getAttribute("aria-pressed")) !== String(flag)) await control.click();
    await expect(control).toHaveAttribute("aria-pressed", String(flag));
  };

  try {
    // Use a real published caster so the same build supplies learned abilities and spells.
    await page.route((url) => url.pathname.endsWith("/data/example.json"), async (route) => {
      const response = await route.fetch({ url: new URL("data/party.json", base).href });
      const party = await response.json();
      await route.fulfill({ json: party.find(({ id }) => id === "vaelis-emberglass").draft });
    });
    await page.goto(base);
    await heading("Vaelis Emberglass").waitFor();
    const rail = page.getByRole("tablist", { name: "Character sheet", exact: true });
    await expect(rail).toHaveAttribute("aria-orientation", "vertical");
    const railBox = await rail.boundingBox();
    const panelBox = await panel.boundingBox();
    assert(railBox.x < panelBox.x && railBox.y < panelBox.y + 80 && railBox.height > railBox.width,
      "Character tabs stay beside the content at 900 px");
    await noOverflow("Main");

    const learned = "ability-signature-arcanist-deliberate-spark";
    const basic = "ability-basic-melee";
    const spell = "spell:flame:4";

    await tab("Abilities");
    const filter = (name) => panel.getByRole("button", { name, exact: true });
    await filter("Learned").click();
    await expect(row(learned)).toBeVisible();
    await expect(row(basic)).toHaveCount(0);
    await setFavorite(action("favorite", learned, panel), false);
    await setFavorite(action("favorite", learned, panel), true);
    await filter("Basic actions").click();
    await expect(row(basic)).toBeVisible();
    await expect(row(learned)).toHaveCount(0);
    await expect(action("open-roll", basic, panel)).toHaveText(/^[A-Za-z]{2,3} [−-]1$/);
    await row(basic).getByRole("button", { name: "Expand Basic Melee", exact: true }).click();
    await expect(panel.locator(`[data-detail-id="${basic}"]`)).toContainText("One adjacent creature");
    await expect(dialog).toHaveCount(0);
    await row(basic).getByRole("button", { name: "Collapse Basic Melee", exact: true }).click();
    await setFavorite(action("favorite", basic, panel), true);
    await filter("Favorites").click();
    await expect(row(learned)).toBeVisible();
    await expect(row(basic)).toBeVisible();
    await panel.getByRole("searchbox", { name: "Search abilities" }).fill("Deliberate Spark");
    await expect(row(basic)).toHaveCount(0);
    await expect(row(learned)).toBeVisible();
    await filter("All").click();
    await panel.getByRole("searchbox", { name: "Search abilities" }).fill("");
    await noOverflow("Abilities");
    await capture("abilities");

    await tab("Spellbooks");
    await panel.getByRole("searchbox", { name: "Search spells" }).fill("Heat Metal");
    await expect(row(spell)).toBeVisible();
    await expect(row(spell).getByRole("button", { name: "Heat Metal (SP: 2)", exact: true })).toBeVisible();
    await expect(row(spell).getByRole("button", { name: "Cast Heat Metal", exact: true })).toHaveText(/^[A-Za-z]{2,3} \+2$/);
    await expect(panel.getByRole("columnheader", { name: /^(SP|Cost|SP cost)$/i })).toHaveCount(0);
    await byLabel("Spell timing").selectOption("Maneuver");
    await expect(row(spell)).toHaveCount(0);
    await byLabel("Spell timing").selectOption("Main Action");
    await expect(row(spell)).toBeVisible();
    await setFavorite(action("favorite", spell, panel), true);
    const arrow = (name, scope = panel) => scope.getByRole("button", { name, exact: true });
    await arrow("Expand Heat Metal").click();
    await expect(arrow("Collapse Heat Metal")).toHaveAttribute("aria-expanded", "true");
    const spellDetail = panel.locator(`[data-detail-id="${spell}"]`);
    await expect(spellDetail).toContainText("One visible metal item");
    await expect(dialog).toHaveCount(0);
    await noOverflow("Spellbooks");
    await capture("spellbooks");
    await arrow("Collapse Heat Metal").click();
    await expect(spellDetail).toHaveCount(0);

    await tab("Main");
    for (const id of [learned, basic, spell]) await expect(row(id)).toBeVisible();
    // An unfavorited catalog action stays in Abilities rather than expanding Main into a library.
    await expect(row("ability-basic-ranged")).toHaveCount(0);
    await action("edit-favorites").click();
    await expect(dialog).toBeVisible();
    const favoriteSearch = dialog.getByRole("searchbox", { name: "Search favorites" });
    await favoriteSearch.fill("Basic Melee");
    await setFavorite(action("favorite", basic, dialog), false);
    await expect(favoriteSearch).toHaveValue("Basic Melee");
    await page.keyboard.press("Escape");
    await expect(row(basic)).toHaveCount(0);
    await expect(row(learned)).toBeVisible();
    await expect(row(spell)).toBeVisible();
    await page.reload();
    await expect(row(basic)).toHaveCount(0);
    await expect(row(learned)).toBeVisible();
    await expect(row(spell)).toBeVisible();
    await capture("main-favorites");

    const sp = page.getByRole("spinbutton", { name: "Current SP", exact: true });
    const startingSp = Number(await sp.inputValue());
    await row(spell).getByRole("button", { name: "Cast Heat Metal", exact: true }).click();
    const cast = action("roll-sheet", undefined, dialog);
    await expect(cast).toHaveText("Cast and roll · 2 SP");
    await cast.click();
    await expect(sp).toHaveValue(String(startingSp - 2));
    await page.keyboard.press("Escape");
    const sustain = page.getByRole("region", { name: "Sustained Spell", exact: true });
    await expect(sustain).toContainText("Heat Metal");
    await sustain.getByRole("button", { name: "Sustain Spell", exact: true }).click();
    await expect(sp).toHaveValue(String(startingSp - 2));
    await page.reload();
    await expect(sustain).toContainText("Heat Metal");
    await sustain.getByRole("button", { name: "End spell", exact: true }).click();
    await expect(sustain).toContainText("None active");

    const hero = "Workshop Compact Check";
    const identity = page.locator(".creation-identity");
    const summary = page.locator(".creation-summary");
    const remaining = page.locator("[data-dp-remaining]");
    await action("new").click();
    await expect(summary).toBeVisible();
    await expect(identity).toContainText("New hero");
    await expect(identity).not.toContainText(/Dwarf|Protector|Arcanist|Not chosen|Unchosen/);
    await expect(summary.locator(".creation-vitals")).not.toContainText(/\d+ (?:HP|SP)/);
    await expect(page.locator(".hero-header")).toHaveCount(0);
    await expect(page.getByRole("spinbutton", { name: "Current HP" })).toHaveCount(0);
    const heroName = byLabel("Character name");
    await heroName.fill(hero);
    await heroName.blur();
    for (const attribute of ["Fortitude", "Knowledge", "Reason"]) {
      const field = byLabel(attribute);
      await field.fill("1");
      await field.blur();
    }

    await stage(1);
    await action("ancestry", "ancestry-dwarf").click();
    await page.locator('input[data-list="traitIds"][value="trait-dwarf-deep-constitution"]').check();
    await page.locator('input[data-list="traitIds"][value="trait-dwarf-carved-history"]').check();
    await byLabel("Home language").selectOption("dwarven");
    await expect(identity).toContainText(hero);
    await expect(identity).toContainText("Dwarf");

    await stage(2);
    await expect(byLabel("Culture")).toHaveJSProperty("tagName", "SELECT");
    await expect(byLabel("Background")).toHaveJSProperty("tagName", "SELECT");
    await expect(byLabel("Culture discipline")).toHaveCount(0);
    // All available origins advertise their disciplines before the player chooses one.
    const originCatalog = await (await page.request.get(new URL("data/forge.json", base).href)).json();
    const disciplineNames = new Map(originCatalog.disciplines.map(({id,name}) => [id,name]));
    for (const origin of originCatalog.origins) {
      const label = origin.kind === "culture" ? "Culture" : "Background";
      const choices = [...new Set(origin.pairs.map(({disciplineId}) => disciplineNames.get(disciplineId)))];
      assert(choices.every(Boolean), `${origin.name} references named disciplines`);
      await expect(byLabel(label).locator(`option[value="${origin.id}"]`))
        .toHaveText(`${origin.name} — ${choices.join(" / ")}`);
    }
    await byLabel("Culture").selectOption("origin-culture-walled-communities");
    await byLabel("Culture discipline").selectOption("0");
    await byLabel("Background").selectOption("origin-background-household-guard");
    await byLabel("Background discipline").selectOption("0");
    await expect(byLabel("Culture").locator("option:checked")).toHaveText("Walled Communities — Armor / Guard");
    await expect(byLabel("Background").locator("option:checked")).toHaveText(/^Household Guard — /);
    await expect(identity).not.toContainText("Protector");
    await noOverflow("Origins");
    await capture("creator-origins");

    await stage(3);
    await panel.getByRole("combobox", { name: "Class", exact: true }).selectOption("class-protector");
    for (const [id, source] of [["armor", "culture"], ["arms", "background"]]) {
      const granted = action("class-discipline", id);
      await expect(granted).toBeDisabled();
      await expect(granted).toContainText(`From ${source}`);
    }
    await action("class-discipline", "guard").click();
    await action("signature", "ability-signature-protector-between-them").click();
    await expect(identity).toContainText("Protector");
    await expect(summary.locator(".creation-vitals")).toContainText(/\d+ HP · \d+ SP/);
    await expect(remaining).toHaveText("10 DP remaining");
    await noOverflow("Class");
    await capture("creator-class");

    await stage(4);
    const sidebar = panel.locator(".forge-sidebar");
    const study = (id) => action("forge-filter", id, sidebar);
    const path = (id) => action("forge-path", id, panel);
    const stepControl = (id) => action("forge-step", id, panel);
    const buy = (id, scope = panel) => action("forge-learn", id, scope);
    const openPath = async (id) => {
      const control = path(id);
      if ((await control.getAttribute("aria-expanded")) !== "true") await control.click();
      await expect(control).toHaveAttribute("aria-expanded", "true");
    };
    const learnedStep = (id) => panel.locator(".forge-step-row.is-learned").filter({ has: action("forge-step", id) });
    await study("arms").click();
    for (const id of ["armor", "arms", "guard"]) await expect(study(id)).toBeVisible();
    await expect(study("elements")).toHaveCount(0);
    await openPath("arms:bladework");
    // Default-open disclosures close on the first click, not the second.
    await path("arms:bladework").click();
    await expect(path("arms:bladework")).toHaveAttribute("aria-expanded", "false");
    await path("arms:bladework").click();
    await expect(stepControl("arms:bladework:1")).toHaveAttribute("aria-expanded", "true");
    await stepControl("arms:bladework:1").click();
    await expect(stepControl("arms:bladework:1")).toHaveAttribute("aria-expanded", "false");
    await stepControl("arms:bladework:1").click();
    await expect(path("arms:bladework")).toContainText("0 of 4 learned");
    await expect(stepControl("arms:bladework:2")).toHaveAccessibleName(/Needs Measured Cut I/);
    await expect(buy("arms:bladework:2")).toHaveCount(0);
    await noOverflow("Learning");
    await capture("learning-first");
    await buy("arms:bladework:1").click();
    await expect(learnedStep("arms:bladework:1")).toBeVisible();
    await expect(path("arms:bladework")).toContainText("1 of 4 learned");
    await expect(remaining).toHaveText("9 DP remaining");
    const improvement = stepControl("arms:bladework:2");
    if ((await improvement.getAttribute("aria-expanded")) !== "true") await improvement.click();
    await expect(panel.locator("#forge-selection")).toContainText("Improves Measured Cut I");
    await expect(dialog).toHaveCount(0);
    await capture("learning-improvement");
    await buy("arms:bladework:2").click();
    await buy("arms:bladework:3").click();
    await expect(path("arms:bladework")).toContainText("3 of 4 learned");
    await expect(stepControl("arms:bladework:4")).toHaveAccessibleName(/Level 3/);
    await expect(buy("arms:bladework:4")).toHaveCount(0);
    await expect(remaining).toHaveText("5 DP remaining");

    await action("forge-chooser", "open", sidebar).click();
    const chooser = page.getByRole("dialog", { name: "Add discipline", exact: true });
    await expect(chooser).toBeVisible();
    await expect(action("forge-candidate", "arms", chooser)).toHaveCount(0);
    await chooser.getByRole("searchbox", { name: "Search disciplines" }).fill("Elements");
    await action("forge-candidate", "elements", chooser).click();
    await expect(chooser.getByRole("searchbox")).toHaveValue("Elements");
    await capture("learning-add-discipline");
    await buy("elements", chooser).click();
    await expect(chooser).toHaveCount(0);
    await expect(study("elements")).toBeVisible();
    await expect(remaining).toHaveText("4 DP remaining");
    await study("elements").click();
    await openPath("elements:air");
    await buy("air:0").click();
    await expect(path("elements:air")).toContainText("2 spells learned");
    await buy("air:1").click();
    await expect(path("elements:air")).toContainText("4 spells learned");
    await expect(stepControl("air:2")).toHaveAccessibleName(/Need 1 more DP/);
    await expect(buy("air:2")).toHaveCount(0);
    await expect(remaining).toHaveText("1 DP remaining");
    await page.reload();
    await expect(identity).toContainText(hero);
    await expect(remaining).toHaveText("1 DP remaining");
    await study("elements").click();
    await openPath("elements:air");
    await expect(path("elements:air")).toContainText("4 spells learned");
    await expect(learnedStep("air:1")).toBeVisible();
    await study("arms").click();
    await openPath("arms:bladework");
    await expect(path("arms:bladework")).toContainText("3 of 4 learned");
    await expect(learnedStep("arms:bladework:3")).toBeVisible();

    await action("forge-view", "atlas", panel).click();
    const map = panel.locator(".forge-map-scroll");
    await map.scrollIntoViewIfNeeded();
    const mapBox = await map.boundingBox();
    const beforeZoom = Number(await map.getAttribute("data-zoom"));
    await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
    await page.mouse.wheel(0, -250);
    await expect.poll(async () => Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(beforeZoom);
    await action("forge-view", "zoom-in", panel).click();
    await action("forge-view", "zoom-in", panel).click();
    await map.evaluate(element => { element.scrollLeft=80; element.scrollTop=80; });
    const beforePan = await map.evaluate(element => [element.scrollLeft,element.scrollTop]);
    const bounds = await map.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + Math.min(bounds.height / 2, 100));
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 - 45, bounds.y + Math.min(bounds.height / 2, 100) - 45, {steps:5});
    await page.mouse.up();
    assert.notDeepEqual(await map.evaluate(element => [element.scrollLeft,element.scrollTop]), beforePan, "Mouse drag pans the Atlas");
    await capture("learning-atlas");

    assert.deepEqual(failures, []);
    await rm(resolve(output, "failure.png"), { force: true });
    console.info("PASS compact Workshop at 900 px: favorites, inline rules, signed rolls, spell filters and upkeep, creator choices, Learning purchases and level gates across reload.");
  } catch (error) {
    await capture("failure");
    console.error("Browser errors:", failures);
    throw error;
  }
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
