import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";
import { selectTestUser } from "./helpers/login.mjs";

const url = process.env.HOL_TEST_URL;
if (url !== "http://localhost:30025" || process.env.HOL_TEST_ALLOW_WRITES !== "1" ||
    process.env.HOL_TEST_ISOLATED_WORLD !== "1" || process.env.HOL_NATIVE_RUNTIME_LEASE !== "workshop")
  throw new Error("Requires the workshop lease and isolated http://localhost:30025 Foundry world.");

const output = resolve("test-results/playtest-workshop-337");
await mkdir(output, { recursive: true });
const portable = JSON.parse(await readFile("Build-Offs/revised/builds/cleric-level-1.hol.json", "utf8"));
portable.draft.shopping = portable.draft.shopping.filter(item => item.id !== "item-ordinary-light-armor");
const chosenPortrait = "icons/svg/book.svg";
const removedItems = ["armor:harness:1", "spell:restoration:1", "spell:restoration:2"];
const evidence = { checks: [], errors: [] };
const browser = await chromium.launch();
let gm, owner, fixture;

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

function actorState(page, id) {
  return page.evaluate(id => {
    const systemId = "heroes-of-legend";
    const actor = game.actors.get(id);
    const saved = actor.getFlag(systemId, "nativeWorkshop");
    const draft = actor.getFlag(systemId, "nativeWorkshopDraft");
    return {
      resource: { hp: actor.system.health.value, sp: actor.system.sp.value },
      maxSp: actor.system.sp.max,
      img: actor.img,
      mode: saved.view.mode,
      purchased: saved.portable.draft.purchases[1].map(entry => entry.id),
      pending: draft?.draft.purchases[1].map(entry => entry.id) ?? null,
      abilities: actor.items.filter(item => item.type === "ability").map(item => item.getFlag(systemId, "catalogId")),
      gear: actor.items.filter(item => item.type === "equipment").map(item => ({
        id: item.id, name: item.name, quantity: item.system.quantity, held: item.system.held,
      })).sort((a, b) => a.id.localeCompare(b.id)),
    };
  }, id);
}

async function openHero(page, id) {
  await page.evaluate(async id => {
    const sheet = game.actors.get(id).sheet;
    await sheet.render({ force: true });
    await sheet.mountReady;
  }, id);
}

function passed(check) {
  evidence.checks.push(check);
  console.info(check);
}

