import { describe, expect, it } from "vitest";
import { SLEEVE_DIELINES, SLEEVE_SIZES, sleeveDieline } from "./dielines";
import { layout } from "./geometry";
import { centreOf } from "./doc";
import { fitToSector, sectorSlices } from "./warp-raster";

const at = (size: 8 | 12 | 16, over: Partial<{ x: number; y: number; width: number; height: number; rotation: number }> = {}) => {
  const c = centreOf(size);
  return { x: c.x, y: c.y, width: 40, height: 20, rotation: 0, ...over };
};

describe("fitting a picture to the band", () => {
  it.each(SLEEVE_SIZES)("%ioz spans the radii the picture's height covers", (size) => {
    const d = sleeveDieline(size);
    const l = layout(d);
    const el = at(size);
    const fit = fitToSector(d, el)!;
    const r0 = Math.hypot(el.x - l.cx, el.y - l.cy);
    expect(fit.rOuter).toBeCloseTo(r0 + el.height / 2, 6);
    expect(fit.rInner).toBeCloseTo(r0 - el.height / 2, 6);
  });

  it("sweeps the angle its width subtends at its own radius", () => {
    const d = SLEEVE_DIELINES[12];
    const l = layout(d);
    const el = at(12, { width: 60 });
    const fit = fitToSector(d, el)!;
    const r0 = Math.hypot(el.x - l.cx, el.y - l.cy);
    /* Arc length = radius × angle. */
    expect(((2 * fit.halfDeg * Math.PI) / 180) * r0).toBeCloseTo(el.width, 6);
  });

  /* The bend bulges past the corners, so a box measured from them would crop the picture. */
  it("gives a box wide enough for the bulge, not just the corners", () => {
    const d = SLEEVE_DIELINES[12];
    const el = at(12, { width: 120, height: 40 });
    const fit = fitToSector(d, el)!;
    expect(fit.placement.width).toBeGreaterThan(el.width * 0.9);
    expect(fit.placement.height).toBeGreaterThan(el.height);
  });

  it("declines rather than folding a picture sitting on the arc centre", () => {
    const d = SLEEVE_DIELINES[12];
    const l = layout(d);
    expect(fitToSector(d, { x: l.cx, y: l.cy, width: 10, height: 10, rotation: 0 })).toBeNull();
  });
});

describe("slices", () => {
  const d = SLEEVE_DIELINES[12];
  const el = at(12, { width: 60, height: 24 });
  const fit = fitToSector(d, el)!;
  const slices = sectorSlices(d, el, fit);
  const l = layout(d);
  const dist = (p: { x: number; y: number }) => Math.hypot(p.x - l.cx, p.y - l.cy);

  it("covers the picture edge to edge, in order", () => {
    expect(slices.length).toBeGreaterThan(30);
    expect(slices[0].src[0].x).toBeCloseTo(0, 9);
    expect(slices[slices.length - 1].src[1].x).toBeCloseTo(el.width, 9);
    for (let i = 1; i < slices.length; i++) {
      expect(slices[i].src[0].x).toBeCloseTo(slices[i - 1].src[1].x, 9);
    }
  });

  it("puts every slice's top and bottom on the band's two radii", () => {
    for (const s of slices) {
      expect(dist(s.dst[0])).toBeCloseTo(fit.rOuter, 6);
      expect(dist(s.dst[1])).toBeCloseTo(fit.rOuter, 6);
      expect(dist(s.dst[2])).toBeCloseTo(fit.rInner, 6);
    }
  });

  it("overlaps neighbours so no seam of background shows through", () => {
    const deg = (p: { x: number; y: number }) => (Math.atan2(p.x - l.cx, -(p.y - l.cy)) * 180) / Math.PI;
    for (let i = 0; i < slices.length - 1; i++) {
      expect(deg(slices[i].wedge[1])).toBeGreaterThan(deg(slices[i + 1].wedge[0]));
    }
    /* Except the last, which must stop exactly at the picture's edge. */
    const last = slices[slices.length - 1];
    expect(deg(last.wedge[1])).toBeCloseTo(fit.angle + fit.halfDeg, 6);
  });

  it("carries rotation into the destination", () => {
    const spun = at(12, { width: 60, height: 24, rotation: 30 });
    const spunFit = fitToSector(d, spun)!;
    const a = sectorSlices(d, el, fit)[0].dst[0];
    const b = sectorSlices(d, spun, spunFit)[0].dst[0];
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1);
  });
});
