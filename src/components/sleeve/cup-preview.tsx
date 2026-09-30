"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCw } from "lucide-react";
import { sleeveDieline, type CupSize } from "@/lib/sleeve/dielines";
import { layout } from "@/lib/sleeve/geometry";
import type { SleeveDoc } from "@/lib/sleeve/doc";
import { renderDoc, type Measurer } from "@/lib/sleeve/render-doc";
import {
  affineFromTriangles, cupRadius, shadeAt, sheetPointAtTurn, surfacePoint, visibleSpans, TILT,
  type CupView,
} from "@/lib/sleeve/wrap3d";

const W = 320;
const PAD = { top: 16, bottom: 18, x: 14 };
const LID_MM = 7;

/**
 * The box a cup is drawn in, shaped to that cup.
 *
 * It used to be a fixed 320×400 for all three, which every size lost by. The 8oz is broader than
 * it is tall, so it sat in seventy-odd pixels of dead height and looked small; the 16oz is much
 * taller than the box, so it was squeezed down to fit and came out smaller than the panel could
 * have shown. Each now gets a frame as wide as the panel and only as tall as it needs.
 */
function frameFor(size: CupSize) {
  const d = sleeveDieline(size);
  const rt = d.cup.topDia / 2;
  const rb = d.cup.baseDia / 2;
  const scale = (W - PAD.x * 2) / (rt * 2 * 1.06);
  const tall = (d.cup.height + (rt + rb) * TILT + LID_MM) * scale + PAD.top + PAD.bottom;
  return { w: W, h: Math.round(tall) };
}
const SLICES = 120;
const SPIN = 0.35; // radians a second

/*
 * Bone, not grey. Matched by eye against the photographs of our own cups rather than sampled
 * off them — every pixel in those shots carries warm sun and bounce off a wood counter, so a
 * sampled hex would be the lighting, not the paper. The shadow side is warm and close to the
 * lit side because the stock is matte and uncoated; a wide dark falloff is what made this read
 * as moulded plastic.
 */
const PAPER = "#ece5d9";
const PAPER_DARK = "#d2c8b8";

/*
 * The two things that make a paper cup read as one rather than as a cone.
 *
 * The lip is rolled outward over itself, so the opening is a couple of millimetres wider than
 * the wall it sits on — which is also why a lid is wider than the cup. The base is the wall
 * folded under and crimped, leaving a ring that steps proud of the wall just above the bottom.
 * Both are plainly there on our own cups; measure one and these are the numbers.
 */
const RIM_ROLL_MM = 2.1;
const BASE_ROLL_MM = 3.6;
const BASE_FLARE_MM = 0.85;
const LID = "#ddd6c7";
const LID_TOP = "#e7e1d4";
const LID_WELL = "#ded7c8";

/**
 * A turning preview of the cup with the sleeve on it.
 *
 * The band is drawn by cutting the flat artwork into thin wedges and mapping each onto its slice
 * of the cone, so it is the real file bending round a real cup rather than a picture stretched
 * over a cylinder. The cup's own dimensions come from the dieline.
 */