try {
  gm = await join(process.env.HOL_TEST_USER ?? "Gamemaster");
  evidence.runtime = await gm.evaluate(() => ({ world: game.world.id, build: game.release.build, system: game.system.version }));
  assert.equal(evidence.runtime.world, process.env.HOL_TEST_WORLD ?? "hol-native-325");
  assert.equal(evidence.runtime.build, 370);
  fixture = await gm.evaluate(async portable => {
    const systemId = "heroes-of-legend";
    const state = globalThis.__playtestWorkshop337 = {};
    const user = await User.create({ name: `Workshop337 owner ${foundry.utils.randomID(5)}`, role: CONST.USER_ROLES.TRUSTED });
    state.user = user.id;
    state.name = user.name;
    portable.draft.name = "Playtest337 cleric";
    const actor = await Actor.create({
      name: portable.draft.name, type: "character", img: "icons/svg/angel.svg",
      ownership: { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    });
    state.actor = actor.id;
    await actor.importFromJSON(JSON.stringify(portable));
    await user.update({ character: actor.id });
    await actor.update({
      img: "icons/svg/angel.svg", "system.health.value": 8, "system.sp.value": 3,
      [`flags.${systemId}.nativeWorkshopPendingRoll`]: {
        id: "orphaned-use", status: "evaluated", kind: "cast", authorId: user.id, faces: [4, 5, 6],
      },
    });
    const grant = actor.items.find(item => item.getFlag(systemId, "acquisitionInstance") === "inventory-learned-ordinary-light-armor");
    if (!grant) throw new Error("The cleric fixture must start with its study-granted light armor.");
    await grant.update({ name: "Playtest337 named armor", "system.quantity": 2 });
    const [custom] = await actor.createEmbeddedDocuments("Item", [{
      name: "Playtest337 unrelated gear", type: "equipment", system: { quantity: 3, carried: true },
    }]);
    state.grant = grant.id;
    state.custom = custom.id;
    return state;
  }, portable);

  owner = await join(fixture.name);
  assert.deepEqual(await owner.evaluate(id => ({
    isGM: game.user.isGM,
    owner: game.actors.get(id).testUserPermission(game.user, "OWNER"),
    canBrowse: game.user.can("FILES_BROWSE"),
  }), fixture.actor), { isGM: false, owner: true, canBrowse: true });
  await openHero(owner, fixture.actor);
  const sheet = owner.locator(".hol-workshop-character");
  const portrait = sheet.getByRole("button", { name: "Edit character portrait" });
  await expect(portrait).toBeVisible();
  assert.ok((await portrait.boundingBox()).height >= 60);
  const beforePortrait = await actorState(gm, fixture.actor);
  await portrait.click();
  const picker = owner.locator('form.application').filter({ has: owner.locator('input[name="file"]') });
  await expect(picker).toBeVisible();
  await picker.getByRole("heading", { name: "Image Browser" }).click();
  await picker.locator(`[data-file][data-path$="${chosenPortrait}"]`).click();
  const selectedPortrait = await picker.locator('input[name="file"]').inputValue();
  assert.ok(selectedPortrait.endsWith(chosenPortrait));
  await picker.locator('button[type="submit"]').click();
  await expect(picker).toBeHidden();
  await expect.poll(async () => (await actorState(gm, fixture.actor)).img).toBe(selectedPortrait);
  await expect(portrait).toHaveAttribute("src", selectedPortrait);
  const afterPortrait = await actorState(gm, fixture.actor);
  assert.deepEqual(afterPortrait, { ...beforePortrait, img: selectedPortrait });
  await sheet.screenshot({ path: resolve(output, "portrait.png") });
  passed("A non-GM owner selected a new Actor image in Foundry’s FilePicker. The portrait and only the portrait changed.");

  const hp = sheet.getByRole("spinbutton", { name: "Current HP" });
  const sp = sheet.getByRole("spinbutton", { name: "Current SP" });
  async function changeResource(input, value, key, expected, keyPress = "Enter") {
    await input.fill(value);
    await expect(input).toHaveValue(value);
    await input.press(keyPress);
    await expect.poll(async () => (await actorState(gm, fixture.actor)).resource[key]).toBe(expected);
    await owner.evaluate(id => game.actors.get(id).sheet.controller.settle(), fixture.actor);
    await expect(input).toHaveValue(String(expected));
  }
  await changeResource(hp, "-2", "hp", 6);
  await changeResource(hp, "+1", "hp", 7);
  await changeResource(hp, "5", "hp", 5, "Tab");
  await changeResource(sp, "+99", "sp", beforePortrait.maxSp);
  await changeResource(sp, "-1", "sp", beforePortrait.maxSp - 1);
  passed("Signed HP and SP edits updated the Actor, clamped at the resource limit, and left unsigned values absolute.");

  const retiredRoll = await gm.evaluate(id => {
    const actor = game.actors.get(id);
    return {
      active: actor.getFlag("heroes-of-legend", "nativeWorkshopPendingRoll") ?? null,
      retired: actor.getFlag("heroes-of-legend", "nativeWorkshopRolls")?.["orphaned-use"],
    };
  }, fixture.actor);
  assert.equal(retiredRoll.active, null);
  assert.equal(retiredRoll.retired.status, "interrupted");
  assert.deepEqual(retiredRoll.retired.faces, [4, 5, 6]);
  passed("A stale evaluated roll retired automatically during the next save. Its dice were retained and development saves remained available.");


  const beforeLearning = await actorState(gm, fixture.actor);
  const targetPurchases = beforeLearning.purchased.filter(id => !["armor", "armor:harness:1", "restoration:0"].includes(id));
  assert(removedItems.every(id => beforeLearning.abilities.includes(id)));
  assert(beforeLearning.gear.some(item => item.id === fixture.grant));
  assert(beforeLearning.gear.some(item => item.id === fixture.custom));
  await sheet.getByRole("tab", { name: "Development" }).click();
  await sheet.getByRole("button", { name: "Spend DP", exact: true }).click();
  await expect(sheet.getByRole("heading", { name: "Level 1 learning" })).toBeVisible();
  const armor = sheet.getByRole("button", { name: "Unlearn Armor", exact: true });
  const restoration = sheet.getByRole("button", { name: "Unlearn Restoration I", exact: true });
  await expect(armor).toBeVisible();
  await expect(restoration).toBeVisible();
  await restoration.scrollIntoViewIfNeeded();
  await sheet.screenshot({ path: `${output}/learning-list.png` });
  await armor.click();
  await expect(sheet.getByRole("button", { name: "Unlearn Light Armor I", exact: true })).toHaveCount(0);
  await expect.poll(async () => (await actorState(gm, fixture.actor)).pending)
    .toEqual(beforeLearning.purchased.filter(id => !["armor", "armor:harness:1"].includes(id)));
  await expect(sheet.locator("#notice")).toBeEmpty({ timeout: 10000 });
  await restoration.click();

  await expect.poll(async () => (await actorState(gm, fixture.actor)).pending).toEqual(targetPurchases);
  const draft = await actorState(gm, fixture.actor);
  assert(draft.pending);
  assert(removedItems.every(id => draft.abilities.includes(id)));
  await owner.evaluate(id => game.actors.get(id).sheet.close(), fixture.actor);
  await openHero(owner, fixture.actor);
  await expect(sheet.getByRole("heading", { name: "Level 1 learning" })).toBeVisible();
  await sheet.getByRole("button", { name: "Save development", exact: true }).click();
  await expect(sheet.getByRole("tab", { name: "Development" })).toHaveAttribute("aria-selected", "true");
  const saved = await actorState(gm, fixture.actor);
  assert.equal(saved.pending, null);
  assert.equal(saved.mode, "sheet");
  assert.deepEqual(saved.purchased, targetPurchases);
  assert.deepEqual(saved.abilities.sort(), beforeLearning.abilities.filter(id => !removedItems.includes(id)).sort());
  assert.deepEqual(saved.gear, beforeLearning.gear);
  assert.deepEqual(saved.resource, beforeLearning.resource);
  passed("Unlearn removes a bought discipline, its dependent ability, and a spellbook section from the List. Reopening and saving preserves owned gear and spent resources.");

  await owner.reload();
  await owner.waitForFunction(() => globalThis.game?.ready, null, { timeout: 60000 });
  await openHero(owner, fixture.actor);
  await expect(sheet.getByRole("tab", { name: "Development" })).toHaveAttribute("aria-selected", "true");
  const reopened = await actorState(owner, fixture.actor);
  reopened.abilities.sort();
  assert.deepEqual(reopened, saved);
  passed("Reloading Foundry and reopening the same Actor retained the learning changes, gear, portrait, and current HP/SP.");

  await sheet.getByRole("tab", { name: "Main" }).click();
  await sheet.getByRole("button", { name: "Add condition", exact: true }).click();
  const conditionDialog=sheet.getByRole("dialog",{name:"Add condition"});
  await conditionDialog.getByLabel("Condition",{exact:true}).selectOption("poisoned");
  await conditionDialog.getByRole("button",{name:"Add condition",exact:true}).click();
  const removeCondition=sheet.getByRole("button",{name:"Remove Poisoned",exact:true});
  const hasPoison=page=>page.evaluate(id=>game.actors.get(id).statuses.has("hol.poisoned"),fixture.actor);
  await expect.poll(()=>hasPoison(gm)).toBe(true);
  await removeCondition.click();
  await expect.poll(()=>hasPoison(gm)).toBe(false);
  await expect(removeCondition).toHaveCount(0);
  passed("An owner added and removed a condition from the Workshop and the embedded Foundry status stopped applying.");

  await sheet.getByRole("tab", { name: "Inventory" }).click();
  const knownGear=(await actorState(gm,fixture.actor)).gear;
  await sheet.getByRole("button",{name:"Add item",exact:true}).click();
  const addItem=sheet.getByRole("dialog",{name:"Add item"});
  await addItem.getByLabel("Item",{exact:true}).selectOption("item-signal-kit");
  await addItem.getByLabel("Quantity",{exact:true}).fill("3");
  await addItem.getByRole("button",{name:"Add item",exact:true}).click();
  await expect.poll(async()=>(await actorState(gm,fixture.actor)).gear.length).toBe(knownGear.length+1);
  const dropped=(await actorState(gm,fixture.actor)).gear.find(item=>!knownGear.some(known=>known.id===item.id));
  const drop=sheet.getByRole("row").filter({hasText:"Signal Kit"}).filter({has:owner.getByRole("cell",{name:"3",exact:true})})
    .getByRole("button",{name:"Drop Signal Kit",exact:true});
  await drop.click();
  const confirmDrop=sheet.getByRole("dialog",{name:"Drop Signal Kit?"});
  await confirmDrop.getByRole("button",{name:"Cancel",exact:true}).click();
  assert.ok((await actorState(gm,fixture.actor)).gear.some(item=>item.id===dropped.id));
  await drop.click();
  await confirmDrop.getByRole("button",{name:"Drop item",exact:true}).click();
  await expect.poll(async()=>(await actorState(gm,fixture.actor)).gear).toEqual(knownGear);
  await owner.reload();
  await owner.waitForFunction(()=>globalThis.game?.ready);
  await openHero(owner,fixture.actor);
  await expect(sheet.getByRole("tab",{name:"Inventory"})).toHaveAttribute("aria-selected","true");
  await expect(drop).toHaveCount(0);
  assert.equal(await hasPoison(owner),false);
  passed("Drop cancellation kept the play-added stack. Confirming removed only that owned item, and reload preserved both changes.");
  assert.deepEqual(evidence.errors, []);
} catch (error) {
  evidence.failure = error.stack;
  await owner?.screenshot({ path: resolve(output, "failure.png") }).catch(() => {});
  throw error;
} finally {
  await owner?.close();
  try {
    await gm?.evaluate(async () => {
      const state = globalThis.__playtestWorkshop337;
      if (!state) return;
      const actor = game.actors.get(state.actor);
      const receipts = state.actor ? game.messages.filter(message =>
        message.getFlag("heroes-of-legend", "nativeWorkshopRequest")?.actorUuid === `Actor.${state.actor}`).map(message => message.id) : [];
      if (receipts.length) await ChatMessage.deleteDocuments(receipts);
      await actor?.delete();
      await game.users.get(state.user)?.delete();
    });
  } catch (error) {
    evidence.cleanupFailure = error.stack;
    process.exitCode = 1;
  }
  await writeFile(resolve(output, "evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
  await browser.close();
}
