# itsjakegray.com — How a Laser Works

Interactive 3D homepage: a giant optical cavity that teaches laser physics from first principles.

**https://www.itsjakegray.com**

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Static output lands in `dist/` (includes `CNAME` + `.nojekyll` from `public/`).

## Deploy

GitHub Actions (`.github/workflows/pages.yml`) builds on push to `main` and deploys to **GitHub Pages**.

One-time repo setup:

1. Settings → Pages → Source: **GitHub Actions**
2. Custom domain: `www.itsjakegray.com` / `itsjakegray.com`
3. Enforce HTTPS after DNS checks out

### DNS (Cloudflare)

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `www` | `practicalbaseline.github.io` | DNS only (grey cloud) |

Optional root apex: follow GitHub Pages apex docs (A records) or redirect root → `www` in Cloudflare.

Legacy helper (branch deploy era): `bash setup-pages.sh`

## Stack

- Vite + TypeScript
- three.js (WebGL cavity, bloom, particles)
- Pedagogical rate model in `src/sim/laserModel.ts` (not a full Maxwell–Bloch solver)

## Controls

- **Story** — Back / Next or `←` `→`
- **Sandbox** — Pump, alignment, output leak
- **Orbit** — drag canvas
- **Space** — pause simulation
- **Why (physics)** — expert-depth captions