export function CupPreview({ doc, measure }: { doc: SleeveDoc; measure: Measurer }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const texture = useRef<HTMLImageElement | null>(null);
  /*
   * Half a turn puts the middle of the artwork toward the viewer. At zero it is the glued seam
   * that faces front, which is the one part of the sleeve nobody is meant to look at.
   */
  const rotation = useRef(Math.PI);
  /*
   * How far above (or below) the cup we are looking, as the squash of a horizontal circle.
   * Positive looks down on it, negative looks up from underneath at the printed base, and zero
   * is dead level. Kept off 0 by a hair because a circle exactly edge-on has no face to shade.
   */
  const tilt = useRef(TILT);
  const dragging = useRef<{ x: number; y: number; from: number; fromTilt: number } | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [ready, setReady] = useState(false);
  /* The drawing box is a property of the cup, so it changes only when the size does. */
  const box = useMemo(() => frameFor(doc.size), [doc.size]);

  /* Rasterise the artwork when it settles, not on every keystroke. */
  useEffect(() => {
    const id = setTimeout(() => {
      const svg = renderDoc(doc, { guides: false, measure, idPrefix: "tx" });
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const img = new Image();
      img.onload = () => {
        texture.current = img;
        setReady(true);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    }, 220);
    return () => clearTimeout(id);
  }, [doc, measure]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = box.w * dpr;
    el.height = box.h * dpr;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (spinning && !reduced && !dragging.current) rotation.current += SPIN * dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, doc, texture.current, rotation.current, tilt.current, box.h);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [doc, spinning, ready]);

  function onDown(e: React.PointerEvent) {
    dragging.current = {
      x: e.clientX,
      y: e.clientY,
      from: rotation.current,
      fromTilt: tilt.current,
    };
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}
  }
  function onMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    /* A drag across the width of the cup turns it about half way round. */
    rotation.current = dragging.current.from + ((e.clientX - dragging.current.x) / W) * Math.PI * 2;
    /* And up and down lifts the camera over the rim or drops it under the base. */
    const next = dragging.current.fromTilt + ((e.clientY - dragging.current.y) / box.h) * 2.2;
    tilt.current = clampTilt(next);
  }
  const onUp = () => {
    dragging.current = null;
  };

  return (
    <div className="rounded-3xl bg-cream-deep/40 border border-espresso/8 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="label-caps text-espresso/50">On the cup</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setSpinning((s) => !s)}
            title={spinning ? "Pause" : "Spin"}
            className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral"
          >
            {spinning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              rotation.current = Math.PI;
            }}
            title="Face front"
            className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <canvas
        ref={canvas}
        style={{ width: "100%", maxWidth: W, aspectRatio: `${box.w} / ${box.h}` }}
        className="mx-auto block cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-label="Your sleeve on the cup — drag to turn it"
      />
      <p className="text-xs text-espresso/50 text-center mt-1">Drag to turn it. Drag up to see the base.</p>
    </div>
  );
}

/** Right over the top to right underneath, never exactly level — edge-on has no face to light. */
const MAX_TILT = 0.82;
const MIN_TILT = 0.05;
export function clampTilt(t: number): number {
  const c = Math.max(-MAX_TILT, Math.min(MAX_TILT, t));
  if (Math.abs(c) >= MIN_TILT) return c;
  return c < 0 ? -MIN_TILT : MIN_TILT;
}

function viewFor(doc: SleeveDoc, tilt: number, H: number): CupView {
  const d = sleeveDieline(doc.size);
  const rt = d.cup.topDia / 2;
  const rb = d.cup.baseDia / 2;
  /* Room for the cup, the two foreshortened ellipses, and the lid sitting on top. */
  const ty = Math.abs(tilt);
  const byHeight = (H - PAD.top - PAD.bottom) / (d.cup.height + (rt + rb) * ty + LID_MM);
  const byWidth = (W - PAD.x * 2) / (rt * 2 * 1.06);
  const scale = Math.min(byHeight, byWidth);
  return {
    scale,
    tilt,
    cx: W / 2,
    baseY: PAD.top + (LID_MM + rt * ty + d.cup.height) * scale,
  };
}

