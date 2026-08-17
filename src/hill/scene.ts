import { HILL_MARKS, marksHtml } from "./marks";
import { farRidge, hash, height, normal, slope, tangent } from "./terrain";

const R = 1;
const GRAVITY = 12.5;
const DRAG = 0.07;
const MIN_SPEED = 5.2;
const MAX_SPEED = 14.5;
const HOP = 7.1;
const AIR_G = 24;

type Dust = {
  live: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function makeDust(n: number): Dust[] {
  return Array.from({ length: n }, () => ({
    live: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 1,
  }));
}

function spawnDust(pool: Dust[], init: Omit<Dust, "live">): void {
  for (const p of pool) {
    if (p.live) continue;
    Object.assign(p, init, { live: true });
    return;
  }
}

export function startHill(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="hill-stage">
      <canvas class="hill-canvas" aria-hidden="true"></canvas>
      <button type="button" class="hill-hop" aria-label="Hop"></button>
      ${marksHtml(HILL_MARKS)}
    </div>
  `;

  const canvasNode = root.querySelector("canvas.hill-canvas");
  const hopNode = root.querySelector("button.hill-hop");
  if (!(canvasNode instanceof HTMLCanvasElement)) throw new Error("canvas missing");
  if (!(hopNode instanceof HTMLButtonElement)) throw new Error("hop missing");
  const canvas: HTMLCanvasElement = canvasNode;
  const hopBtn: HTMLButtonElement = hopNode;
  const ctxMaybe = canvas.getContext("2d", { alpha: false });
  if (!ctxMaybe) throw new Error("2d context missing");
  const ctx: CanvasRenderingContext2D = ctxMaybe;

  const reduced = prefersReducedMotion();
  const dust = makeDust(180);

  let w = 0;
  let h = 0;
  let dpr = 1;
  let ppu = 80;

  let contactX = 2;
  let speed = 7;
  let rot = 0.4;
  let air = false;
  let cx = 0;
  let cy = 0;
  let vx = 0;
  let vy = 0;
  let camX = 2;
  let camY = height(2);
  let last = performance.now();
  let raf = 0;
  let stopped = false;
  let hopCool = 0;

  function groundedCenter(): { x: number; y: number } {
    const n = normal(contactX);
    return {
      x: contactX + n.nx * R,
      y: height(contactX) + n.ny * R,
    };
  }

  function layout(): void {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ppu = Math.min(w, h) * 0.17;
  }

  function toScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: (wx - camX) * ppu + w * 0.3,
      y: h * 0.5 - (wy - camY) * ppu,
    };
  }

  function hop(): void {
    if (air || hopCool > 0) return;
    const t = tangent(contactX);
    const n = normal(contactX);
    const c = groundedCenter();
    cx = c.x;
    cy = c.y;
    vx = speed * t.tx + n.nx * 0.35;
    vy = speed * t.ty + n.ny * HOP;
    air = true;
    hopCool = 0.32;
  }

  function step(dt: number): void {
    hopCool = Math.max(0, hopCool - dt);
    const dts = dt * (reduced ? 0.45 : 1);

    if (!air) {
      const sl = slope(contactX);
      const accel = (GRAVITY * -sl) / Math.hypot(1, sl) - DRAG * speed;
      speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed + accel * dts));
      const t = tangent(contactX);
      contactX += speed * t.tx * dts;
      rot += (speed * dts) / R;
      const c = groundedCenter();
      cx = c.x;
      cy = c.y;
    } else {
      vy -= AIR_G * dts;
      cx += vx * dts;
      cy += vy * dts;
      rot += (Math.hypot(vx, vy) * dts) / R;
      const n = normal(cx);
      const groundCenterY = height(cx) + n.ny * R;
      if (cy <= groundCenterY + 0.02 && vy <= 0) {
        contactX = cx - n.nx * R;
        const t = tangent(contactX);
        speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, vx * t.tx + vy * t.ty));
        air = false;
        const c = groundedCenter();
        cx = c.x;
        cy = c.y;
      }
    }

    const targetCamX = cx + 0.55;
    const targetCamY = height(air ? cx : contactX) + 0.15;
    const follow = 1 - Math.exp(-dts * 5.5);
    camX += (targetCamX - camX) * follow;
    camY += (targetCamY - camY) * follow;

    if (!reduced && !air) {
      let left = 22 * dts * (speed / MAX_SPEED);
      while (left > 0) {
        if (Math.random() > Math.min(1, left)) break;
        left -= 1;
        const life = 0.28 + Math.random() * 0.4;
        spawnDust(dust, {
          x: contactX + (Math.random() - 0.5) * 0.3,
          y: height(contactX) + 0.05,
          vx: -speed * 0.3 + (Math.random() - 0.5) * 1.6,
          vy: 0.5 + Math.random() * 1.8,
          life,
          maxLife: life,
          size: 0.07 + Math.random() * 0.12,
        });
      }
    }

    for (const p of dust) {
      if (!p.live) continue;
      p.life -= dts;
      if (p.life <= 0) {
        p.live = false;
        continue;
      }
      p.x += p.vx * dts;
      p.y += p.vy * dts;
      p.vy -= 7 * dts;
      p.vx *= 1 - 1.3 * dts;
    }
  }

  function drawSky(): void {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1a2742");
    g.addColorStop(0.36, "#5c4e72");
    g.addColorStop(0.58, "#d46b42");
    g.addColorStop(0.78, "#f0b56a");
    g.addColorStop(1, "#e0a05a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const sunX = w * 0.76;
    const sunY = h * 0.22;
    const sun = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, h * 0.42);
    sun.addColorStop(0, "rgba(255, 232, 176, 0.95)");
    sun.addColorStop(0.07, "rgba(255, 196, 100, 0.5)");
    sun.addColorStop(0.2, "rgba(255, 140, 60, 0.12)");
    sun.addColorStop(1, "rgba(255, 120, 40, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffe9b8";
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.max(14, h * 0.018), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRidges(): void {
    const layers = [
      { p: 0.08, base: h * 0.38, color: "#3a334c", amp: 52 },
      { p: 0.16, base: h * 0.42, color: "#4a3d55", amp: 40 },
    ];
    for (const layer of layers) {
      ctx.beginPath();
      const step = 8;
      for (let sx = 0; sx <= w + step; sx += step) {
        const world = camX * layer.p + sx / (ppu * 0.55);
        const yy = layer.base - farRidge(world, layer.p * 12) * layer.amp * 0.35;
        if (sx === 0) ctx.moveTo(sx, yy);
        else ctx.lineTo(sx, yy);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = layer.color;
      ctx.fill();
    }
  }

  function sampleRange(): { x0: number; x1: number } {
    const pad = w / ppu + 2;
    return { x0: camX - pad * 0.45, x1: camX + pad * 0.85 };
  }

  function appendTerrain(x0: number, x1: number, lift = 0): void {
    const step = 0.07;
    for (let x = x0; x <= x1; x += step) {
      const p = toScreen(x, height(x) + lift);
      ctx.lineTo(p.x, p.y);
    }
  }

  function drawGround(): void {
    const { x0, x1 } = sampleRange();
    const first = toScreen(x0, height(x0));
    const last = toScreen(x1, height(x1));

    ctx.beginPath();
    ctx.moveTo(first.x, h + 20);
    ctx.lineTo(first.x, first.y);
    appendTerrain(x0 + 0.07, x1);
    ctx.lineTo(last.x, h + 20);
    ctx.closePath();

    const dirt = ctx.createLinearGradient(0, h * 0.3, 0, h);
    dirt.addColorStop(0, "#d4ae6a");
    dirt.addColorStop(0.22, "#b88842");
    dirt.addColorStop(0.55, "#7a4c24");
    dirt.addColorStop(1, "#3a2214");
    ctx.fillStyle = dirt;
    ctx.fill();

    // worn track
    ctx.beginPath();
    ctx.moveTo(toScreen(x0, height(x0) + 0.02).x, toScreen(x0, height(x0) + 0.02).y);
    appendTerrain(x0 + 0.07, x1, 0.02);
    ctx.strokeStyle = "rgba(70, 42, 20, 0.28)";
    ctx.lineWidth = R * ppu * 1.35;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toScreen(x0, height(x0) + 0.03).x, toScreen(x0, height(x0) + 0.03).y);
    appendTerrain(x0 + 0.07, x1, 0.03);
    ctx.strokeStyle = "rgba(40, 24, 12, 0.18)";
    ctx.lineWidth = R * ppu * 0.35;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    appendTerrain(x0 + 0.07, x1);
    ctx.strokeStyle = "rgba(235, 200, 120, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const gStep = 0.13;
    const start = Math.floor(x0 / gStep);
    const end = Math.ceil(x1 / gStep);
    ctx.lineWidth = 1.15;
    for (let i = start; i <= end; i++) {
      const x = i * gStep + (hash(i) - 0.5) * 0.05;
      const p = toScreen(x, height(x));
      const sl = Math.atan(slope(x));
      const len = (0.2 + hash(i + 3) * 0.32) * ppu;
      ctx.strokeStyle = `rgba(62, 36, 12, ${0.28 + hash(i + 4) * 0.25})`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(
        p.x + Math.sin(sl) * 5 + (hash(i + 5) - 0.4) * 7,
        p.y - Math.cos(sl) * len,
      );
      ctx.stroke();
    }

    for (let i = start; i <= end; i++) {
      if (hash(i + 90) > 0.045) continue;
      const x = i * gStep;
      const p = toScreen(x, height(x));
      const rw = (0.08 + hash(i + 91) * 0.12) * ppu;
      ctx.fillStyle = `rgb(${78 + hash(i) * 36}, ${62 + hash(i + 1) * 22}, ${48 + hash(i + 2) * 14})`;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - rw * 0.22, rw, rw * 0.5, hash(i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // fence posts for scale / speed
    const postStep = 3.4;
    const p0 = Math.floor(x0 / postStep);
    const p1 = Math.ceil(x1 / postStep);
    for (let i = p0; i <= p1; i++) {
      if (hash(i + 200) > 0.55) continue;
      const x = i * postStep + 0.4;
      const sl = Math.atan(slope(x));
      const base = toScreen(x, height(x));
      const ph = (1.15 + hash(i + 201) * 0.35) * ppu;
      ctx.strokeStyle = "rgba(48, 28, 14, 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(base.x + Math.sin(sl) * 6, base.y - ph);
      ctx.stroke();
    }
  }

  function drawShadow(): void {
    const footX = air ? cx : contactX;
    const p = toScreen(footX, height(footX));
    const sl = slope(footX);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan(sl));
    ctx.scale(1, 0.26);
    const lift = air ? Math.min(1.6, Math.max(0, cy - height(cx))) : 0;
    const a = 0.32 / (1 + lift * 1.15);
    const rad = (R * 1.2 + lift * 0.3) * ppu;
    const g = ctx.createRadialGradient(0, 0, 3, 0, 0, rad);
    g.addColorStop(0, `rgba(20, 10, 4, ${a})`);
    g.addColorStop(1, "rgba(20, 10, 4, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTire(): void {
    const p = toScreen(cx, cy);
    const pxR = R * ppu;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(rot);

    ctx.fillStyle = "#121212";
    ctx.beginPath();
    ctx.arc(0, 0, pxR, 0, Math.PI * 2);
    ctx.fill();

    const lugs = 18;
    for (let i = 0; i < lugs; i++) {
      const a = (i / lugs) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = i % 5 === 0 ? "#2a2a2a" : "#0b0b0b";
      ctx.fillRect(-pxR * 0.09, -pxR * 1.025, pxR * 0.18, pxR * 0.17);
      ctx.restore();
    }

    const side = ctx.createRadialGradient(-pxR * 0.18, -pxR * 0.18, pxR * 0.08, 0, 0, pxR * 0.86);
    side.addColorStop(0, "#2c2c2c");
    side.addColorStop(0.72, "#151515");
    side.addColorStop(1, "#090909");
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.arc(0, 0, pxR * 0.84, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8b9198";
    ctx.beginPath();
    ctx.arc(0, 0, pxR * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#555a61";
    ctx.beginPath();
    ctx.arc(0, 0, pxR * 0.44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1c20";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * pxR * 0.26,
        Math.sin(a) * pxR * 0.26,
        pxR * 0.1,
        pxR * 0.14,
        a,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.fillStyle = "#c5c9ce";
    ctx.beginPath();
    ctx.arc(0, 0, pxR * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6a7078";
    ctx.beginPath();
    ctx.arc(0, 0, pxR * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#efe6c8";
    ctx.beginPath();
    ctx.arc(0, -pxR * 0.68, pxR * 0.055, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d0a82a";
    ctx.fillRect(pxR * 0.78, -pxR * 0.03, pxR * 0.14, pxR * 0.06);

    ctx.restore();
  }

  function drawDust(): void {
    for (const p of dust) {
      if (!p.live) continue;
      const s = toScreen(p.x, p.y);
      const t = 1 - p.life / p.maxLife;
      ctx.fillStyle = `rgba(130, 88, 42, ${(1 - t) * 0.38})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.size * ppu * (1 + t * 1.2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawForeground(): void {
    const step = 0.22;
    const x0 = camX - 4;
    const x1 = camX + 14;
    const i0 = Math.floor(x0 / step);
    const i1 = Math.ceil(x1 / step);
    for (let i = i0; i <= i1; i++) {
      if (hash(i + 400) > 0.38) continue;
      const x = i * step + camX * 0.12;
      const sx = (x - camX * 1.35) * ppu * 0.7 + w * 0.3;
      if (sx < -40 || sx > w + 40) continue;
      const tall = 18 + hash(i + 401) * 34;
      ctx.strokeStyle = `rgba(18, 10, 6, ${0.45 + hash(i + 402) * 0.3})`;
      ctx.lineWidth = 2 + hash(i + 403) * 2;
      ctx.beginPath();
      ctx.moveTo(sx, h + 2);
      ctx.quadraticCurveTo(sx + (hash(i + 404) - 0.5) * 16, h - tall * 0.5, sx + (hash(i + 405) - 0.5) * 22, h - tall);
      ctx.stroke();
    }
  }

  function draw(): void {
    drawSky();
    drawRidges();
    drawGround();
    drawShadow();
    drawDust();
    drawTire();
    drawForeground();
  }

  function frame(now: number): void {
    if (stopped) return;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(() => layout());
  ro.observe(canvas);
  layout();
  hopBtn.addEventListener("click", hop);
  last = performance.now();
  raf = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}
