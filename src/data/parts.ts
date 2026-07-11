export type LaserPartId =
  | "hr"
  | "oc"
  | "gain"
  | "envelope"
  | "mount"
  | "pump";

export type LaserPart = {
  id: LaserPartId;
  name: string;
  role: string;
  materials: { name: string; note: string }[];
  principle: string;
  /** Construction / manufacture note for builders */
  manufacture: string;
  /** Simple schematic labels for SVG */
  schematic: "mirror-hr" | "mirror-oc" | "gain-rod" | "envelope" | "mount" | "pump";
};

export const PARTS: Record<LaserPartId, LaserPart> = {
  hr: {
    id: "hr",
    name: "High reflector (HR)",
    role: "Rear cavity mirror. Reflectance R ≈ 1 at λ; closes the Fabry–Pérot axis.",
    materials: [
      { name: "Substrate", note: "Fused silica or BK7; λ/10 flatness typical for lab cavities." },
      { name: "Dielectric stack", note: "λ/4 multilayers (SiO₂ / TiO₂ or Ta₂O₅); designed R > 99.5% at line." },
      { name: "Coatings", note: "Hard oxide IBS/EB coats; low scatter, high damage threshold." },
    ],
    principle: "R₁ → 1 minimizes rear loss in −½ ln(R₁ R₂).",
    manufacture:
      "Specify λ and AOI for the dielectric stack; polish substrate to λ/10; coat via IBS/EB; mount with tip/tilt to the optic axis.",
    schematic: "mirror-hr",
  },
  oc: {
    id: "oc",
    name: "Output coupler (OC)",
    role: "Partial reflector. Reflectance R < 1; transmission T extracts the beam.",
    materials: [
      { name: "Substrate", note: "Fused silica; often slight wedge or ROC to define mode." },
      { name: "Partial dielectric", note: "Fewer high-index pairs than HR → designed T (e.g. 1–20%)." },
      { name: "AR back face", note: "Exit face AR-coated to avoid ghost cavities." },
    ],
    principle: "Useful output ∝ T · I_cavity; higher T raises threshold loss.",
    manufacture:
      "Choose T as a threshold vs output tradeoff; AR the exit face; ROC/wedge per mode design; same coating process family as HR.",
    schematic: "mirror-oc",
  },
  gain: {
    id: "gain",
    name: "Gain medium",
    role: "Active volume. Host + dopant (or gas/semiconductor) providing the lasing transition.",
    materials: [
      { name: "Host (solid-state example)", note: "Al₂O₃ (ruby), YAG, glass — sets thermal and optical path." },
      { name: "Active ions / species", note: "Cr³⁺, Nd³⁺, Yb³⁺; or He–Ne gas; or III–V diode junction." },
      { name: "Dopant level", note: "Sets available inversion density and pump absorption length." },
    ],
    principle: "Gain g ∝ σ · (N₂ − N₁). Inversion requires non-equilibrium pumping.",
    manufacture:
      "Grow or melt host; dope to target concentration; cut/polish rod or slab; AR or Brewster faces; bond to heat sink for high power.",
    schematic: "gain-rod",
  },
  envelope: {
    id: "envelope",
    name: "Tube / envelope",
    role: "Mechanical and optical housing for the medium (coolant, vacuum, or gas seal).",
    materials: [
      { name: "Fused quartz / borosilicate", note: "UV–vis transparent walls; low expansion." },
      { name: "Seals / windows", note: "Brewster windows (gas lasers) or AR flats; O-rings / glass–metal seals." },
      { name: "Coolant path", note: "Water jacket or heat sink interface for high average power." },
    ],
    principle: "Not a gain element; sets aperture, scatter, and thermal boundary conditions.",
    manufacture:
      "Machine or glass-blow housing; seal windows; route coolant; keep clear aperture larger than mode diameter.",
    schematic: "envelope",
  },
  mount: {
    id: "mount",
    name: "Rail / mount",
    role: "Rigid reference. Holds optic axis; tip/tilt defines alignment loss.",
    materials: [
      { name: "Aluminum or steel", note: "Kinematic mounts, invar for thermal stability on precision benches." },
      { name: "Adjusters", note: "Micrometer tip/tilt; spring-loaded for hysteresis control." },
    ],
    principle: "Misalignment → walk-off → effective α_loss ↑; mode fails before medium does.",
    manufacture:
      "Bolt kinematic mounts to a stiff rail; align HR/OC until cavity rings; lock adjusters after threshold is reached.",
    schematic: "mount",
  },
  pump: {
    id: "pump",
    name: "Pump path",
    role: "Energy input that drives N₂ above thermal equilibrium (optical, electrical, or chemical).",
    materials: [
      { name: "Flashlamp / diode bars", note: "Solid-state: broadband lamp or λ-matched laser diodes." },
      { name: "Discharge electrodes", note: "Gas lasers: RF or DC plasma excitation." },
      { name: "Current injection", note: "Semiconductor: p–n junction injection current." },
    ],
    principle: "Pump rate W_p competes with A₂₁ and stimulated depletion; required for N₂ > N₁.",
    manufacture:
      "Match pump spectrum to absorption band; couple with fiber or cavity geometry; cool diodes/lamps; set current/power for inversion.",
    schematic: "pump",
  },
};

/** Corpus of manufacture + material notes for tests. */
export function partsManufactureCorpus(): string {
  return PART_IDS.map((id) => {
    const p = PARTS[id];
    const mats = p.materials.map((m) => `${m.name}: ${m.note}`).join(" ");
    return `${p.name}\n${p.role}\n${p.manufacture}\n${mats}\n${p.principle}`;
  }).join("\n");
}

export const PART_IDS = Object.keys(PARTS) as LaserPartId[];
