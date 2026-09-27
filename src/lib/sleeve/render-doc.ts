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
import type { SleeveDieline } from "./dielines";

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

/** The centre the dieline's arcs are struck from. Everything angular is measured from here. */
export type Frame = { cx: number; cy: number };

/**
 * Text follows an arc struck from the dieline's own centre.
 *
 * This is the whole trick of a sleeve. The flat shape is an annular sector, so a constant radius
 * on the sheet is a constant height once it is wrapped round the cup. Set text on a straight line
 * and it crosses radii, which reads as a slope curving away on the cup; set it on a concentric arc
 * and it sits level. `curve` bends away from that natural arc rather than replacing it.
 */
function renderText(el: TextElement, measure: Measurer, idPrefix: string, frame: Frame): string {
  const ls = wrapLines(el, measure);
  const stack = fontStack(el.font);
  const fill = colour(el.fill, "#1a1a1a");
  const anchor = el.align === "left" ? "start" : el.align === "right" ? "end" : "middle";
  const offset = el.align === "left" ? "0%" : el.align === "right" ? "100%" : "50%";
  const common =
    `font-family="${stack}" font-size="${n(el.fontSize)}" font-weight="${el.bold ? 700 : 400}"` +
    `${el.italic ? ' font-style="italic"' : ""}` +
    `${el.letterSpacing ? ` letter-spacing="${n(el.letterSpacing)}"` : ""} fill="${fill}"`;

  const natural = Math.hypot(el.x - frame.cx, el.y - frame.cy);
  /* Tighter radius bends more; looser flattens. Never past zero, which would invert the text. */
  const bend = Math.max(0.2, 1 - el.curve / 150);
  const base = Math.max(el.fontSize, natural * bend);
  /* Angle either side of straight up, matching how the sector is laid out. */
  const angle = (Math.atan2(el.x - frame.cx, -(el.y - frame.cy)) * 180) / Math.PI;
  const step = el.fontSize * el.lineHeight;

  const paths: string[] = [];
  const texts: string[] = [];
  ls.forEach((line, i) => {
    /* Later lines sit at a smaller radius, which is lower down the cup. */
    const radius = Math.max(el.fontSize, base + ((ls.length - 1) / 2 - i) * step);
    const halfDeg = degAt(el.width / 2, radius);
    const id = `${idPrefix}-${el.id}-l${i}`;
    paths.push(`<path id="${id}" d="${arcPath(frame, radius, angle - halfDeg, angle + halfDeg)}" fill="none"/>`);
    texts.push(
      `<text ${common} dominant-baseline="middle">` +
        `<textPath href="#${id}" startOffset="${offset}" text-anchor="${anchor}">${esc(line)}</textPath></text>`
    );
  });

  return `<g${transform(el)}${opacity(el)}><defs>${paths.join("")}</defs>${texts.join("")}</g>`;
}

/** Hex to the 0-1 channels a colour matrix wants. */
function channels(hex: string): [number, number, number] | null {
  const v = hex.trim().replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
}

/**
 * A placed picture, drawn as a single image.
 *
 * The bend is baked into the picture itself rather than expressed as clipped slices here — see
 * warp-raster.ts for why. `warped` carries both the bent picture and where it sits; without it
 * (nothing has baked it yet) the original is placed flat rather than not at all.
 */
function renderImage(el: ImageElement, idPrefix: string): string {
  const warped = el.warped ? dataImage(el.warped.href) : null;
  const href = warped ?? dataImage(el.href);
  if (!href) return "";

  const rgb = el.tint && el.tint !== "none" ? channels(colour(el.tint, "")) : null;
  const filterId = `${idPrefix}-tint-${el.id}`;
  const defs = rgb
    ? `<defs><filter id="${filterId}" color-interpolation-filters="sRGB">` +
      `<feColorMatrix type="matrix" values="0 0 0 0 ${n(rgb[0])} 0 0 0 0 ${n(rgb[1])} 0 0 0 0 ${n(
        rgb[2]
      )} 0 0 0 1 0"/></filter></defs>`
    : "";
  const filter = rgb ? ` filter="url(#${filterId})"` : "";

  /* The baked picture already carries the element's rotation; a flat fallback still needs it. */
  const box = warped && el.warped
    ? { x: el.warped.x, y: el.warped.y, width: el.warped.width, height: el.warped.height, spin: "" }
    : {
        x: el.x - el.width / 2, y: el.y - el.height / 2,
        width: el.width, height: el.height, spin: transform(el),
      };

  return (
    defs +
    `<image href="${href}" x="${n(box.x)}" y="${n(box.y)}" width="${n(box.width)}" height="${n(
      box.height
    )}" preserveAspectRatio="none"${filter}${box.spin}${opacity(el)}/>`
  );
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

export const renderElement = (el: SleeveElement, measure: Measurer, frame: Frame, idPrefix = "s") =>
  el.kind === "text"
    ? renderText(el, measure, idPrefix, frame)
    : el.kind === "image"
      ? renderImage(el, idPrefix)
      : renderShape(el);

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

  const art = doc.elements.map((el) => renderElement(el, measure, l, idPrefix)).join("");

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
    /*
     * An uploaded background covers the whole sheet and is clipped to the bleed, so it reaches the
     * trim on every edge whatever shape the picture is. Stock colour stays underneath, which is
     * what shows through when it is dimmed.
     */
    `<g clip-path="url(#${clipId})">${backgroundImage(doc, l)}${patternLayer(doc, d, l, idPrefix)}</g>`,
    /* Artwork is clipped to the bleed so a dragged element can never print past the trim. */
    `<g clip-path="url(#${clipId})">${art}</g>`,
    guideLayer,
    cropMarks(l),
    `</svg>`,
  ].join("");
}

