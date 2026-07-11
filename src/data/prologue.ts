/**
 * Opening film cards — sparse, movie-like. Not a lecture.
 * Theme: concentrated light as a tool for building, healing, connecting.
 */

export type PrologueCard = {
  id: string;
  /** Upper kicker, optional */
  kicker?: string;
  /** Main line on screen */
  line: string;
  /** Seconds this card holds (nominal; reduced-motion shortens) */
  hold: number;
};

export const PROLOGUE_CARDS: PrologueCard[] = [
  {
    id: "silence",
    line: "",
    hold: 1.2,
  },
  {
    id: "world",
    kicker: "Cold open",
    line: "The world runs on things no hand can carve.",
    hold: 3.4,
  },
  {
    id: "steel",
    kicker: "Build",
    line: "A beam cuts steel for a hospital frame — no blade, no wear.",
    hold: 3.6,
  },
  {
    id: "sight",
    kicker: "Heal",
    line: "A thinner beam reshapes a cornea. Sight returns in minutes.",
    hold: 3.6,
  },
  {
    id: "link",
    kicker: "Connect",
    line: "Pulse trains in glass fiber carry a surgery across an ocean.",
    hold: 3.5,
  },
  {
    id: "thesis",
    kicker: "The good",
    line: "Same physics. Precision where it saves time, metal, and lives.",
    hold: 3.8,
  },
  {
    id: "invite",
    kicker: "Enter the machine",
    line: "Learn how a laser is made — and why it works.",
    hold: 2.8,
  },
];

export const PROLOGUE_SKIP_LABEL = "Skip";
export const PROLOGUE_CTA = "Enter the lab";
