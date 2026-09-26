import { describe, expect, it } from "vitest";
import { DIELINES } from "./dielines";

/**
 * The sleeve numbers were read off the supplier's drawing by eye. An annular sector over-specifies
 * itself — arc length is radius × sweep, and the band is the difference of the radii — so if any
 * figure was mistyped these identities stop holding.
 */
describe("sleeve sector geometry", () => {
  const sleeves = Object.values(DIELINES).filter((d) => d.sector);

  it("covers all three sizes", () => {
    expect(sleeves.map((d) => d.id).sort()).toEqual(["sleeve12", "sleeve16", "sleeve8"]);
  });

  it.each(sleeves)("$id arc lengths follow from its radii and sweep", (d) => {
    const rad = (d.sector!.sweepDeg * Math.PI) / 180;
    expect(d.sector!.innerRadius * rad).toBeCloseTo(d.sector!.arcBottom, 0);
    expect(d.sector!.outerRadius * rad).toBeCloseTo(d.sector!.arcTop, 0);
  });

  it.each(sleeves)("$id band height is the difference of its radii", (d) => {
    expect(d.sector!.outerRadius - d.sector!.innerRadius).toBeCloseTo(d.sector!.bandHeight, 1);
  });

  it.each(sleeves)("$id glue lap angle matches its width at the inner radius", (d) => {
    const deg = ((d.sector!.glueLap.width / d.sector!.innerRadius) * 180) / Math.PI;
    expect(deg).toBeCloseTo(d.sector!.glueLap.deg, 1);
  });

  it.each(sleeves)("$id band sits on the cup's taper", (d) => {
    const { cup, bandOnCup } = d.sector!;
    const diaAt = (h: number) => cup.baseDia + ((cup.topDia - cup.baseDia) * h) / cup.height;
    /* The sleeve is a hair wider than the cup at both ends — that clearance is what lets it slide on. */
    for (const h of [bandOnCup.from, bandOnCup.to]) {
      expect(diaAt(h)).toBeGreaterThan(0);
      expect(diaAt(h)).toBeLessThan(cup.topDia);
    }
    expect(bandOnCup.to).toBeGreaterThan(bandOnCup.from);
    expect(bandOnCup.to).toBeLessThan(cup.height);
  });

  it("leaves nothing unconfirmed", () => {
    expect(Object.values(DIELINES).filter((d) => !d.confirmed)).toEqual([]);
  });

  it("every sleeve carries the drawing it was read from", () => {
    for (const d of sleeves) expect(d.source).toMatch(/^content\/dielines\/.+\.svg$/);
  });
});