function draw(
  ctx: CanvasRenderingContext2D,
  doc: SleeveDoc,
  tex: HTMLImageElement | null,
  rot: number,
  tiltNow: number,
  H: number
) {
  const d = sleeveDieline(doc.size);
  const view = viewFor(doc, tiltNow, H);
  const { cx, baseY, scale, tilt } = view;
  const rb = cupRadius(d, 0) * scale;
  const rt = cupRadius(d, d.cup.height) * scale;
  const topY = baseY - d.cup.height * scale;

  ctx.clearRect(0, 0, W, H);

  /* A soft contact shadow, so the cup sits on something. Not when we are under the counter. */
  if (!isBelow(view)) {
    const sy = baseY + rb * tilt;
    const shadow = ctx.createRadialGradient(cx, sy, 1, cx, sy, rb * 1.7);
    shadow.addColorStop(0, "rgba(26,26,26,0.20)");
    shadow.addColorStop(1, "rgba(26,26,26,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(cx, baseY + rb * tilt * 0.9, rb * 1.7, ry(view, rb) * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Cup body: the cone, lit from the left so it reads as round. */
  ctx.save();
  conePath(ctx, view, rt, rb, topY, baseY);
  const body = ctx.createLinearGradient(cx - rt, 0, cx + rt, 0);
  body.addColorStop(0, PAPER_DARK);
  body.addColorStop(0.3, PAPER);
  body.addColorStop(0.62, PAPER);
  body.addColorStop(1, PAPER_DARK);
  ctx.fillStyle = body;
  ctx.fill();

  /* A cup standing on a counter is a shade darker near its base, where less sky reaches it. */
  const down = ctx.createLinearGradient(0, topY, 0, baseY);
  down.addColorStop(0, "rgba(26,26,26,0)");
  down.addColorStop(0.62, "rgba(26,26,26,0)");
  down.addColorStop(1, "rgba(26,26,26,0.07)");
  ctx.fillStyle = down;
  ctx.fill();
  ctx.restore();

  drawBaseRoll(ctx, view, rb, baseY, rt);

  if (tex) {
    drawBand(ctx, doc, view, tex, rot);
    /* The sleeve stands off the cup, so it throws a shadow down the wall beneath it. */
    drawSleeveShadow(ctx, d, view, rt, rb, topY, baseY);
  }

  grain(ctx, view, rt, rb, topY, baseY);

  /* The lid grips the rolled lip, not the wall, so it is set out by the roll as well. */
  const rimOuter = rt + RIM_ROLL_MM * scale;
  if (!isBelow(view)) {
    drawRim(ctx, view, rt, rimOuter, topY);
    drawLid(ctx, view, rimOuter, topY);
  }
  /* Underneath, the printed base is the whole point of looking. */
  if (isBelow(view)) drawPrintedBase(ctx, view, rb, baseY);
}

/**
 * The bottom of the cup, which is where our own mark goes. Only drawn when the camera is under
 * the cup; from anywhere above it is a face pointing away and the body covers it.
 *
 * The lid is skipped from below rather than drawn behind, because at these angles the cup's own
 * wall hides all of it and painting it first only risks its skirt bleeding past the silhouette.
 */
function drawPrintedBase(
  ctx: CanvasRenderingContext2D,
  view: CupView,
  rb: number,
  baseY: number
) {
  const { cx } = view;
  const r = rb * 0.95;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, baseY, r, ry(view, r), 0, 0, Math.PI * 2);
  ctx.fillStyle = "#fdfcfa";
  ctx.fill();

  /*
   * Everything below is drawn in the circle's own space and squashed by the tilt, so the lockup
   * lies on the base rather than floating in front of it.
   */
  ctx.translate(cx, baseY);
  ctx.scale(1, Math.max(0.0001, Math.abs(view.tilt)));
  ctx.fillStyle = BASE_INK;
  ctx.strokeStyle = BASE_INK;

  /* The hairline that rings the whole lockup. */
  ctx.lineWidth = Math.max(0.35, r * 0.006);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  /*
   * Sized so the top run sits inside the top of the circle rather than wrapping down its sides,
   * which is where it sits on the artwork. Forty-two letters at the first size I tried spanned
   * most of a turn.
   */
  ctx.font = `${Math.max(3, r * 0.047)}px ui-sans-serif, system-ui, sans-serif`;
  const track = r * 0.022;
  arcText(ctx, "TÜV RHEINLAND CERTIFIED · HOME COMPOSTABLE", r * 0.82, track, "top");
  arcText(ctx, "PAPER CUP · PHA LINED · CUPCASA.COM", r * 0.82, track, "bottom");

  /* Sized to the circle rather than guessed at, so it fits at any cup size. */
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = r * 0.2;
  const serif = (n: number) => `${n}px ui-serif, Georgia, "Times New Roman", serif`;
  ctx.font = serif(size);
  const got = ctx.measureText("Made to disappear.").width;
  if (got > 0) size = Math.max(4, (size * r * 1.04) / got);
  ctx.font = serif(size);
  ctx.fillText("Made to disappear.", 0, -r * 0.04);

  drawMark(ctx, 0, r * 0.52, r * 0.22);
  ctx.restore();
}

/** The ink on the base: dark navy, not black — taken off the artwork. */
const BASE_INK = "#2a3140";

/**
 * Text set around a circle, a glyph at a time. The bottom run goes the other way about and
 * upside down, which is what makes a badge read when you turn it over — exactly how it sits on
 * the printed base.
 */
function arcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  radius: number,
  tracking: number,
  where: "top" | "bottom"
) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + tracking);
  const span = widths.reduce((a, b) => a + b, 0) / radius;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let angle = -span / 2;
  for (let i = 0; i < chars.length; i++) {
    const step = widths[i] / radius;
    ctx.save();
    ctx.rotate((where === "bottom" ? Math.PI : 0) + angle + step / 2);
    ctx.translate(0, -radius);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    angle += step;
  }
  ctx.restore();
}

