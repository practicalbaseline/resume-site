import {
  BackSide,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";

const CHUNK = 42;
const SEGMENTS = 22;
const GRID = 3;
const SPAN = 120;
const EYE = 1.72;
const MAX_PIXEL_RATIO = 1.5;

const SUN = new Vector3(0.52, 0.34, -0.46).normalize();

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function sandHeight(x: number, z: number): number {
  const nx = x / CHUNK;
  const nz = z / CHUNK;
  const tau = Math.PI * 2;
  return (
    Math.sin(tau * nx) * Math.cos(tau * nz) * 0.62 +
    Math.sin(tau * 2 * nx + 1.7) * 0.24 +
    Math.cos(tau * 2 * nz + 0.4) * 0.2 +
    Math.sin(tau * (nx + nz)) * 0.14
  );
}

function wrapNear(base: number, cam: number, span: number): number {
  let d = base - cam;
  d -= Math.round(d / span) * span;
  return cam + d;
}

function linearColor(hex: number): Vector3 {
  const color = new Color(hex);
  return new Vector3(color.r, color.g, color.b);
}

type Scatter = { x: number; z: number; rot: number; s: number; h: number };

function scatter(count: number, salt: number): Scatter[] {
  const out: Scatter[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: hash(i * 1.17 + salt) * SPAN,
      z: hash(i * 2.41 + salt * 3.1) * SPAN,
      rot: hash(i * 4.3 + salt * 9) * Math.PI * 2,
      s: 0.65 + hash(i * 8.2 + salt + 2) * 1.15,
      h: 0.75 + hash(i * 6.4 + salt + 5) * 1.35,
    });
  }
  return out;
}

function displacePlane(geo: PlaneGeometry, heightAt: (x: number, z: number) => number, shade: boolean): void {
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = shade ? new Float32Array(pos.count * 3) : null;
  for (let i = 0; i < pos.count; i++) {
    const y = heightAt(pos.getX(i), pos.getZ(i));
    pos.setY(i, y);
    if (colors) {
      const tone = 0.84 + (y + 0.5) * 0.16;
      colors[i * 3] = tone;
      colors[i * 3 + 1] = tone * 0.97;
      colors[i * 3 + 2] = tone * 0.9;
    }
  }
  if (colors) geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
}

