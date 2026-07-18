import { describe, expect, it } from "vitest";
import {
  GRAPH,
  HUB_ID,
  getNode,
  leavesForTrunk,
  neighborsOf,
} from "./graph";
import { TRUNK_LABELS, TRUNK_ORDER } from "./types";

describe("GRAPH", () => {
  it("has a hub with name only (no bio line)", () => {
    const hub = getNode(HUB_ID);
    expect(hub?.kind).toBe("hub");
    expect(hub?.title).toBe("Jake Gray");
    expect(hub?.summary).toBeUndefined();
  });

  it("orders trunks: projects, quotes, library, writing, research", () => {
    expect(TRUNK_ORDER).toEqual([
      "projects",
      "quotes",
      "library",
      "writing",
      "research",
    ]);
    expect(TRUNK_LABELS.research).toBe("Things I'm Researching (And Why)");
    for (const trunk of TRUNK_ORDER) {
      const t = getNode(`trunk-${trunk}`);
      expect(t?.kind).toBe("trunk");
      expect(t?.title).toBe(TRUNK_LABELS[trunk]);
    }
  });

  it("has projects and does not list Laser Lab", () => {
    const projects = leavesForTrunk("projects");
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((p) => p.id !== "project-laser-lab")).toBe(true);
  });

  it("has quotes with attributions", () => {
    const quotes = leavesForTrunk("quotes");
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.every((q) => q.kind === "quote")).toBe(true);
    expect(quotes.every((q) => q.source)).toBe(true);
  });

  it("research trunk may be empty until filled in", () => {
    const research = leavesForTrunk("research");
    expect(Array.isArray(research)).toBe(true);
  });

  it("has no email or github on the hub", () => {
    const hub = getNode(HUB_ID);
    expect(hub?.href).toBeUndefined();
    const blob = `${hub?.summary ?? ""}\n${hub?.body ?? ""}`.toLowerCase();
    expect(blob).not.toMatch(/@|github\.com|mailto:/);
  });

  it("connects hub to each trunk and trunks to their leaves", () => {
    for (const trunk of TRUNK_ORDER) {
      const edge = GRAPH.edges.find(
        (e) => e.from === HUB_ID && e.to === `trunk-${trunk}`,
      );
      expect(edge).toBeTruthy();
    }
    for (const leaf of leavesForTrunk("projects")) {
      const edge = GRAPH.edges.find(
        (e) => e.from === "trunk-projects" && e.to === leaf.id,
      );
      expect(edge).toBeTruthy();
    }
  });

  it("neighborsOf returns connected nodes", () => {
    const n = neighborsOf("project-sweatygm");
    expect(n.some((x) => x.id === "trunk-projects")).toBe(true);
  });

  it("writing trunk may have zero leaves (no fake posts)", () => {
    const posts = leavesForTrunk("writing");
    expect(Array.isArray(posts)).toBe(true);
  });
});
