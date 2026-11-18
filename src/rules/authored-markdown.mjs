const HTML_ESCAPES = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
});

const SOURCE_LINK_PATH =
  /^\/bruceamoser\/heroes-of-legend\/blob\/[a-f0-9]{40}\//;
const TABLE_DELIMITER_CELL = /^:?-{3,}:?$/;
const AUTHORED_HEADING = /^(#{1,6})[ \t]+(.+?)[ \t]*$/;
const BACKSLASH_ESCAPABLE = new Set("\\*[]()`|".split(""));

// Escape source text before generating the small authored subset TextEditor can enrich.
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) => HTML_ESCAPES[character],
  );
}

function safeSourceLink(target) {
  let url;
  try {
    url = new URL(target);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    !SOURCE_LINK_PATH.test(url.pathname)
  )
    return null;
  return url.href;
}

function escapedAt(text, index) {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor--)
    slashes++;
  return slashes % 2 === 1;
}

function closingMarker(text, marker, start) {
  for (
    let index = text.indexOf(marker, start);
    index >= 0;
    index = text.indexOf(marker, index + marker.length)
  ) {
    if (!escapedAt(text, index)) return index;
  }
  return -1;
}

function authoredLink(text, start) {
  const labelEnd = text.indexOf("]", start + 1);
  if (
    labelEnd < 0 ||
    text[labelEnd + 1] !== "(" ||
    text.slice(start + 1, labelEnd).includes("\n")
  )
    return null;
  const targetEnd = text.indexOf(")", labelEnd + 2);
  if (targetEnd < 0) return null;
  const target = text.slice(labelEnd + 2, targetEnd);
  if (!target || /\s/.test(target)) return null;
  return {
    end: targetEnd + 1,
    label: text.slice(start + 1, labelEnd),
    target,
  };
}

function renderInline(text, { allowLinks = true } = {}) {
  let html = "";
  for (let index = 0; index < text.length; ) {
    const character = text[index];
    const next = text[index + 1];
    if (character === "\\" && BACKSLASH_ESCAPABLE.has(next)) {
      html += escapeHtml(next);
      index += 2;
      continue;
    }
    if (character === "`") {
      const end = closingMarker(text, "`", index + 1);
      if (end > index + 1) {
        html += `<code>${escapeHtml(text.slice(index + 1, end))}</code>`;
        index = end + 1;
        continue;
      }
    }
    if (character === "*" && next === "*") {
      const end = closingMarker(text, "**", index + 2);
      if (end > index + 2) {
        html += `<strong>${renderInline(
          text.slice(index + 2, end),
          { allowLinks: false },
        )}</strong>`;
        index = end + 2;
        continue;
      }
    }
    if (character === "*") {
      const end = closingMarker(text, "*", index + 1);
      if (end > index + 1) {
        html += `<em>${renderInline(text.slice(index + 1, end), {
          allowLinks: false,
        })}</em>`;
        index = end + 1;
        continue;
      }
    }
    if (character === "[" && allowLinks) {
      const link = authoredLink(text, index);
      if (link) {
        const target = safeSourceLink(link.target);
        if (target)
          html += `<a href="${escapeHtml(target)}" target="_blank" rel="noopener noreferrer">${renderInline(
            link.label,
            { allowLinks: false },
          )}</a>`;
        else if (/^(?:\.\.\/|\.\/)*[a-z0-9/_-]+\.md(?:#[a-z0-9_-]+)?$/i.test(link.target))
          html += renderInline(link.label, { allowLinks: false });
        else html += escapeHtml(text.slice(index, link.end));
        index = link.end;
        continue;
      }
    }
    html += escapeHtml(character);
    index++;
  }
  return html;
}

function tableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const cells = [];
  let cell = "";
  for (let index = 1; index < trimmed.length - 1; index++) {
    const character = trimmed[index];
    if (
      character === "|" &&
      (!cell.endsWith("\\") || cell.endsWith("\\\\"))
    ) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function tableAt(lines, index) {
  const header = tableCells(lines[index]);
  const delimiter = tableCells(lines[index + 1] ?? "");
  if (
    !header ||
    !delimiter ||
    header.length !== delimiter.length ||
    !delimiter.every((cell) => TABLE_DELIMITER_CELL.test(cell))
  )
    return null;
  const rows = [];
  let cursor = index + 2;
  while (cursor < lines.length) {
    const row = tableCells(lines[cursor]);
    if (!row) break;
    rows.push(row);
    cursor++;
  }
  return { cursor, header, rows };
}

function renderTable({ header, rows }) {
  const head = header
    .map(
      (cell) =>
        `<th scope="col">${renderInline(cell, { allowLinks: false })}</th>`,
    )
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${renderInline(cell)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead>${
    body ? `<tbody>${body}</tbody>` : ""
  }</table>`;
}

export function renderMarkdown(markdown) {
  if (typeof markdown !== "string" || !markdown.trim()) return "";
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  for (let index = 0; index < lines.length; ) {
    const line = lines[index].trim();
    if (!line) {
      flushParagraph();
      index++;
      continue;
    }
    const heading = AUTHORED_HEADING.exec(line);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index++;
      continue;
    }
    const bullet = /^[-*][ \t]+(.+)$/;
    if (bullet.test(line)) {
      flushParagraph();
      const items = [];
      while (index < lines.length) {
        const item = bullet.exec(lines[index].trim());
        if (!item) break;
        items.push(`<li>${renderInline(item[1])}</li>`);
        index++;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    const table = tableAt(lines, index);
    if (table) {
      flushParagraph();
      html.push(renderTable(table));
      index = table.cursor;
      continue;
    }
    paragraph.push(line);
    index++;
  }
  flushParagraph();
  return html.join("");
}

/** Format older generated Item paragraphs at display time without rewriting the Item. */
export function formatStoredRuleProse(description) {
  if (!description || !/(?:\*|\]\(|>\s*-\s)/.test(description)) return description;
  const parsed = new DOMParser().parseFromString(description, "text/html");
  for (const paragraph of parsed.body.querySelectorAll("p")) {
    if (paragraph.querySelector(":scope > :not(br,strong,b,em,i)")) continue;
    const text = [...paragraph.childNodes].map(node => {
      if (node.nodeName === "BR") return "\n";
      if (node.nodeName === "STRONG" || node.nodeName === "B") return `**${node.textContent}**`;
      if (node.nodeName === "EM" || node.nodeName === "I") return `*${node.textContent}*`;
      return node.textContent;
    }).join("");
    const raw = paragraph.textContent;
    if (!/\*[^*]+\*|\[[^\]]+\]\([^)]+\)/.test(raw) && !/^\s*[-*]\s+/m.test(text)) continue;
    paragraph.outerHTML = renderMarkdown(text);
  }
  return parsed.body.innerHTML;
}
