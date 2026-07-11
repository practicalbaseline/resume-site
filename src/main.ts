import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { createScene, resizeRenderer } from "./scene/createScene";
import { createCavity } from "./scene/cavity";
import { createBeam } from "./scene/beam";
import { createAtoms } from "./scene/atoms";
import { createPhotons } from "./scene/photons";
import { createGoodScene } from "./scene/goodScene";
import {
  createInitialState,
  defaultParams,
  stepLaser,
  type LaserParams,
  type LaserState,
} from "./sim/laserModel";
import { STEPS } from "./story/steps";
import { mountHud } from "./ui/hud";
import { mountSchematic } from "./ui/schematic";
import { mountTeachPanels } from "./ui/teach";
import { mountPrologue } from "./ui/prologue";
import type { LaserPartId } from "./data/parts";

mountTeachPanels();

const canvasEl = document.querySelector<HTMLCanvasElement>("#c");
if (!canvasEl) throw new Error("Canvas #c missing");
const canvas: HTMLCanvasElement = canvasEl;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lowPower =
  reducedMotion ||
  /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ||
  (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4);

const { scene, camera, renderer, controls } = createScene(canvas);
const cavity = createCavity();
const beam = createBeam();
const atoms = createAtoms();
const photons = createPhotons();
const good = createGoodScene();

scene.add(cavity.group);
scene.add(beam.group);
scene.add(atoms.points);
scene.add(photons.points);
scene.add(good.group);

// Lab hardware hidden during prologue
cavity.group.visible = false;
beam.group.visible = false;
atoms.points.visible = false;
photons.points.visible = false;
good.setVisible(true);
controls.enabled = false;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
  lowPower ? 0.55 : 1.15,
  0.45,
  0.55,
);
composer.addPass(bloom);

let params: LaserParams = defaultParams();
let state: LaserState = createInitialState();
let stepIndex = 0;
let paused = false;
let storyDrivingCamera = true;
let cameraTarget = new THREE.Vector3(6.5, 2.2, 7.5);
let userOrbited = false;
let selectedPart: LaserPartId | null = null;
let inPrologue = true;

// Opening camera — wide cinematic
const prologueCamFrom = new THREE.Vector3(3.5, 4.2, 11);
const prologueCamTo = new THREE.Vector3(-2, 2.5, 8);
camera.position.copy(prologueCamFrom);
controls.target.set(0, -0.2, 0);

const schematic = mountSchematic();
const prologue = mountPrologue({ reducedMotion });

const hud = mountHud({
  onStep: (i) => goToStep(i),
  onParams: (partial) => {
    if (inPrologue) return;
    params = { ...params, ...partial };
    storyDrivingCamera = false;
  },
  onAutoAlign: () => {
    if (inPrologue) return;
    params = { ...params, alignment: 1 };
    hud.syncSliders(params);
  },
  onReset: () => {
    if (inPrologue) return;
    state = createInitialState();
    params = { ...defaultParams(), ...STEPS[stepIndex].params };
    hud.syncSliders(params);
    applyStepCamera(stepIndex, true);
  },
});

function enterLab(): void {
  inPrologue = false;
  good.setVisible(false);
  cavity.group.visible = true;
  beam.group.visible = true;
  atoms.points.visible = true;
  photons.points.visible = true;
  controls.enabled = true;
  goToStep(0);
  applyStepCamera(0, true);
  // Soft bloom back to lab values
  bloom.threshold = 0.72;
}

prologue.onFinished(enterLab);

function goToStep(i: number): void {
  if (inPrologue) return;
  if (i < 0 || i >= STEPS.length) return;
  stepIndex = i;
  const step = STEPS[i];
  params = { ...params, ...step.params };
  hud.setStep(i);
  hud.syncSliders(params);
  applyStepCamera(i, false);
  if (i === 0) state = createInitialState();
}

function applyStepCamera(i: number, instant: boolean): void {
  const c = STEPS[i].camera;
  cameraTarget.set(c.x, c.y, c.z);
  storyDrivingCamera = true;
  userOrbited = false;
  if (instant || reducedMotion) {
    camera.position.copy(cameraTarget);
    controls.target.set(0, 0.15, 0);
    controls.update();
  }
}

