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
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function atlasLayout(graph) {
  if (atlasCache.has(graph)) return atlasCache.get(graph);
  const positions = new Map();
  const edges = [];
  const center = { x: 0, y: 0 };
  const outerCount = 12;
  const innerCount = 6;
  const ringRadius = [595, 307];

  graph.disciplines.forEach((discipline, index) => {
    let origin = center;
    if (index < outerCount)
      origin = point(center, -Math.PI / 2 + index * TAU / outerCount, ringRadius[0]);
    else if (index < outerCount + innerCount)
      origin = point(center, -Math.PI / 2 + (index - outerCount + 0.5) * TAU / innerCount, ringRadius[1]);
    positions.set(discipline.id, origin);
    discipline.paths.forEach((path, index) => {
      const direction = -Math.PI / 2 + index * TAU / discipline.paths.length;
      const radius = 31;
      const lobe = point(origin, direction, 52);
      path.steps.forEach((id, step) => {
        const angle = direction + Math.PI + step * 1.7 * Math.PI / (path.steps.length - 1);
        const target = point(lobe, angle, radius);
        const predecessor = path.steps[step - 1] ?? discipline.id;
        const previous = positions.get(predecessor);
        positions.set(id, target);
        edges.push({
          from: predecessor,
          to: id,
          draw: step
            ? `M ${previous.x} ${previous.y} A ${radius} ${radius} 0 0 1 ${target.x} ${target.y}`
            : `M ${previous.x} ${previous.y} L ${target.x} ${target.y}`,
        });
      });
    });
  });

  const clusters = graph.disciplines.map((discipline) => positions.get(discipline.id));
  const placed = [];
  for (const node of graph.nodes.filter((node) => node.kind === "combined")) {
    const contacts = node.requires.map((id) => positions.get(id));
    const midpoint = {
      x: contacts.reduce((sum, p) => sum + p.x, 0) / contacts.length,
      y: contacts.reduce((sum, p) => sum + p.y, 0) / contacts.length,
    };
    // Place the marker near its actual endpoints without obscuring a branch.
    let position;
    for (let radius = 0; !position && radius <= 1_440; radius += 21) {
      const candidates = Math.max(1, Math.ceil(TAU * radius / 25));
      for (let index = 0; index < candidates; index++) {
        const candidate = point(midpoint, index * TAU / candidates, radius);
        if (
          clusters.every((p) =>
            distance(p, candidate) > 95 &&
            (Math.abs(candidate.x - p.x) > 75 || Math.abs(candidate.y - p.y + 91) > 25),
          ) &&
          placed.every((p) => distance(p, candidate) > 45)
        ) {
          position = candidate;
          break;
        }
      }
    }
    position ??= midpoint;
    positions.set(node.id, position);
    placed.push(position);
  }
  const result = { positions, edges };
  atlasCache.set(graph, result);
  return result;
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
  const label = `${node.name}, ${status === "later" ? "requirements to meet" : status}`;
  return control(
    "forge-select",
    node.id,
    content,
    `aria-label="${escape(label)}" aria-pressed="${selected}" title="${escape(label)}"${style ? ` style="${style}"` : ""}${tabIndex === undefined ? "" : ` tabindex="${tabIndex}"`}`,
    `forge-node is-${status} ${className}`,
  );
}

function visibleDisciplines(model) {
  if (model.atlasDiscipline && model.atlasScope === "discipline") {
    const ids = new Set([model.atlasDiscipline.id]);
    if (model.selected?.kind === "combined")
      for (const id of model.selected.requires) ids.add(model.nodes.get(id)?.disciplineId);
    return model.disciplines.filter((entry) => ids.has(entry.id));
  }
  return model.disciplines;
}

function connectedCombinations(model, visible) {
  const disciplineIds = new Set(visible.map((entry) => entry.id));
  return model.combinations.filter((entry) =>
    entry.requires.some((id) => disciplineIds.has(model.nodes.get(id)?.disciplineId)),
  );
}

