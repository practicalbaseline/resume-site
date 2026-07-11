import * as THREE from "three";
import { CAVITY_AXIS_HALF } from "./cavity";

export type AtomSystem = {
  points: THREE.Points;
  update: (inversion: number, pump: number, t: number) => void;
};

const COUNT = 420;

export function createAtoms(): AtomSystem {
  const positions = new Float32Array(COUNT * 3);
  const bases = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() * 2 - 1) * (CAVITY_AXIS_HALF - 0.5);
    const r = Math.random() * 0.22;
    const th = Math.random() * Math.PI * 2;
    const y = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    bases[i * 3] = x;
    bases[i * 3 + 1] = y;
    bases[i * 3 + 2] = z;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xff6a80,
    size: 0.045,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geom, mat);

  const update = (inversion: number, pump: number, t: number) => {
    const arr = geom.attributes.position.array as Float32Array;
    const lift = inversion * 0.12;
    for (let i = 0; i < COUNT; i++) {
      const px = bases[i * 3];
      const py = bases[i * 3 + 1];
      const pz = bases[i * 3 + 2];
      const wiggle = Math.sin(t * 2.2 + phases[i]) * 0.015 * (0.3 + pump);
      // Excited atoms float slightly "up" in y as a visual metaphor for energy level
      const excited = (Math.sin(phases[i] * 3.1) * 0.5 + 0.5) < inversion;
      arr[i * 3] = px + wiggle;
      arr[i * 3 + 1] = py + (excited ? lift : 0) + wiggle * 0.5;
      arr[i * 3 + 2] = pz + wiggle * 0.3;
    }
    geom.attributes.position.needsUpdate = true;
    mat.opacity = 0.12 + inversion * 0.65 + pump * 0.15;
    mat.size = 0.03 + inversion * 0.04;
    mat.color.setHSL(0.98, 0.85, 0.45 + inversion * 0.25);
  };

  return { points, update };
}