/**
 * The mark: a cup coming apart into dots. The scatter is a fixed list, not random, so the same
 * cup does not shed a different pattern on every frame of a turn.
 */
const MARK_DOTS: Array<[number, number, number]> = [
  [0.52, 0.12, 0.085], [0.58, 0.46, 0.065], [0.64, 0.74, 0.05],
  [0.72, 0.28, 0.055], [0.78, 0.6, 0.042], [0.86, 0.16, 0.04],
  [0.9, 0.44, 0.032], [0.96, 0.72, 0.028], [1.02, 0.3, 0.025],
  [1.08, 0.58, 0.02], [1.14, 0.12, 0.018], [1.2, 0.42, 0.015],
];

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const h = w * 1.05;
  ctx.save();
  ctx.translate(x - w * 0.35, y - h / 2);

  /* Lid: a bar with a thin rim under it. */
  ctx.fillRect(-w * 0.34, 0, w * 0.68, h * 0.12);
  ctx.fillRect(-w * 0.3, h * 0.17, w * 0.6, h * 0.08);

  /* Body: a tapered cup. */
  ctx.beginPath();
  ctx.moveTo(-w * 0.28, h * 0.31);
  ctx.lineTo(w * 0.28, h * 0.31);
  ctx.lineTo(w * 0.19, h);
  ctx.lineTo(-w * 0.19, h);
  ctx.closePath();
  ctx.fill();

  /* And the half that has already gone. */
  for (const [dx, dy, dr] of MARK_DOTS) {
    ctx.beginPath();
    ctx.arc(-w * 0.28 + dx * w, h * 0.31 + dy * h * 0.72, dr * w, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Drawing a cup you can orbit.
 *
 * Canvas will not take a negative radius, so every ellipse is drawn with the magnitude of the
 * tilt and the *sign* decides which half of a circle faces us. The silhouette is exempt: its top
 * boundary is the upper arc and its bottom the lower one whichever side you view from, because
 * those are screen directions rather than parts of the cup. Faces are not exempt — the near half
 * of a ring dips below its centre when you look down on it and rises above it when you look up.
 */
const ry = (view: CupView, r: number) => r * Math.abs(view.tilt);
const UPPER: [number, number] = [Math.PI, Math.PI * 2];
const LOWER: [number, number] = [0, Math.PI];
const near = (view: CupView): [number, number] => (view.tilt < 0 ? UPPER : LOWER);

/**
 * The near half traced right-to-left, and its return leg left-to-right.
 *
 * A half arc has two ends, and which end it starts at flips with the tilt. Naming the halves by
 * angle alone was enough to draw them but not to join them: the `lineTo` after an arc assumed it
 * had finished on the left, so once the near half flipped the strip closed across itself and the
 * sleeve came out as a bowtie. Asking for a direction instead of a range makes the joins hold.
 */
function nearStrip(view: CupView) {
  return view.tilt < 0
    ? { a: Math.PI * 2, b: Math.PI, ccw: true }
    : { a: 0, b: Math.PI, ccw: false };
}
const stripTop = (ctx: CanvasRenderingContext2D, view: CupView, cx: number, cy: number, r: number) => {
  const k = nearStrip(view);
  ctx.ellipse(cx, cy, r, ry(view, r), 0, k.a, k.b, k.ccw);
};
const stripBottom = (ctx: CanvasRenderingContext2D, view: CupView, cx: number, cy: number, r: number) => {
  const k = nearStrip(view);
  ctx.ellipse(cx, cy, r, ry(view, r), 0, k.b, k.a, !k.ccw);
};
const far = (view: CupView): [number, number] => (view.tilt < 0 ? LOWER : UPPER);
const isBelow = (view: CupView) => view.tilt < 0;

/** The cone's silhouette — the back of the mouth and the front of the base. */
function conePath(
  ctx: CanvasRenderingContext2D,
  view: CupView,
  rt: number,
  rb: number,
  topY: number,
  baseY: number
) {
  const { cx } = view;
  ctx.beginPath();
  ctx.moveTo(cx - rt, topY);
  ctx.ellipse(cx, topY, rt, ry(view, rt), 0, ...UPPER);
  ctx.lineTo(cx + rb, baseY);
  ctx.ellipse(cx, baseY, rb, ry(view, rb), 0, ...LOWER);
  ctx.closePath();
}

/**
 * Shadow cast by the sleeve onto the wall below it. A sleeve is corrugated and sits off the cup
 * by a millimetre or two, which is exactly why it insulates — and why its lower edge reads as a
 * dark line rather than a join.
 */
function drawSleeveShadow(
  ctx: CanvasRenderingContext2D,
  d: ReturnType<typeof sleeveDieline>,
  view: CupView,
  rt: number,
  rb: number,
  topY: number,
  baseY: number
) {
  const { cx, scale, tilt } = view;
  const yBot = baseY - d.bandOnCup.from * scale;
  const rBot = cupRadius(d, d.bandOnCup.from) * scale;
  const fall = 5 * scale;

  ctx.save();
  conePath(ctx, view, rt, rb, topY, baseY);
  ctx.clip();
  /*
   * Laid along the arc, not across a box. A vertical gradient in a rectangle put a straight
   * edge under a curved sleeve, which read as a seam drawn on the cup. Stacking the same arc
   * a few times, fainter and lower each pass, keeps the shadow parallel to the edge casting it.
   */
  const passes = 16;
  ctx.lineCap = "butt";
  for (let i = 0; i < passes; i++) {
    const t = i / (passes - 1);
    ctx.strokeStyle = `rgba(26,26,26,${(0.032 * (1 - t) * (1 - t)).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, fall / 1.6);
    ctx.beginPath();
    ctx.ellipse(cx, yBot + t * fall * Math.sign(view.tilt || 1), rBot, ry(view, rBot), 0, ...near(view));
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The crimped base: the wall folded under itself, standing a hair proud of the cone and casting
 * a thin shadow into the step. Drawn after the body so it sits on top of the gradient.
 */
function drawBaseRoll(
  ctx: CanvasRenderingContext2D,
  view: CupView,
  rb: number,
  baseY: number,
  bodyR: number
) {
  const { cx, scale, tilt } = view;
  const h = BASE_ROLL_MM * scale;
  const ro = rb + BASE_FLARE_MM * scale;
  const yTop = baseY - h;

  /*
   * A strip between two front-facing arcs, not a full silhouette.
   *
   * Taking the BACK arc for the top edge — as the body does for the cup's open mouth — was
   * wrong here: the back of this ring is behind the cup, and drawing it ballooned a 3mm fold
   * into a lens across the whole base. You only ever see the near side of a ring on the
   * outside of a cone, so both edges are front arcs and the strip keeps its height all the
   * way round.
   */
  ctx.beginPath();
  stripTop(ctx, view, cx, baseY, ro);
  ctx.lineTo(cx - ro, yTop);
  stripBottom(ctx, view, cx, yTop, ro);
  ctx.closePath();
  /*
   * Lit across the same span as the body, not its own, so the tones line up where the two meet.
   * Given its own gradient the ring came out paler than the wall above it and read as a glass
   * tumbler base rather than a fold in the same paper.
   */
  const g = ctx.createLinearGradient(cx - bodyR, 0, cx + bodyR, 0);
  g.addColorStop(0, PAPER_DARK);
  g.addColorStop(0.32, PAPER);
  g.addColorStop(0.72, PAPER);
  g.addColorStop(1, PAPER_DARK);
  ctx.fillStyle = g;
  ctx.fill();

  /* Folded paper catches a little less light than the wall it came from. */
  ctx.fillStyle = "rgba(26,26,26,0.05)";
  ctx.fill();

  /* The step itself: a shadow where the wall meets the ring, across the front only. */
  ctx.save();
  ctx.strokeStyle = "rgba(26,26,26,0.18)";
  ctx.lineWidth = Math.max(0.6, 0.28 * scale);
  ctx.beginPath();
  ctx.ellipse(cx, yTop, ro, ry(view, ro), 0, ...near(view));
  ctx.stroke();
  ctx.restore();
}

/**
 * The rolled lip. Mostly hidden under a lid — which is the point: it is why the lid is wider
 * than the wall — but a sliver of it shows where the skirt ends.
 */
function drawRim(
  ctx: CanvasRenderingContext2D,
  view: CupView,
  rt: number,
  rimOuter: number,
  topY: number
) {
  const { cx, scale, tilt } = view;
  const h = RIM_ROLL_MM * scale * 1.2;

  ctx.beginPath();
  ctx.moveTo(cx - rimOuter, topY);
  ctx.ellipse(cx, topY, rimOuter, ry(view, rimOuter), 0, ...UPPER);
  ctx.lineTo(cx + rimOuter, topY + h);
  ctx.ellipse(cx, topY + h, rimOuter, ry(view, rimOuter), 0, ...LOWER);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - rimOuter, 0, cx + rimOuter, 0);
  g.addColorStop(0, PAPER_DARK);
  g.addColorStop(0.36, PAPER);
  g.addColorStop(0.7, PAPER);
  g.addColorStop(1, PAPER_DARK);
  ctx.fillStyle = g;
  ctx.fill();

  /* Where the roll meets the wall below it. */
  ctx.strokeStyle = "rgba(26,26,26,0.12)";
  ctx.lineWidth = Math.max(0.5, 0.3 * scale);
  ctx.beginPath();
  ctx.ellipse(cx, topY + h, rt, ry(view, rt), 0, ...near(view));
  ctx.stroke();
}

/**
 * A sip lid: a skirt that grips the cup and overhangs it slightly, a top face stepped in from the
 * skirt, and a sip slot on the drinking side.
 *
 * Every part is a closed path rather than a rectangle with ellipses over it, and the shading is
 * clipped to the skirt — painting a gradient over a bare rect is what left a grey block hanging
 * off the sides.
 */
function drawLid(ctx: CanvasRenderingContext2D, view: CupView, rimOuter: number, topY: number) {
  const { cx, scale, tilt } = view;
  /* It only has to clear the rolled lip, which is already in `rimOuter`. */
  const skirtR = rimOuter * 1.015;
  /* Shallow: a lid grips the rim, it does not sit on the cup like a tub. */
  const skirtH = 3.0 * scale;
  const brimY = topY - skirtH;
  /*
   * A moulded bagasse lid is not a flat disc with a hole. It has a broad flat brim, a rounded
   * shoulder stepping UP from it, and a raised plateau in the middle — the earlier model had
   * that plateau recessed, which is the shape of a plastic tub lid rather than ours.
   */
  const rise = 4.4 * scale;
  const plateauR = skirtR * 0.63;
  const plateauY = brimY - rise;

  const skirt = () => {
    ctx.beginPath();
    ctx.moveTo(cx - skirtR, brimY);
    ctx.lineTo(cx - skirtR, topY);
    ctx.ellipse(cx, topY, skirtR, ry(view, skirtR), 0, Math.PI, 0, true);
    ctx.lineTo(cx + skirtR, brimY);
    ctx.ellipse(cx, brimY, skirtR, ry(view, skirtR), 0, 0, Math.PI, true);
    ctx.closePath();
  };

  /* A little shadow where the lid overhangs, so it sits on the cup rather than floating. */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, topY + skirtR * tilt * 0.06, skirtR * 0.99, ry(view, skirtR), 0, ...near(view));
  ctx.fillStyle = "rgba(26,26,26,0.10)";
  ctx.fill();
  ctx.restore();

  skirt();
  ctx.fillStyle = LID;
  ctx.fill();

  ctx.save();
  skirt();
  ctx.clip();
  const round = ctx.createLinearGradient(cx - skirtR, 0, cx + skirtR, 0);
  round.addColorStop(0, "rgba(26,26,26,0.26)");
  round.addColorStop(0.36, "rgba(26,26,26,0)");
  round.addColorStop(0.68, "rgba(26,26,26,0)");
  round.addColorStop(1, "rgba(26,26,26,0.26)");
  ctx.fillStyle = round;
  ctx.fillRect(cx - skirtR, brimY - ry(view, skirtR), skirtR * 2, skirtH + ry(view, skirtR) * 2);
  ctx.restore();

  /* The flat brim. */
  ctx.fillStyle = LID_TOP;
  ctx.beginPath();
  ctx.ellipse(cx, brimY, skirtR, ry(view, skirtR), 0, 0, Math.PI * 2);
  ctx.fill();

  /* The flange is stepped, not flat — a concentric groove runs round it. */
  ctx.strokeStyle = "rgba(26,26,26,0.10)";
  ctx.lineWidth = Math.max(0.6, 0.35 * scale);
  ctx.beginPath();
  ctx.ellipse(cx, brimY, skirtR * 0.85, ry(view, skirtR * 0.85), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.ellipse(cx, brimY - 0.5 * scale, skirtR * 0.85, ry(view, skirtR * 0.85), 0, ...far(view));
  ctx.stroke();

  /* The shoulder: the near-side wall of the raised middle, as a strip between two front arcs. */
  ctx.beginPath();
  stripTop(ctx, view, cx, brimY, plateauR);
  ctx.lineTo(cx - plateauR, plateauY);
  stripBottom(ctx, view, cx, plateauY, plateauR);
  ctx.closePath();
  const wall = ctx.createLinearGradient(cx - plateauR, 0, cx + plateauR, 0);
  wall.addColorStop(0, "#cdc6b7");
  wall.addColorStop(0.4, LID);
  wall.addColorStop(1, "#cdc6b7");
  ctx.fillStyle = wall;
  ctx.fill();

  /* The raised middle. */
  ctx.fillStyle = LID_TOP;
  ctx.beginPath();
  ctx.ellipse(cx, plateauY, plateauR, ry(view, plateauR), 0, 0, Math.PI * 2);
  ctx.fill();

  /* Where the shoulder turns over, catching the light along the far side. */
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = Math.max(0.5, 0.28 * scale);
  ctx.beginPath();
  ctx.ellipse(cx, plateauY, plateauR, ry(view, plateauR), 0, ...far(view));
  ctx.stroke();

  /* And a soft shadow where it meets the brim on the near side. */
  ctx.strokeStyle = "rgba(26,26,26,0.12)";
  ctx.lineWidth = Math.max(0.6, 0.35 * scale);
  ctx.beginPath();
  ctx.ellipse(cx, brimY, plateauR, ry(view, plateauR), 0, ...near(view));
  ctx.stroke();

  /*
   * The sip opening: a teardrop set toward the near edge of the plateau, wider across than
   * deep, not a round port in the middle. Narrow end inward, as it is on the moulding.
   */
  const slotCy = plateauY + plateauR * tilt * 0.68;
  const slotW = plateauR * 0.38;
  const slotH = plateauR * tilt * 0.5;
  ctx.fillStyle = "rgba(38,30,24,0.44)";
  ctx.beginPath();
  ctx.moveTo(cx - slotW, slotCy);
  ctx.quadraticCurveTo(cx - slotW * 0.75, slotCy + slotH, cx, slotCy + slotH);
  ctx.quadraticCurveTo(cx + slotW * 0.75, slotCy + slotH, cx + slotW, slotCy);
  ctx.quadraticCurveTo(cx + slotW * 0.5, slotCy - slotH * 0.8, cx, slotCy - slotH * 0.8);
  ctx.quadraticCurveTo(cx - slotW * 0.5, slotCy - slotH * 0.8, cx - slotW, slotCy);
  ctx.closePath();
  ctx.fill();

  /* The moulded lip standing behind the opening. */
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = Math.max(0.4, 0.25 * scale);
  ctx.beginPath();
  ctx.moveTo(cx - slotW, slotCy);
  ctx.quadraticCurveTo(cx - slotW * 0.5, slotCy - slotH * 0.8, cx, slotCy - slotH * 0.8);
  ctx.quadraticCurveTo(cx + slotW * 0.5, slotCy - slotH * 0.8, cx + slotW, slotCy);
  ctx.stroke();

  /* The vent, on the far side. */
  ctx.fillStyle = "rgba(38,30,24,0.45)";
  ctx.beginPath();
  ctx.ellipse(
    cx - plateauR * 0.52,
    plateauY - plateauR * tilt * 0.42,
    Math.max(0.8, 0.5 * scale),
    Math.max(0.5, 0.32 * scale),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawBand(
  ctx: CanvasRenderingContext2D,
  doc: SleeveDoc,
  view: CupView,
  tex: HTMLImageElement,
  rot: number
) {
  const d = sleeveDieline(doc.size);
  const { cx, baseY, scale, tilt } = view;
  const hFrom = d.bandOnCup.from;
  const hTo = d.bandOnCup.to;
  const rTop = cupRadius(d, hTo) * scale;
  const rBot = cupRadius(d, hFrom) * scale;
  const yTop = baseY - hTo * scale;
  const yBot = baseY - hFrom * scale;

  /* The sheet's viewBox is in millimetres; the raster is some number of pixels across the same. */
  const sheet = layout(d);
  const pxPerMmX = tex.naturalWidth / sheet.width;
  const pxPerMmY = tex.naturalHeight / sheet.height;

  ctx.save();
  /* Clip to the visible face of the band so no slice spills past its edges. */
  ctx.beginPath();
  stripTop(ctx, view, cx, yTop, rTop);
  ctx.lineTo(cx - rBot, yBot);
  stripBottom(ctx, view, cx, yBot, rBot);
  ctx.closePath();
  ctx.clip();

  const spans = visibleSpans(rot);
  const toPx = (p: { x: number; y: number }) => ({ x: p.x * pxPerMmX, y: p.y * pxPerMmY });

  for (const span of spans) {
    const base = Math.floor((span.from + rot) / (2 * Math.PI));
    const steps = Math.max(2, Math.round((SLICES * (span.to - span.from)) / Math.PI));
    for (let i = 0; i < steps; i++) {
      const p0 = span.from + ((span.to - span.from) * i) / steps;
      const p1 = span.from + ((span.to - span.from) * (i + 1)) / steps;
      const t0 = (p0 + rot) / (2 * Math.PI) - base;
      const t1 = (p1 + rot) / (2 * Math.PI) - base;

      const s1 = toPx(sheetPointAtTurn(d, t0, hTo));
      const s2 = toPx(sheetPointAtTurn(d, t1, hTo));
      const s3 = toPx(sheetPointAtTurn(d, t0, hFrom));
      const d1 = surfacePoint(d, view, p0, hTo);
      const d2 = surfacePoint(d, view, p1, hTo);
      const d3 = surfacePoint(d, view, p0, hFrom);

      const m = affineFromTriangles(s1, s2, s3, d1, d2, d3);
      if (!m) continue;

      ctx.save();
      /* Clip to this wedge, then draw the whole sheet through the transform that lands it here. */
      ctx.beginPath();
      const d4 = surfacePoint(d, view, p1, hFrom);
      const pad = 0.6;
      ctx.moveTo(d1.x - pad, d1.y - pad);
      ctx.lineTo(d2.x + pad, d2.y - pad);
      ctx.lineTo(d4.x + pad, d4.y + pad);
      ctx.lineTo(d3.x - pad, d3.y + pad);
      ctx.closePath();
      ctx.clip();
      ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      ctx.drawImage(tex, 0, 0);
      ctx.restore();

      /* Shade the wedge by how far it has turned away, which is what makes it look round. */
      const lit = shadeAt((p0 + p1) / 2);
      const dark = 0.42 * (1 - lit);
      if (dark > 0.005) {
        ctx.fillStyle = `rgba(26,26,26,${dark.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(d1.x, d1.y);
        ctx.lineTo(d2.x, d2.y);
        ctx.lineTo(d4.x, d4.y);
        ctx.lineTo(d3.x, d3.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/**
 * Uncoated stock is not a flat fill. A little grain over the whole cup stops the gradients
 * reading as vinyl — built once and reused, because generating noise every frame of a spin
 * would cost more than the effect is worth.
 */
let grainPattern: CanvasPattern | null = null;

function grain(
  ctx: CanvasRenderingContext2D,
  view: CupView,
  rt: number,
  rb: number,
  topY: number,
  baseY: number
) {
  if (!grainPattern) {
    const tile = document.createElement("canvas");
    tile.width = 64;
    tile.height = 64;
    const tctx = tile.getContext("2d");
    if (!tctx) return;
    const img = tctx.createImageData(64, 64);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 42;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 16;
    }
    tctx.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(tile, "repeat");
  }
  if (!grainPattern) return;

  ctx.save();
  conePath(ctx, view, rt, rb, topY, baseY);
  ctx.clip();
  ctx.fillStyle = grainPattern;
  ctx.fillRect(view.cx - rt * 1.2, topY - ry(view, rt) - 2, rt * 2.4, baseY - topY + ry(view, rt) * 2 + 4);
  ctx.restore();
}
