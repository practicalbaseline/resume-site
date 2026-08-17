import { describe, expect, it } from "vitest";
import { height, slope } from "./terrain";

describe("endless hill", () => {
  it("is always downhill (negative slope)", () => {
    for (let x = 0; x < 400; x += 0.37) {
      expect(slope(x)).toBeLessThan(-0.08);
    }
  });

  it("matches its derivative numerically", () => {
    const dx = 1e-4;
    for (const x of [0, 3.2, 18, 91.5, 240]) {
      const numeric = (height(x + dx) - height(x - dx)) / (2 * dx);
      expect(numeric).toBeCloseTo(slope(x), 5);
    }
  });
});
