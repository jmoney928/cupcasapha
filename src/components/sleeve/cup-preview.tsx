"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCw } from "lucide-react";
import { sleeveDieline } from "@/lib/sleeve/dielines";
import { layout } from "@/lib/sleeve/geometry";
import type { SleeveDoc } from "@/lib/sleeve/doc";
import { renderDoc, type Measurer } from "@/lib/sleeve/render-doc";
import {
  affineFromTriangles, cupRadius, shadeAt, sheetPointAtTurn, surfacePoint, visibleSpans, TILT,
  type CupView,
} from "@/lib/sleeve/wrap3d";

const W = 320;
const H = 400;
const PAD = { top: 20, bottom: 24, x: 26 };
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
  const dragging = useRef<{ x: number; from: number } | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [ready, setReady] = useState(false);

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
    el.width = W * dpr;
    el.height = H * dpr;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (spinning && !reduced && !dragging.current) rotation.current += SPIN * dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, doc, texture.current, rotation.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [doc, spinning, ready]);

  function onDown(e: React.PointerEvent) {
    dragging.current = { x: e.clientX, from: rotation.current };
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}
  }
  function onMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    /* A drag across the width of the cup turns it about half way round. */
    rotation.current = dragging.current.from + ((e.clientX - dragging.current.x) / W) * Math.PI * 2;
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
        style={{ width: "100%", maxWidth: W, aspectRatio: `${W} / ${H}` }}
        className="mx-auto block cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-label="Your sleeve on the cup — drag to turn it"
      />
      <p className="text-xs text-espresso/50 text-center mt-1">Drag to turn it.</p>
    </div>
  );
}

function viewFor(doc: SleeveDoc): CupView {
  const d = sleeveDieline(doc.size);
  const rt = d.cup.topDia / 2;
  const rb = d.cup.baseDia / 2;
  /* Room for the cup, the two foreshortened ellipses, and the lid sitting on top. */
  const lidMm = 7;
  const byHeight = (H - PAD.top - PAD.bottom) / (d.cup.height + (rt + rb) * TILT + lidMm);
  const byWidth = (W - PAD.x * 2) / (rt * 2 * 1.06);
  const scale = Math.min(byHeight, byWidth);
  return {
    scale,
    tilt: TILT,
    cx: W / 2,
    baseY: PAD.top + (lidMm + rt * TILT + d.cup.height) * scale,
  };
}

