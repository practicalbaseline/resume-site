import { HUB_ID, getNode, leavesForTrunk } from "./data/graph";
import type { GraphNode, TrunkId } from "./data/types";
import { TRUNK_LABELS, TRUNK_NAV_LABELS, TRUNK_ORDER } from "./data/types";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bodyParagraphs(text: string, asQuote: boolean): string {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (!buf.length) return;
    blocks.push(`<p>${escapeHtml(buf.join(" "))}</p>`);
    buf = [];
  };

  for (const line of lines) {
    if (line.trim() === "") flush();
    else buf.push(line.trim());
  }
  flush();

  const cls = asQuote ? "entry-body quote-body" : "entry-body";
  return `<div class="${cls}">${blocks.join("")}</div>`;
}

function statusBadge(status?: GraphNode["status"]): string {
  if (!status) return "";
  return `<span class="badge badge-${status}">${escapeHtml(status)}</span>`;
}

function tagsHtml(tags?: string[]): string {
  if (!tags?.length) return "";
  return `<div class="tags">${tags
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("")}</div>`;
}

function entryHtml(n: GraphNode): string {
  const asQuote = n.kind === "quote";

  const meta = [
    n.source ? `<span class="entry-source">${escapeHtml(n.source)}</span>` : "",
    statusBadge(n.status),
  ]
    .filter(Boolean)
    .join("");

  const body = n.body ? bodyParagraphs(n.body, asQuote) : "";

  return `
    <details class="entry" id="${escapeHtml(n.id)}">
      <summary>
        <div class="entry-title-row">
          <span class="entry-title">${escapeHtml(n.title)}</span>
        </div>
        <div class="entry-meta">${meta}</div>
        ${
          n.summary
            ? `<p class="entry-summary">${escapeHtml(n.summary)}</p>`
            : ""
        }
      </summary>
      ${body}
      ${
        n.href
          ? `<div class="entry-actions"><a class="entry-link" href="${escapeHtml(n.href)}" target="_blank" rel="noopener noreferrer">Open ↗</a></div>`
          : ""
      }
      ${tagsHtml(n.tags)}
    </details>
  `;
}

function sectionHtml(trunk: TrunkId): string {
  const leaves = leavesForTrunk(trunk);
  const trunkNode = getNode(`trunk-${trunk}`);
  const count =
    leaves.length === 0 ? "—" : String(leaves.length).padStart(2, "0");

  const body =
    leaves.length === 0
      ? trunkNode?.summary
        ? "" // lead line already states status (e.g. Coming Soon)
        : `<p class="empty">Nothing published here yet.</p>`
      : `<div class="entries">${leaves.map(entryHtml).join("")}</div>`;

  return `
    <section class="trunk" id="section-${trunk}" aria-labelledby="heading-${trunk}">
      <div class="trunk-head">
        <h2 id="heading-${trunk}">${TRUNK_LABELS[trunk]}</h2>
        <span class="trunk-count" aria-hidden="true">${count}</span>
      </div>
      ${
        trunkNode?.summary
          ? `<p class="trunk-lead">${escapeHtml(trunkNode.summary)}</p>`
          : ""
      }
      ${body}
    </section>
  `;
}

function render(): void {
  const root = document.querySelector("#app");
  if (!root) throw new Error("#app missing");

  const hub = getNode(HUB_ID);
  if (!hub) throw new Error("hub missing");

  const nav = TRUNK_ORDER.map(
    (t) =>
      `<a href="#section-${t}">${TRUNK_NAV_LABELS[t]}</a>`,
  ).join("");

  root.innerHTML = `
    <header class="site-header">
      <h1 class="name">${escapeHtml(hub.title)}</h1>
      <p class="role">${escapeHtml(hub.summary ?? "")}</p>
      <nav class="site-nav" aria-label="Sections">${nav}</nav>
    </header>
    <main>
      ${TRUNK_ORDER.map(sectionHtml).join("")}
    </main>
    <footer class="site-footer">
      Projects · Quotes · Library · Writing · Research
    </footer>
  `;

  applyHash();
}

function applyHash(): void {
  const raw = location.hash.replace(/^#/, "");
  if (!raw) return;

  // Support #section-projects and #project-laser-lab
  const el =
    document.getElementById(raw) ??
    document.getElementById(`section-${raw}`);
  if (!el) return;

  if (el instanceof HTMLDetailsElement) {
    el.open = true;
    el.classList.add("is-target");
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

window.addEventListener("hashchange", applyHash);
render();
