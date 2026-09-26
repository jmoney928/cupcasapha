/** Guards for anything that ends up inside a generated file. */

/** SVG is XML: a stray & or < from user text breaks the document. */
export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Trim a number to something a path can carry without a wall of decimals. */
export const n = (v: number) => Number(v.toFixed(3));

/** A colour we are willing to write into a file. Anything else falls back rather than injecting. */
export const colour = (value: string, fallback: string) =>
  /^#[0-9a-f]{3}([0-9a-f]{3,5})?$/i.test(value.trim()) ? value.trim() : fallback;

/**
 * Only a self-contained image is allowed. A remote URL in a print file would fetch when the
 * printer opens it, which is both a privacy leak and a file that renders differently offline.
 */
export const dataImage = (value: string | null | undefined): string | null =>
  value && /^data:image\/(png|jpeg|svg\+xml|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : null;

/** Fonts are written into the file, so only ones we ship a stack for. */
export const FONTS = [
  { id: "sans", label: "Sans", stack: "Helvetica, Arial, sans-serif" },
  { id: "serif", label: "Serif", stack: "Georgia, 'Times New Roman', serif" },
  { id: "mono", label: "Mono", stack: "'SF Mono', Menlo, Consolas, monospace" },
  { id: "rounded", label: "Rounded", stack: "'Avenir Next', 'Trebuchet MS', sans-serif" },
] as const;

export type FontId = (typeof FONTS)[number]["id"];

export const fontStack = (id: string) => FONTS.find((f) => f.id === id)?.stack ?? FONTS[0].stack;
