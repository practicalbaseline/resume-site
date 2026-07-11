/**
 * Industrial laser use — static teaching claim for laser nerds.
 *
 * Scope: among high-power industrial systems, material processing / manufacturing
 * (cutting, welding, marking, additive) is the volume workhorse. Not a live market API.
 */

export type IndustryUse = {
  /** Application class that dominates industrial laser deployment */
  dominantClass: string;
  /** Short label for UI */
  shortLabel: string;
  /** Concrete process examples */
  examples: string[];
  /** Why this class uses lasers most / why they win */
  why: string[];
  /** Dominant source technology in that class */
  typicalSources: string;
};

export const INDUSTRY_USE: IndustryUse = {
  dominantClass: "Material processing / manufacturing",
  shortLabel: "Manufacturing (material processing)",
  examples: [
    "Laser cutting of sheet metal",
    "Laser welding and remote welding",
    "Marking / engraving on production lines",
    "Additive manufacturing (powder bed / DED)",
  ],
  why: [
    "Non-contact energy delivery: focus high irradiance into a small spot without tool wear on the workpiece.",
    "Precision and speed on metal fabrication: narrow kerf, high feed rates, automation-friendly CNC paths.",
    "Beam quality and wall-plug efficiency of modern fiber and diode-pumped sources make multi-kW factory systems practical.",
    "One source family serves cutting, welding, and marking cells — industrial CAPEX concentrates here more than niche scientific or display uses.",
  ],
  typicalSources:
    "High-power fiber lasers and diode-pumped solid-state / direct-diode systems are the industrial workhorses for multi-kW processing.",
};

export function industryCorpus(): string {
  const i = INDUSTRY_USE;
  return [
    i.dominantClass,
    i.shortLabel,
    ...i.examples,
    ...i.why,
    i.typicalSources,
  ].join("\n");
}
