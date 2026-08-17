export type HillMark = {
  label: string;
  href: string;
};

/** Other projects listed under the hill. Add a row to put another link there. */
export const HILL_MARKS: HillMark[] = [
  {
    label: "SweatyGM.com",
    href: "https://sweatygm.com",
  },
];

export function marksHtml(marks: HillMark[]): string {
  const links = marks
    .map(
      (m) => `
      <a
        class="hill-mark"
        href="${escapeAttr(m.href)}"
        target="_blank"
        rel="noopener noreferrer"
      >${escapeText(m.label)}</a>`,
    )
    .join("");

  return `
    <nav class="hill-marks" aria-label="Other projects">
      <p class="hill-marks-kicker">Other Projects:</p>
      <div class="hill-marks-list">${links}</div>
    </nav>`;
}

function escapeAttr(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeText(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
