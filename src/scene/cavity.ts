import * as THREE from "three";
import type { LaserPartId } from "../data/parts";

export type Cavity = {
  group: THREE.Group;
  /** All meshes that accept pick / highlight */
  pickables: THREE.Object3D[];
  gainRod: THREE.Mesh;
  gainMaterial: THREE.MeshStandardMaterial;
  backMirror: THREE.Mesh;
  frontMirror: THREE.Mesh;
  setAlignment: (alignment: number) => void;
  setPumpGlow: (pump: number, inversion: number) => void;
  setHighlight: (partId: LaserPartId | null) => void;
};

const CAVITY_HALF = 3.2;
const ROD_RADIUS = 0.28;
const ROD_LENGTH = 4.2;

function tag(obj: THREE.Object3D, partId: LaserPartId): void {
  obj.userData.partId = partId;
  obj.traverse((child) => {
    child.userData.partId = partId;
  });
}

export function createCavity(): Cavity {
  const group = new THREE.Group();
  const pickables: THREE.Object3D[] = [];
  const highlightable: { mesh: THREE.Mesh; baseEmissive: number }[] = [];

  const register = (mesh: THREE.Mesh, partId: LaserPartId, emissiveBase = 0) => {
    tag(mesh, partId);
    pickables.push(mesh);
    highlightable.push({ mesh, baseEmissive: emissiveBase });
    group.add(mesh);
  };

  // Rails / mount
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x1c222c,
    metalness: 0.7,
    roughness: 0.45,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const railGeom = new THREE.BoxGeometry(CAVITY_HALF * 2 + 1.2, 0.08, 0.08);
  for (const z of [-0.55, 0.55]) {
    for (const y of [-0.55, 0.55]) {
      const rail = new THREE.Mesh(railGeom, railMat.clone());
      rail.position.set(0, y, z);
      register(rail, "mount");
    }
  }

  // End plates (mount)
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x151a22,
    metalness: 0.6,
    roughness: 0.4,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const plateGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.12, 32);
  const backPlate = new THREE.Mesh(plateGeom, plateMat.clone());
  backPlate.rotation.z = Math.PI / 2;
  backPlate.position.x = -CAVITY_HALF;
  register(backPlate, "mount");
  const frontPlate = new THREE.Mesh(plateGeom, plateMat.clone());
  frontPlate.rotation.z = Math.PI / 2;
  frontPlate.position.x = CAVITY_HALF;
  register(frontPlate, "mount");

  // High reflector
  const mirrorGeom = new THREE.CylinderGeometry(0.62, 0.62, 0.06, 48);
  const backMirrorMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0cc,
    metalness: 1,
    roughness: 0.12,
    emissive: 0x111318,
    emissiveIntensity: 0.15,
  });
  const backMirror = new THREE.Mesh(mirrorGeom, backMirrorMat);
  backMirror.rotation.z = Math.PI / 2;
  backMirror.position.x = -CAVITY_HALF + 0.08;
  register(backMirror, "hr", 0.15);

  // Output coupler
  const frontMirrorMat = new THREE.MeshStandardMaterial({
    color: 0x8a94a3,
    metalness: 0.95,
    roughness: 0.18,
    transparent: true,
    opacity: 0.72,
    emissive: 0x0a0c10,
    emissiveIntensity: 0.1,
  });
  const frontMirror = new THREE.Mesh(mirrorGeom, frontMirrorMat);
  frontMirror.rotation.z = Math.PI / 2;
  frontMirror.position.x = CAVITY_HALF - 0.08;
  register(frontMirror, "oc", 0.1);

  // Gain medium rod
  const gainMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a1020,
    emissive: 0xff2a4a,
    emissiveIntensity: 0.05,
    metalness: 0.1,
    roughness: 0.35,
    transparent: true,
    opacity: 0.82,
  });
  const rodGeom = new THREE.CylinderGeometry(ROD_RADIUS, ROD_RADIUS, ROD_LENGTH, 48);
  const gainRod = new THREE.Mesh(rodGeom, gainMaterial);
  gainRod.rotation.z = Math.PI / 2;
  register(gainRod, "gain", 0.05);

  // Tube glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x8899aa,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.55,
    thickness: 0.4,
    transparent: true,
    opacity: 0.22,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(ROD_RADIUS + 0.12, ROD_RADIUS + 0.12, ROD_LENGTH + 0.3, 48),
    glassMat,
  );
  glass.rotation.z = Math.PI / 2;
  register(glass, "envelope");

  // Pedestal
  const ped = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.35, 1.0),
    railMat.clone(),
  );
  ped.position.set(0, -1.15, 0);
  register(ped, "mount");

  // Pump lamp (stylized flashlamp alongside rod)
  const pumpMat = new THREE.MeshStandardMaterial({
    color: 0x2a3040,
    metalness: 0.5,
    roughness: 0.4,
    emissive: 0xffaa44,
    emissiveIntensity: 0.05,
  });
  const pumpLamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, ROD_LENGTH * 0.9, 16),
    pumpMat,
  );
  pumpLamp.rotation.z = Math.PI / 2;
  pumpLamp.position.set(0, 0.55, 0);
  register(pumpLamp, "pump", 0.05);

  const setAlignment = (alignment: number) => {
    const tip = (1 - alignment) * 0.22;
    frontMirror.rotation.y = tip;
    frontMirror.rotation.x = tip * 0.35;
    frontMirror.position.y = tip * 0.4;
  };

  const setPumpGlow = (pump: number, inversion: number) => {
    const e = 0.04 + pump * 0.35 + inversion * 0.9;
    gainMaterial.emissiveIntensity = e;
    gainMaterial.color.setRGB(0.22 + inversion * 0.3, 0.05, 0.1 + pump * 0.05);
    pumpMat.emissiveIntensity = 0.05 + pump * 1.2;
  };

  const setHighlight = (partId: LaserPartId | null) => {
    for (const { mesh, baseEmissive } of highlightable) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!("emissiveIntensity" in mat)) continue;
      const id = mesh.userData.partId as LaserPartId | undefined;
      if (partId && id === partId) {
        mat.emissiveIntensity = Math.max(baseEmissive, 0.35) + 0.55;
        if (mat.emissive.getHex() === 0x000000) mat.emissive.setHex(0x00f0ff);
      } else if (id === "gain") {
        // gain emissive driven by setPumpGlow
      } else if (id === "pump") {
        // pump driven by setPumpGlow
      } else {
        mat.emissiveIntensity = baseEmissive;
        if (id === "mount" || id === "envelope") mat.emissive.setHex(0x000000);
      }
    }
  };

  return {
    group,
    pickables,
    gainRod,
    gainMaterial,
    backMirror,
    frontMirror,
    setAlignment,
    setPumpGlow,
    setHighlight,
  };
}

export const CAVITY_AXIS_HALF = CAVITY_HALF;
