import * as THREE from "three";

/**
 * Movie tableau: industrial cut → medical focus → fiber link.
 * Stylized, not photoreal — cinematic silhouette + additive beam.
 */
export type GoodScene = {
  group: THREE.Group;
  /** 0 = dark workshop, 1 = cutting, 2 = medical, 3 = fiber/connect, 4 = hold */
  setPhase: (phase: number, t: number) => void;
  setVisible: (v: boolean) => void;
};

export function createGoodScene(): GoodScene {
  const group = new THREE.Group();
  group.visible = false;

  // Floor / stage
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      metalness: 0.4,
      roughness: 0.85,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.4;
  group.add(floor);

  // Steel plate (manufacturing)
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.12, 3.2),
    new THREE.MeshStandardMaterial({
      color: 0x3a4250,
      metalness: 0.9,
      roughness: 0.35,
      emissive: 0xff2200,
      emissiveIntensity: 0,
    }),
  );
  plate.position.set(0, -1.2, 0);
  group.add(plate);

  // Kerf glow line on plate
  const kerfMat = new THREE.MeshBasicMaterial({
    color: 0xff5533,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const kerf = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 2.6), kerfMat);
  kerf.position.set(0, -1.12, 0);
  group.add(kerf);

  // Industrial beam (vertical from above)
  const indMat = new THREE.MeshBasicMaterial({
    color: 0xff2a4a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const indBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 8, 16), indMat);
  indBeam.position.set(0, 2.8, 0);
  group.add(indBeam);

  const indHalo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.28, 8, 16),
    new THREE.MeshBasicMaterial({
      color: 0xff6680,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  indHalo.position.copy(indBeam.position);
  group.add(indHalo);

  // Laser head silhouette
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.5, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.7, roughness: 0.4 }),
  );
  head.position.set(0, 6.5, 0);
  group.add(head);

  // Medical: abstract cornea rings (heal phase)
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(4.5, 0.4, -1.5);
  eyeGroup.visible = true;
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.35 + i * 0.18, 0.012, 8, 48),
      ringMat.clone(),
    );
    ring.rotation.x = Math.PI / 2;
    eyeGroup.add(ring);
  }
  const medBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 3.5, 12),
    new THREE.MeshBasicMaterial({
      color: 0x66eeff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  medBeam.position.set(0, 1.8, 0);
  eyeGroup.add(medBeam);
  group.add(eyeGroup);

  // Fiber path (connect) — dashed glowing segments
  const fiberGroup = new THREE.Group();
  const fiberMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fiberPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    fiberPts.push(
      new THREE.Vector3(-8 + u * 16, -0.2 + Math.sin(u * Math.PI * 2) * 0.4, -4 + Math.cos(u * Math.PI) * 1.2),
    );
  }
  const fiberGeom = new THREE.BufferGeometry().setFromPoints(fiberPts);
  const fiberLine = new THREE.Line(
    fiberGeom,
    new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    }),
  );
  fiberGroup.add(fiberLine);
  // Pulse node
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), fiberMat);
  fiberGroup.add(pulse);
  group.add(fiberGroup);

  // Sparks (industrial)
  const sparkCount = 80;
  const sparkPos = new Float32Array(sparkCount * 3);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      color: 0xffaa66,
      size: 0.06,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  group.add(sparks);

  // Soft vignette light
  const key = new THREE.PointLight(0xff4466, 0, 20);
  key.position.set(0, 3, 2);
  group.add(key);
  const fill = new THREE.PointLight(0x00f0ff, 0, 18);
  fill.position.set(4, 2, -2);
  group.add(fill);

  const setPhase = (phase: number, t: number) => {
    // phase continuous 0–4 driven by prologue progress
    const cut = smoothstep(0.15, 0.45, phase);
    const heal = smoothstep(0.4, 0.7, phase);
    const link = smoothstep(0.65, 0.95, phase);

    indMat.opacity = cut * (1 - heal * 0.85) * 0.9;
    (indHalo.material as THREE.MeshBasicMaterial).opacity = cut * (1 - heal * 0.85) * 0.28;
    kerfMat.opacity = cut * 0.7;
    (plate.material as THREE.MeshStandardMaterial).emissiveIntensity = cut * 0.35;
    key.intensity = cut * 2.2 * (1 - link * 0.5);

    // Kerf travels along plate
    kerf.position.x = THREE.MathUtils.lerp(-2.2, 2.2, (Math.sin(t * 0.7) * 0.5 + 0.5) * cut);
    indBeam.position.x = kerf.position.x;
    indHalo.position.x = kerf.position.x;
    head.position.x = kerf.position.x;

    // Sparks near kerf
    const sp = sparks.material as THREE.PointsMaterial;
    sp.opacity = cut * 0.85 * (1 - heal);
    const arr = sparkGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < sparkCount; i++) {
      const a = t * 3 + i;
      arr[i * 3] = kerf.position.x + Math.sin(a) * 0.3;
      arr[i * 3 + 1] = -1.1 + Math.abs(Math.sin(a * 2.1)) * 0.8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4 * cut;
    }
    sparkGeo.attributes.position.needsUpdate = true;

    // Medical rings
    eyeGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshBasicMaterial) {
        if (obj.geometry.type === "CylinderGeometry") {
          obj.material.opacity = heal * 0.85;
        } else {
          obj.material.opacity = heal * 0.55;
        }
      }
    });
    fill.intensity = heal * 1.8 + link * 1.2;
    eyeGroup.rotation.y = t * 0.15;
    eyeGroup.scale.setScalar(0.85 + heal * 0.25);

    // Fiber
    const fl = fiberLine.material as THREE.LineBasicMaterial;
    fl.opacity = link * 0.85;
    fiberMat.opacity = link * 0.95;
    const u = (t * 0.25) % 1;
    const idx = Math.floor(u * (fiberPts.length - 1));
    const p = fiberPts[idx];
    pulse.position.copy(p);
    pulse.scale.setScalar(0.8 + Math.sin(t * 8) * 0.3);

    // Fade plate away into heal/link
    plate.material.opacity = 1;
    (plate.material as THREE.MeshStandardMaterial).transparent = true;
    (plate.material as THREE.MeshStandardMaterial).opacity = 1 - heal * 0.85;
    head.visible = cut > 0.05 && heal < 0.9;
  };

  return {
    group,
    setPhase,
    setVisible: (v) => {
      group.visible = v;
    },
  };
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
