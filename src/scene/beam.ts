import * as THREE from "three";
import { CAVITY_AXIS_HALF } from "./cavity";

export type BeamSystem = {
  group: THREE.Group;
  setIntensity: (cavityI: number, outputI: number, alignment: number) => void;
};

export function createBeam(): BeamSystem {
  const group = new THREE.Group();

  const cavityMat = new THREE.MeshBasicMaterial({
    color: 0xff2a4a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cavityCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, CAVITY_AXIS_HALF * 2 - 0.3, 24),
    cavityMat,
  );
  cavityCore.rotation.z = Math.PI / 2;
  group.add(cavityCore);

  const cavityHaloMat = new THREE.MeshBasicMaterial({
    color: 0xff4466,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cavityHalo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, CAVITY_AXIS_HALF * 2 - 0.3, 24),
    cavityHaloMat,
  );
  cavityHalo.rotation.z = Math.PI / 2;
  group.add(cavityHalo);

  // Output beam extending in +x past front mirror
  const outLen = 14;
  const outMat = new THREE.MeshBasicMaterial({
    color: 0xff2a4a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.14, outLen, 24),
    outMat,
  );
  outCore.rotation.z = Math.PI / 2;
  outCore.position.x = CAVITY_AXIS_HALF + outLen / 2;
  group.add(outCore);

  const outHaloMat = new THREE.MeshBasicMaterial({
    color: 0xff6070,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outHalo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.38, outLen, 24),
    outHaloMat,
  );
  outHalo.rotation.z = Math.PI / 2;
  outHalo.position.x = CAVITY_AXIS_HALF + outLen / 2;
  group.add(outHalo);

  // Soft punch disk at output coupler
  const diskMat = new THREE.MeshBasicMaterial({
    color: 0xff8899,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const disk = new THREE.Mesh(new THREE.CircleGeometry(0.35, 32), diskMat);
  disk.rotation.y = Math.PI / 2;
  disk.position.x = CAVITY_AXIS_HALF - 0.05;
  group.add(disk);

  const setIntensity = (cavityI: number, outputI: number, alignment: number) => {
    const a = Math.max(0.15, alignment);
    const c = Math.min(1, cavityI) * a;
    const o = Math.min(1, outputI * 2.2) * a;

    cavityMat.opacity = c * 0.85;
    cavityHaloMat.opacity = c * 0.28;
    outMat.opacity = o * 0.9;
    outHaloMat.opacity = o * 0.25;
    diskMat.opacity = o * 0.7;

    const scale = 0.85 + c * 0.35;
    cavityCore.scale.set(1, scale, scale);
    cavityHalo.scale.set(1, 0.9 + c * 0.5, 0.9 + c * 0.5);
  };

  return { group, setIntensity };
}
