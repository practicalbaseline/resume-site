/** Contact-point height. Average grade is always downhill as x increases. */
export function height(x: number): number {
  return (
    -0.34 * x +
    0.62 * Math.cos(x * 0.085) +
    0.22 * Math.cos(x * 0.19 + 0.6) +
    0.08 * Math.cos(x * 0.41 + 1.2)
  );
}

/** dy/dx — always negative so the tire never faces a true climb. */
export function slope(x: number): number {
  return (
    -0.34 -
    0.0527 * Math.sin(x * 0.085) -
    0.0418 * Math.sin(x * 0.19 + 0.6) -
    0.0328 * Math.sin(x * 0.41 + 1.2)
  );
}

export function normal(x: number): { nx: number; ny: number } {
  const sl = slope(x);
  const hyp = Math.hypot(1, sl);
  return { nx: -sl / hyp, ny: 1 / hyp };
}

export function tangent(x: number): { tx: number; ty: number } {
  const sl = slope(x);
  const hyp = Math.hypot(1, sl);
  return { tx: 1 / hyp, ty: sl / hyp };
}

export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function farRidge(x: number, layer: number): number {
  return (
    1.8 * Math.sin(x * 0.07 + layer * 1.7) +
    0.95 * Math.sin(x * 0.16 + layer * 0.4) +
    0.4 * Math.sin(x * 0.33 + layer)
  );
}