function mapView(model, visible) {
  if (!visible.length) return `<p class="forge-empty">Begin studying a discipline to see it here. ${control("forge-view", "atlas", "Show whole atlas", "", "small")}</p>`;

  const { positions, edges } = atlasLayout(model.graph);
  const paths = visible.flatMap((entry) => entry.paths);
  const combinations = connectedCombinations(model, visible);
  const overview = visible.length > 4;
  const mapCombinations = overview
    ? combinations
    : combinations.filter((node) => node.id === model.selected?.id);
  const focus = [
    ...visible.map((entry) => ({ id: entry.id, pad: 105 })),
    ...mapCombinations.map((entry) => ({ id: entry.id, pad: 25 })),
  ];
  const minX = Math.min(...focus.map(({ id, pad }) => positions.get(id).x - pad));
  const minY = Math.min(...focus.map(({ id, pad }) => positions.get(id).y - pad - 12));
  const width = Math.max(...focus.map(({ id, pad }) => positions.get(id).x + pad)) - minX;
  const height = Math.max(...focus.map(({ id, pad }) => positions.get(id).y + pad)) - minY;
  const toStyle = (p) => `--node-x:${100 * (p.x - minX) / width}%;--node-y:${100 * (p.y - minY) / height}%`;
  const visibleIds = new Set(paths.flatMap((entry) => entry.steps));
  const selection = model.selected;
  const relevantEdges = edges.filter(({ to }) => visibleIds.has(to));
  const branchPaths = relevantEdges.map(({ from, to, draw }) =>
    `<path class="forge-branch ${model.learned.has(to) ? "is-learned" : ""} ${selection?.id === to || selection?.id === from ? "is-highlighted" : ""}" data-from="${escape(from)}" data-to="${escape(to)}" d="${draw}"/>`,
  ).join("");
  const crossPaths = mapCombinations.filter((entry) =>
    entry.id === selection?.id || entry.requires.includes(selection?.id),
  ).flatMap((entry) => entry.requires.filter((id) => visibleIds.has(id)).map((id) => {
    const source = positions.get(id);
    const destination = positions.get(entry.id);
    const path = `M ${source.x} ${source.y} Q ${source.x} ${destination.y} ${destination.x} ${destination.y}`;
    return `<path class="forge-cross ${model.learned.has(id) ? "is-learned" : ""}" data-from="${escape(id)}" data-to="${escape(entry.id)}" d="${path}"/>`;
  })).join("");
  const roots = visible.map((entry) => {
    const p = positions.get(entry.id);
    return nodeButton(
      model,
      model.nodes.get(entry.id),
      disciplineToken(entry.id),
      { className: "forge-map-root", style: toStyle(p) },
    ) + `<span class="forge-map-name" style="${toStyle({ x: p.x, y: p.y - 91 })}" aria-hidden="true">${escape(entry.name)}</span>`;
  }).join("");
  const steps = paths.flatMap((path) => path.steps.map((id, index) => {
    const node = model.nodes.get(id);
    const end = index === path.steps.length - 1;
    return nodeButton(model, node, "", {
      className: `forge-map-step${end ? " forge-map-end" : ""}`,
      style: toStyle(positions.get(id)),
      tabIndex: undefined,
    });
  })).join("");
  const crossNodes = mapCombinations.map((node) =>
    nodeButton(model, node, String(node.requires.length), {
      className: "forge-map-combination",
      style: toStyle(positions.get(node.id)),
      tabIndex: undefined,
    }),
  ).join("");
  const mapRatio = width / height;
  return `<div class="forge-map-scroll" data-zoom="${model.zoom}" tabindex="0" aria-label="Discipline map"><div class="forge-map ${visible.length === 1 ? "forge-map-focus" : "forge-map-overview"}" style="--map-ratio:${mapRatio};--map-zoom:${model.zoom}"><svg viewBox="${minX} ${minY} ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${branchPaths}${crossPaths}</svg>${roots}${steps}${crossNodes}</div></div>`;
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
  const learned = discipline.paths.flatMap((path) => path.steps)
    .filter((id) => model.learned.has(id)).map((id) => model.nodes.get(id));
  if (discipline.paths.some((path) => path.bookId))
    return `${plural(new Set(learned.flatMap((node) => node.spellIds ?? [])).size, "spell")} learned`;
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
  if (node.spellIds?.length) return `Section ${node.section} · ${plural(node.spellIds.length, "spell")}`;
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
  const open = model.openPaths.has(path.id);
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
    const paths = discipline.paths.map(path => pathCard(model, path)).join("");
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
    return '<div class="forge-inspector"><p>Select a discipline, a step, or a combined ability to see what it teaches.</p></div>';
  const availability = model.eligibility(node.id);
  const learned = model.learned.has(node.id);
  const discipline = model.disciplines.find((entry) => entry.id === (node.disciplineId ?? node.id));
  const path = discipline?.paths.find((entry) => entry.id === node.pathId);
  const parentNodes = node.requires.map((id) => model.nodes.get(id));
  const children = model.graph.nodes.filter((entry) => entry.requires.includes(node.id));
  const next = children.filter((entry) => entry.kind !== "combined");
  const combined = children.filter((entry) => entry.kind === "combined");
  const canRefund = refundable(model, node.id);
  const currency = learned ? "Learned" : `${model.eligibility(node.id).cost ?? "—"} DP`;
  const context = [discipline?.name, path?.name].filter((value) => value && value !== node.name).join(" · ");
  const description = node.effect ?? (node.kind === "discipline" ? "Choose any of its four paths and learn the steps in order." : "");
  return `<section class="forge-inspector" id="forge-selection" aria-label="Selected learning" tabindex="-1">
    ${context ? `<p class="forge-context">${escape(context)}${node.section ? ` · Section ${escape(node.section)}` : ""}</p>` : ""}
    <h3>${escape(node.name)}</h3>
    <p class="forge-meta">${currency}${node.level ? ` · Level ${node.level}` : ""}${node.kind === "combined" ? ` · ${node.requires.length} disciplines` : ""}</p>
    ${description ? `<p class="forge-effect">${escape(description)}</p>` : ""}
    ${!learned ? reasonsList(availability) : ""}
    <div class="forge-inspector-actions">
      ${!learned ? control("forge-learn", node.id, node.kind === "discipline" ? "Begin studying" : "Learn", availability.eligible ? "" : "disabled", "primary") : ""}
      ${learned && canRefund ? control("forge-refund", node.id, "Undo learning") : ""}
      ${discipline && model.atlasScope !== "discipline" && model.view === "atlas" ? control("forge-filter", discipline.id, "View discipline", "", "small") : ""}
    </div>
    ${relatedList(model, parentNodes, node.kind === "combined" ? "Required endpoints" : "Earlier step", node.kind === "combined")}
    ${relatedList(model, next, node.kind === "discipline" ? "First steps" : "Next step")}
    ${relatedList(model, combined, "Combined abilities")}
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
    zoom: Math.min(6, Math.max(0.4, Number(options.zoom) || 1)),
    canRefund: options.canRefund ?? options.refundable,
    disciplines: graph.disciplines,
    combinations: graph.nodes.filter((node) => node.kind === "combined"),
    books: new Map(graph.books.map((book) => [book.id, book])),
    spells: new Map(graph.spells.map((spell) => [spell.id, spell])),
    eligibility: options.eligibility ?? ((id) => forgeEligibility(graph, state, id)),
  };

  const visible = visibleDisciplines(model);
  const columns = view === "columns";
  const source = model.sources[(columns ? discipline : atlasDiscipline)?.id];
  const context = columns ? "Learn" : model.atlasScope === "discipline" ? atlasDiscipline?.name : "Discipline atlas";
  const combinations = connectedCombinations(model, columns ? model.studied : visible);
  const showInspector = !columns || ["combined", "talent"].includes(selected?.kind);
  const viewed = (id) => `aria-pressed="${view === id}"`;
  return `<div class="workshop-forge">
    ${sidebar(model)}
    <div class="forge-workspace">
      <div class="forge-controls">
        <h3>${escape(context)}</h3>
        ${source && !columns && model.atlasScope === "discipline" ? `<span class="forge-source">${escape(source.detail ? `From your ${source.label.toLowerCase()} · ${source.detail}` : source.label)}</span>` : ""}
        <div class="forge-view-buttons" aria-label="Learning views">
          ${control("forge-view", "columns", "List", viewed("columns"), "small")}
          ${control("forge-view", "atlas", "Atlas", viewed("atlas"), "small")}
        </div>
      </div>
      <div class="forge-surface">
        ${columns ? columnView(model) : `<div class="forge-map-toolbar">
          ${model.atlasScope === "discipline" ? control("forge-filter", "all", "Whole atlas", "", "small") : ""}
          ${control("forge-view", "zoom-out", "−", 'aria-label="Zoom out"', "small")}
          ${control("forge-view", "zoom-in", "+", 'aria-label="Zoom in"', "small")}
          ${control("forge-view", "fit", "Fit", 'aria-label="Fit atlas"', "small")}
          <span class="forge-map-legend"><span class="forge-key forge-key-learned">Learned</span><span class="forge-key forge-key-available">Available</span><span class="forge-key">Requirements to meet</span></span>
        </div>${mapView(model, visible)}`}
      </div>
      ${showInspector ? inspector(model) : ""}
      <div class="forge-more">
        <details class="forge-other-learning" ${["combined", "talent"].includes(selected?.kind) ? "open" : ""}>
          <summary>Combined abilities and talents</summary>
          ${relatedList(model, combinations, "Combined abilities")}
          ${relatedList(model, graph.nodes.filter((node) => node.kind === "talent"), "Talents")}
        </details>
      </div>
    </div>
    ${disciplineChooser(model)}
  </div>`;
}

/** Bind pointer and search interactions to the stable Workshop app container. */
export function bindForgeInteractions(container, { onZoom = () => {} } = {}) {
  let drag;
  let suppressClick = false;
  let query = "";
  let candidateScroll = 0;
  let previousDialog;

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
    const next = Math.min(6, Math.max(0.4, current * Math.exp(-delta * 0.0015)));
    if (current === next) return;
    const before = map.getBoundingClientRect();
    const anchorX = (event.clientX - before.left) / before.width;
    const anchorY = (event.clientY - before.top) / before.height;
    map.style.setProperty("--map-zoom", next);
    viewport.dataset.zoom = next;
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
