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
  /**
   * The sleeve is the one that needs the supplier's own dieline in writing. The 12oz cup sidewall is
   * 90×60×110mm, but a sleeve has its own trim, seam allowance and cone warp, and guessing it means
   * printing 5,000 unusable sleeves.
   */
  sleeve12: {
    id: "sleeve12", label: "12oz sleeve", trim: { width: 0, height: 0 },
    bleed: 0, safeArea: 0, confirmed: false,
    note: "Awaiting the supplier's dieline (trim, seam allowance and cone warp). Not available to generate until confirmed.",
  },
};

export const confirmedDielines = () => Object.values(DIELINES).filter((d) => d.confirmed);

export const MM_TO_PT = 72 / 25.4;
export const mm = (v: number) => v * MM_TO_PT;
