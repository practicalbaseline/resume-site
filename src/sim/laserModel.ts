/**
 * Pedagogical rate model — not a full Maxwell–Bloch / FEM cavity solver.
 *
 * Teaches: pump → inversion → gain vs loss → threshold → intensity growth.
 * Experts: net round-trip gain when g(D) > cavity losses (alignment + output coupler).
 */

export type LaserParams = {
  /** 0–1 external pump strength */
  pump: number;
  /** 0–1 how square the cavity is (1 = aligned) */
  alignment: number;
  /** Fraction of intensity leaving the output coupler each "round trip" (0.02–0.45) */
  outputLeak: number;
};

export type LaserState = {
  /** Excited fraction proxy ∈ [0, 1] (population inversion stand-in) */
  inversion: number;
  /** Circulating intensity in cavity ∈ [0, ~1+] */
  intensity: number;
  /** Output beam intensity */
  output: number;
  /** Whether above threshold this frame */
  aboveThreshold: boolean;
  /** Net gain margin (positive ⇒ growing) */
  gainMargin: number;
  /** Spontaneous emission rate proxy */
  spontaneous: number;
  /** Stimulated emission strength along axis */
  stimulated: number;
};

const REST_INVERSION = 0.12;
const MAX_INVERSION = 0.92;
const PUMP_RATE = 1.35;
const RELAX_RATE = 0.55;
const STIM_DEPLETION = 0.35;
const GAIN_COEFF = 2.8;
const FIXED_LOSS = 0.18;
const ALIGN_LOSS_WEIGHT = 1.15;
const INTENSITY_GROW = 2.4;
const INTENSITY_DECAY = 1.1;
const SPONT_SEED = 0.012;

export function createInitialState(): LaserState {
  return {
    inversion: REST_INVERSION,
    intensity: 0,
    output: 0,
    aboveThreshold: false,
    gainMargin: -1,
    spontaneous: 0,
    stimulated: 0,
  };
}

export function defaultParams(): LaserParams {
  return {
    pump: 0,
    alignment: 1,
    outputLeak: 0.12,
  };
}

/** Cavity loss rises when misaligned or when the output coupler leaks more. */
export function cavityLoss(params: LaserParams): number {
  const misalign = 1 - params.alignment;
  return FIXED_LOSS + ALIGN_LOSS_WEIGHT * misalign * misalign + params.outputLeak;
}

/** Small-signal gain from inversion (didactic linear gain). */
export function gain(inversion: number): number {
  // Net useful gain only when inverted above ~0.5 equilibrium caricature
  const excess = Math.max(0, inversion - 0.45);
  return GAIN_COEFF * excess;
}

export function stepLaser(
  state: LaserState,
  params: LaserParams,
  dt: number,
): LaserState {
  const loss = cavityLoss(params);
  const g = gain(state.inversion);
  const margin = g - loss;

  // Population: pump up, relax down, stimulated emission depletes inversion
  let inv = state.inversion;
  inv += params.pump * PUMP_RATE * (MAX_INVERSION - inv) * dt;
  inv -= RELAX_RATE * (inv - REST_INVERSION) * dt;
  inv -= STIM_DEPLETION * state.intensity * inv * dt;
  inv = clamp(inv, 0, MAX_INVERSION);

  const spontaneous = (0.15 + inv) * (0.04 + 0.2 * params.pump);
  const stimulated = state.intensity * g * params.alignment;

  // Intensity dynamics: seed + growth/decay by gain margin
  let I = state.intensity;
  I += SPONT_SEED * spontaneous * params.alignment * dt;
  if (margin > 0) {
    I += INTENSITY_GROW * margin * I * dt;
    I += SPONT_SEED * 0.5 * margin * dt;
  } else {
    I -= INTENSITY_DECAY * (loss - g * 0.5) * I * dt;
  }
  // Hard ceiling for visual stability
  I = clamp(I, 0, 1.6);

  const aboveThreshold = margin > 0 && I > 0.04;
  const output = I * params.outputLeak * params.alignment;

  return {
    inversion: inv,
    intensity: I,
    output,
    aboveThreshold,
    gainMargin: margin,
    spontaneous,
    stimulated,
  };
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function statusCopy(state: LaserState, params: LaserParams): string {
  const loss = cavityLoss(params);
  const g = gain(state.inversion);
  if (params.alignment < 0.35) {
    return `Walk-off: alignment low → α_loss high. g=${g.toFixed(2)}, loss=${loss.toFixed(2)}.`;
  }
  if (params.pump < 0.08 && state.intensity < 0.05) {
    return `W_p ≈ 0. g=${g.toFixed(2)} < loss=${loss.toFixed(2)}.`;
  }
  if (state.aboveThreshold) {
    return `g=${g.toFixed(2)} > loss=${loss.toFixed(2)} · above threshold`;
  }
  return `g=${g.toFixed(2)} ≤ loss=${loss.toFixed(2)} · below threshold`;
}
