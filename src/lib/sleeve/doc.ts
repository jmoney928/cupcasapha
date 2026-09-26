/**
 * The sleeve document: what someone has put on the band, in millimetres, in the same coordinate
 * space as the rendered sheet. Everything the editor does is a pure change to this object, which
 * is what makes undo a stack rather than a pile of special cases.
 */
import { sleeveDieline, type CupSize } from "./dielines";
import { bandCentre, layout } from "./geometry";
import type { FontId } from "./safe";

export type ElementKind = "text" | "image" | "shape";

type Base = {
  id: string;
  /** Centre of the element, in sheet millimetres. */
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  locked: boolean;
};

export type TextElement = Base & {
  kind: "text";
  text: string;
  font: FontId;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  letterSpacing: number;
  lineHeight: number;
  align: "left" | "center" | "right";
  /** Box width in mm. Text wraps to it; a word longer than the box overhangs rather than breaking. */
  width: number;
  fill: string;
  /** Degrees of curve. 0 is a straight line; positive bends the text upward. */
  curve: number;
};

export type ImageElement = Base & {
  kind: "image";
  href: string;
  width: number;
  height: number;
};

export type ShapeElement = Base & {
  kind: "shape";
  shape: "rect" | "ellipse" | "line";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
};

export type SleeveElement = TextElement | ImageElement | ShapeElement;

export type SleeveDoc = {
  size: CupSize;
  background: string;
  elements: SleeveElement[];
};

let counter = 0;
export const newId = () => `el-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/** Middle of the printable band — where a new element lands. */
export function centreOf(size: CupSize) {
  const d = sleeveDieline(size);
  const c = bandCentre(layout(d), d);
  return { x: c.x, y: c.y };
}

export function newText(size: CupSize, over: Partial<TextElement> = {}): TextElement {
  const c = centreOf(size);
  const d = sleeveDieline(size);
  return {
    id: newId(), kind: "text", x: c.x, y: c.y, rotation: 0, opacity: 1, locked: false,
    text: "Your café", font: "sans", fontSize: 11, bold: true, italic: false,
    letterSpacing: 0, lineHeight: 1.25, align: "center",
    /* Wide enough that a short name never wraps, narrow enough that a sentence does. */
    width: Math.round(d.arcBottom * 0.7),
    fill: "#ede9de", curve: 0,
    ...over,
  };
}

export function newImage(size: CupSize, href: string, aspect: number): ImageElement {
  const c = centreOf(size);
  const d = sleeveDieline(size);
  const height = Math.min(d.bandHeight - 2 * d.safeArea, 30);
  return {
    id: newId(), kind: "image", x: c.x, y: c.y, rotation: 0, opacity: 1, locked: false,
    href, height, width: height * (aspect > 0 ? aspect : 1),
  };
}

export function newShape(size: CupSize, shape: ShapeElement["shape"]): ShapeElement {
  const c = centreOf(size);
  return {
    id: newId(), kind: "shape", x: c.x, y: c.y, rotation: 0, opacity: 1, locked: false,
    shape, width: shape === "line" ? 80 : 40, height: shape === "line" ? 0 : 20,
    fill: shape === "line" ? "none" : "#e8735a", stroke: shape === "line" ? "#ede9de" : "none",
    strokeWidth: shape === "line" ? 1.5 : 0, radius: 2,
  };
}

export const emptyDoc = (size: CupSize = 12): SleeveDoc => ({
  size,
  background: "#1a1a1a",
  elements: [newText(size)],
});

/* ---------------------------------------------------------------- operations */

export const byId = (doc: SleeveDoc, id: string) => doc.elements.find((e) => e.id === id);

export const update = (doc: SleeveDoc, id: string, patch: Partial<SleeveElement>): SleeveDoc => ({
  ...doc,
  elements: doc.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as SleeveElement) : e)),
});

export const add = (doc: SleeveDoc, el: SleeveElement): SleeveDoc => ({
  ...doc,
  elements: [...doc.elements, el],
});

export const remove = (doc: SleeveDoc, id: string): SleeveDoc => ({
  ...doc,
  elements: doc.elements.filter((e) => e.id !== id),
});

export function duplicate(doc: SleeveDoc, id: string): { doc: SleeveDoc; id: string } {
  const el = byId(doc, id);
  if (!el) return { doc, id };
  const copy = { ...el, id: newId(), x: el.x + 4, y: el.y + 4 } as SleeveElement;
  return { doc: add(doc, copy), id: copy.id };
}

/** Later in the array paints on top, so ordering is just a move within it. */
export function reorder(doc: SleeveDoc, id: string, to: "front" | "back" | "forward" | "backward"): SleeveDoc {
  const i = doc.elements.findIndex((e) => e.id === id);
  if (i < 0) return doc;
  const rest = doc.elements.filter((e) => e.id !== id);
  const el = doc.elements[i];
  const at =
    to === "front" ? rest.length : to === "back" ? 0 : to === "forward" ? Math.min(i + 1, rest.length) : Math.max(i - 1, 0);
  return { ...doc, elements: [...rest.slice(0, at), el, ...rest.slice(at)] };
}

/**
 * Changing size changes the shape of the band, so everything is carried across by the shift in the
 * band's centre. Without this a design jumps off the sleeve the moment someone tries another size.
 */
export function resize(doc: SleeveDoc, size: CupSize): SleeveDoc {
  if (size === doc.size) return doc;
  const from = centreOf(doc.size);
  const to = centreOf(size);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    ...doc,
    size,
    elements: doc.elements.map((e) => ({ ...e, x: e.x + dx, y: e.y + dy })),
  };
}
