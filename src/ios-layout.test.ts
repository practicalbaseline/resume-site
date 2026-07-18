import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "src/styles/main.css"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");

describe("iOS layout affordances", () => {
  it("uses viewport-fit=cover for safe-area insets", () => {
    expect(html).toMatch(/viewport-fit=cover/);
    expect(html).toMatch(/apple-mobile-web-app-capable/);
    expect(html).toMatch(/theme-color/);
  });

  it("defines safe-area CSS variables and uses them in padding", () => {
    expect(css).toMatch(/safe-area-inset-top/);
    expect(css).toMatch(/safe-area-inset-bottom/);
    expect(css).toMatch(/--safe-top/);
    expect(css).toMatch(/env\(safe-area-inset/);
  });

  it("sets touch-friendly targets and disables text size adjust quirks", () => {
    expect(css).toMatch(/--touch:\s*44px/);
    expect(css).toMatch(/min-height:\s*var\(--touch\)/);
    expect(css).toMatch(/-webkit-text-size-adjust:\s*100%/);
    expect(css).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
    expect(css).toMatch(/touch-action:\s*manipulation/);
  });

  it("uses dynamic viewport height for body", () => {
    expect(css).toMatch(/100dvh/);
  });

  it("has a dedicated small-screen breakpoint", () => {
    expect(css).toMatch(/@media \(max-width:\s*640px\)/);
  });
});
