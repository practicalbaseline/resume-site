import { INDUSTRY_USE } from "../data/industry";
import { MANUFACTURE_STEPS } from "../data/manufacture";
import { FOUNDATIONS } from "../data/foundations";

/** Fill static teaching panels from shipped data modules. */
export function mountTeachPanels(): void {
  const industryRoot = document.querySelector("#industry-panel");
  const mfgRoot = document.querySelector("#manufacture-panel");
  if (!industryRoot || !mfgRoot) {
    throw new Error("Teach panels missing from DOM");
  }

  const i = INDUSTRY_USE;
  industryRoot.innerHTML = `
    <p class="panel-kicker">Industry use</p>
    <h2 class="panel-title">${escapeHtml(i.dominantClass)}</h2>
    <p class="panel-lead">Dominant industrial class: ${escapeHtml(i.shortLabel)}.</p>
    <ul class="panel-list">
      ${i.examples.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("")}
    </ul>
    <p class="panel-sub">Why</p>
    <ul class="panel-list why">
      ${i.why.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}
    </ul>
    <p class="panel-note">${escapeHtml(i.typicalSources)}</p>
  `;

  mfgRoot.innerHTML = `
    <p class="panel-kicker">Build order</p>
    <h2 class="panel-title">Creating a laser</h2>
    <ol class="build-steps">
      ${MANUFACTURE_STEPS.map(
        (s) => `
        <li>
          <span class="build-title">${escapeHtml(s.title)}</span>
          <span class="build-body">${escapeHtml(s.build)}</span>
          <span class="build-mats">${escapeHtml(s.materials)}</span>
        </li>`,
      ).join("")}
    </ol>
    <p class="panel-sub">Foundations</p>
    <ul class="panel-list foundations-list">
      ${FOUNDATIONS.map(
        (f) =>
          `<li><strong>${escapeHtml(f.name)}</strong> — ${escapeHtml(f.relation)}</li>`,
      ).join("")}
    </ul>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
