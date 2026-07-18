import type { GraphData, GraphEdge, GraphNode, TrunkId } from "./types";
import { TRUNK_LABELS, TRUNK_ORDER } from "./types";

const HUB_ID = "hub";

const hub: GraphNode = {
  id: HUB_ID,
  kind: "hub",
  title: "Jake Gray",
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
      return "I learn by doing. Here are my attempts at doing:";
    case "quotes":
      return "Quotes that make me stop and think:";
    case "library":
      return "Coming Soon";
    case "writing":
      return "Useful things I learned along the way in life.";
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
      "This is a gamified version of dry-fire. The goal is to increase eye speed inbetween transitions, and practice key fundamentals for competitive shooters.",
    href: "https://www.sweatygm.com",
    tags: ["simulation", "performance", "frontend"],
    status: "live",
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