/** An uploaded picture, scaled to cover the sheet rather than stretched to fit it. */
function backgroundImage(doc: SleeveDoc, l: ReturnType<typeof layout>): string {
  const href = dataImage(doc.backgroundImage);
  if (!href) return "";
  const alpha = Math.min(1, Math.max(0.05, doc.backgroundImageOpacity));
  return (
    `<image href="${href}" x="0" y="0" width="${n(l.width)}" height="${n(l.height)}"` +
    ` preserveAspectRatio="xMidYMid slice"${alpha < 1 ? ` opacity="${n(alpha)}"` : ""}/>`
  );
}

/**
 * Background designs, drawn under the artwork.
 *
 * Rings follow the dieline's own arcs, so they wrap as level bands round the cup rather than
 * sloping — the same reason text has to. The tiled ones are deliberately quiet: a sleeve is a
 * background for a café's mark, not a competitor to it.
 */
function patternLayer(doc: SleeveDoc, d: SleeveDieline, l: ReturnType<typeof layout>, idPrefix: string): string {
  if (doc.pattern === "none") return "";
  const ink = colour(doc.patternInk, "#1a1a1a");
  const spread = degAt(d.bleed, d.innerRadius);
  const from = l.startDeg - spread;
  const to = l.endDeg + spread;

  if (doc.pattern === "rings") {
    const rings: string[] = [];
    for (let r = d.innerRadius + 4; r < d.outerRadius; r += 4) {
      rings.push(`<path d="${arcPath(l, r, from, to)}"/>`);
    }
    return `<g fill="none" stroke="${ink}" stroke-opacity="0.16" stroke-width="0.5">${rings.join("")}</g>`;
  }

  if (doc.pattern === "rule") {
    const inset = 2.5;
    const framed = sectorPath(
      l,
      d.innerRadius + inset,
      d.outerRadius - inset,
      l.startDeg + degAt(inset, d.innerRadius),
      l.foldDeg - degAt(inset, d.innerRadius)
    );
    return `<path d="${framed}" fill="none" stroke="${ink}" stroke-opacity="0.32" stroke-width="0.5"/>`;
  }

  const tiles: Record<string, { size: number; body: string }> = {
    stripes: {
      size: 7,
      body: `<path d="M -1 8 L 8 -1 M 1 10 L 10 1" stroke="${ink}" stroke-opacity="0.13" stroke-width="0.55" fill="none"/>`,
    },
    dots: {
      size: 7,
      body: `<circle cx="3.5" cy="3.5" r="0.75" fill="${ink}" fill-opacity="0.17"/>`,
    },
    sprigs: {
      size: 15,
      body:
        `<g stroke="${ink}" stroke-opacity="0.22" stroke-width="0.45" fill="none">` +
        `<path d="M7.5 12.5 C7.5 9 7.5 6.5 7.5 4"/></g>` +
        `<g fill="${ink}" fill-opacity="0.15">` +
        `<path d="M7.5 7.4 C5.4 7.4 4.2 6.3 3.8 4.6 C5.9 4.6 7.1 5.7 7.5 7.4 Z"/>` +
        `<path d="M7.5 9.6 C9.6 9.6 10.8 8.5 11.2 6.8 C9.1 6.8 7.9 7.9 7.5 9.6 Z"/></g>`,
    },
  };
  const tile = tiles[doc.pattern];
  if (!tile) return "";
  const id = `${idPrefix}-pat`;
  const area = sectorPath(l, d.innerRadius - d.bleed, d.outerRadius + d.bleed, from, to);
  return (
    `<defs><pattern id="${id}" width="${tile.size}" height="${tile.size}" patternUnits="userSpaceOnUse">` +
    `${tile.body}</pattern></defs><path d="${area}" fill="url(#${id})"/>`
  );
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
