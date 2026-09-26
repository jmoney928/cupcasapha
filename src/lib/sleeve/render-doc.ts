/**
 * Renders a sleeve document to SVG.
 *
 * One user unit is one millimetre and the root carries mm width/height, so the file opens at true
 * size and goes on the press at 1:1. The same function draws the editor's canvas and writes the
 * download, so what someone sees is what they get.
 */
import { sleeveDieline } from "./dielines";
import { arcPath, degAt, layout, radialPath, sectorPath } from "./geometry";
import type { ImageElement, ShapeElement, SleeveDoc, SleeveElement, TextElement } from "./doc";
import { colour, dataImage, esc, fontStack, n } from "./safe";

/** Width of a run of text, in mm. The browser measures properly; tests use the estimate. */
export type Measurer = (text: string, el: TextElement) => number;

/** Rough enough to lay out without a DOM, and never used when one is available. */
export const estimateWidth: Measurer = (text, el) =>
  text.length * el.fontSize * (el.bold ? 0.58 : 0.54) + Math.max(0, text.length - 1) * el.letterSpacing;

/**
 * Greedy word wrap to the element's box, with typed line breaks kept as hard breaks. A single word
 * wider than the box is left to overhang rather than broken mid-word — breaking a café's name in
 * half is worse than a line that runs wide, and the safe-area guide shows when it has.
 */
export function wrapLines(el: TextElement, measure: Measurer): string[] {
  const max = Math.max(el.width, el.fontSize * 0.5);
  const out: string[] = [];

  for (const paragraph of el.text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate, el) > max) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) out.push(line);
  }

  return out.length ? out : [""];
}

/** The box the editor draws handles around. */
export function elementBounds(el: SleeveElement, measure: Measurer) {
  if (el.kind === "text") {
    /* The box, not the letters — so the wrap width is what you grab and drag. */
    const ls = wrapLines(el, measure);
    const widest = Math.max(1, ...ls.map((l) => measure(l, el)));
    return { width: Math.max(el.width, widest), height: ls.length * el.fontSize * el.lineHeight };
  }
  return { width: el.width, height: Math.max(el.height, el.kind === "shape" && el.shape === "line" ? el.strokeWidth : 0) };
}

const transform = (el: SleeveElement) =>
  el.rotation ? ` transform="rotate(${n(el.rotation)} ${n(el.x)} ${n(el.y)})"` : "";

const opacity = (el: SleeveElement) => (el.opacity < 1 ? ` opacity="${n(el.opacity)}"` : "");

function renderText(el: TextElement, measure: Measurer, idPrefix: string): string {
  const ls = wrapLines(el, measure);
  const stack = fontStack(el.font);
  const fill = colour(el.fill, "#ede9de");
  const anchor = el.align === "left" ? "start" : el.align === "right" ? "end" : "middle";
  const common =
    `font-family="${stack}" font-size="${n(el.fontSize)}" font-weight="${el.bold ? 700 : 400}"` +
    `${el.italic ? ' font-style="italic"' : ""}` +
    `${el.letterSpacing ? ` letter-spacing="${n(el.letterSpacing)}"` : ""} fill="${fill}"`;

  if (el.curve) {
    /* Each line rides its own arc, concentric, so a stack of curved lines stays parallel. */
    const rad = Math.abs(el.curve) * (Math.PI / 180);
    const up = el.curve > 0;
    const paths: string[] = [];
    const texts: string[] = [];
    ls.forEach((line, i) => {
      const width = Math.max(measure(line, el), 0.01);
      const base = width / rad;
      const step = i * el.fontSize * el.lineHeight;
      const r = Math.max(1, up ? base - step : base + step);
      const cy = up ? el.y + r : el.y - r;
      const half = ((width / r) * 180) / Math.PI / 2;
      const id = `${idPrefix}-${el.id}-l${i}`;
      const from = up ? -half : half;
      const to = up ? half : -half;
      paths.push(`<path id="${id}" d="${arcPath({ cx: el.x, cy }, r, from, to)}" fill="none"/>`);
      texts.push(
        `<text ${common} dominant-baseline="middle"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(
          line
        )}</textPath></text>`
      );
    });
    return `<g${transform(el)}${opacity(el)}><defs>${paths.join("")}</defs>${texts.join("")}</g>`;
  }

  const total = ls.length * el.fontSize * el.lineHeight;
  const first = el.y - total / 2 + el.fontSize * el.lineHeight * 0.5;
  /* Aligned against the edges of the box, which is what makes left and right mean anything. */
  const half = elementBounds(el, measure).width / 2;
  const x = el.align === "left" ? el.x - half : el.align === "right" ? el.x + half : el.x;
  const tspans = ls
    .map((line, i) => `<tspan x="${n(x)}" y="${n(first + i * el.fontSize * el.lineHeight)}">${esc(line)}</tspan>`)
    .join("");
  return `<text ${common} text-anchor="${anchor}" dominant-baseline="middle"${transform(el)}${opacity(
    el
  )}>${tspans}</text>`;
}

