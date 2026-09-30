/**
 * Carrying a built bundle through checkout.
 *
 * Two things have to survive the jump from the builder to our inbox: what the person chose, and
 * what they drew. The choices are small and go into Stripe metadata, where they stay attached to
 * the payment for good. The artwork is not small — an uploaded logo is a data URL and can run to
 * megabytes — so it travels once, as an email attachment, and is never put anywhere it would have
 * to be stored or paid for.
 *
 * Nothing here is trusted for pricing. The checkout route still prices every line from the
 * catalogue; this is description only.
 */
import type { SleeveDoc } from "@/lib/sleeve/doc";
import { PATTERNS, SLEEVE_STOCKS } from "@/lib/sleeve/safe";

/** Vercel caps a function's request body at 4.5MB; stay well under it, headers and all. */
export const MAX_ARTWORK_BYTES = 3_000_000;

export type Artwork = {
  slug: string;
  oz: number;
  /** One line a human can read in an email without opening anything. */
  summary: string;
  /** The print-ready sleeve, or null when it was too big to carry. */
  svg: string | null;
  /** Why the file is missing though artwork existed, so the order email can say which. */
  omitted?: "too-large" | "unreadable";
};

const STORAGE_KEY = "cupcasa-artwork";

/**
 * What the sleeve says, in words. Deliberately not a dump of the document: the point is that
 * whoever opens the order email can tell at a glance what was ordered without rendering anything.
 */
export function describeDoc(doc: SleeveDoc): string {
  const parts: string[] = [];

  const stock = SLEEVE_STOCKS.find((s) => s.colour.toLowerCase() === doc.background.toLowerCase());
  parts.push(stock ? `${stock.label} stock` : `stock ${doc.background}`);

  if (doc.pattern && doc.pattern !== "none") {
    const pattern = PATTERNS.find((p) => p.id === doc.pattern);
    parts.push(`${pattern?.label ?? doc.pattern} background`);
  }
  if (doc.backgroundImage) parts.push("uploaded background picture");

  const text = doc.elements
    .filter((el): el is Extract<typeof el, { kind: "text" }> => el.kind === "text")
    .map((el) => el.text.trim())
    .filter(Boolean);
  if (text.length) parts.push(`text: ${text.map((t) => `“${t}”`).join(", ")}`);

  const images = doc.elements.filter((el) => el.kind === "image").length;
  if (images) parts.push(`${images} uploaded image${images === 1 ? "" : "s"}`);

  const shapes = doc.elements.filter((el) => el.kind === "shape").length;
  if (shapes) parts.push(`${shapes} shape${shapes === 1 ? "" : "s"}`);

  return parts.join(" · ");
}

/** Bytes a string will weigh as UTF-8, which is what the request body actually carries. */
const byteLength = (s: string): number =>
  typeof TextEncoder === "undefined" ? s.length : new TextEncoder().encode(s).length;

export function buildArtwork(slug: string, oz: number, summary: string, svg: string): Artwork {
  if (byteLength(svg) > MAX_ARTWORK_BYTES) {
    return { slug, oz, summary, svg: null, omitted: "too-large" };
  }
  return { slug, oz, summary, svg };
}

/* ------------------------------------------------------------------ the browser side */

/**
 * Artwork waits in localStorage between adding to the cart and checking out, keyed by the SKU it
 * belongs to. It is cleared once an order is on its way — holding a stranger's logo on a shared
 * machine for no reason would be careless.
 */
export function saveArtwork(art: Artwork): void {
  try {
    const all = loadArtwork().filter((a) => a.slug !== art.slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, art]));
  } catch {
    // A quota failure must never block a sale. We lose the file, not the order, and the
    // omitted flag on the wire tells us to ask for it.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...art, svg: null, omitted: "too-large" }]));
    } catch {}
  }
}

export function loadArtwork(): Artwork[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is Artwork =>
        !!a && typeof a === "object" && typeof (a as Artwork).slug === "string"
    );
  } catch {
    return [];
  }
}

export function clearArtwork(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/* ------------------------------------------------------------------ the server side */

/** What survives validation on the way in. A tampered payload can describe, never price. */
export function sanitiseArtwork(input: unknown): Artwork[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const a = raw as Record<string, unknown>;
    const slug = typeof a.slug === "string" ? a.slug.slice(0, 80) : null;
    if (!slug) return [];
    const raw_svg = typeof a.svg === "string" ? a.svg : null;
    const isSvg = raw_svg !== null && raw_svg.startsWith("<svg");
    const fits = raw_svg !== null && byteLength(raw_svg) <= MAX_ARTWORK_BYTES;
    const svg = isSvg && fits ? raw_svg : null;
    return [
      {
        slug,
        oz: Number(a.oz) || 0,
        summary: typeof a.summary === "string" ? a.summary.slice(0, 400) : "",
        svg,
        ...(svg === null && a.svg
          ? { omitted: (isSvg ? "too-large" : "unreadable") as "too-large" | "unreadable" }
          : {}),
      },
    ];
  });
}
