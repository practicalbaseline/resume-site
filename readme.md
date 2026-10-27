# itsjakegray.com

Personal resume for **Jake Gray** — projects, principles, library, and writing.

**https://itsjakegray.com**

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

`npm run build` runs `tsc`, then Vite. Static output lands in `dist/`.

## Deploy

Production is the Vercel project `resume-site` (Vite, Node.js 24), linked to this repo.

- https://itsjakegray.com is the live site
- https://www.itsjakegray.com redirects to that apex with a 301

A merge to `main` deploys production. A pull request gets a preview deployment. Vercel runs `npm run build` and publishes `dist/`.

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
- Vercel
