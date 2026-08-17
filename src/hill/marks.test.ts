import { describe, expect, it } from "vitest";
import { HILL_MARKS, marksHtml } from "./marks";

describe("hill marks", () => {
  it("includes SweatyGM as a real outbound link", () => {
    expect(HILL_MARKS.some((m) => m.href.includes("sweatygm.com"))).toBe(true);
    const html = marksHtml(HILL_MARKS);
    expect(html).toContain("sweatygm.com");
    expect(html).toContain('href="https://sweatygm.com"');
    expect(html).toContain('target="_blank"');
  });
});
