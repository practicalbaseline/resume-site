import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "src/styles/main.css"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const page = readFileSync(resolve(root, "src/main.ts"), "utf8");

describe("coming soon page", () => {
  it("uses a dark full-height page with safe areas", () => {
    expect(html).toMatch(/viewport-fit=cover/);
    expect(html).toMatch(/color-scheme" content="dark"/);
    expect(html).toMatch(/theme-color" content="#121311"/);
    expect(css).toMatch(/safe-area-inset-top/);
    expect(css).toMatch(/safe-area-inset-bottom/);
    expect(css).toMatch(/--safe-top/);
    expect(css).toMatch(/100dvh/);
    expect(css).toMatch(/@media \(max-width:\s*640px\)/);
    expect(css).toMatch(/-webkit-text-size-adjust:\s*100%/);
    expect(css).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  });

  it("shows one still line and no motion", () => {
    expect(page).toMatch(/Website coming soon/);
    expect(css).not.toMatch(/animation/);
    expect(css).not.toMatch(/transition/);
    expect(css).not.toMatch(/@keyframes/);
    expect(page).not.toMatch(/requestAnimationFrame/);
  });
});
