import { forgeEligibility } from "./rules/forge.mjs";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );

const TAU = Math.PI * 2;
const WEBP_TOKENS = new Set([
  "arms", "armor", "guard", "marksmanship", "athletics", "subterfuge",
  "wilderness", "medicine", "craft", "scholarship", "influence", "life",
]);
const atlasCache = new WeakMap();
const point = (center, angle, distance) => ({
  x: Math.round(center.x + Math.cos(angle) * distance),
  y: Math.round(center.y + Math.sin(angle) * distance),
});
function attachedMasteries(graph, path) {
  const book = graph.books.find((entry) => entry.id === path.bookId);
  return (book?.masteryIds ?? []).filter((id) => graph.nodes.some((node) => node.id === id));
}

export function atlasLayout(graph) {
  if (atlasCache.has(graph)) return atlasCache.get(graph);
  const positions = new Map();
  const edges = [];
  const center = { x: 0, y: 0 };
  const directions = [-Math.PI / 2, Math.PI, 0, Math.PI / 2]; // Main, Maneuver, Reaction, wildcard.
  graph.disciplines.forEach((discipline, index) => {
    const origin = index < 12
      ? point(center, -Math.PI / 2 + index * TAU / 12, 1020)
      : index < 18
        ? point(center, -Math.PI / 2 + (index - 12 + 0.5) * TAU / 6, 520)
        : center;
    positions.set(discipline.id, origin);
    discipline.paths.forEach((path, index) => {
      const direction = directions[index];
      const radius = 40;
      const lobe = point(origin, direction, 75);
      path.steps.forEach((id, step) => {
        // The first four purchases retain the small loop. The advanced tail
        // starts at that loop's level-3 endpoint, not at another discipline.
        const target = step < 4
          ? point(lobe, direction + Math.PI + step * 1.7 * Math.PI / 3, radius)
          : point(origin, direction + (6 - step) * 0.2, 135 + (step - 4) * 30);
        const predecessor = path.steps[step - 1] ?? discipline.id;
        const previous = positions.get(predecessor);
        const tailBend = point(origin, direction + 0.75, 145);
        positions.set(id, target);
        edges.push({ from: predecessor, to: id,
          draw: step > 0 && step < 4
            ? `M ${previous.x} ${previous.y} A ${radius} ${radius} 0 0 1 ${target.x} ${target.y}`
            : step === 4
              ? `M ${previous.x} ${previous.y} Q ${tailBend.x} ${tailBend.y} ${target.x} ${target.y}`
              : `M ${previous.x} ${previous.y} L ${target.x} ${target.y}` });
      });
      const masteries = attachedMasteries(graph, path);
      masteries.forEach((id, index) => {
        const predecessor = path.steps.at(-1);
        const previous = positions.get(predecessor);
        const target = point(origin, direction + (index - (masteries.length - 1) / 2) * 0.25, 185);
        positions.set(id, target);
        const bend = point(origin, direction + 0.75, 145);
        edges.push({ from: predecessor, to: id,
          draw: `M ${previous.x} ${previous.y} Q ${bend.x} ${bend.y} ${target.x} ${target.y}` });
      });
    });
  });
  const result = { positions, edges };
  atlasCache.set(graph, result);
  return result;
}

function nodeShape(level) {
  const path = level >= 7 ? "M20 3 L37 20 L20 37 L3 20 Z"
    : level >= 3 ? "M20 3 L37 35 L3 35 Z"
      : "M20 4 A16 16 0 1 0 20 36 A16 16 0 1 0 20 4 Z";
  return `<svg class="forge-node-shape" viewBox="0 0 40 40" aria-hidden="true"><path class="forge-shape-halo" d="${path}"/><path class="forge-shape-body" d="${path}"/></svg>`;
}

function control(action, id, label, attributes = "", className = "") {
  return `<button type="button" data-action="${action}" data-id="${escape(id)}" class="${className}" ${attributes}>${label}</button>`;
}

