export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function ruleInline(text, resolve) {
  return esc(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, path) => {
      const id = resolve?.(path);
      return id
        ? `<button type="button" class="rule-link" data-rule="${esc(id)}">${label}</button>`
        : label;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
export function ruleMarkup(markdown, resolve) {
  return String(markdown ?? "")
    .split(/\n\s*\n/)
    .map((block) => {
      const heading = block.match(/^(#{1,6}) (.*)$/);
      if (heading)
        return `<h${Math.min(4, heading[1].length + 1)}>${ruleInline(heading[2], resolve)}</h${Math.min(4, heading[1].length + 1)}>`;
      if (block.startsWith("|"))
        return `<div class="rule-table"><table>${block
          .split("\n")
          .filter((r) => !/^\|[- :|]+$/.test(r))
          .map(
            (r, i) =>
              `<tr>${r
                .split("|")
                .slice(1, -1)
                .map(
                  (c) =>
                    `<${i ? "td" : "th"}>${ruleInline(c.trim(), resolve)}</${i ? "td" : "th"}>`,
                )
                .join("")}</tr>`,
          )
          .join("")}</table></div>`;
      if (block.split("\n").every((l) => l.startsWith("- ")))
        return `<ul>${block
          .split("\n")
          .map((l) => `<li>${ruleInline(l.slice(2), resolve)}</li>`)
          .join("")}</ul>`;
      return `<p>${ruleInline(block, resolve).replace(/\n/g, " ")}</p>`;
    })
    .join("");
}
/** A rule block can contain prose, outcomes and options together. */
export function ruleBlockMarkup(block, { outcomeLayout = "table" } = {}) {
  return (typeof block.text === "string" ? ruleMarkup(block.text) : "") +
    (Array.isArray(block.outcomes) ? outcomeLayout === "stacked"
      ? block.outcomes.map(outcome => `<div class="outcome"><strong>${esc(outcome.label)}</strong>${ruleInline(outcome.text)}</div>`).join("")
      : `<table class="outcome-table">${block.outcomes.map(outcome => `<tr><th>${esc(outcome.label)}</th><td>${ruleInline(outcome.text)}</td></tr>`).join("")}</table>` : "") +
    (Array.isArray(block.items) ? `<ul>${block.items.map(item => `<li>${ruleInline(item)}</li>`).join("")}</ul>` : "");
}
export function recordMarkup(record, resolve) {
  if (record.markdown) return ruleMarkup(record.markdown, resolve);
  const ref = record.reference;
  return `<h2>${esc(record.name)}</h2>${ref?.flavor?.map((t) => `<p class="flavor">${ruleInline(t)}</p>`).join("") ?? ""}<dl>${ref?.rules?.details?.map((d) => `<dt>${esc(d.label)}</dt><dd>${ruleInline(d.value)}</dd>`).join("") ?? ""}</dl>${ref?.rules?.body?.map(ruleBlockMarkup).join("") ?? ""}${ref?.rules?.notes?.map((n) => `<p>${ruleInline(typeof n === "string" ? n : n.text)}</p>`).join("") ?? ""}`;
}
