# itsjakegray.com

Personal resume for **Jake Gray** — projects, principles, library, and writing.

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

## Test

```bash
npm test
```

## Content

Edit `src/data/graph.ts`. Four trunks:

| Order | Section | Purpose |
|-------|---------|---------|
| 1 | **Projects** | What ships (including Laser Lab as a project overview) |
| 2 | **Quotes** | Attributed lines worth keeping |
| 3 | **Library** | Books, papers, talks (links optional) |
| 4 | **Writing** | Posts when they exist |
| 5 | **Things I'm Researching (And Why)** | Active questions with reasons |

## Stack

- Vite + TypeScript
- Static HTML rendered from a typed content model
- GitHub Pages via `dist/`
