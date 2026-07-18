/** Content domains on the resume. */
export type TrunkId =
  | "projects"
  | "quotes"
  | "library"
  | "writing"
  | "research";

export type NodeKind =
  | "hub"
  | "trunk"
  | "project"
  | "post"
  | "material"
  | "quote"
  | "research";

export type NodeStatus = "live" | "wip" | "idea" | "archive";

export type GraphNode = {
  id: string;
  kind: NodeKind;
  /** Present on trunk and leaf nodes. */
  trunk?: TrunkId;
  title: string;
  /** Short blurb shown in the closed row. */
  summary?: string;
  /** Longer overview body (plain text; newlines preserved). */
  body?: string;
  /** Attribution for quotes / materials. */
  source?: string;
  /** External or deep link. */
  href?: string;
  tags?: string[];
  status?: NodeStatus;
};

export type GraphEdge = {
  from: string;
  to: string;
  strength?: number;
  relation?: "contains" | "builds-on" | "cites" | "embodies";
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

/** Display order on the page. */
export const TRUNK_ORDER: TrunkId[] = [
  "projects",
  "quotes",
  "library",
  "writing",
  "research",
];

export const TRUNK_LABELS: Record<TrunkId, string> = {
  projects: "Projects",
  quotes: "Quotes",
  library: "Library",
  writing: "Writing",
  research: "Things I'm Researching (And Why)",
};

/** Shorter labels for the header jump nav. */
export const TRUNK_NAV_LABELS: Record<TrunkId, string> = {
  projects: "Projects",
  quotes: "Quotes",
  library: "Library",
  writing: "Writing",
  research: "Research",
};
