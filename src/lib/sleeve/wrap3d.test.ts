import { describe, expect, it } from "vitest";
import { SLEEVE_DIELINES, SLEEVE_SIZES } from "./dielines";
import { layout } from "./geometry";
import {
  affineFromTriangles, applyAffine, cupRadius, sheetPoint, sheetPointAtTurn, surfacePoint, visibleSpans,
  type CupView,
} from "./wrap3d";

const view: CupView = { cx: 200, baseY: 400, scale: 2, tilt: 0.3 };
const sleeves = SLEEVE_SIZES.map((s) => SLEEVE_DIELINES[s]);

describe("cup", () => {
  it.each(sleeves)("$label tapers from its base to its rim", (d) => {
    expect(cupRadius(d, 0)).toBeCloseTo(d.cup.baseDia / 2, 6);
    expect(cupRadius(d, d.cup.height)).toBeCloseTo(d.cup.topDia / 2, 6);
    expect(cupRadius(d, d.cup.height / 2)).toBeGreaterThan(cupRadius(d, 0));
  });

  it.each(sleeves)("$label puts the silhouette edges at a quarter turn", (d) => {
    const r = cupRadius(d, d.bandOnCup.from) * view.scale;
    const left = surfacePoint(d, view, -Math.PI / 2, d.bandOnCup.from);
    const right = surfacePoint(d, view, Math.PI / 2, d.bandOnCup.from);
    expect(left.x).toBeCloseTo(view.cx - r, 6);
    expect(right.x).toBeCloseTo(view.cx + r, 6);
    /* Edge-on, so the tilt does not lift them. */
    expect(left.y).toBeCloseTo(right.y, 6);
  });

  it("brings the front of the cup nearer the bottom of the screen than the back", () => {
    const d = SLEEVE_DIELINES[12];
    const front = surfacePoint(d, view, 0, 50);
    const back = surfacePoint(d, view, Math.PI, 50);
    expect(front.y).toBeGreaterThan(back.y);
  });
});

describe("sheet mapping", () => {
  it.each(sleeves)("$label lands the band's edges on the dieline's own radii", (d) => {
    const l = layout(d);
    const bottom = sheetPoint(d, 0, d.bandOnCup.from);
    const top = sheetPoint(d, 0, d.bandOnCup.to);
    expect(Math.hypot(bottom.x - l.cx, bottom.y - l.cy)).toBeCloseTo(d.innerRadius, 6);
    expect(Math.hypot(top.x - l.cx, top.y - l.cy)).toBeCloseTo(d.outerRadius, 6);
  });

  it.each(sleeves)("$label spends exactly one sweep on one turn of the cup", (d) => {
    const l = layout(d);
    const angleOf = (p: { x: number; y: number }) =>
      (Math.atan2(p.x - l.cx, -(p.y - l.cy)) * 180) / Math.PI;
    expect(angleOf(sheetPoint(d, 0, d.bandOnCup.from))).toBeCloseTo(l.startDeg, 4);
    /* Just short of a full turn, so it has not yet wrapped back to the start. */
    expect(angleOf(sheetPoint(d, 2 * Math.PI * 0.999, d.bandOnCup.from))).toBeCloseTo(
      l.startDeg + d.sweepDeg * 0.999,
      3
    );
  });

  it("wraps round rather than running off the end", () => {
    const d = SLEEVE_DIELINES[12];
    const a = sheetPoint(d, 0.4, d.bandOnCup.from);
    const b = sheetPoint(d, 0.4 + 2 * Math.PI, d.bandOnCup.from);
    expect(b.x).toBeCloseTo(a.x, 6);
    expect(b.y).toBeCloseTo(a.y, 6);
  });
});

describe("affine", () => {
  it("carries the triangle it was built from onto the target, exactly", () => {
    const s = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }] as const;
    const t = [{ x: 3, y: 7 }, { x: 13, y: 9 }, { x: 1, y: 12 }] as const;
    const m = affineFromTriangles(s[0], s[1], s[2], t[0], t[1], t[2])!;
    expect(m).not.toBeNull();
    for (let i = 0; i < 3; i++) {
      expect(applyAffine(m, s[i]).x).toBeCloseTo(t[i].x, 9);
      expect(applyAffine(m, s[i]).y).toBeCloseTo(t[i].y, 9);
    }
  });

  it("refuses a degenerate triangle rather than producing infinities", () => {
    const p = { x: 1, y: 1 };
    expect(affineFromTriangles(p, p, p, p, p, p)).toBeNull();
    expect(affineFromTriangles({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, p, p, p)).toBeNull();
  });
});

describe("spans", () => {
  it("is one span when the seam is round the back", () => {
    expect(visibleSpans(Math.PI)).toHaveLength(1);
  });

  it("splits where the seam crosses the visible half", () => {
    const spans = visibleSpans(0);
    expect(spans).toHaveLength(2);
    expect(spans[0].to).toBeCloseTo(spans[1].from, 9);
    expect(spans[0].from).toBeCloseTo(-Math.PI / 2, 9);
    expect(spans[1].to).toBeCloseTo(Math.PI / 2, 9);
  });

  it("covers the visible half exactly, at every rotation", () => {
    for (let rot = -8; rot < 8; rot += 0.13) {
      const spans = visibleSpans(rot);
      const covered = spans.reduce((sum, s) => sum + (s.to - s.from), 0);
      expect(covered).toBeCloseTo(Math.PI, 9);
      for (const s of spans) expect(s.to).toBeGreaterThan(s.from);
    }
  });

  it("reaches the far end of the sector where the seam falls, instead of snapping back", () => {
    const d = SLEEVE_DIELINES[12];
    const l = layout(d);
    const end = sheetPointAtTurn(d, 1, d.bandOnCup.from);
    const deg = (Math.atan2(end.x - l.cx, -(end.y - l.cy)) * 180) / Math.PI;
    expect(deg).toBeCloseTo(l.startDeg + d.sweepDeg, 6);
  });
});
