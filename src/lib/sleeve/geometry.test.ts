import { describe, expect, it } from "vitest";
import { SLEEVE_DIELINES, SLEEVE_SIZES } from "./dielines";
import { arcPath, degAt, layout, polar, sectorPath, sectorSize, sheetSize } from "./geometry";

const sleeves = SLEEVE_SIZES.map((s) => SLEEVE_DIELINES[s]);

describe("dieline figures", () => {
  /* An annular sector over-specifies itself, so these identities catch a mistyped figure. */
  it.each(sleeves)("$label arc lengths follow from its radii and sweep", (d) => {
    const rad = (d.sweepDeg * Math.PI) / 180;
    expect(d.innerRadius * rad).toBeCloseTo(d.arcBottom, 0);
    expect(d.outerRadius * rad).toBeCloseTo(d.arcTop, 0);
  });

  it.each(sleeves)("$label band height is the difference of its radii", (d) => {
    expect(d.outerRadius - d.innerRadius).toBeCloseTo(d.bandHeight, 1);
  });

  it.each(sleeves)("$label glue lap angle matches its width at the inner radius", (d) => {
    expect(degAt(d.glueLap.width, d.innerRadius)).toBeCloseTo(d.glueLap.deg, 1);
  });
});

describe("layout", () => {
  /*
   * The real check on the whole model: build the sector from first principles and compare it with
   * the footprint the drawings quote. Three different sizes agreeing to within a millimetre means
   * the sector and its glue lap are being placed the way the drawings intend.
   */
  it.each(sleeves)("$label sector width matches the drawing's quoted footprint", (d) => {
    expect(Math.abs(sectorSize(d).width - d.sheet.width)).toBeLessThan(1);
  });

  /* The quoted height carries the bleed; the quoted width does not. */
  it.each(sleeves)("$label sector height matches it once bleed is added", (d) => {
    expect(Math.abs(sectorSize(d).height + d.bleed - d.sheet.height)).toBeLessThan(1.5);
  });

  it.each(sleeves)("$label bleed sheet is larger than the cut sector on both axes", (d) => {
    const sheet = sheetSize(d);
    const cut = sectorSize(d);
    expect(sheet.width).toBeGreaterThan(cut.width);
    expect(sheet.height).toBeGreaterThan(cut.height);
  });

  it.each(sleeves)("$label keeps the whole bleed on the sheet", (d) => {
    const l = layout(d);
    const rOuter = d.outerRadius + d.bleed;
    const bleedHalf = (d.sweepDeg + d.glueLap.deg) / 2 + degAt(d.bleed, d.innerRadius);
    for (const deg of [-bleedHalf, 0, bleedHalf]) {
      for (const r of [d.innerRadius - d.bleed, rOuter]) {
        const p = polar(l.cx, l.cy, r, deg);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(l.width);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(l.height);
      }
    }
  });

  it.each(sleeves)("$label puts the fold one glue lap in from the end", (d) => {
    const l = layout(d);
    expect(l.endDeg - l.foldDeg).toBeCloseTo(d.glueLap.deg, 3);
    expect(l.foldDeg - l.startDeg).toBeCloseTo(d.sweepDeg, 3);
  });
});

describe("paths", () => {
  const l = layout(SLEEVE_DIELINES[12]);
  const d = SLEEVE_DIELINES[12];

  it("closes the sector and uses the short arc", () => {
    const p = sectorPath(l, d.innerRadius, d.outerRadius, l.startDeg, l.endDeg);
    expect(p.startsWith("M ")).toBe(true);
    expect(p.endsWith("Z")).toBe(true);
    expect(p).toContain("0 0 1"); // large-arc 0, sweep 1 on the outer edge
    expect(p).toContain("0 0 0"); // and back the other way on the inner
  });

  it("emits no NaN", () => {
    for (const size of SLEEVE_SIZES) {
      const dd = SLEEVE_DIELINES[size];
      const ll = layout(dd);
      const paths = [
        sectorPath(ll, dd.innerRadius, dd.outerRadius, ll.startDeg, ll.endDeg),
        arcPath(ll, dd.outerRadius, ll.startDeg, ll.foldDeg),
      ];
      for (const p of paths) expect(p).not.toMatch(/NaN|Infinity/);
    }
  });
});
