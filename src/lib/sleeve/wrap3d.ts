/**
 * Mapping the flat sleeve onto the cup it wraps.
 *
 * The dieline is an annular sector precisely because the cup is a truncated cone: wrapped, the
 * sector's inner arc becomes the band's bottom edge and its outer arc the top. So a point on the
 * cup has an exact home on the artwork, and the preview samples the real file rather than
 * stretching a picture of it.
 *
 * Pure geometry only — no canvas, so it can be checked.
 */
import type { SleeveDieline } from "./dielines";
import { layout, polar, type Point } from "./geometry";

/** How much a circle is squashed when seen from slightly above. 0 is edge-on. */
export const TILT = 0.3;

export type CupView = {
  /** Screen position of the centre of the cup's base. */
  cx: number;
  baseY: number;
  /** Pixels per millimetre. */
  scale: number;
  tilt: number;
};

/** Radius of the cup, in mm, at `h` mm above its base. */
export function cupRadius(d: SleeveDieline, h: number): number {
  const { baseDia, topDia, height } = d.cup;
  return (baseDia + ((topDia - baseDia) * h) / height) / 2;
}

/**
 * A point on the cup's surface. `phi` is the angle round the cup with 0 facing the viewer, so the
 * visible half is -90° to 90°.
 */
export function surfacePoint(d: SleeveDieline, view: CupView, phi: number, h: number): Point {
  const r = cupRadius(d, h) * view.scale;
  return {
    x: view.cx + r * Math.sin(phi),
    y: view.baseY - h * view.scale + r * Math.cos(phi) * view.tilt,
  };
}

/**
 * Where that same point sits on the flat artwork. One turn of the cup is the sector's whole sweep,
 * and the band's height maps onto the gap between the two radii.
 */
export function sheetPoint(d: SleeveDieline, phi: number, h: number): Point {
  return sheetPointAtTurn(d, wrapTurn(phi / (2 * Math.PI)), h);
}

export const wrapTurn = (turn: number) => ((turn % 1) + 1) % 1;

/**
 * The same mapping, but taking the turn directly so a caller can ask for 1 as well as 0. Drawing
 * the band in slices needs that: the slice that ends where the seam falls has to reach the far end
 * of the sector rather than snapping back to its start.
 */
export function sheetPointAtTurn(d: SleeveDieline, turn: number, h: number): Point {
  const l = layout(d);
  const frac = (h - d.bandOnCup.from) / (d.bandOnCup.to - d.bandOnCup.from);
  const radius = d.innerRadius + frac * (d.outerRadius - d.innerRadius);
  return polar(l.cx, l.cy, radius, l.startDeg + turn * d.sweepDeg);
}

/**
 * The visible half of the cup, split where the artwork's seam falls so no slice straddles it.
 * `rot` is how far the cup has been turned, in radians.
 */
export function visibleSpans(rot: number): Array<{ from: number; to: number }> {
  const start = -Math.PI / 2;
  const end = Math.PI / 2;
  /* The seam sits wherever the turn crosses a whole number; at most once across half a turn. */
  const k = Math.ceil((start + rot) / (2 * Math.PI));
  const seam = k * 2 * Math.PI - rot;
  return seam > start && seam < end
    ? [{ from: start, to: seam }, { from: seam, to: end }]
    : [{ from: start, to: end }];
}

export type Affine = { a: number; b: number; c: number; d: number; e: number; f: number };

/**
 * The affine that carries one triangle onto another — which is what lets a slice of the flat
 * artwork be drawn onto its slice of the cup without sampling pixel by pixel.
 *
 * Canvas order: x' = a·x + c·y + e, y' = b·x + d·y + f.
 */
export function affineFromTriangles(s1: Point, s2: Point, s3: Point, d1: Point, d2: Point, d3: Point): Affine | null {
  const ux = s2.x - s1.x, uy = s2.y - s1.y;
  const vx = s3.x - s1.x, vy = s3.y - s1.y;
  const det = ux * vy - uy * vx;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-9) return null;

  const Ux = d2.x - d1.x, Uy = d2.y - d1.y;
  const Vx = d3.x - d1.x, Vy = d3.y - d1.y;

  const a = (Ux * vy - Vx * uy) / det;
  const c = (Vx * ux - Ux * vx) / det;
  const b = (Uy * vy - Vy * uy) / det;
  const dd = (Vy * ux - Uy * vx) / det;

  return { a, b, c, d: dd, e: d1.x - (a * s1.x + c * s1.y), f: d1.y - (b * s1.x + dd * s1.y) };
}

export const applyAffine = (m: Affine, p: Point): Point => ({
  x: m.a * p.x + m.c * p.y + m.e,
  y: m.b * p.x + m.d * p.y + m.f,
});

/** How lit a point is, 1 facing the viewer down to 0 at the silhouette. Keeps the cup looking round. */
export const shadeAt = (phi: number) => Math.max(0, Math.cos(phi));