function disciplineToken(id) {
  const extension = WEBP_TOKENS.has(id) ? "webp" : "svg";
  return `<img class="forge-token" src="assets/${encodeURIComponent(id)}.${extension}" alt="" draggable="false">`;
}

function nodeStatus(model, id) {
  if (model.learned.has(id)) return "learned";
  return model.eligibility(id).eligible ? "available" : "later";
}

function nodeButton(model, node, content, { className = "", style = "", tabIndex } = {}) {
  const status = nodeStatus(model, node.id);
  const selected = model.selected?.id === node.id;
  const label = `${node.name}${node.kind === "discipline" ? "" : `, level ${node.level}`}, ${status === "later" ? "requirements to meet" : status}`;
  return control(
    "forge-select",
    node.id,
    content + (className.includes("forge-map-") ? `<span class="forge-node-label">${escape(node.name)}</span>` : ""),
    `aria-label="${escape(label)}" aria-pressed="${selected}" title="${escape(label)}"${style ? ` style="${style}"` : ""}${tabIndex === undefined ? "" : ` tabindex="${tabIndex}"`}`,
    `forge-node is-${status} ${className}`,
  );
}

function visibleDisciplines(model) {
  return model.atlasDiscipline && model.atlasScope === "discipline"
    ? [model.atlasDiscipline] : model.disciplines;
}

function mapView(model, visible) {
  if (!visible.length) return '<p class="forge-empty">Add a discipline to begin.</p>';
  const { positions, edges } = atlasLayout(model.graph);
  const paths = visible.flatMap((entry) => entry.paths);
  const ids = paths.flatMap((path) => [...path.steps, ...attachedMasteries(model.graph, path)]);
  const focus = visible.map((entry) => positions.get(entry.id));
  const minX = Math.min(...focus.map((p) => p.x - 245));
  const minY = Math.min(...focus.map((p) => p.y - 255));
  const width = Math.max(...focus.map((p) => p.x + 245)) - minX;
  const height = Math.max(...focus.map((p) => p.y + 230)) - minY;
  const toStyle = (p) => `--node-x:${100 * (p.x - minX) / width}%;--node-y:${100 * (p.y - minY) / height}%`;
  const visibleIds = new Set(ids);
  const branchPaths = edges.filter(({ to }) => visibleIds.has(to)).map(({ from, to, draw }) =>
    `<path class="forge-branch ${model.learned.has(to) ? "is-learned" : ""} ${model.selected?.id === to || model.selected?.id === from ? "is-highlighted" : ""}" data-from="${escape(from)}" data-to="${escape(to)}" d="${draw}"/>`,
  ).join("");
  const roots = visible.map((entry) => {
    const p = positions.get(entry.id);
    return nodeButton(model, model.nodes.get(entry.id), disciplineToken(entry.id),
      { className: "forge-map-root", style: toStyle(p) })
      + `<span class="forge-map-name" style="${toStyle({ x: p.x, y: p.y - 235 })}" aria-hidden="true">${escape(entry.name)}</span>`;
  }).join("");
  const steps = ids.map((id) => {
    const node = model.nodes.get(id);
    const root = model.nodes.get(node.requires?.[0]);
    const origin = positions.get(node.disciplineId ?? root?.disciplineId) ?? positions.get(visible[0].id);
    return nodeButton(model, node, nodeShape(node.level), {
      className: `forge-map-step forge-level-${node.level >= 7 ? 7 : node.level >= 3 ? 3 : 1}${node.level >= 7 ? " forge-map-end" : ""}${positions.get(id).x < origin.x ? " forge-label-left" : ""}`,
      style: toStyle(positions.get(id)),
    });
  }).join("");
  return `<div class="forge-map-scroll${model.zoom >= 4 ? " show-node-labels" : ""}" data-zoom="${model.zoom}" tabindex="0" aria-label="Discipline map"><div class="forge-map ${visible.length === 1 ? "forge-map-focus" : "forge-map-overview"}" style="--map-ratio:${width / height};--map-zoom:${model.zoom}"><svg viewBox="${minX} ${minY} ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${branchPaths}</svg>${roots}${steps}</div></div>`;
}