function renderImage(el: ImageElement): string {
  const href = dataImage(el.href);
  if (!href) return "";
  return `<image href="${href}" x="${n(el.x - el.width / 2)}" y="${n(el.y - el.height / 2)}" width="${n(
    el.width
  )}" height="${n(el.height)}" preserveAspectRatio="xMidYMid meet"${transform(el)}${opacity(el)}/>`;
}

function renderShape(el: ShapeElement): string {
  const fill = el.fill === "none" ? "none" : colour(el.fill, "#e8735a");
  const stroke = el.stroke === "none" ? "none" : colour(el.stroke, "#ede9de");
  const paint = `fill="${fill}" stroke="${stroke}" stroke-width="${n(el.strokeWidth)}"`;
  const t = `${transform(el)}${opacity(el)}`;
  if (el.shape === "ellipse") {
    return `<ellipse cx="${n(el.x)}" cy="${n(el.y)}" rx="${n(el.width / 2)}" ry="${n(el.height / 2)}" ${paint}${t}/>`;
  }
  if (el.shape === "line") {
    return `<line x1="${n(el.x - el.width / 2)}" y1="${n(el.y)}" x2="${n(el.x + el.width / 2)}" y2="${n(
      el.y
    )}" stroke="${stroke}" stroke-width="${n(el.strokeWidth)}" stroke-linecap="round"${t}/>`;
  }
  return `<rect x="${n(el.x - el.width / 2)}" y="${n(el.y - el.height / 2)}" width="${n(el.width)}" height="${n(
    el.height
  )}" rx="${n(el.radius)}" ${paint}${t}/>`;
}

export const renderElement = (el: SleeveElement, measure: Measurer, idPrefix = "s") =>
  el.kind === "text" ? renderText(el, measure, idPrefix) : el.kind === "image" ? renderImage(el) : renderShape(el);

export type RenderOptions = {
  /** Cut, fold, bleed and safe lines. On for the screen, off for the press. */
  guides?: boolean;
  measure?: Measurer;
  /** Unique across renders on one page, so two previews never share a path id. */
  idPrefix?: string;
};