controls.addEventListener("start", () => {
  if (inPrologue) return;
  userOrbited = true;
  storyDrivingCamera = false;
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown: { x: number; y: number; t: number } | null = null;

function setPointerFromEvent(e: PointerEvent): void {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickPart(): LaserPartId | null {
  if (inPrologue) return null;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(cavity.pickables, false);
  for (const hit of hits) {
    const id = hit.object.userData.partId as LaserPartId | undefined;
    if (id) return id;
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  if (inPrologue || e.button !== 0) return;
  pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
});

canvas.addEventListener("pointerup", (e) => {
  if (inPrologue || !pointerDown || e.button !== 0) return;
  const dx = e.clientX - pointerDown.x;
  const dy = e.clientY - pointerDown.y;
  const dt = performance.now() - pointerDown.t;
  pointerDown = null;
  if (dx * dx + dy * dy > 36 || dt > 500) return;

  setPointerFromEvent(e);
  const id = pickPart();
  if (id) {
    selectedPart = id;
    cavity.setHighlight(id);
    schematic.open(id);
  } else {
    selectedPart = null;
    cavity.setHighlight(null);
    schematic.close();
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (inPrologue) {
    canvas.classList.remove("picking");
    return;
  }
  setPointerFromEvent(e);
  const id = pickPart();
  canvas.classList.toggle("picking", id !== null);
});

window.addEventListener("schematic:close", () => {
  selectedPart = null;
  cavity.setHighlight(null);
});

window.addEventListener("keydown", (e) => {
  if (inPrologue) return;
  if (e.key === "Escape") {
    schematic.close();
    selectedPart = null;
    cavity.setHighlight(null);
    return;
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    goToStep(stepIndex + 1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    goToStep(stepIndex - 1);
  } else if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    paused = !paused;
  }
});

let last = performance.now();
let statusAcc = 0;

function frame(now: number): void {
  requestAnimationFrame(frame);
  const rawDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  resizeRenderer(canvas, camera, renderer);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  composer.setSize(w, h);
  bloom.setSize(w, h);

  if (inPrologue) {
    prologue.tick(rawDt);
    const p = prologue.getProgress();
    good.setPhase(p, t);

    // Slow cinematic dolly
    camera.position.lerpVectors(prologueCamFrom, prologueCamTo, p);
    controls.target.set(
      THREE.MathUtils.lerp(0, 1.5, p * p),
      THREE.MathUtils.lerp(-0.2, 0.3, p),
      THREE.MathUtils.lerp(0, -1.2, p),
    );
    camera.lookAt(controls.target);
    bloom.strength = 0.9 + Math.sin(t * 0.8) * 0.15 + p * 0.5;

    if (document.visibilityState !== "hidden") composer.render();
    return;
  }

  const dt = paused ? 0 : rawDt;

  if (dt > 0) {
    state = stepLaser(state, params, dt);
  }

  cavity.setAlignment(params.alignment);
  cavity.setPumpGlow(params.pump, state.inversion);
  if (selectedPart) cavity.setHighlight(selectedPart);
  beam.setIntensity(state.intensity, state.output, params.alignment);
  atoms.update(state.inversion, params.pump, t);
  photons.update(dt || 0.016, {
    spontaneous: paused ? 0 : state.spontaneous,
    stimulated: paused ? 0 : state.stimulated,
    intensity: state.intensity,
    alignment: params.alignment,
    reducedMotion: reducedMotion || lowPower,
  });

  bloom.strength = (lowPower ? 0.4 : 0.65) + state.output * (lowPower ? 0.5 : 1.1);

  if (storyDrivingCamera && !userOrbited && !reducedMotion) {
    camera.position.lerp(cameraTarget, 1 - Math.exp(-2.2 * rawDt));
    controls.target.lerp(new THREE.Vector3(0, 0.15, 0), 1 - Math.exp(-2.2 * rawDt));
  }
  controls.update();

  statusAcc += rawDt;
  if (statusAcc > 0.12) {
    statusAcc = 0;
    hud.setStatus(state, params);
  }

  if (document.visibilityState === "hidden") return;
  composer.render();
}

requestAnimationFrame(frame);

window.addEventListener("resize", () => {
  resizeRenderer(canvas, camera, renderer);
  composer.setSize(canvas.clientWidth, canvas.clientHeight);
});