function spellCard(spell) {
  const fields = [
    ["Casting", spell.action],
    ["Time", spell.ritualTime ?? spell.time],
    ["Trigger", spell.trigger],
    ["Attribute", spell.attribute],
    ["Target / range", spell.target],
    ["Duration", spell.duration],
  ].filter(([, value]) => value);
  return `<details class="forge-spell"><summary><span>${escape(spell.name)}</span><span>${spell.sp} SP</span></summary><dl>${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl><p>${escape(spell.effect)}</p></details>`;
}

function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function disciplineCount(model, discipline) {
  const learned = discipline.paths.flatMap((path) => [...path.steps, ...attachedMasteries(model.graph, path)])
    .filter((id) => model.learned.has(id)).map((id) => model.nodes.get(id));
  if (discipline.paths.some((path) => path.bookId)) {
    const spellCount = new Set(learned.flatMap((node) => node.spellIds ?? [])).size;
    const trainingCount = learned.filter((node) => !node.spellIds?.length).length;
    return `${trainingCount ? `${trainingCount} training steps · ` : ""}${plural(spellCount, "spell")} learned`;
  }
  return `${learned.length} learned`;
}

function sidebar(model) {
  const rows = model.studied.map((discipline) => {
    const source = model.sources[discipline.id]?.label ?? "Study";
    return control("forge-filter", discipline.id, `<span>${escape(discipline.name)}</span><span>${disciplineCount(model, discipline)}</span><small>${escape(source)}</small>`,
      `aria-pressed="${model.filter === discipline.id}"`, "forge-discipline");
  });
  return `<aside class="forge-sidebar" aria-label="Your disciplines">
    <h3>Your disciplines</h3>
    ${control("forge-filter", "all", "All disciplines", `aria-pressed="${model.filter === "all"}"`, "forge-discipline")}
    <div class="forge-studied">${rows.join("")}</div>
    ${control("forge-chooser", "open", "+ Add discipline", 'aria-haspopup="dialog"', "forge-add")}
    <div class="forge-balance"><span>DP remaining</span><strong>${model.dp}${model.budget == null ? "" : ` of ${model.budget}`}</strong></div>
  </aside>`;
}

function spellSection(model, node) {
  if (!node.spellIds?.length) return "";
  const label = model.learned.has(node.id) ? "Spells learned" : "Spells taught";
  return `<section class="forge-spells"><h4>${label}</h4>${node.spellIds.map((id) => spellCard(model.spells.get(id))).join("")}</section>`;
}

function stepSummary(node) {
  if (node.spellIds?.length) return `${node.section ? `Section ${node.section} · ` : ""}${plural(node.spellIds.length, "spell")}`;
  return node.effect ?? "";
}

function stepStatus(model, node) {
  if (model.learned.has(node.id)) return "Learned";
  const gates = [];
  if (node.level > model.level) gates.push(`Level ${node.level}`);
  for (const required of node.requires) {
    if (!model.learned.has(required)) gates.push(`Needs ${model.nodes.get(required).name}`);
  }
  const cost = model.eligibility(node.id).cost;
  if (model.dp < cost) gates.push(`Need ${cost - model.dp} more DP`);
  return gates.join(" · ");
}

function reasonsList(availability) {
  const reasons = (availability.reasons ?? []).map((reason) => typeof reason === "string" ? reason : reason.text).filter(Boolean);
  return reasons.length ? `<ul class="forge-reasons">${reasons.map((reason) => `<li>${escape(reason)}</li>`).join("")}</ul>` : "";
}

