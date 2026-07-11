/**
 * Pure teaching content for laser creation principles.
 * Importable without three.js / DOM — unit tests assert these strings.
 */

export type Foundation = {
  id: string;
  name: string;
  /** Named law or relation */
  relation: string;
};

/** Foundations required to create a laser (causal order). */
export const FOUNDATIONS: Foundation[] = [
  {
    id: "spontaneous",
    name: "Einstein A — spontaneous emission",
    relation:
      "Excited state decays with rate A₂₁, emitting a photon isotropically. Seeds the field; incoherent alone.",
  },
  {
    id: "stimulated",
    name: "Einstein B — stimulated emission",
    relation:
      "A field at ν drives emission into the same mode: phase, direction, and frequency match (stimulated emission).",
  },
  {
    id: "inversion",
    name: "Population inversion",
    relation:
      "Thermal equilibrium: N₂/N₁ = e^{−ΔE/kT} ≪ 1. Net gain needs N₂ > N₁ on the lasing transition via a pump.",
  },
  {
    id: "resonator",
    name: "Optical resonator (Fabry–Pérot)",
    relation:
      "High reflector + output coupler define a cavity mode. Feedback selects direction and spectral modes.",
  },
  {
    id: "threshold",
    name: "Lasing threshold",
    relation:
      "Threshold when gain ≥ loss: g(N₂ − N₁) ≥ cavity loss (mirror T, scatter, walk-off). Above threshold, intensity grows until gain saturates.",
  },
];

/** Flattened text for tests and search. */
export function foundationsCorpus(): string {
  return FOUNDATIONS.map((f) => `${f.name}\n${f.relation}`).join("\n");
}
