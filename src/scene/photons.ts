import * as THREE from "three";
import { CAVITY_AXIS_HALF } from "./cavity";

type Photon = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  axial: boolean;
};

export type PhotonSystem = {
  points: THREE.Points;
  update: (
    dt: number,
    opts: {
      spontaneous: number;
      stimulated: number;
      intensity: number;
      alignment: number;
      reducedMotion: boolean;
    },
  ) => void;
};

const MAX = 280;

export function createPhotons(): PhotonSystem {
  const photons: Photon[] = [];
  const positions = new Float32Array(MAX * 3);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xff3355,
    size: 0.07,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geom, mat);

  const spawn = (axial: boolean, alignment: number) => {
    if (photons.length >= MAX) photons.shift();
    const x = (Math.random() * 2 - 1) * (CAVITY_AXIS_HALF - 0.4);
    if (axial) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const jitter = (1 - alignment) * 0.8;
      photons.push({
        x,
        y: (Math.random() - 0.5) * 0.08,
        z: (Math.random() - 0.5) * 0.08,
        vx: dir * (3.5 + Math.random() * 2),
        vy: (Math.random() - 0.5) * jitter,
        vz: (Math.random() - 0.5) * jitter,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        axial: true,
      });
    } else {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1.2 + Math.random() * 2.2;
      photons.push({
        x,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.2,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.6,
        axial: false,
      });
    }
  };

  const update: PhotonSystem["update"] = (dt, opts) => {
    if (opts.reducedMotion) {
      // Keep a few static seeds near axis for understanding without chaos
      while (photons.length < 12) spawn(true, opts.alignment);
    } else {
      const spontRate = opts.spontaneous * 28;
      const stimRate = opts.stimulated * 40 + opts.intensity * 18;
      const nSpont = Math.min(8, Math.floor(spontRate * dt + Math.random()));
      const nStim = Math.min(12, Math.floor(stimRate * dt * opts.alignment + Math.random() * 0.5));
      for (let i = 0; i < nSpont; i++) spawn(false, opts.alignment);
      for (let i = 0; i < nStim; i++) spawn(true, opts.alignment);
    }

    for (let i = photons.length - 1; i >= 0; i--) {
      const p = photons[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Bounce axial photons on mirrors (idealized)
      if (p.axial) {
        if (p.x > CAVITY_AXIS_HALF - 0.15) {
          p.x = CAVITY_AXIS_HALF - 0.15;
          p.vx *= -1;
        } else if (p.x < -CAVITY_AXIS_HALF + 0.15) {
          p.x = -CAVITY_AXIS_HALF + 0.15;
          p.vx *= -1;
        }
        // Walk-off kills misaligned rays
        if (Math.hypot(p.y, p.z) > 0.55) {
          photons.splice(i, 1);
          continue;
        }
      }

      if (p.life > p.maxLife || Math.hypot(p.y, p.z) > 4 || Math.abs(p.x) > 12) {
        photons.splice(i, 1);
      }
    }

    const arr = geom.attributes.position.array as Float32Array;
    arr.fill(0);
    for (let i = 0; i < photons.length; i++) {
      arr[i * 3] = photons[i].x;
      arr[i * 3 + 1] = photons[i].y;
      arr[i * 3 + 2] = photons[i].z;
    }
    geom.setDrawRange(0, photons.length);
    geom.attributes.position.needsUpdate = true;
    mat.opacity = 0.35 + Math.min(0.55, opts.intensity * 0.5);
  };

  return { points, update };
}