function refundable(model, id) {
  return typeof model.canRefund === "function" ? model.canRefund(id) : model.canRefund;
}

function stepDetails(model, node) {
  const learned = model.learned.has(node.id);
  const improves = model.nodes.get(node.improves);
  return `<section class="forge-step-details" id="forge-selection" aria-label="${escape(node.name)} mechanics" tabindex="-1">
    <p class="forge-meta">${escape(node.name)} · ${learned ? "Learned" : `${model.eligibility(node.id).cost ?? "—"} DP`}${node.level ? ` · Level ${node.level}` : ""}</p>
    ${node.effect ? `<p class="forge-step-effect">${escape(node.effect)}</p>` : ""}
    ${improves ? `<p class="forge-improves">Improves ${escape(improves.name)}.</p>` : ""}
    ${learned ? "" : reasonsList(model.eligibility(node.id))}
    ${spellSection(model, node)}
    ${learned && refundable(model, node.id) ? control("forge-refund", node.id, "Undo learning", "", "small") : ""}
  </section>`;
}

function stepRow(model, node, selectedId) {
  const status = nodeStatus(model, node.id);
  const expanded = selectedId === node.id;
  const requirement = stepStatus(model, node);
  return `<li class="forge-step-row is-${status}">
    ${control("forge-step", node.id,
      `<span class="forge-step-name">${escape(node.name)}</span><span class="forge-step-summary">${escape(stepSummary(node))}</span><span class="forge-step-cost">${model.eligibility(node.id).cost ?? "—"} DP</span><span class="forge-step-chevron" aria-hidden="true">${expanded ? "⌄" : "›"}</span>`,
      `aria-label="${escape([node.name, `${model.eligibility(node.id).cost ?? "—"} DP`, requirement].filter(Boolean).join(", "))}" aria-expanded="${expanded}" ${expanded ? 'aria-controls="forge-selection"' : ""}`, "forge-step-toggle")}
    ${status === "available"
      ? `<span class="forge-step-status">Available now</span>`
      : `<span class="forge-step-status">${escape(requirement)}</span>`}
    ${expanded ? stepDetails(model, node) : ""}
  </li>`;
}

function pathCard(model, path) {
  const nodes = path.steps.map((id) => model.nodes.get(id));
  const open = model.openPaths.has(path.id) || (model.selected?.kind === "spell-mastery" && path.steps.includes(model.selected.id));
  const next = nodes.find((node) => !model.learned.has(node.id));
  const availability = next && model.eligibility(next.id);
  if (!model.showAll && !open && !availability?.eligible) return "";
  const learned = nodes.filter((node) => model.learned.has(node.id));
  const book = model.books.get(path.bookId);
  const heading = next ? `${path.name} — ${next.name} — ${availability.cost ?? "—"} DP` : `${path.name} — Complete`;
  return `<section class="forge-path forge-learning-branch${open ? " is-open" : ""}" data-path="${escape(path.id)}">
    <div class="forge-next-heading">
      <h4>${control("forge-path", path.id, `<span>${escape(heading)} <small class="forge-branch-count">${learned.length}/${nodes.length} learned</small></span><span aria-hidden="true">${open ? "⌄" : "›"}</span>`,
        `aria-expanded="${open}" aria-controls="branch-${escape(path.id)}"`, "forge-path-toggle")}</h4>
      ${availability?.eligible ? control("forge-learn", next.id, "Learn now", `aria-label="Learn ${escape(next.name)} for ${availability.cost ?? "—"} DP"`, "primary forge-next-learn") : `<span class="forge-next-status">${next ? escape(stepStatus(model, next)) : `${learned.length} learned`}</span>`}
    </div>
    ${next ? `<div class="forge-next-mechanics">${book ? `<p class="forge-book-name">${escape(book.name)}</p>` : ""}${next.effect ? `<p class="forge-step-effect">${escape(next.effect)}</p>` : ""}${spellSection(model, next)}</div>` : ""}
    <div id="branch-${escape(path.id)}" ${open ? "" : "hidden"}>
      ${open ? `<ol>${nodes.map((node) => stepRow(model, node, model.selection)).join("")}</ol>` : ""}
    </div>
  </section>`;
}

