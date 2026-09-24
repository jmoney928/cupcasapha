import type { ReactElement } from "react";
import { CERT } from "@/lib/certs";

/**
 * Six templates and a colour picker — no font or spacing controls. A café owner handed a full design
 * tool produces something worse than the worst template and blames the tool. See docs/SPEC.md,
 * "Where this loses its way".
 */
export const TEMPLATES = [
  { key: "logo-centred", label: "Logo centred", blurb: "Safest. Works with any mark." },
  { key: "logo-tagline", label: "Logo + tagline", blurb: "Your mark over two lines of your words." },
  { key: "wordmark-band", label: "Wordmark band", blurb: "Type-led. No logo needed." },
  { key: "pattern-badge", label: "Pattern + badge", blurb: "Repeating motif with a logo badge." },
  { key: "sustainability", label: "Sustainability co-brand", blurb: "Your logo beside our certification." },
  { key: "minimal-stamp", label: "Minimal stamp", blurb: "Single colour. Cheapest to print." },
] as const;
export type TemplateKey = (typeof TEMPLATES)[number]["key"];

export type BrandInput = {
  cafeName: string;
  tagline?: string;
  primary: string;
  secondary: string;
  logoPng: string | null;
  monoPng: string | null;
  template: TemplateKey;
};

const readable = (hex: string) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2) || "0", 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1a1a1a" : "#ffffff";
};

const dots = (color: string, n = 26) => (
  <div style={{ display: "flex", position: "absolute", inset: 0, flexWrap: "wrap", opacity: 0.16 }}>
    {Array.from({ length: n * 3 }).map((_, i) => (
      <div key={i} style={{ display: "flex", width: 40, height: 40, margin: 18, borderRadius: 20, background: color }} />
    ))}
  </div>
);

/** "We've switched" — the announcement post. */
export function switchedPost(b: BrandInput, size = 1080): ReactElement {
  const fg = readable(b.primary);
  const logo = b.template === "minimal-stamp" ? b.monoPng : b.logoPng;
  return (
    <div style={{ width: size, height: size, display: "flex", flexDirection: "column", background: b.primary, color: fg, padding: 80, position: "relative", fontFamily: "Inter" }}>
      {b.template === "pattern-badge" && dots(fg)}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", position: "relative" }}>
        {logo && b.template !== "wordmark-band" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={220} height={220} style={{ objectFit: "contain", marginBottom: 40 }} alt="" />
        )}
        <div style={{ display: "flex", fontFamily: "Manrope", fontSize: size * 0.085, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          We&apos;ve switched to a cup that composts at home.
        </div>
        {b.template === "logo-tagline" && b.tagline && (
          <div style={{ display: "flex", fontSize: size * 0.034, marginTop: 28, opacity: 0.85 }}>{b.tagline}</div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative" }}>
        <div style={{ display: "flex", fontFamily: "Manrope", fontSize: size * 0.038, fontWeight: 800 }}>{b.cafeName}</div>
        <div style={{ display: "flex", fontSize: size * 0.022, opacity: 0.8 }}>No PE · No PLA · No microplastics</div>
      </div>
    </div>
  );
}

/** The certification post — the one that does the explaining. */
export function certPost(b: BrandInput, size = 1080): ReactElement {
  const bg = b.template === "sustainability" ? "#ede9de" : "#ede9de";
  return (
    <div style={{ width: size, height: size, display: "flex", flexDirection: "column", background: bg, color: "#1a1a1a", padding: 80, fontFamily: "Inter" }}>
      <div style={{ display: "flex", fontSize: size * 0.021, letterSpacing: 5, textTransform: "uppercase", color: b.primary, fontWeight: 700 }}>
        Certified home compostable
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <div style={{ display: "flex", fontFamily: "Manrope", fontSize: size * 0.075, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>
          Our cups are paper lined with PHA, not plastic.
        </div>
        <div style={{ display: "flex", fontSize: size * 0.03, marginTop: 30, lineHeight: 1.5, color: "#45443f" }}>
          {`Certified by DIN CERTCO, part of the TÜV Rheinland group, under certificate ${CERT.number}. It breaks down in a home compost — no industrial facility needed.`}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {b.logoPng && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.logoPng} width={110} height={110} style={{ objectFit: "contain" }} alt="" />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Manrope", fontSize: size * 0.034, fontWeight: 800 }}>{b.cafeName}</div>
          <div style={{ display: "flex", fontSize: size * 0.02, color: "#6f625a" }}>Serving Cup Casa cups</div>
        </div>
      </div>
    </div>
  );
}

/** Vertical story version. */
export function storyPost(b: BrandInput): ReactElement {
  const fg = readable(b.primary);
  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", background: b.primary, color: fg, padding: 100, justifyContent: "center", fontFamily: "Inter", position: "relative" }}>
      {b.template === "pattern-badge" && dots(fg, 40)}
      {b.logoPng && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.logoPng} width={260} height={260} style={{ objectFit: "contain", marginBottom: 60 }} alt="" />
      )}
      <div style={{ display: "flex", fontFamily: "Manrope", fontSize: 110, fontWeight: 800, lineHeight: 1.03, letterSpacing: -3 }}>
        This cup composts at home.
      </div>
      <div style={{ display: "flex", fontSize: 40, marginTop: 40, opacity: 0.85, lineHeight: 1.4 }}>
        No plastic lining. No microplastics. Certified by DIN CERTCO.
      </div>
      <div style={{ display: "flex", marginTop: 80, fontFamily: "Manrope", fontSize: 44, fontWeight: 800 }}>{b.cafeName}</div>
    </div>
  );
}

/** A small mark for a printed menu. */
export function menuChip(b: BrandInput): ReactElement {
  return (
    <div style={{ width: 900, height: 260, display: "flex", alignItems: "center", gap: 30, background: "#ffffff", padding: 40, fontFamily: "Inter" }}>
      <div style={{ display: "flex", width: 12, height: 180, background: b.primary }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "Manrope", fontSize: 46, fontWeight: 800, color: "#1a1a1a" }}>
          Served in a home-compostable cup
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#6f625a", marginTop: 10 }}>
          {`PHA lining · no PE, no PLA · DIN CERTCO ${CERT.number}`}
        </div>
      </div>
    </div>
  );
}
