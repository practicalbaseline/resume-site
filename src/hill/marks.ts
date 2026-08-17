export type HillMark = {
  label: string;
  href: string;
  tilt: number;
};

/** Trail tags in the dirt. Add a row to put another project at the bottom. */
export const HILL_MARKS: HillMark[] = [
  {
    label: "sweatygm.com",
    href: "https://sweatygm.com",
    tilt: -1.6,
  },
];

export function marksHtml(marks: HillMark[]): string {
  const tags = marks
    .map(
      (m) => `
      <a
        class="hill-mark"
        href="${escapeAttr(m.href)}"
        target="_blank"
        rel="noopener noreferrer"
        style="--tilt: ${m.tilt}deg"
      >
        <span class="hill-mark-stake" aria-hidden="true"></span>
        <span class="hill-mark-plate">${escapeText(m.label)}</span>
      </a>`,
    )
    .join("");

  return `<nav class="hill-marks" aria-label="Projects">${tags}</nav>`;
}

function escapeAttr(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeText(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