function draw(ctx: CanvasRenderingContext2D, doc: SleeveDoc, tex: HTMLImageElement | null, rot: number) {
  const d = sleeveDieline(doc.size);
  const view = viewFor(doc);
  const { cx, baseY, scale, tilt } = view;
  const rb = cupRadius(d, 0) * scale;
  const rt = cupRadius(d, d.cup.height) * scale;
  const topY = baseY - d.cup.height * scale;

  ctx.clearRect(0, 0, W, H);

  /* A soft contact shadow, so the cup sits on something. */
  const shadow = ctx.createRadialGradient(cx, baseY + rb * tilt, 1, cx, baseY + rb * tilt, rb * 1.7);
  shadow.addColorStop(0, "rgba(26,26,26,0.20)");
  shadow.addColorStop(1, "rgba(26,26,26,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + rb * tilt * 0.9, rb * 1.7, rb * tilt * 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

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
  drawRim(ctx, view, rt, rimOuter, topY);
  drawLid(ctx, view, rimOuter, topY);
}

/** The cone's silhouette — the back of the mouth and the front of the base. */
function conePath(
  ctx: CanvasRenderingContext2D,
  view: CupView,
  rt: number,
  rb: number,
  topY: number,
  baseY: number
) {
  const { cx, tilt } = view;
  ctx.beginPath();
  ctx.moveTo(cx - rt, topY);
  ctx.ellipse(cx, topY, rt, rt * tilt, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(cx + rb, baseY);
  ctx.ellipse(cx, baseY, rb, rb * tilt, 0, 0, Math.PI);
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
    ctx.ellipse(cx, yBot + t * fall, rBot, rBot * tilt, 0, 0, Math.PI);
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
  ctx.ellipse(cx, baseY, ro, ro * tilt, 0, 0, Math.PI);
  ctx.lineTo(cx - ro, yTop);
  ctx.ellipse(cx, yTop, ro, ro * tilt, 0, Math.PI, 0, true);
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
  ctx.ellipse(cx, yTop, ro, ro * tilt, 0, 0, Math.PI);
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
  ctx.ellipse(cx, topY, rimOuter, rimOuter * tilt, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(cx + rimOuter, topY + h);
  ctx.ellipse(cx, topY + h, rimOuter, rimOuter * tilt, 0, 0, Math.PI);
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
  ctx.ellipse(cx, topY + h, rt, rt * tilt, 0, 0, Math.PI);
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
    ctx.ellipse(cx, topY, skirtR, skirtR * tilt, 0, Math.PI, 0, true);
    ctx.lineTo(cx + skirtR, brimY);
    ctx.ellipse(cx, brimY, skirtR, skirtR * tilt, 0, 0, Math.PI, true);
    ctx.closePath();
  };

  /* A little shadow where the lid overhangs, so it sits on the cup rather than floating. */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, topY + skirtR * tilt * 0.06, skirtR * 0.99, skirtR * tilt, 0, 0, Math.PI);
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
  ctx.fillRect(cx - skirtR, brimY - skirtR * tilt, skirtR * 2, skirtH + skirtR * tilt * 2);
  ctx.restore();

  /* The flat brim. */
  ctx.fillStyle = LID_TOP;
  ctx.beginPath();
  ctx.ellipse(cx, brimY, skirtR, skirtR * tilt, 0, 0, Math.PI * 2);
  ctx.fill();

  /* The flange is stepped, not flat — a concentric groove runs round it. */
  ctx.strokeStyle = "rgba(26,26,26,0.10)";
  ctx.lineWidth = Math.max(0.6, 0.35 * scale);
  ctx.beginPath();
  ctx.ellipse(cx, brimY, skirtR * 0.85, skirtR * 0.85 * tilt, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.ellipse(cx, brimY - 0.5 * scale, skirtR * 0.85, skirtR * 0.85 * tilt, 0, Math.PI, Math.PI * 2);
  ctx.stroke();

  /* The shoulder: the near-side wall of the raised middle, as a strip between two front arcs. */
  ctx.beginPath();
  ctx.ellipse(cx, brimY, plateauR, plateauR * tilt, 0, 0, Math.PI);
  ctx.lineTo(cx - plateauR, plateauY);
  ctx.ellipse(cx, plateauY, plateauR, plateauR * tilt, 0, Math.PI, 0, true);
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
  ctx.ellipse(cx, plateauY, plateauR, plateauR * tilt, 0, 0, Math.PI * 2);
  ctx.fill();

  /* Where the shoulder turns over, catching the light along the far side. */
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = Math.max(0.5, 0.28 * scale);
  ctx.beginPath();
  ctx.ellipse(cx, plateauY, plateauR, plateauR * tilt, 0, Math.PI, Math.PI * 2);
  ctx.stroke();

  /* And a soft shadow where it meets the brim on the near side. */
  ctx.strokeStyle = "rgba(26,26,26,0.12)";
  ctx.lineWidth = Math.max(0.6, 0.35 * scale);
  ctx.beginPath();
  ctx.ellipse(cx, brimY, plateauR, plateauR * tilt, 0, 0, Math.PI);
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
  ctx.ellipse(cx, yTop, rTop, rTop * tilt, 0, 0, Math.PI);
  ctx.lineTo(cx - rBot, yBot);
  ctx.ellipse(cx, yBot, rBot, rBot * tilt, 0, Math.PI, 0, true);
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
  ctx.fillRect(view.cx - rt * 1.2, topY - rt * view.tilt, rt * 2.4, baseY - topY + rt * 2);
  ctx.restore();
}
