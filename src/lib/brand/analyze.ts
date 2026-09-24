import "server-only";
import sharp from "sharp";

/**
 * What a café can't do for themselves: check the logo will actually print, pull a palette out of it,
 * and make the single-colour version cheap printing needs. See docs/SPEC.md, "Logo handling".
 *
 * The original is never modified — for a lot of cafés this file is the only copy they have.
 */
export type LogoAnalysis = {
  width: number;
  height: number;
  format: string;
  hasAlpha: boolean;
  /** Print readiness, judged against the widest confirmed piece (the A1 A-frame). */
  print: { ok: boolean; level: "good" | "marginal" | "poor"; message: string };
  palette: string[];
  /** True when the logo has no usable colour of its own (pure black/white artwork). */
  monochrome: boolean;
  /** PNG data URLs, for preview and for the generated assets. */
  normalizedPng: string;
  monoPng: string;
};

const MIN_PRINT_WIDTH = 1200;
const GOOD_PRINT_WIDTH = 2000;

export async function analyzeLogo(input: Buffer): Promise<LogoAnalysis> {
  const image = sharp(input, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const vector = meta.format === "svg" || meta.format === "pdf";

  const print = vector
    ? { ok: true, level: "good" as const, message: "Vector artwork — it will print crisply at any size." }
    : width >= GOOD_PRINT_WIDTH
      ? { ok: true, level: "good" as const, message: `${width}px wide — plenty for print.` }
      : width >= MIN_PRINT_WIDTH
        ? { ok: true, level: "marginal" as const, message: `${width}px wide. Fine for signage and social, but a vector or larger file would be better for anything printed large.` }
        : { ok: false, level: "poor" as const, message: `Only ${width}px wide. This will look soft when printed. Send us a vector (SVG, PDF or AI) if you have one — it's worth finding.` };

  // Normalise to a workable PNG on transparent ground, capped so downstream renders stay fast.
  const normalized = await sharp(input, { failOn: "none", density: 300 })
    .resize({ width: Math.min(Math.max(width || 1200, 600), 1600), withoutEnlargement: false, fit: "inside" })
    .png()
    .toBuffer();

  const palette = await extractPalette(normalized);
  const mono = await toMono(normalized);

  return {
    width, height, format: meta.format ?? "unknown", hasAlpha: Boolean(meta.hasAlpha),
    print, palette, monochrome: palette.length === 0,
    normalizedPng: `data:image/png;base64,${normalized.toString("base64")}`,
    monoPng: `data:image/png;base64,${mono.toString("base64")}`,
  };
}

/** Dominant colours, offered as suggestions and never imposed. */
async function extractPalette(png: Buffer): Promise<string[]> {
  const { data, info } = await sharp(png).resize(48, 48, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3] ?? 255];
    if (a < 128) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max > 240 && min > 240) continue; // near-white ground
    if (max < 24) continue;               // pure-black artwork has no colour to extract
    const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
    const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    buckets.set(key, { r: cur.r + r, g: cur.g + g, b: cur.b + b, n: cur.n + 1 });
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((c) => hex(Math.round(c.r / c.n), Math.round(c.g / c.n), Math.round(c.b / c.n)));
}

/** Single-colour version, which is what the cheapest sleeve printing needs. */
async function toMono(png: Buffer): Promise<Buffer> {
  return sharp(png).ensureAlpha().greyscale().normalise().threshold(150).png().toBuffer();
}

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
