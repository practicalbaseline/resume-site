import { describe, expect, it } from "vitest";
import { FOUNDATIONS, foundationsCorpus } from "./foundations";
import { MANUFACTURE_STEPS, manufactureCorpus } from "./manufacture";
import { INDUSTRY_USE, industryCorpus } from "./industry";
import { PARTS, PART_IDS, partsManufactureCorpus } from "./parts";
import { STEPS } from "../story/steps";
import { PROLOGUE_CARDS, PROLOGUE_CTA } from "./prologue";

describe("foundations (create a laser)", () => {
  it("ships named principles including stimulated emission, inversion, cavity, threshold", () => {
    const corpus = foundationsCorpus().toLowerCase();
    expect(FOUNDATIONS.length).toBeGreaterThanOrEqual(5);

    expect(corpus).toMatch(/stimulated emission|einstein b/);
    expect(corpus).toMatch(/population inversion|n₂\s*>\s*n₁|n2\s*>\s*n1/i);
    expect(corpus).toMatch(/fabry|resonator|cavity/);
    expect(corpus).toMatch(/threshold/);
    expect(corpus).toMatch(/gain/);
    expect(corpus).toMatch(/loss/);
    expect(corpus).toMatch(/spontaneous|einstein a/);
  });

  it("each foundation has a non-empty relation", () => {
    for (const f of FOUNDATIONS) {
      expect(f.name.trim().length).toBeGreaterThan(3);
      expect(f.relation.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("interactive principle tour", () => {
  it("story steps reference the same core laws", () => {
    const tour = STEPS.map((s) => `${s.title} ${s.formula}`).join("\n").toLowerCase();
    expect(tour).toMatch(/einstein b|stimulated/);
    expect(tour).toMatch(/inversion/);
    expect(tour).toMatch(/fabry|cavity/);
    expect(tour).toMatch(/threshold|gain.*loss|loss.*gain/);
  });
});

describe("manufacture / construction", () => {
  it("covers gain medium, pump, HR or OC, and materials", () => {
    const corpus = `${manufactureCorpus()}\n${partsManufactureCorpus()}`.toLowerCase();

    expect(corpus).toMatch(/gain medium/);
    expect(corpus).toMatch(/pump/);
    expect(corpus).toMatch(/high reflector|output coupler|\bhr\b|\boc\b|dielectric/);
    expect(corpus).toMatch(/fused silica|yag|dielectric|diode/);
    expect(MANUFACTURE_STEPS.some((s) => s.id === "medium")).toBe(true);
    expect(MANUFACTURE_STEPS.some((s) => s.id === "pump")).toBe(true);
    expect(MANUFACTURE_STEPS.some((s) => s.id === "optics")).toBe(true);
  });

  it("core pickable parts expose manufacture + materials", () => {
    for (const id of ["gain", "pump", "hr", "oc"] as const) {
      expect(PART_IDS).toContain(id);
      const p = PARTS[id];
      expect(p.materials.length).toBeGreaterThan(0);
      expect(p.manufacture.trim().length).toBeGreaterThan(15);
      expect(p.principle.trim().length).toBeGreaterThan(10);
    }
  });
});

describe("cinematic prologue (good of lasers)", () => {
  it("ships a multi-card opening about build / heal / connect", () => {
    expect(PROLOGUE_CARDS.length).toBeGreaterThanOrEqual(5);
    const corpus = PROLOGUE_CARDS.map((c) => `${c.kicker ?? ""} ${c.line}`).join("\n").toLowerCase();
    expect(corpus).toMatch(/build|steel|hospital|manufact/);
    expect(corpus).toMatch(/heal|cornea|sight/);
    expect(corpus).toMatch(/connect|fiber|ocean/);
    expect(PROLOGUE_CTA.toLowerCase()).toMatch(/lab|enter/);
  });
});

describe("industry most-use + why", () => {
  it("names material processing / manufacturing as dominant industrial class", () => {
    const corpus = industryCorpus().toLowerCase();
    expect(corpus).toMatch(/material processing|manufacturing/);
    expect(INDUSTRY_USE.dominantClass.toLowerCase()).toMatch(
      /material processing|manufacturing/,
    );
  });

  it("includes a non-empty why with industrial rationale", () => {
    expect(INDUSTRY_USE.why.length).toBeGreaterThan(0);
    const whyText = INDUSTRY_USE.why.join(" ").toLowerCase();
    expect(whyText.length).toBeGreaterThan(40);
    // At least one concrete driver: precision, non-contact, efficiency, or productivity
    expect(
      /precision|non-contact|efficiency|productivity|beam quality|fabricat/.test(whyText),
    ).toBe(true);
  });

  it("lists concrete process examples", () => {
    expect(INDUSTRY_USE.examples.length).toBeGreaterThan(1);
    const ex = INDUSTRY_USE.examples.join(" ").toLowerCase();
    expect(ex).toMatch(/cut|weld|mark/);
  });
});
