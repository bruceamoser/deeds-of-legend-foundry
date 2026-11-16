import { esc, ruleBlockMarkup } from "./rules-view.mjs";
import { rollCard } from "./chat-cards.mjs";
import { rollSetup, bindRollSetup } from "./roll-ui.mjs";
import { rollPlan, classifyRoll } from "./rules/roll.mjs";
import { ATTRIBUTES } from "./rules/character.mjs";
import { workshopCharacter } from "./rules/workshop-character.mjs";
import { workshopCatalogs } from "./rules/workshop-forge-catalog.mjs";
const [draft, choices, inventory, creatures, wounds, forge, references] = await Promise.all(
  ["example", "choices", "inventory", "creatures", "wounds", "forge", "forge-references"].map(async (name) => {
    const response = await fetch(`data/${name}.json`);
    if (!response.ok) throw new Error(`Cannot load ${name}`);
    return response.json();
  }),
);
const catalogs = workshopCatalogs(choices, inventory, wounds, forge, references);
const character = workshopCharacter(draft, catalogs);
const cards = character.state.abilities
  .map((id) => catalogs.choices.find((record) => record.id === id))
  .filter(Boolean);
const attackAbility = cards.find((record) => record.id === "arms:bladework:1");
const improvements = character.state.learning.improvements.get(attackAbility.id) ?? [];
const opponent = creatures.creatures.find((record) => record.id === "creature-goblin-scrapper");
const incoming = opponent.actions.main.actions.find((record) => record.name === "Scrap knife");
const incomingFields = opponent.reference.specialtyDetails
  .find((entry) => entry.title === incoming.name).fields;
const field = (name) => incomingFields.find((entry) => entry.label === name)?.text ?? "";
const damageType = field("Damage type").replace(/\.$/, "");
// Resolve this preview's one printed attack. Other selections remain references
// for applying their own effects at the table.
const damageRule = [attackAbility, ...improvements].toReversed()
  .find((entry) => /\d+\/\d+\/\d+ \w+ damage/.test(entry.effect));
const [, weak, standard, strong, damageKind] =
  damageRule.effect.match(/(\d+)\/(\d+)\/(\d+) (\w+) damage/);
const damageByTier = { weak, standard, strong };
const bleeding = improvements.find((entry) => entry.id === "arms:bladework:3")
  ?.effect.match(/Bleeding (\d+)/)?.[1];

function attackEffect(tier) {
  const damage = `${damageByTier[tier]} ${damageKind} damage.`;
  if (tier !== "strong") return damage;
  return [damage, "You may move 1 square after the attack.", bleeding && `Apply Bleeding ${bleeding}.`]
    .filter(Boolean).join(" ");
}

function rollTitle(mode) {
  if (mode === "ability") return attackAbility.name;
  if (mode === "defense") return `Defend · ${incoming.name}`;
  return "Attribute check";
}

