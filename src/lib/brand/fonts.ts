import "server-only";

/**
 * Satori needs real font buffers, and only accepts TTF/OTF/WOFF (not WOFF2), so we ask Google Fonts
 * with an old User-Agent to get a TTF back. Cached for the life of the server process.
 */
const cache = new Map<string, ArrayBuffer>();

export async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/src: url\((https:[^)]+\.(?:ttf|otf))\)/)?.[1];
    if (!url) return null;
    const buf = await fetch(url).then((r) => r.arrayBuffer());
    cache.set(key, buf);
    return buf;
  } catch {
    return null;
  }
}

/** The site's display + body pairing, for generated assets. */
export async function brandFonts() {
  const [displayBold, body] = await Promise.all([loadFont("Manrope", 800), loadFont("Inter", 500)]);
  const fonts = [];
  if (displayBold) fonts.push({ name: "Manrope", data: displayBold, weight: 800 as const, style: "normal" as const });
  if (body) fonts.push({ name: "Inter", data: body, weight: 500 as const, style: "normal" as const });
  return fonts;
}
