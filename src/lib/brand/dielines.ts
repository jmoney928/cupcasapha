/**
 * Print dielines as data, not drawings, so a supplier change is a data update rather than a redesign.
 * See docs/SPEC.md, "Module 7 — Templates".
 *
 * All measurements in millimetres.
 */
export type Dieline = {
  id: string;
  label: string;
  trim: { width: number; height: number };
  bleed: number;
  safeArea: number;
  /** Confirmed with the supplier in writing? Nothing prints at scale until this is true. */
  confirmed: boolean;
  note?: string;
  /**
   * A sleeve is not a rectangle. It is an annular sector that wraps a tapered cup, so `trim` is
   * only the flat sheet it is cut from; this is the geometry the art has to be warped onto.
   */
  sector?: Sector;
  /** The drawing this data was read off, relative to the repo root. */
  source?: string;
};

/** All millimetres except the two degree fields. */
export type Sector = {
  innerRadius: number;
  outerRadius: number;
  sweepDeg: number;
  /** Slant height of the band — the printable height, not the vertical rise. */
  bandHeight: number;
  arcBottom: number;
  arcTop: number;
  glueLap: { width: number; deg: number };
  /** The cup it wraps: top Ø, base Ø, height. */
  cup: { topDia: number; baseDia: number; height: number };
  /** Where the band sits, measured up from the cup base. */
  bandOnCup: { from: number; to: number };
};

export const DIELINES: Record<string, Dieline> = {
  "window-decal": {
    id: "window-decal", label: "Window decal", trim: { width: 150, height: 150 },
    bleed: 3, safeArea: 5, confirmed: true,
  },
  "till-card": {
    id: "till-card", label: "Till card (tent fold)", trim: { width: 100, height: 140 },
    bleed: 3, safeArea: 6, confirmed: true,
    note: "Folds across the middle at 70mm; artwork sits on the upper half.",
  },
  "a-frame": {
    id: "a-frame", label: "A-frame insert", trim: { width: 594, height: 841 },
    bleed: 3, safeArea: 20, confirmed: true, note: "A1. Most A-frames take A1 or A2 — check yours.",
  },
  sleeve12: {
    id: "sleeve12", label: "12oz sleeve", trim: { width: 264, height: 83 },
    bleed: 3, safeArea: 4, confirmed: true,
    source: "content/dielines/sleeve-12oz.svg",
    note: "Print area 211 × 55.5mm. The drawing asks for cup dimensions and glue lap to be confirmed with the printer before tooling.",
    sector: {
      innerRadius: 249.1, outerRadius: 304.6, sweepDeg: 48.64,
      bandHeight: 55.5, arcBottom: 211.5, arcTop: 258.6,
      glueLap: { width: 12, deg: 2.76 },
      cup: { topDia: 90, baseDia: 60, height: 110 },
      bandOnCup: { from: 25, to: 80 },
    },
  },
  sleeve16: {
    id: "sleeve16", label: "16oz sleeve", trim: { width: 265, height: 83 },
    bleed: 3, safeArea: 4, confirmed: true,
    source: "content/dielines/sleeve-16oz.svg",
    note: "Print area 215 × 60.4mm. The drawing asks for cup dimensions and glue lap to be confirmed with the printer before tooling.",
    sector: {
      innerRadius: 309.1, outerRadius: 369.5, sweepDeg: 39.76,
      bandHeight: 60.4, arcBottom: 214.5, arcTop: 256.4,
      glueLap: { width: 12, deg: 2.22 },
      cup: { topDia: 90, baseDia: 60, height: 135 },
      bandOnCup: { from: 35, to: 95 },
    },
  },
  /**
   * Page 1 of the supplier's three-page set. The 8oz is the base size on the consumer packs, so
   * this is the one gap that still stops a full set of sleeve artwork being generated.
   */
  sleeve8: {
    id: "sleeve8", label: "8oz sleeve", trim: { width: 0, height: 0 },
    bleed: 0, safeArea: 0, confirmed: false,
    note: "Drawing not supplied — the 12oz and 16oz arrived as pages 2 and 3 of 3. Cannot generate until page 1 lands.",
  },
};

export const confirmedDielines = () => Object.values(DIELINES).filter((d) => d.confirmed);

export const MM_TO_PT = 72 / 25.4;
export const mm = (v: number) => v * MM_TO_PT;
