/**
 * Turning a sleeve dieline into SVG paths.
 *
 * Everything is laid out in millimetres — one SVG user unit is one millimetre — so a rendered file
 * carries its own true size and a printer can drop it straight on the bed at 1:1.
 *
 * The band curves upward with the circle's centre below the artwork, which is why every point is
 * measured as an angle either side of straight-up rather than in screen coordinates.
 */
import type { SleeveDieline } from "./dielines";

export type Point = { x: number; y: number };

/** A point at `radius` from the centre, `deg` either side of straight up. SVG y grows downward. */
export function polar(cx: number, cy: number, radius: number, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) };
}

const n = (v: number) => Number(v.toFixed(3));
const pt = (p: Point) => `${n(p.x)} ${n(p.y)}`;

/** Degrees subtended by an arc of `mm` at `radius` — how far a millimetre reaches around. */
export const degAt = (mm: number, radius: number) => ((mm / radius) * 180) / Math.PI;

export type Layout = {
  /** Centre of the circle the band is struck from, in the same mm space as the paths. */
  cx: number;
  cy: number;
  /** Full sheet, bleed and crop-mark margin included. */
  width: number;
  height: number;
  /** Angles either side of straight up, measured clockwise. */
  startDeg: number;
  /** Where the printable band ends and the glue lap begins. */
  foldDeg: number;
  endDeg: number;
  margin: number;
};

/** Space for crop marks outside the bleed. */
const CROP_MARGIN = 6;

/**
 * Places the sector on a sheet. The band is centred on the sheet including its glue lap, so the
 * lap's extra sweep shifts the printable area very slightly left of centre — which is correct:
 * the lap is glued under the other end and is never seen.
 */
export function layout(d: SleeveDieline): Layout {
  const total = d.sweepDeg + d.glueLap.deg;
  const half = total / 2;

  /* Bleed reaches around the ends as well as past the edges, and reaches furthest at the tight radius. */
  const bleedHalf = half + degAt(d.bleed, d.innerRadius);
  const rOuter = d.outerRadius + d.bleed;
  const rInner = d.innerRadius - d.bleed;

  const halfWidth = rOuter * Math.sin((bleedHalf * Math.PI) / 180);
  const top = 0;
  const bottom = rOuter - rInner * Math.cos((bleedHalf * Math.PI) / 180);

  return {
    cx: halfWidth + CROP_MARGIN,
    cy: rOuter + CROP_MARGIN,
    width: 2 * halfWidth + 2 * CROP_MARGIN,
    height: bottom - top + 2 * CROP_MARGIN,
    startDeg: -half,
    foldDeg: -half + d.sweepDeg,
    endDeg: half,
    margin: CROP_MARGIN,
  };
}

/** The closed outline of an annular sector between two angles. */
export function sectorPath(
  l: Pick<Layout, "cx" | "cy">,
  rInner: number,
  rOuter: number,
  fromDeg: number,
  toDeg: number
): string {
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  const o1 = polar(l.cx, l.cy, rOuter, fromDeg);
  const o2 = polar(l.cx, l.cy, rOuter, toDeg);
  const i2 = polar(l.cx, l.cy, rInner, toDeg);
  const i1 = polar(l.cx, l.cy, rInner, fromDeg);
  return [
    `M ${pt(o1)}`,
    `A ${n(rOuter)} ${n(rOuter)} 0 ${large} 1 ${pt(o2)}`,
    `L ${pt(i2)}`,
    `A ${n(rInner)} ${n(rInner)} 0 ${large} 0 ${pt(i1)}`,
    "Z",
  ].join(" ");
}

/** A single arc at one radius — the baseline text is set along. */
export function arcPath(
  l: Pick<Layout, "cx" | "cy">,
  radius: number,
  fromDeg: number,
  toDeg: number
): string {
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  const a = polar(l.cx, l.cy, radius, fromDeg);
  const b = polar(l.cx, l.cy, radius, toDeg);
  return `M ${pt(a)} A ${n(radius)} ${n(radius)} 0 ${large} 1 ${pt(b)}`;
}

/** A straight line across the band — the fold at the glue lap. */
export function radialPath(
  l: Pick<Layout, "cx" | "cy">,
  rInner: number,
  rOuter: number,
  deg: number
): string {
  return `M ${pt(polar(l.cx, l.cy, rOuter, deg))} L ${pt(polar(l.cx, l.cy, rInner, deg))}`;
}

/**
 * Where a logo sits: the middle of the printable band, turned so it stands square to the cup
 * rather than square to the sheet.
 */
export function bandCentre(l: Layout, d: SleeveDieline) {
  const deg = (l.startDeg + l.foldDeg) / 2;
  const radius = (d.innerRadius + d.outerRadius) / 2;
  return { ...polar(l.cx, l.cy, radius, deg), deg };
}

/** The bleed sheet the generator produces, crop-mark margin removed. */
export const sheetSize = (d: SleeveDieline) => {
  const l = layout(d);
  return { width: l.width - 2 * l.margin, height: l.height - 2 * l.margin };
};

/**
 * Bounding box of the cut sector itself, glue lap included and bleed excluded. This is the figure
 * the supplier's drawings quote as the flat sheet footprint, so it is what the model is checked
 * against — the generator's own sheet is deliberately larger, because bleed has to run past the
 * ends of the band as well as its edges.
 */
export function sectorSize(d: SleeveDieline) {
  const half = ((d.sweepDeg + d.glueLap.deg) / 2) * (Math.PI / 180);
  return {
    width: 2 * d.outerRadius * Math.sin(half),
    height: d.outerRadius - d.innerRadius * Math.cos(half),
  };
}