function columnView(model) {
  if (!model.studied.length) return '<p class="forge-empty">Add a discipline to start learning.</p>';
  const disciplines = model.filter === "all" ? model.studied : model.studied.filter(entry => entry.id === model.discipline?.id);
  const groups = disciplines.map(discipline => {
    const paths = discipline.paths.map(path => pathCard(model, path) + attachedMasteries(model.graph, path).map(id => pathCard(model, {id, name: `${path.name} · Advanced spell`, steps: [id]})).join("")).join("");
    if (!paths) return "";
    return `<section class="forge-learning-group" data-discipline="${escape(discipline.id)}"><h3>${disciplineToken(discipline.id)} ${escape(discipline.name)} <small>${disciplineCount(model, discipline)}</small></h3><div class="forge-paths">${paths}</div></section>`;
  }).join("");
  return `<div class="forge-list-toolbar">${control("forge-show-all", "toggle", "Show all branches", `aria-pressed="${model.showAll}"`, "small")}</div>${groups || '<p class="forge-empty">No choices available to purchase now. Show all branches to plan your next steps.</p>'}`;
}

function disciplineChooser(model) {
  if (!model.chooser) return "";
  const choices = model.disciplines.filter(({ id }) => !model.learned.has(id));
  const candidate = choices.find(({ id }) => id === model.candidate) ?? choices[0];
  const root = model.nodes.get(candidate?.id);
  return `<dialog id="forge-discipline-chooser" class="forge-chooser" aria-labelledby="forge-chooser-title">
    <header><h2 id="forge-chooser-title">Add discipline</h2>${control("forge-chooser", "close", "×", 'aria-label="Close add discipline"', "small")}</header>
    <div class="forge-chooser-context"><span>${escape(model.className ?? "Choose a class")}</span><strong>${model.dp} DP available</strong></div>
    <input type="search" id="forge-chooser-search" aria-label="Search disciplines" placeholder="Search disciplines…" autofocus>
    <div class="forge-chooser-body">
      <div class="forge-chooser-list" aria-label="Available disciplines">${choices.map((entry) => control("forge-candidate", entry.id,
        `<span>${escape(entry.name)}</span><small class="forge-chooser-cost">${model.eligibility(entry.id).cost ?? "—"} DP</small>`,
        `aria-pressed="${candidate.id === entry.id}"`, "forge-discipline")).join("")}
        <p class="forge-no-choices" ${choices.length ? "hidden" : ""}>${choices.length ? "No disciplines match." : "All disciplines are studied."}</p>
      </div>
      ${candidate ? `<section class="forge-chooser-preview">
        <h3>${escape(candidate.name)}</h3>
        <p>${escape(candidate.theme)}</p>
        <div class="forge-chooser-paths">${candidate.paths.map(path => `<div class="forge-chooser-path"><strong>${escape(path.name)}</strong><span>${escape(model.nodes.get(path.steps[0])?.name ?? "")}</span></div>`).join("")}</div>
        ${reasonsList(model.eligibility(root.id))}
        ${control("forge-learn", root.id, `Study ${escape(root.name)} for ${model.eligibility(root.id).cost ?? "—"} DP`,
          model.eligibility(root.id).eligible ? "" : "disabled", "primary")}
      </section>` : ""}
    </div>
  </dialog>`;
}

