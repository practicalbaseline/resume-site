import { PARTS, type LaserPart, type LaserPartId } from "../data/parts";

function schematicSvg(kind: LaserPart["schematic"]): string {
  const stroke = "#00f0ff";
  const dim = "#5a5f6a";
  const fill = "#0a0c10";
  const beam = "#ff2a4a";

  switch (kind) {
    case "mirror-hr":
      return `
        <svg viewBox="0 0 200 100" class="schematic-svg" aria-hidden="true">
          <line x1="20" y1="50" x2="160" y2="50" stroke="${dim}" stroke-dasharray="4 3"/>
          <rect x="18" y="20" width="10" height="60" fill="${stroke}" opacity="0.9"/>
          <text x="40" y="30" fill="${stroke}" font-size="9">HR · R≈1</text>
          <text x="40" y="70" fill="${dim}" font-size="8">dielectric stack</text>
          <path d="M40 50 L70 50" stroke="${beam}" stroke-width="2"/>
          <path d="M70 50 L40 42 M70 50 L40 58" stroke="${beam}" stroke-width="1" fill="none"/>
        </svg>`;
    case "mirror-oc":
      return `
        <svg viewBox="0 0 200 100" class="schematic-svg" aria-hidden="true">
          <line x1="30" y1="50" x2="120" y2="50" stroke="${dim}" stroke-dasharray="4 3"/>
          <rect x="118" y="22" width="8" height="56" fill="${stroke}" opacity="0.55" stroke="${stroke}"/>
          <line x1="130" y1="50" x2="185" y2="50" stroke="${beam}" stroke-width="2.5"/>
          <text x="40" y="28" fill="${stroke}" font-size="9">OC · R&lt;1, T&gt;0</text>
          <text x="40" y="78" fill="${dim}" font-size="8">partial stack + AR exit</text>
        </svg>`;
    case "gain-rod":
      return `
        <svg viewBox="0 0 200 100" class="schematic-svg" aria-hidden="true">
          <rect x="40" y="35" width="120" height="30" rx="4" fill="${fill}" stroke="${beam}" stroke-width="1.5"/>
          <text x="55" y="54" fill="${beam}" font-size="9">host + dopant · g∝σΔN</text>
          <text x="40" y="82" fill="${dim}" font-size="8">N₂ ─→ N₁ + hν</text>
          <line x1="30" y1="50" x2="40" y2="50" stroke="${dim}"/>
          <line x1="160" y1="50" x2="170" y2="50" stroke="${dim}"/>
        </svg>`;
    case "envelope":
      return `
        <svg viewBox="0 0 200 100" class="schematic-svg" aria-hidden="true">
          <rect x="35" y="28" width="130" height="44" rx="14" fill="none" stroke="${stroke}" stroke-width="1.2"/>
          <rect x="50" y="40" width="100" height="20" rx="3" fill="${fill}" stroke="${dim}"/>
          <text x="55" y="88" fill="${dim}" font-size="8">quartz envelope · aperture / seal</text>
        </svg>`;
    case "mount":
      return `
        <svg viewBox="0 0 200 100" class="schematic-svg" aria-hidden="true">
          <line x1="20" y1="70" x2="180" y2="70" stroke="${dim}" stroke-width="3"/>
          <rect x="30" y="40" width="20" height="30" fill="${stroke}" opacity="0.5"/>
          <rect x="150" y="40" width="20" height="30" fill="${stroke}" opacity="0.5"/>
          <line x1="40" y1="40" x2="160" y2="40" stroke="${dim}" stroke-dasharray="3 2"/>
          <text x="55" y="30" fill="${stroke}" font-size="9">optic axis</text>
          <text x="50" y="90" fill="${dim}" font-size="8">tip/tilt → walk-off loss</text>
        </svg>`;
    case "pump":
      return `
        <svg viewBox="0 0 200 100" class="schematic-svg" aria-hidden="true">
          <rect x="50" y="38" width="100" height="24" rx="3" fill="${fill}" stroke="${dim}"/>
          <line x1="60" y1="20" x2="60" y2="38" stroke="#ffaa44" stroke-width="2"/>
          <line x1="100" y1="14" x2="100" y2="38" stroke="#ffaa44" stroke-width="2"/>
          <line x1="140" y1="20" x2="140" y2="38" stroke="#ffaa44" stroke-width="2"/>
          <text x="55" y="80" fill="${stroke}" font-size="9">W_p · optical / e⁻ / RF</text>
        </svg>`;
    default:
      return "";
  }
}

export type SchematicPanel = {
  open: (id: LaserPartId) => void;
  close: () => void;
  isOpen: () => boolean;
};

export function mountSchematic(): SchematicPanel {
  const root = document.querySelector<HTMLElement>("#schematic");
  const title = document.querySelector<HTMLElement>("#schematic-title");
  const role = document.querySelector<HTMLElement>("#schematic-role");
  const principle = document.querySelector<HTMLElement>("#schematic-principle");
  const materials = document.querySelector<HTMLElement>("#schematic-materials");
  const manufacture = document.querySelector<HTMLElement>("#schematic-manufacture");
  const svgHost = document.querySelector<HTMLElement>("#schematic-svg");
  const closeBtn = document.querySelector<HTMLButtonElement>("#schematic-close");

  if (
    !root ||
    !title ||
    !role ||
    !principle ||
    !materials ||
    !manufacture ||
    !svgHost ||
    !closeBtn
  ) {
    throw new Error("Schematic panel markup missing");
  }

  let openId: LaserPartId | null = null;

  const close = () => {
    openId = null;
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    window.dispatchEvent(new CustomEvent("schematic:close"));
  };

  const open = (id: LaserPartId) => {
    const part = PARTS[id];
    openId = id;
    title.textContent = part.name;
    role.textContent = part.role;
    principle.textContent = part.principle;
    manufacture.textContent = part.manufacture;
    materials.innerHTML = part.materials
      .map(
        (m) =>
          `<li><span class="mat-name">${escapeHtml(m.name)}</span><span class="mat-note">${escapeHtml(m.note)}</span></li>`,
      )
      .join("");
    svgHost.innerHTML = schematicSvg(part.schematic);
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    window.dispatchEvent(new CustomEvent("schematic:open", { detail: { id } }));
  };

  closeBtn.addEventListener("click", close);
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  return {
    open,
    close,
    isOpen: () => openId !== null,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
