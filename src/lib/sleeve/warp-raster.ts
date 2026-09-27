/**
 * Baking the sector warp into the picture itself.
 *
 * Slicing an image into wedges inside the SVG is correct, and renders correctly in a browser — but
 * Chrome drops the per-slice clips when the same SVG is rasterised as an image, which is how the
 * cup preview reads it, and is a plausible way a printer's tooling reads it too. So the warp is
 * applied once here, on a canvas, and the file carries one ordinary <image>. Nothing downstream has
 * to honour forty-eight clip paths for the artwork to be right.
 */
import type { SleeveDieline } from "./dielines";
import { degAt, layout, polar, type Point } from "./geometry";
import { affineFromTriangles } from "./wrap3d";

/** Resolution the warp is baked at. 12 px/mm is a shade over 300dpi. */
export const WARP_PX_PER_MM = 12;
const SLICES = 64;

export type ImagePlacement = {
  /** Where the baked picture goes on the sheet, in millimetres. */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SectorFit = {
  rInner: number;
  rOuter: number;
  angle: number;
  halfDeg: number;
  placement: ImagePlacement;
};

/**
 * Where an image of this size, at this spot, lands once bent round the band — and the bounding box
 * the baked picture needs to occupy. Returns null when it is too close to the arc centre for a
 * sector to mean anything.
 */
export function fitToSector(
  d: SleeveDieline,
  el: { x: number; y: number; width: number; height: number; rotation: number }
): SectorFit | null {
  const l = layout(d);
  const r0 = Math.hypot(el.x - l.cx, el.y - l.cy);
  const rInner = r0 - el.height / 2;
  if (!Number.isFinite(r0) || rInner <= 1) return null;

  const rOuter = r0 + el.height / 2;
  const halfDeg = degAt(el.width / 2, r0);
  const angle = (Math.atan2(el.x - l.cx, -(el.y - l.cy)) * 180) / Math.PI;
  const rot = (el.rotation * Math.PI) / 180;

  const at = (deg: number, radius: number): Point => {
    const p = polar(l.cx, l.cy, radius, deg);
    if (!el.rotation) return p;
    const dx = p.x - el.x;
    const dy = p.y - el.y;
    return {
      x: el.x + dx * Math.cos(rot) - dy * Math.sin(rot),
      y: el.y + dx * Math.sin(rot) + dy * Math.cos(rot),
    };
  };

  /* The bend bulges past the corners, so the box is measured along the arc, not from them. */
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= SLICES; i++) {
    const deg = angle - halfDeg + (2 * halfDeg * i) / SLICES;
    for (const radius of [rInner, rOuter]) {
      const p = at(deg, radius);
      xs.push(p.x);
      ys.push(p.y);
    }
  }
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    rInner, rOuter, angle, halfDeg,
    placement: { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y },
  };
}

/** One slice of the bake: where it comes from in the picture and where it lands on the sheet. */
export type Slice = { src: [Point, Point, Point]; dst: [Point, Point, Point]; wedge: Point[] };

export function sectorSlices(
  d: SleeveDieline,
  el: { x: number; y: number; width: number; height: number; rotation: number },
  fit: SectorFit
): Slice[] {
  const l = layout(d);
  const rot = (el.rotation * Math.PI) / 180;
  const at = (deg: number, radius: number): Point => {
    const p = polar(l.cx, l.cy, radius, deg);
    if (!el.rotation) return p;
    const dx = p.x - el.x;
    const dy = p.y - el.y;
    return {
      x: el.x + dx * Math.cos(rot) - dy * Math.sin(rot),
      y: el.y + dx * Math.sin(rot) + dy * Math.cos(rot),
    };
  };

  const out: Slice[] = [];
  for (let i = 0; i < SLICES; i++) {
    const t0 = i / SLICES;
    const t1 = (i + 1) / SLICES;
    const a0 = fit.angle - fit.halfDeg + 2 * fit.halfDeg * t0;
    const a1 = fit.angle - fit.halfDeg + 2 * fit.halfDeg * t1;
    /* Neighbours overlap a hair, so no seam of background shows between slices. */
    const lap = i === SLICES - 1 ? 0 : (a1 - a0) * 0.4;
    out.push({
      src: [
        { x: el.width * t0, y: 0 },
        { x: el.width * t1, y: 0 },
        { x: el.width * t0, y: el.height },
      ],
      dst: [at(a0, fit.rOuter), at(a1, fit.rOuter), at(a0, fit.rInner)],
      wedge: [at(a0, fit.rOuter), at(a1 + lap, fit.rOuter), at(a1 + lap, fit.rInner), at(a0, fit.rInner)],
    });
  }
  return out;
}

/**
 * Paints the warp onto a canvas and hands back a data URL. Browser only — it is the one step that
 * needs a real 2D context, and it runs once per change rather than per frame.
 */
export async function bakeWarp(
  source: string,
  d: SleeveDieline,
  el: { x: number; y: number; width: number; height: number; rotation: number }
): Promise<{ href: string; placement: ImagePlacement } | null> {
  const fit = fitToSector(d, el);
  if (!fit) return null;

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = source;
  });
  if (!img) return null;

  const { placement } = fit;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(placement.width * WARP_PX_PER_MM));
  canvas.height = Math.max(1, Math.round(placement.height * WARP_PX_PER_MM));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const slice of sectorSlices(d, el, fit)) {
    const m = affineFromTriangles(slice.src[0], slice.src[1], slice.src[2], slice.dst[0], slice.dst[1], slice.dst[2]);
    if (!m) continue;
    ctx.save();
    ctx.setTransform(WARP_PX_PER_MM, 0, 0, WARP_PX_PER_MM, -placement.x * WARP_PX_PER_MM, -placement.y * WARP_PX_PER_MM);
    ctx.beginPath();
    slice.wedge.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.clip();
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    ctx.drawImage(img, 0, 0, el.width, el.height);
    ctx.restore();
  }

  return { href: canvas.toDataURL("image/png"), placement };
}
