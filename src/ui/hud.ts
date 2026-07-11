import { STEPS, type StoryStep } from "../story/steps";
import type { LaserParams, LaserState } from "../sim/laserModel";
import { statusCopy } from "../sim/laserModel";

export type HudHandlers = {
  onStep: (index: number) => void;
  onParams: (partial: Partial<LaserParams>) => void;
  onAutoAlign: () => void;
  onReset: () => void;
};

export type Hud = {
  setStep: (index: number) => void;
  setStatus: (state: LaserState, params: LaserParams) => void;
  syncSliders: (params: LaserParams) => void;
};

export function mountHud(handlers: HudHandlers): Hud {
  const title = el<HTMLElement>("#story-title");
  const formula = el<HTMLElement>("#story-formula");
  const dots = el<HTMLOListElement>("#step-dots");
  const prev = el<HTMLButtonElement>("#prev-step");
  const next = el<HTMLButtonElement>("#next-step");
  const pump = el<HTMLInputElement>("#pump");
  const alignment = el<HTMLInputElement>("#alignment");
  const leak = el<HTMLInputElement>("#leak");
  const status = el<HTMLElement>("#status-line");
  const autoAlign = el<HTMLButtonElement>("#auto-align");
  const reset = el<HTMLButtonElement>("#reset-sim");

  let stepIndex = 0;

  dots.innerHTML = "";
  STEPS.forEach((step, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = step.title;
    btn.setAttribute("aria-label", `Principle ${i + 1}: ${step.title}`);
    btn.addEventListener("click", () => handlers.onStep(i));
    li.appendChild(btn);
    dots.appendChild(li);
  });

  const paintStep = (index: number) => {
    stepIndex = index;
    const step: StoryStep = STEPS[index];
    title.textContent = step.title;
    formula.textContent = step.formula;

    const buttons = dots.querySelectorAll("button");
    buttons.forEach((b, i) => {
      if (i === index) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });

    prev.disabled = index <= 0;
    next.disabled = index >= STEPS.length - 1;
  };

  prev.addEventListener("click", () => handlers.onStep(stepIndex - 1));
  next.addEventListener("click", () => handlers.onStep(stepIndex + 1));

  pump.addEventListener("input", () => {
    handlers.onParams({ pump: Number(pump.value) });
  });
  alignment.addEventListener("input", () => {
    handlers.onParams({ alignment: Number(alignment.value) });
  });
  leak.addEventListener("input", () => {
    handlers.onParams({ outputLeak: Number(leak.value) });
  });
  autoAlign.addEventListener("click", () => handlers.onAutoAlign());
  reset.addEventListener("click", () => handlers.onReset());

  paintStep(0);

  return {
    setStep: paintStep,
    setStatus: (state, params) => {
      status.textContent = statusCopy(state, params);
      status.classList.toggle("lasing", state.aboveThreshold);
    },
    syncSliders: (params) => {
      pump.value = String(params.pump);
      alignment.value = String(params.alignment);
      leak.value = String(params.outputLeak);
    },
  };
}

function el<T extends Element>(sel: string): T {
  const node = document.querySelector(sel);
  if (!node) throw new Error(`Missing element ${sel}`);
  return node as T;
}