const skyVertex = `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const skyFragment = `
uniform vec3 sunDir;
uniform vec3 skyTop;
uniform vec3 skyMid;
uniform vec3 skyHor;
uniform vec3 dust;
uniform vec3 sunHot;
uniform vec3 sunLimb;
varying vec3 vDir;
void main() {
  vec3 dir = normalize(vDir);
  float h = clamp(dir.y, -0.05, 1.0);
  vec3 col = mix(skyHor, skyMid, smoothstep(0.0, 0.28, h));
  col = mix(col, skyTop, smoothstep(0.18, 0.85, h));
  col = mix(dust, col, smoothstep(-0.12, 0.08, dir.y));
  float d = dot(dir, sunDir);
  float halo = pow(max(d, 0.0), 5.0);
  float glow = pow(max(d, 0.0), 22.0);
  col += sunLimb * halo * 0.42 + sunHot * glow * 0.28;
  float limb = smoothstep(0.9972, 0.9986, d);
  float core = smoothstep(0.9986, 0.99945, d);
  vec3 sunCol = mix(sunLimb, sunHot, core);
  col = mix(col, sunCol, limb);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function startDesert(view: HTMLElement): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new WebGLRenderer({ antialias: true, alpha: false });
  if (!renderer.getContext()) {
    renderer.dispose();
    return () => {};
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0xe6c4a0, 1);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  view.appendChild(canvas);

  const scene = new Scene();
  scene.fog = new Fog(0xe6c4a0, 18, 98);

  const camera = new PerspectiveCamera(68, 1, 0.08, 360);
  camera.rotation.order = "YXZ";

  const skyMat = new ShaderMaterial({
    uniforms: {
      sunDir: { value: SUN.clone() },
      skyTop: { value: linearColor(0x4c92c8) },
      skyMid: { value: linearColor(0x8ec0e2) },
      skyHor: { value: linearColor(0xe8c7a2) },
      dust: { value: linearColor(0xd7b184) },
      sunHot: { value: linearColor(0xfff7e8) },
      sunLimb: { value: linearColor(0xf08a3c) },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const sky = new Mesh(new SphereGeometry(1, 20, 12), skyMat);
  sky.scale.setScalar(280);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  scene.add(new HemisphereLight(0xc5e2f6, 0xc4a36e, 0.72));
  const sunLight = new DirectionalLight(0xfff1d4, 2.35);
  sunLight.position.set(SUN.x * 80, SUN.y * 80, SUN.z * 80);
  scene.add(sunLight);

  const groundGeo = new PlaneGeometry(CHUNK, CHUNK, SEGMENTS, SEGMENTS);
  displacePlane(groundGeo, sandHeight, true);
  const groundMat = new MeshLambertMaterial({ color: 0xd7b48a, vertexColors: true, flatShading: true });
  const chunks: Mesh[] = [];
  const half = (GRID - 1) / 2;
  for (let gz = -half; gz <= half; gz++) {
    for (let gx = -half; gx <= half; gx++) {
      const mesh = new Mesh(groundGeo, groundMat);
      mesh.position.set(gx * CHUNK, 0, gz * CHUNK);
      scene.add(mesh);
      chunks.push(mesh);
    }
  }

  const duneGeo = new PlaneGeometry(96, 40, 14, 4);
  displacePlane(
    duneGeo,
    (x, z) => Math.sin(x * 0.085) * 3.4 + Math.cos(z * 0.07 + 0.6) * 2.3 + Math.sin((x + z) * 0.05) * 1.6,
    false,
  );
  const duneMat = new MeshLambertMaterial({ color: 0xc49a62, flatShading: true });
  const duneAnchor = new Object3D();
  scene.add(duneAnchor);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dune = new Mesh(duneGeo, duneMat);
    dune.position.set(Math.cos(angle) * 70, -1.2, Math.sin(angle) * 70);
    dune.rotation.y = angle * 0.65;
    duneAnchor.add(dune);
  }

  const rockGeo = new IcosahedronGeometry(1, 0);
  const rockMat = new MeshLambertMaterial({ color: 0x8a7360, flatShading: true });
  const cactusGeo = new CylinderGeometry(0.18, 0.24, 1, 6);
  const armGeo = new CylinderGeometry(0.1, 0.12, 1, 5);
  const plantMat = new MeshLambertMaterial({ color: 0x3f6e48, flatShading: true });
  const shrubGeo = new ConeGeometry(0.7, 1, 5);
  const shrubMat = new MeshLambertMaterial({ color: 0x6a7840, flatShading: true });

  const rocks = scatter(28, 11);
  const cacti = scatter(16, 47);
  const shrubs = scatter(22, 83);
  const rockMesh = new InstancedMesh(rockGeo, rockMat, rocks.length);
  const cactusMesh = new InstancedMesh(cactusGeo, plantMat, cacti.length);
  const armMesh = new InstancedMesh(armGeo, plantMat, cacti.length);
  const armMeshB = new InstancedMesh(armGeo, plantMat, cacti.length);
  const shrubMesh = new InstancedMesh(shrubGeo, shrubMat, shrubs.length);
  scene.add(rockMesh, cactusMesh, armMesh, armMeshB, shrubMesh);

  const tint = new Color();
  for (let i = 0; i < rocks.length; i++) {
    tint.set(hash(i + 3) > 0.5 ? 0x8d7762 : 0x6e5c4c);
    rockMesh.setColorAt(i, tint);
  }
  if (rockMesh.instanceColor) rockMesh.instanceColor.needsUpdate = true;

  const dummy = new Object3D();

  function placeProps(camX: number, camZ: number): void {
    for (let i = 0; i < rocks.length; i++) {
      const spec = rocks[i];
      const x = wrapNear(spec.x, camX, SPAN);
      const z = wrapNear(spec.z, camZ, SPAN);
      const y = sandHeight(x, z);
      const rh = 0.22 * spec.s;
      dummy.position.set(x, y + rh * 0.28, z);
      dummy.rotation.set(spec.h, spec.rot, spec.s);
      dummy.scale.set(spec.s * 0.55, rh, spec.s * 0.48);
      dummy.updateMatrix();
      rockMesh.setMatrixAt(i, dummy.matrix);
    }
    rockMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < cacti.length; i++) {
      const spec = cacti[i];
      const x = wrapNear(spec.x, camX, SPAN);
      const z = wrapNear(spec.z, camZ, SPAN);
      const y = sandHeight(x, z);
      const trunkH = 1.15 * spec.h;
      dummy.position.set(x, y + trunkH * 0.5, z);
      dummy.rotation.set(0, spec.rot, 0);
      dummy.scale.set(spec.s * 0.5, trunkH, spec.s * 0.5);
      dummy.updateMatrix();
      cactusMesh.setMatrixAt(i, dummy.matrix);

      const armH = trunkH * 0.38;
      dummy.scale.set(spec.s * 0.28, armH, spec.s * 0.28);
      dummy.rotation.order = "YXZ";
      dummy.rotation.set(0, spec.rot, -1.05);
      dummy.position.set(x + Math.cos(spec.rot) * 0.22, y + trunkH * 0.62, z + Math.sin(spec.rot) * 0.22);
      dummy.updateMatrix();
      armMesh.setMatrixAt(i, dummy.matrix);

      dummy.rotation.set(0, spec.rot + Math.PI, -1.05);
      dummy.position.set(x + Math.cos(spec.rot + Math.PI) * 0.2, y + trunkH * 0.5, z + Math.sin(spec.rot + Math.PI) * 0.2);
      dummy.updateMatrix();
      armMeshB.setMatrixAt(i, dummy.matrix);
      dummy.rotation.order = "XYZ";
    }
    cactusMesh.instanceMatrix.needsUpdate = true;
    armMesh.instanceMatrix.needsUpdate = true;
    armMeshB.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < shrubs.length; i++) {
      const spec = shrubs[i];
      const x = wrapNear(spec.x, camX, SPAN);
      const z = wrapNear(spec.z, camZ, SPAN);
      const y = sandHeight(x, z);
      const sh = 0.42 * spec.h;
      dummy.position.set(x, y + sh * 0.45, z);
      dummy.rotation.set(0, spec.rot, 0);
      dummy.scale.set(spec.s * 0.85, sh, spec.s * 0.85);
      dummy.updateMatrix();
      shrubMesh.setMatrixAt(i, dummy.matrix);
    }
    shrubMesh.instanceMatrix.needsUpdate = true;
  }

  let camX = 6;
  let camZ = 4;
  let yaw = Math.atan2(-SUN.x, -SUN.z);
  let pitch = 0.14;
  let bob = 0;
  const held = { forward: false, back: false, left: false, right: false };
  let looking = false;
  let lastX = 0;
  let lastY = 0;
  let last = performance.now();
  let raf = 0;
  let stopped = false;

  function resize(): void {
    const w = Math.max(1, view.clientWidth);
    const h = Math.max(1, view.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function placeChunks(): void {
    const cx = Math.round(camX / CHUNK);
    const cz = Math.round(camZ / CHUNK);
    let i = 0;
    for (let gz = -half; gz <= half; gz++) {
      for (let gx = -half; gx <= half; gx++) {
        chunks[i].position.set((cx + gx) * CHUNK, 0, (cz + gz) * CHUNK);
        i += 1;
      }
    }
  }

  function renderScene(dt: number, move: boolean): void {
    if (move) {
      if (held.left) yaw += 1.15 * dt;
      if (held.right) yaw -= 1.15 * dt;
      let speed = 4.4;
      if (held.back) speed = -3.3;
      else if (held.forward) speed = 7.4;
      camX += -Math.sin(yaw) * speed * dt;
      camZ += -Math.cos(yaw) * speed * dt;
      bob += dt * 9.2;
    }
    const ground = sandHeight(camX, camZ);
    const bobY = move ? Math.sin(bob) * 0.04 : 0;
    const bobPitch = move ? Math.sin(bob * 2) * 0.006 : 0;
    camera.position.set(camX, ground + EYE + bobY, camZ);
    camera.rotation.y = yaw;
    camera.rotation.x = pitch + bobPitch;
    placeChunks();
    placeProps(camX, camZ);
    duneAnchor.position.set(camX, 0, camZ);
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
  }

  function frame(now: number): void {
    if (stopped) return;
    if (document.hidden) {
      raf = 0;
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    renderScene(dt, true);
    raf = requestAnimationFrame(frame);
  }

  function onKey(event: KeyboardEvent, down: boolean): void {
    let slot: keyof typeof held | null = null;
    if (event.code === "KeyW" || event.code === "ArrowUp") slot = "forward";
    else if (event.code === "KeyS" || event.code === "ArrowDown") slot = "back";
    else if (event.code === "KeyA" || event.code === "ArrowLeft") slot = "left";
    else if (event.code === "KeyD" || event.code === "ArrowRight") slot = "right";
    if (!slot) return;
    event.preventDefault();
    held[slot] = down;
  }
  function onKeyDown(event: KeyboardEvent): void {
    onKey(event, true);
  }
  function onKeyUp(event: KeyboardEvent): void {
    onKey(event, false);
  }
  function clearHeld(): void {
    held.forward = false;
    held.back = false;
    held.left = false;
    held.right = false;
  }
  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    looking = true;
    lastX = event.clientX;
    lastY = event.clientY;
    view.classList.add("is-looking");
    view.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent): void {
    if (!looking) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    yaw -= dx * 0.0028;
    pitch = Math.max(-0.45, Math.min(0.62, pitch - dy * 0.0022));
  }
  function onPointerUp(event: PointerEvent): void {
    looking = false;
    view.classList.remove("is-looking");
    if (view.hasPointerCapture(event.pointerId)) view.releasePointerCapture(event.pointerId);
  }
  function onVisibility(): void {
    if (stopped || reduced) return;
    if (!document.hidden && raf === 0) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  const ro = new ResizeObserver(() => {
    resize();
    if (reduced) renderScene(0, false);
  });
  ro.observe(view);
  resize();
  renderScene(0, false);

  if (!reduced) {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearHeld);
    view.addEventListener("pointerdown", onPointerDown);
    view.addEventListener("pointermove", onPointerMove);
    view.addEventListener("pointerup", onPointerUp);
    view.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);
  }

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", clearHeld);
    view.removeEventListener("pointerdown", onPointerDown);
    view.removeEventListener("pointermove", onPointerMove);
    view.removeEventListener("pointerup", onPointerUp);
    view.removeEventListener("pointercancel", onPointerUp);
    document.removeEventListener("visibilitychange", onVisibility);
    groundGeo.dispose();
    groundMat.dispose();
    duneGeo.dispose();
    duneMat.dispose();
    rockGeo.dispose();
    rockMat.dispose();
    cactusGeo.dispose();
    armGeo.dispose();
    plantMat.dispose();
    shrubGeo.dispose();
    shrubMat.dispose();
    sky.geometry.dispose();
    skyMat.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