function relatedList(model, nodes, label, showPath = false) {
  if (!nodes.length) return "";
  const rows = nodes.map((node) => {
    const discipline = showPath && model.disciplines.find((entry) => entry.id === node.disciplineId);
    const path = discipline && discipline.paths.find((entry) => entry.id === node.pathId);
    const context = path ? `<span class="forge-endpoint-context">${escape(discipline.name)} · ${escape(path.name)}</span>` : "";
    const title = `<span>${escape(node.name)}${context}</span>`;
    const status = `<small>${model.learned.has(node.id) ? "Learned" : "View path"}</small>`;
    return `<li>${nodeButton(model, node, title + status, { className: "forge-related-node" })}</li>`;
  }).join("");
  return `<section class="forge-related"><h4>${label}</h4><ul>${rows}</ul></section>`;
}

function inspector(model) {
  const node = model.selected;
  if (!node)
    return '<div class="forge-inspector"><p>Select a discipline, a technique, or a spell to see what it teaches.</p></div>';
  const availability = model.eligibility(node.id);
  const learned = model.learned.has(node.id);
  const discipline = model.disciplines.find((entry) => entry.id === (node.disciplineId ?? node.id));
  const path = discipline?.paths.find((entry) => entry.id === node.pathId);
  const parentNodes = node.requires.map((id) => model.nodes.get(id));
  const children = model.graph.nodes.filter((entry) => entry.requires.includes(node.id));
  const next = children;
  const canRefund = refundable(model, node.id);
  const currency = learned ? "Learned" : `${model.eligibility(node.id).cost ?? "—"} DP`;
  const context = [discipline?.name, path?.name].filter((value) => value && value !== node.name).join(" · ");
  const description = node.effect ?? (node.kind === "discipline" ? "Choose any of its four paths and learn the steps in order." : "");
  return `<section class="forge-inspector" id="forge-selection" aria-label="Selected learning" tabindex="-1">
    ${context ? `<p class="forge-context">${escape(context)}${node.section ? ` · Section ${escape(node.section)}` : ""}</p>` : ""}
    <h3>${escape(node.name)}</h3>
    <p class="forge-meta">${currency}${node.level ? ` · Level ${node.level}` : ""}</p>
    ${description ? `<p class="forge-effect">${escape(description)}</p>` : ""}
    ${!learned ? reasonsList(availability) : ""}
    <div class="forge-inspector-actions">
      ${!learned ? control("forge-learn", node.id, node.kind === "discipline" ? "Begin studying" : "Learn", availability.eligible ? "" : "disabled", "primary") : ""}
      ${learned && canRefund ? control("forge-refund", node.id, "Undo learning") : ""}
      ${discipline && model.atlasScope !== "discipline" && model.view === "atlas" ? control("forge-filter", discipline.id, "View discipline", "", "small") : ""}
    </div>
    ${relatedList(model, parentNodes, "Earlier learning")}
    ${relatedList(model, next, node.kind === "discipline" ? "First steps" : "Next step")}
    ${spellSection(model, node)}
  </section>`;
}

