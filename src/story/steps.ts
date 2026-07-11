import type { LaserParams } from "../sim/laserModel";

export type StoryStep = {
  id: string;
  /** Short law / principle name */
  title: string;
  /** One line: the relation, not marketing */
  formula: string;
  camera: { x: number; y: number; z: number };
  params: Partial<LaserParams>;
};

/** Principle tour — names and relations only. */
export const STEPS: StoryStep[] = [
  {
    id: "cavity",
    title: "Fabry–Pérot cavity",
    formula: "Two mirrors on an optic axis. Mode volume between high reflector and output coupler.",
    camera: { x: 6.5, y: 2.2, z: 7.5 },
    params: { pump: 0, alignment: 1, outputLeak: 0.12 },
  },
  {
    id: "planck",
    title: "E = hν",
    formula: "Transition energy fixes photon frequency. Absorption and emission share the same resonance.",
    camera: { x: 3.2, y: 1.4, z: 4.2 },
    params: { pump: 0.35, alignment: 1, outputLeak: 0.12 },
  },
  {
    id: "einstein-a",
    title: "Einstein A (spontaneous)",
    formula: "Excited state → ground + photon. Rate A₂₁; isotropic, incoherent seed field.",
    camera: { x: 4.5, y: 2.8, z: 5.0 },
    params: { pump: 0.55, alignment: 0.85, outputLeak: 0.12 },
  },
  {
    id: "einstein-b",
    title: "Einstein B (stimulated)",
    formula: "Field at ν drives emission into the same mode: phase, direction, frequency match.",
    camera: { x: 0.5, y: 1.2, z: 8.5 },
    params: { pump: 0.7, alignment: 1, outputLeak: 0.1 },
  },
  {
    id: "boltzmann",
    title: "Population inversion",
    formula: "Thermal: N₂/N₁ = e^{−ΔE/kT} ≪ 1. Net gain needs N₂ > N₁ on the lasing transition (pump).",
    camera: { x: 5.5, y: 0.8, z: 3.5 },
    params: { pump: 0.85, alignment: 1, outputLeak: 0.12 },
  },
  {
    id: "round-trip",
    title: "Round-trip gain vs loss",
    formula: "g · L ≥ −½ ln(R₁ R₂) + α_loss. Misalignment and scatter raise loss; coupler sets useful T.",
    camera: { x: 7.5, y: 1.5, z: 0.2 },
    params: { pump: 0.9, alignment: 1, outputLeak: 0.1 },
  },
  {
    id: "threshold",
    title: "Lasing threshold",
    formula: "g(N₂ − N₁) = loss. Above threshold, intensity grows until gain saturates.",
    camera: { x: 4.0, y: 2.0, z: 6.0 },
    params: { pump: 0.95, alignment: 1, outputLeak: 0.1 },
  },
  {
    id: "output",
    title: "Output coupler",
    formula: "Partial mirror: T > 0 extracts beam. Coherence and directionality follow mode selection + B.",
    camera: { x: -2.5, y: 1.8, z: 9.0 },
    params: { pump: 1, alignment: 1, outputLeak: 0.14 },
  },
];
