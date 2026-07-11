import {
  PROLOGUE_CARDS,
  PROLOGUE_CTA,
  PROLOGUE_SKIP_LABEL,
  type PrologueCard,
} from "../data/prologue";

export type PrologueApi = {
  /** 0–1 overall progress through cards */
  getProgress: () => number;
  /** Discrete phase 0–1 for scene (maps cards → visual acts) */
  getScenePhase: () => number;
  isActive: () => boolean;
  /** Call each frame with dt seconds */
  tick: (dt: number) => void;
  skip: () => void;
  onFinished: (cb: () => void) => void;
};

export function mountPrologue(opts: {
  reducedMotion: boolean;
}): PrologueApi {
  const root = document.querySelector<HTMLElement>("#prologue");
  const kicker = document.querySelector<HTMLElement>("#prologue-kicker");
  const line = document.querySelector<HTMLElement>("#prologue-line");
  const skipBtn = document.querySelector<HTMLButtonElement>("#prologue-skip");
  const ctaBtn = document.querySelector<HTMLButtonElement>("#prologue-cta");
  const letterTop = document.querySelector<HTMLElement>("#letterbox-top");
  const letterBot = document.querySelector<HTMLElement>("#letterbox-bottom");

  if (!root || !kicker || !line || !skipBtn || !ctaBtn || !letterTop || !letterBot) {
    throw new Error("Prologue markup missing");
  }

  const rootEl = root;
  const kickerEl = kicker;
  const lineEl = line;
  const skipEl = skipBtn;
  const ctaEl = ctaBtn;
  const letterTopEl = letterTop;
  const letterBotEl = letterBot;

  const cards: PrologueCard[] = PROLOGUE_CARDS;
  let cardIndex = 0;
  let cardTime = 0;
  let active = true;
  let finishing = false;
  let progress = 0;
  const finishedCbs: Array<() => void> = [];

  skipEl.textContent = PROLOGUE_SKIP_LABEL;
  ctaEl.textContent = PROLOGUE_CTA;
  ctaEl.hidden = true;

  const holdScale = opts.reducedMotion ? 0.35 : 1;

  function paintCard(i: number): void {
    const c = cards[i];
    if (!c) return;
    kickerEl.textContent = c.kicker ?? "";
    kickerEl.hidden = !c.kicker;
    lineEl.textContent = c.line;
    lineEl.classList.remove("enter");
    // reflow for animation restart
    void lineEl.offsetWidth;
    lineEl.classList.add("enter");
    if (!c.line) {
      lineEl.classList.add("empty");
    } else {
      lineEl.classList.remove("empty");
    }
  }

  function totalDuration(): number {
    return cards.reduce((s, c) => s + c.hold * holdScale, 0);
  }

  function elapsedBefore(i: number): number {
    let s = 0;
    for (let k = 0; k < i; k++) s += cards[k].hold * holdScale;
    return s;
  }

  function finish(): void {
    if (!active) return;
    active = false;
    finishing = true;
    rootEl.classList.add("exit");
    document.body.classList.remove("mode-prologue");
    document.body.classList.add("mode-lab");
    window.setTimeout(() => {
      rootEl.hidden = true;
      rootEl.setAttribute("aria-hidden", "true");
      letterTopEl.classList.add("stow");
      letterBotEl.classList.add("stow");
      for (const cb of finishedCbs) cb();
    }, opts.reducedMotion ? 200 : 900);
  }

  function showCta(): void {
    ctaEl.hidden = false;
    ctaEl.classList.add("show");
    skipEl.hidden = true;
  }

  paintCard(0);
  document.body.classList.add("mode-prologue");
  document.body.classList.remove("mode-lab");
  rootEl.hidden = false;
  rootEl.setAttribute("aria-hidden", "false");

  if (opts.reducedMotion) {
    // Jump to thesis card, show CTA quickly
    cardIndex = cards.length - 2;
    paintCard(cardIndex);
    showCta();
  }

  skipEl.addEventListener("click", () => finish());
  ctaEl.addEventListener("click", () => finish());

  window.addEventListener("keydown", (e) => {
    if (!active) return;
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
      if (e.key === " " && !ctaEl.hidden) {
        e.preventDefault();
        finish();
      } else if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        finish();
      }
    }
  });

  return {
    getProgress: () => progress,
    getScenePhase: () => {
      // Map progress to visual acts: silence→cut→heal→link→hold
      return progress;
    },
    isActive: () => active,
    tick: (dt: number) => {
      if (!active || finishing) return;

      if (opts.reducedMotion) {
        progress = 0.85;
        return;
      }

      cardTime += dt;
      const hold = cards[cardIndex].hold * holdScale;
      const total = totalDuration();
      const elapsed = elapsedBefore(cardIndex) + Math.min(cardTime, hold);
      progress = total > 0 ? Math.min(1, elapsed / total) : 1;

      if (cardTime >= hold) {
        cardTime = 0;
        if (cardIndex < cards.length - 1) {
          cardIndex += 1;
          paintCard(cardIndex);
          if (cardIndex === cards.length - 1) {
            showCta();
          }
        }
      }

      // Auto-advance off last card after hold if user doesn't click
      if (cardIndex === cards.length - 1 && cardTime >= hold * 0.95) {
        // stay on CTA until click — don't auto-finish (user agency)
        cardTime = hold * 0.95;
        progress = 1;
      }
    },
    skip: finish,
    onFinished: (cb) => {
      finishedCbs.push(cb);
    },
  };
}