export const previewExample = {
  draft,
  maxHp: character.limits.maxHp,
  opponent,
  incoming,
  field,
  inventory: catalogs.inventory,
  attackAbility,
  title: rollTitle,
  effect(mode, tier) {
    if (mode === "ability") return attackEffect(tier);
    if (mode === "defense")
      return `${incoming.outcomes[tier]} ${damageType} damage before resistance.`;
    return null;
  },
};
const dialog = document.querySelector("#reference");
const heading = document.querySelector("[data-preview-hero]");
if (heading) {
  heading.textContent = draft.name;
  document.querySelector('[data-open="ability"]').textContent = attackAbility.name;
}
const chatMode = document.body.classList.contains("chat-preview");
let mode = "ability";
function open(next) {
  mode = next;
  const attribute = mode === "defense" ? incoming.defense.attribute : "brawn";
  const selected = mode === "ability" ? attackAbility.id : null;
  const defenseGuidance = mode === "defense"
    ? '<p class="roll-preview-note">Include any Threat and other modifiers in your roll. Partial cover grants 1 Boon and heavy cover grants 3. <a href="journal.html#rule-foundations">Cover rules</a></p>'
    : "";
  dialog.innerHTML = `<header><div><small class="hol-roll-context">${esc(draft.name)}${mode === "defense" ? " · Defense" : ""}</small><h2 id="reference-title">${esc(rollTitle(mode))}</h2></div><button type="button" data-close class="quiet">Close</button></header><div class="reference-body">${rollSetup({ attributes: Object.fromEntries(ATTRIBUTES.map((a) => [a, draft.attributes[a]])), selected: attribute, attributeId: "preview-attribute", value: draft.attributes[attribute], netId: "preview-net", labelId: "preview-net-label" })}${defenseGuidance}<details class="hol-roll-abilities" open><summary>Abilities</summary><div class="roll-abilities">${[
    ...cards,
  ]
    .sort((a, b) => Number(b.id === selected) - Number(a.id === selected))
    .map(
      (r) =>
        `<label class="inline-toggle"><input type="checkbox" data-preview-ability="${esc(r.id)}" ${r.id === selected ? "checked" : ""}>${esc(r.name)}</label>`,
    )
    .join(
      "",
    )}</div><small>Choose applicable abilities; use the slider for the net Boons or Banes.</small></details><div id="preview-result" class="hol-roll-result" role="status" aria-live="polite"></div><div class="dialog-actions"><button type="button" class="primary" data-preview-roll>Roll</button></div><details class="hol-preview-rules"><summary>Selected ability rules</summary><div data-selected-rules></div></details></div>`;
  bindRollSetup(dialog.querySelector(".reference-body"), {
    getAttributeValue: () =>
      draft.attributes[document.querySelector("#preview-attribute").value],
  });
  updateRules();
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}
function updateRules() {
  const selected = [
    ...dialog.querySelectorAll("[data-preview-ability]:checked"),
  ].map((e) => cards.find((r) => r.id === e.dataset.previewAbility));
  dialog.querySelector("[data-selected-rules]").innerHTML =
    selected
      .map(
        (r) =>
          `<section><h3>${esc(r.name)}</h3>${r.reference?.rules?.details?.map((d) => `<p><b>${esc(d.label)}:</b> ${esc(d.value)}</p>`).join("") ?? ""}${r.reference?.rules?.body?.map(ruleBlockMarkup).join("") ?? ""}${r.reference?.rules?.notes?.map((n) => `<p>${esc(typeof n === "string" ? n : n.text)}</p>`).join("") ?? ""}${(character.state.learning.improvements.get(r.id) ?? []).map((entry) => `<h4>${esc(entry.name)}</h4><p>${esc(entry.effect)}</p>`).join("")}</section>`,
      )
      .join("") || "<p>No abilities selected.</p>";
}
function die() {
  const a = new Uint32Array(1);
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= 4294967292);
  return (a[0] % 6) + 1;
}
document.addEventListener("click", (e) => {
  const opener = e.target.closest("[data-open]");
  if (opener) open(opener.dataset.open);
  const reroll = e.target.closest("[data-chat-reroll]");
  if (reroll) open(reroll.dataset.chatReroll);
  if (e.target.closest("[data-chat-defend]")) open("defense");
  if (e.target.closest("[data-close]")) dialog.close();
  if (e.target.closest("[data-preview-roll]")) {
    const attribute =
        draft.attributes[document.querySelector("#preview-attribute").value],
      net = Number(document.querySelector("#preview-net").value);
    const plan = rollPlan({
      attribute,
      boons: Math.max(0, net),
      banes: Math.max(0, -net),
    });
    const faces = Array.from({ length: plan.count }, () => die());
    const retainedIndices = faces
      .map((face, index) => ({ face, index }))
      .sort(
        (a, b) =>
          (net < 0 ? a.face - b.face : b.face - a.face) || a.index - b.index,
      )
      .slice(0, 3)
      .map((d) => d.index);
    const retained = retainedIndices.map((i) => faces[i]);
    const result = classifyRoll(retained, attribute);
    const selected = [
      ...dialog.querySelectorAll("[data-preview-ability]:checked"),
    ].map((e) => cards.find((r) => r.id === e.dataset.previewAbility).name);
    const message = {
      actor: draft.name,
      target: mode === "attribute" ? null : opponent.name,
      title: rollTitle(mode),
      mode,
      attribute: document.querySelector("#preview-attribute").value,
      abilities: selected,
      effect: previewExample.effect(mode, result.tier),
      roll: { plan, faces, retainedIndices, result },
    };
    document.querySelector("#preview-result").innerHTML = rollCard(message);
    document.dispatchEvent(
      new CustomEvent("hol-preview-roll", { detail: message }),
    );
    if (chatMode) dialog.close();
  }
});
dialog.addEventListener("change", (e) => {
  if (e.target.matches("[data-preview-ability]")) updateRules();
});
if (!chatMode) open("ability");