export function renderDoc(doc: SleeveDoc, opts: RenderOptions = {}): string {
  const { guides = false, measure = estimateWidth, idPrefix = "s" } = opts;
  const d = sleeveDieline(doc.size);
  const l = layout(d);
  const bg = colour(doc.background, "#1a1a1a");

  const bleedExtra = degAt(d.bleed, d.innerRadius);
  const bleedShape = sectorPath(l, d.innerRadius - d.bleed, d.outerRadius + d.bleed, l.startDeg - bleedExtra, l.endDeg + bleedExtra);
  const cutShape = sectorPath(l, d.innerRadius, d.outerRadius, l.startDeg, l.endDeg);
  const safeInset = degAt(d.safeArea, d.innerRadius);
  const safeShape = sectorPath(l, d.innerRadius + d.safeArea, d.outerRadius - d.safeArea, l.startDeg + safeInset, l.foldDeg - safeInset);
  const clipId = `${idPrefix}-clip`;

  const art = doc.elements.map((el) => renderElement(el, measure, idPrefix)).join("");

  const guideLayer = guides
    ? [
        `<g fill="none">`,
        /* A pale line under the dark one, so the cut reads on a black sleeve and a cream one alike. */
        `<path d="${cutShape}" stroke="#ffffff" stroke-width="0.7" stroke-opacity="0.9"/>`,
        `<path d="${radialPath(l, d.innerRadius, d.outerRadius, l.foldDeg)}" stroke="#ffffff" stroke-width="0.7" stroke-opacity="0.9"/>`,
        `<g stroke-width="0.25">`,
        `<path d="${bleedShape}" stroke="#e8735c" stroke-dasharray="1.5 1.5"/>`,
        `<path d="${cutShape}" stroke="#1a1a1a"/>`,
        `<path d="${safeShape}" stroke="#4a9cd4" stroke-dasharray="1 1"/>`,
        `<path d="${radialPath(l, d.innerRadius, d.outerRadius, l.foldDeg)}" stroke="#1a1a1a" stroke-dasharray="2 1.5"/>`,
        `</g></g>`,
      ].join("")
    : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(l.width)}mm" height="${n(l.height)}mm" viewBox="0 0 ${n(
      l.width
    )} ${n(l.height)}">`,
    `<title>cupcasa sleeve — ${d.label}</title>`,
    `<desc>1:1 at ${n(l.width)} × ${n(l.height)} mm. ${d.label} dieline, ${d.bleed}mm bleed, ${d.glueLap.width}mm glue lap.</desc>`,
    `<defs><clipPath id="${clipId}"><path d="${bleedShape}"/></clipPath></defs>`,
    `<path d="${bleedShape}" fill="${bg}"/>`,
    /* Artwork is clipped to the bleed so a dragged element can never print past the trim. */
    `<g clip-path="url(#${clipId})">${art}</g>`,
    guideLayer,
    cropMarks(l),
    `</svg>`,
  ].join("");
}

/** Corner marks outside the bleed, so the trimmer has something to line up on. */
function cropMarks(l: ReturnType<typeof layout>): string {
  const m = l.margin;
  const len = m * 0.7;
  const seg = [
    [0, m, len, m], [m, 0, m, len],
    [l.width, m, l.width - len, m], [l.width - m, 0, l.width - m, len],
    [0, l.height - m, len, l.height - m], [m, l.height, m, l.height - len],
    [l.width, l.height - m, l.width - len, l.height - m], [l.width - m, l.height, l.width - m, l.height - len],
  ].map(([x1, y1, x2, y2]) => `M ${n(x1)} ${n(y1)} L ${n(x2)} ${n(y2)}`);
  return `<path d="${seg.join(" ")}" stroke="#1a1a1a" stroke-width="0.2" fill="none"/>`;
}

export const sleeveFileName = (doc: SleeveDoc) => {
  const first = doc.elements.find((e): e is TextElement => e.kind === "text" && e.text.trim().length > 0);
  const name = (first?.text ?? "artwork").split("\n")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `cupcasa-sleeve-${doc.size}oz-${name || "artwork"}.svg`;
};

/**
 * Whether every corner of an element sits inside the safe area.
 *
 * Wrapping makes it easy to build a text block taller than the band without noticing, and the
 * clip means it would simply print cut off. Cheaper to say so than to let someone order 500
 * sleeves with half a name on them.
 */
export function insideSafeArea(doc: SleeveDoc, el: SleeveElement, measure: Measurer): boolean {
  const d = sleeveDieline(doc.size);
  const l = layout(d);
  const b = elementBounds(el, measure);
  const inset = degAt(d.safeArea, d.innerRadius);
  const minR = d.innerRadius + d.safeArea;
  const maxR = d.outerRadius - d.safeArea;
  const minDeg = l.startDeg + inset;
  const maxDeg = l.foldDeg - inset;
  const a = (el.rotation * Math.PI) / 180;

  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const lx = (sx * b.width) / 2;
    const ly = (sy * b.height) / 2;
    const x = el.x + lx * Math.cos(a) - ly * Math.sin(a);
    const y = el.y + lx * Math.sin(a) + ly * Math.cos(a);
    const dx = x - l.cx;
    const dy = y - l.cy;
    const r = Math.hypot(dx, dy);
    /* Angle either side of straight up, matching how the sector is laid out. */
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (r < minR || r > maxR || deg < minDeg || deg > maxDeg) return false;
  }
  return true;
}
