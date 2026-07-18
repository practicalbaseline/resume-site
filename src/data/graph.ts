import type { GraphData, GraphEdge, GraphNode, TrunkId } from "./types";
import { TRUNK_LABELS, TRUNK_ORDER } from "./types";

const HUB_ID = "hub";

const hub: GraphNode = {
  id: HUB_ID,
  kind: "hub",
  title: "Jake Gray",
  summary:
    "Technology Sales Professional Solving Client Problems Through Engineering",
  body: "Projects, quotes, library, writing, and active research.",
};

const trunks: GraphNode[] = TRUNK_ORDER.map((id) => ({
  id: `trunk-${id}`,
  kind: "trunk" as const,
  trunk: id,
  title: TRUNK_LABELS[id],
  summary: trunkSummary(id),
}));

function trunkSummary(id: TrunkId): string {
  switch (id) {
    case "projects":
      return "What I ship — simulations, tools, and teaching demos.";
    case "quotes":
      return "Quotes that make me stop and think, or are foundational to my approach.";
    case "library":
      return "Coming Soon";
    case "writing":
      return "Essays and notes. Named posts appear here when they exist.";
    case "research":
      return "Active questions — and the reason each one matters.";
  }
}

/** Named entries under each trunk. */
const leaves: GraphNode[] = [
  // —— 1. Projects ——
  {
    id: "project-sweatygm",
    kind: "project",
    trunk: "projects",
    title: "SweatyGM / Dry-Fire Trainer",
    summary:
      "This tool is for Competitive Shooters to train their vision with key fundamentals. The goal is to simulate fundamental drills and increase eye-speed from home.",
    body: [
      "This tool is for Competitive Shooters to train their vision with key fundamentals. The goal is to simulate fundamental drills and increase eye-speed from home.",
    ].join("\n"),
    href: "https://www.sweatygm.com",
    tags: ["simulation", "performance", "frontend"],
    status: "live",
  },
  {
    id: "project-economic-school-of-brass",
    kind: "project",
    trunk: "projects",
    title: "Economic School of Brass",
    summary: "Coming Soon — August 2026",
    body: "Coming soon. Target launch: August 2026.",
    status: "idea",
    tags: ["coming-soon"],
  },
  // —— 2. Quotes ——
  {
    id: "quote-clarke-iii",
    kind: "quote",
    trunk: "quotes",
    title: "Clarke’s Third Law",
    source: "Arthur C. Clarke",
    summary:
      "Any sufficiently advanced technology is indistinguishable from magic.",
    body: [
      "Any sufficiently advanced technology is indistinguishable from magic.",
      "",
      "The full Three Laws still apply — but this is the line that sticks.",
    ].join("\n"),
    tags: ["technology"],
  },
  {
    id: "quote-self-education",
    kind: "quote",
    trunk: "quotes",
    title: "Self-Education",
    source: "Isaac Asimov",
    summary:
      "Self-education is, I firmly believe, the only kind of education there is.",
    body: [
      "Self-education is, I firmly believe, the only kind of education there is.",
      "",
      "Formal instruction is scaffolding. Understanding is built by sustained attention to first sources and hard problems.",
    ].join("\n"),
    tags: ["learning"],
  },
  {
    id: "quote-knowledge-problem",
    kind: "quote",
    trunk: "quotes",
    title: "Dispersed Knowledge",
    source: "Friedrich Hayek",
    summary:
      "The knowledge of the circumstances of which we must make use never exists in concentrated or integrated form…",
    body: [
      "The knowledge of the circumstances of which we must make use never exists in concentrated or integrated form, but solely as the dispersed bits of incomplete and frequently contradictory knowledge which all the separate individuals possess.",
      "",
      "No planner holds the full map.",
    ].join("\n"),
    tags: ["knowledge"],
  },
  {
    id: "quote-voluntary-exchange",
    kind: "quote",
    trunk: "quotes",
    title: "Voluntary Exchange",
    source: "Milton Friedman",
    summary:
      "No exchange takes place unless both parties benefit.",
    body: [
      "The most important single central fact about a free market is that no exchange takes place unless both parties benefit.",
      "",
      "Consent plus mutual gain is the basic unit of peaceful coordination.",
    ].join("\n"),
    tags: ["exchange"],
  },
  {
    id: "quote-second-law",
    kind: "quote",
    trunk: "quotes",
    title: "The Second Law",
    source: "Thermodynamics",
    summary: "Entropy of an isolated system never decreases. Order requires work.",
    body: [
      "Entropy of an isolated system never decreases. Order requires work.",
      "",
      "Decay is free; structure is paid for.",
    ].join("\n"),
    tags: ["science"],
  },
  {
    id: "quote-occam",
    kind: "quote",
    trunk: "quotes",
    title: "Occam’s Razor",
    source: "William of Ockham",
    summary: "Entities should not be multiplied beyond necessity.",
    body: [
      "Entities should not be multiplied beyond necessity.",
      "",
      "Prefer the explanation that accounts for the facts with the fewest free parameters.",
    ].join("\n"),
    tags: ["reasoning"],
  },

  // —— 3. Library: empty (Coming Soon) ——

  // —— 4. Writing: empty until real posts ——

  // —— 5. Research: empty for now ——
];

function buildEdges(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const t of trunks) {
    edges.push({
      from: HUB_ID,
      to: t.id,
      strength: 1.4,
      relation: "contains",
    });
  }

  for (const leaf of nodes.filter((n) => n.kind !== "hub" && n.kind !== "trunk")) {
    if (!leaf.trunk) continue;
    edges.push({
      from: `trunk-${leaf.trunk}`,
      to: leaf.id,
      strength: 1,
      relation: "contains",
    });
  }

  return edges;
}

const allNodes: GraphNode[] = [hub, ...trunks, ...leaves];

export const GRAPH: GraphData = {
  nodes: allNodes,
  edges: buildEdges(allNodes),
};

export function getNode(id: string): GraphNode | undefined {
  return GRAPH.nodes.find((n) => n.id === id);
}

export function leavesForTrunk(trunk: TrunkId): GraphNode[] {
  return GRAPH.nodes.filter(
    (n) => n.trunk === trunk && n.kind !== "trunk" && n.kind !== "hub",
  );
}

export function neighborsOf(id: string): GraphNode[] {
  const ids = new Set<string>();
  for (const e of GRAPH.edges) {
    if (e.from === id) ids.add(e.to);
    if (e.to === id) ids.add(e.from);
  }
  return GRAPH.nodes.filter((n) => ids.has(n.id));
}

export { HUB_ID };
