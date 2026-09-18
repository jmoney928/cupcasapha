import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "cupcasa — made for every drink, made to disappear. Home-compostable PHA cups.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Manrope 800 (the site display font) fetched at build time; falls back to the default sans if offline. */
async function loadManrope(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Manrope:wght@800&display=swap", {
      headers: { "User-Agent": "Mozilla/5.0" }, // ask for a TTF/OTF, not woff2 (satori can't read woff2)
    }).then((r) => r.text());
    const url = css.match(/src: url\((https:[^)]+\.(?:ttf|otf))\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/** Generated at build time; edit the copy here rather than re-exporting a PNG. */
export default async function OpenGraphImage() {
  const [cup, mark, manrope] = await Promise.all([
    readFile(path.join(process.cwd(), "public/rebrand/hero-cup.png")),
    readFile(path.join(process.cwd(), "public/brand/wordmark-black.png")),
    loadManrope(),
  ]);
  const cupSrc = `data:image/png;base64,${cup.toString("base64")}`;
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ede9de", fontFamily: manrope ? "Manrope, sans-serif" : "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 0 72px 72px", width: 690 }}>
          <div style={{ fontSize: 22, letterSpacing: 5, fontWeight: 700, color: "#e8735a", textTransform: "uppercase" }}>
            Home compostable · plastic-free
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 62, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            <span style={{ color: "#1a1a1a" }}>Made for every drink.</span>
            <span style={{ color: "#e8735a" }}>Made to disappear.</span>
          </div>
          <div style={{ marginTop: 32, fontSize: 28, color: "#45443f", fontWeight: 600 }}>
            Fully compostable PHA cups, hot or cold.
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} alt="" width={236} height={62} style={{ marginTop: 56 }} />
        </div>
        <div style={{ display: "flex", width: 510, height: "100%", overflow: "hidden", borderRadius: "48px 0 0 48px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cupSrc} alt="" width={630} height={630} style={{ objectFit: "cover", marginLeft: -60 }} />
        </div>
      </div>
    ),
    { ...size, fonts: manrope ? [{ name: "Manrope", data: manrope, weight: 800, style: "normal" }] : undefined },
  );
}