/** Render learning controls inside the Workshop's delegated button dispatcher. */
export function renderForge(graph, state, options = {}) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const learned = new Set(state.learned ?? []);
  const view = options.view === "atlas" ? "atlas" : "columns";
  const studied = graph.disciplines.filter(({ id }) => learned.has(id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected = nodes.get(options.selected);
  const atlasDiscipline = graph.disciplines.find(({ id }) => id === options.discipline);
  const requested = studied.find(({ id }) => id === options.discipline);
  const discipline = requested ?? studied.find(({ id }) => id === selected?.disciplineId) ?? studied[0];
  const model = {
    graph, nodes, learned, view, selected, studied, discipline, atlasDiscipline,
    selection: options.selected,
    path: options.path,
    filter: options.discipline ?? "all",
    openPaths: new Set(options.openPaths ?? (options.path ? [options.path] : [])),
    showAll: options.showAll ?? false,
    chooser: options.chooser,
    candidate: options.candidate,
    sources: options.sources ?? {},
    className: graph.classes?.find(entry => entry.id === state.classId)?.name,
    atlasScope: options.atlasScope ?? (atlasDiscipline ? "discipline" : "all"),
    dp: state.dp,
    level: state.level,
    budget: options.budget,
    zoom: Math.min(20, Math.max(0.4, Number(options.zoom) || 1)),
    canRefund: options.canRefund ?? options.refundable,
    disciplines: graph.disciplines,
    books: new Map(graph.books.map((book) => [book.id, book])),
    spells: new Map(graph.spells.map((spell) => [spell.id, spell])),
    eligibility: options.eligibility ?? ((id) => forgeEligibility(graph, state, id)),
  };

  const atlas = view === "atlas";
  const listModel = atlas ? {...model, view: "columns", filter: options.listDiscipline ?? "all", discipline: studied.find(entry => entry.id === options.listDiscipline) ?? discipline, selected: undefined, selection: undefined} : model;
  const atlasDialog = atlas ? `<dialog id="forge-atlas-dialog" class="forge-atlas-dialog" aria-labelledby="forge-atlas-title">
    <header><h2 id="forge-atlas-title">Discipline atlas</h2><strong>${state.dp} DP available</strong>${control("forge-view", "columns", "Close", 'aria-label="Close atlas"', "small")}</header>
    <div class="forge-map-toolbar">
      ${control("forge-filter", "all", "Whole atlas", "", "small")}
      ${control("forge-view", "zoom-out", "−", 'aria-label="Zoom out"', "small")}
      ${control("forge-view", "zoom-in", "+", 'aria-label="Zoom in"', "small")}
      ${control("forge-view", "fit", "Fit", 'aria-label="Fit atlas"', "small")}
      <span class="forge-map-legend"><span class="forge-key forge-key-learned">✓ Learned</span><span class="forge-key forge-key-available">Available</span><span class="forge-key forge-key-later">Requirements to meet</span><span class="forge-shape-key">○ Level 1 · △ Level 3 · ◇ Level 7</span></span>
    </div>
    <div class="forge-atlas-body">${mapView(model, visibleDisciplines(model))}<aside class="forge-atlas-inspector">${inspector(model)}</aside></div>
  </dialog>` : "";
  return `<div class="workshop-forge">
    ${sidebar(listModel)}
    <div class="forge-workspace">
      <div class="forge-controls"><h3>Learn</h3><div class="forge-view-buttons" aria-label="Learning views">
        ${control("forge-view", "columns", "List", 'aria-pressed="true"', "small")}
        ${control("forge-view", "atlas", "Atlas", 'aria-haspopup="dialog"', "small")}
      </div></div>
      <div class="forge-surface">${columnView(listModel)}</div>
      ${!atlas && selected?.kind === "talent" ? inspector(model) : ""}
      <div class="forge-more"><details class="forge-other-learning" ${!atlas && selected?.kind === "talent" ? "open" : ""}>
        <summary>Talents</summary>
        ${relatedList(model, graph.nodes.filter((node) => node.kind === "talent"), "Talents")}
      </details></div>
    </div>
    ${disciplineChooser(model)}${atlasDialog}
  </div>`;
}

/** Bind pointer and search interactions to the stable Workshop app container. */
export function bindForgeInteractions(container, { onZoom = () => {} } = {}) {
  let drag;
  let suppressClick = false;
  let query = "";
  let candidateScroll = 0;
  let previousDialog;
  let previousAtlas;

  function filterCandidates(dialog) {
    const search = query.trim().toLocaleLowerCase();
    const buttons = [...dialog.querySelectorAll('[data-action="forge-candidate"]')];
    if (!buttons.length) return;
    for (const button of buttons)
      button.hidden = !button.textContent.toLocaleLowerCase().includes(search);
    dialog.querySelector(".forge-no-choices").hidden = buttons.some((button) => !button.hidden);
  }

  container.addEventListener("input", (event) => {
    if (event.target.id !== "forge-chooser-search") return;
    query = event.target.value;
    filterCandidates(event.target.closest("dialog"));
  });

  container.addEventListener("wheel", (event) => {
    const viewport = event.target.closest(".forge-map-scroll");
    if (!viewport) return;
    event.preventDefault();
    const map = viewport.querySelector(".forge-map");
    const current = Number(viewport.dataset.zoom);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
    const next = Math.min(20, Math.max(0.4, current * Math.exp(-delta * 0.0015)));
    if (current === next) return;
    const before = map.getBoundingClientRect();
    const anchorX = (event.clientX - before.left) / before.width;
    const anchorY = (event.clientY - before.top) / before.height;
    map.style.setProperty("--map-zoom", next);
    viewport.dataset.zoom = next;
    viewport.classList.toggle("show-node-labels", next >= 4);
    const after = map.getBoundingClientRect();
    viewport.scrollLeft += after.left + after.width * anchorX - event.clientX;
    viewport.scrollTop += after.top + after.height * anchorY - event.clientY;
    onZoom(next);
  }, { passive: false });

  container.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick = false;
    const viewport = event.target.closest(".forge-map-scroll");
    if (!viewport || event.pointerType === "touch") return;
    drag = {
      viewport, id: event.pointerId,
      x: event.clientX, y: event.clientY,
      left: viewport.scrollLeft, top: viewport.scrollTop,
      moved: false,
    };
  });

  container.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(x, y) < 5) return;
      if (drag.viewport.scrollWidth <= drag.viewport.clientWidth &&
          drag.viewport.scrollHeight <= drag.viewport.clientHeight) return;
      drag.moved = true;
      drag.viewport.setPointerCapture(event.pointerId);
      drag.viewport.classList.add("is-panning");
    }
    drag.viewport.scrollLeft = drag.left - x;
    drag.viewport.scrollTop = drag.top - y;
  });

  function finishPan(event) {
    if (drag?.id !== event.pointerId) return;
    suppressClick = drag.moved && event.type === "pointerup";
    drag.viewport.classList.remove("is-panning");
    drag = undefined;
  }

  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    container.ownerDocument.addEventListener(type, finishPan);

  container.addEventListener("click", (event) => {
    if (suppressClick && event.target.closest(".forge-map-scroll") && event.detail) {
      suppressClick = false;
      event.stopPropagation();
      event.preventDefault();
    }
    if (event.target.closest('[data-action="forge-candidate"]'))
      candidateScroll = event.target.closest(".forge-chooser-list").scrollTop;
  }, { capture: true });

  return function syncForge() {
    const atlas = container.querySelector("#forge-atlas-dialog");
    if (atlas && atlas !== previousAtlas) {
      atlas.showModal();
      atlas.addEventListener("cancel", event => {
        event.preventDefault();
        atlas.querySelector('[aria-label="Close atlas"]').click();
      });
    } else if (!atlas && previousAtlas) {
      container.querySelector('[data-action="forge-view"][data-id="atlas"]')?.focus({preventScroll:true});
    }
    previousAtlas = atlas;
    const dialog = container.querySelector("#forge-discipline-chooser");
    if (!dialog) {
      if (previousDialog)
        container.querySelector('[data-action="forge-chooser"][data-id="open"]')?.focus({ preventScroll: true });
      previousDialog = undefined;
      query = "";
      candidateScroll = 0;
      return;
    }
    if (dialog === previousDialog) return;
    const active = container.ownerDocument.activeElement;
    const keepFocus = dialog.contains(active);
    previousDialog = dialog;
    const search = dialog.querySelector("#forge-chooser-search");
    search.value = query;
    filterCandidates(dialog);
    dialog.showModal();
    dialog.querySelector(".forge-chooser-list").scrollTop = candidateScroll;
    if (keepFocus) active.focus({ preventScroll: true });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      dialog.querySelector('[data-id="close"]').click();
    });
  };
}
