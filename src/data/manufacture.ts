/**
 * Manufacturing / construction basics tied to laser physics.
 * Not a fab process manual — material roles and build order for laser nerds.
 */

export type ManufactureStep = {
  id: string;
  title: string;
  /** What you build / specify */
  build: string;
  /** Typical materials / process note */
  materials: string;
  /** Links to a creation principle */
  principleId: string;
};

/**
 * Order of construction concerns when creating a laser source.
 */
export const MANUFACTURE_STEPS: ManufactureStep[] = [
  {
    id: "medium",
    title: "Gain medium",
    build: "Choose host + active species (or gas mix / semiconductor junction) for the lasing transition and pump band.",
    materials:
      "Solid-state: YAG/YVO₄/glass + Nd³⁺/Yb³⁺/Cr³⁺; gas: He–Ne, CO₂; diode: III–V epitaxial stacks (GaAs, InP families).",
    principleId: "inversion",
  },
  {
    id: "pump",
    title: "Pump that produces inversion",
    build: "Deliver energy faster than upper-level decay so N₂ exceeds N₁ on the transition.",
    materials:
      "Diode bars / fiber-coupled pumps (λ-matched), flashlamps, RF/DC discharge, or injection current in diodes.",
    principleId: "inversion",
  },
  {
    id: "optics",
    title: "HR and OC resonator optics",
    build: "Dielectric-coated mirrors set R₁≈1 and designed OC transmission T; figure and ROC define the mode.",
    materials:
      "Fused silica / BK7 substrates; λ/4 oxide multilayers (SiO₂, TiO₂, Ta₂O₅) via IBS/EB; AR on OC exit face.",
    principleId: "resonator",
  },
  {
    id: "mounts",
    title: "Mounts and alignment",
    build: "Rigid rails/kinematic mounts hold the optic axis; tip/tilt minimizes walk-off loss.",
    materials: "Aluminum/steel benches; invar for thermal stability; micrometer tip/tilt stages.",
    principleId: "threshold",
  },
  {
    id: "threshold-build",
    title: "Threshold verification",
    build: "Raise pump until g ≥ loss; measure output vs pump for knee at threshold; set T_oc for useful power vs stability.",
    materials: "Power meter, spectrometer, beam profiler; coolant / heat sink for medium and pump diodes.",
    principleId: "threshold",
  },
];

export function manufactureCorpus(): string {
  return MANUFACTURE_STEPS.map(
    (s) => `${s.title}\n${s.build}\n${s.materials}`,
  ).join("\n");
}
