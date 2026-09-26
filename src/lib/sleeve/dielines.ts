/**
 * Sleeve dielines, read off the supplier's drawings in content/dielines (carried on the
 * portal-admin branch). All millimetres except the two degree fields.
 *
 * A sleeve is an annular sector, not a rectangle: it wraps a tapered cup, so its flat shape is a
 * curved band. Everything the generator draws comes from these numbers.
 */
export type CupSize = 8 | 12 | 16;

export type SleeveDieline = {
  size: CupSize;
  label: string;
  innerRadius: number;
  outerRadius: number;
  /** Sweep of the printable band, before the glue lap is added on. */
  sweepDeg: number;
  /** Slant height of the band — the printable height, not the vertical rise. */
  bandHeight: number;
  arcBottom: number;
  arcTop: number;
  glueLap: { width: number; deg: number };
  bleed: number;
  /** Keep artwork that must not be trimmed this far inside the cut line. */
  safeArea: number;
  cup: { topDia: number; baseDia: number; height: number };
  bandOnCup: { from: number; to: number };
  /** The flat sheet each drawing quotes, kept to check the generator against. */
  sheet: { width: number; height: number };
};

export const SLEEVE_DIELINES: Record<CupSize, SleeveDieline> = {
  8: {
    size: 8, label: "8oz",
    innerRadius: 171.6, outerRadius: 217.5, sweepDeg: 70.6,
    bandHeight: 45.9, arcBottom: 211.4, arcTop: 268.0,
    glueLap: { width: 12, deg: 4.01 },
    bleed: 3, safeArea: 4,
    /* The 8oz sits on a 62mm base where the other two use 60mm — the one place the family differs. */
    cup: { topDia: 90, baseDia: 62, height: 70 },
    bandOnCup: { from: 12, to: 57 },
    sheet: { width: 263, height: 85 },
  },
  12: {
    size: 12, label: "12oz",
    innerRadius: 249.1, outerRadius: 304.6, sweepDeg: 48.64,
    bandHeight: 55.5, arcBottom: 211.5, arcTop: 258.6,
    glueLap: { width: 12, deg: 2.76 },
    bleed: 3, safeArea: 4,
    cup: { topDia: 90, baseDia: 60, height: 110 },
    bandOnCup: { from: 25, to: 80 },
    sheet: { width: 264, height: 83 },
  },
  16: {
    size: 16, label: "16oz",
    innerRadius: 309.1, outerRadius: 369.5, sweepDeg: 39.76,
    bandHeight: 60.4, arcBottom: 214.5, arcTop: 256.4,
    glueLap: { width: 12, deg: 2.22 },
    bleed: 3, safeArea: 4,
    cup: { topDia: 90, baseDia: 60, height: 135 },
    bandOnCup: { from: 35, to: 95 },
    sheet: { width: 265, height: 83 },
  },
};

export const SLEEVE_SIZES: CupSize[] = [8, 12, 16];
export const sleeveDieline = (size: CupSize) => SLEEVE_DIELINES[size];
