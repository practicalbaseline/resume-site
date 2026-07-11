import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type SceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
};

export function createScene(canvas: HTMLCanvasElement): SceneBundle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.FogExp2(0x05070a, 0.035);

  const camera = new THREE.PerspectiveCamera(
    42,
    canvas.clientWidth / Math.max(canvas.clientHeight, 1),
    0.1,
    120,
  );
  camera.position.set(6.5, 2.2, 7.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const amb = new THREE.AmbientLight(0x6a7380, 0.35);
  scene.add(amb);
  const key = new THREE.DirectionalLight(0xc8d0dc, 0.55);
  key.position.set(4, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x00f0ff, 0.15);
  rim.position.set(-6, 2, -4);
  scene.add(rim);

  // Faint ground grid for scale
  const grid = new THREE.GridHelper(40, 40, 0x1a1f2a, 0x12161e);
  grid.position.y = -1.6;
  const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const m of mats) {
    m.transparent = true;
    m.opacity = 0.35;
  }
  scene.add(grid);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 0.15, 0);
  controls.update();

  return { scene, camera, renderer, controls };
}

export function resizeRenderer(
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
): void {
  const w = canvas.clientWidth;
  const h = Math.max(canvas.clientHeight, 1);
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
