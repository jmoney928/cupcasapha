/**
 * Builds a print-ready sleeve as SVG.
 *
 * One user unit is one millimetre and the root carries mm width/height, so the file opens at true
 * size — a printer can place it on the bed at 1:1 without scaling anything.
 *
 * Artwork never enters the glue lap: that strip is glued under the other end of the band and is
 * never seen. The background does run through it, so a mis-registered wrap shows colour rather
 * than bare board.
 */
import { sleeveDieline, type CupSize } from "./dielines";
import { arcPath, bandCentre, degAt, layout, radialPath, sectorPath } from "./geometry";

export type SleeveDesign = {
  size: CupSize;
  businessName: string;
  tagline: string;
  background: string;
  ink: string;
  /** Data URL of the uploaded mark, or null for a text-only sleeve. */
  logo: string | null;
  /** Width ÷ height of that image, so it is never stretched. */
  logoAspect: number;
  showCert: boolean;
};

export const DEFAULT_DESIGN: SleeveDesign = {
  size: 12,
  businessName: "Your café",
  tagline: "",
  background: "#1a1a1a",
  ink: "#f5f1e8",
  logo: null,
  logoAspect: 1,
  showCert: true,
};

const CERT_LINE = "HOME COMPOSTABLE · PHA LINED · CUPCASA.COM";

/** SVG is XML: user text has to be escaped or a stray & breaks the file. */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const n = (v: number) => Number(v.toFixed(3));

/** A colour we are willing to write into a file. Anything else falls back rather than injecting. */
const colour = (value: string, fallback: string) =>
  /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value.trim()) ? value.trim() : fallback;

export type RenderOptions = {
  /** Draw the cut, fold, bleed and safe-area guides. On for the screen, off for the press. */
  guides?: boolean;
};

export function renderSleeveSvg(design: SleeveDesign, { guides = false }: RenderOptions = {}): string {
  const d = sleeveDieline(design.size);
  const l = layout(d);

  const bg = colour(design.background, DEFAULT_DESIGN.background);
  const ink = colour(design.ink, DEFAULT_DESIGN.ink);

  const rInner = d.innerRadius;
  const rOuter = d.outerRadius;
  const mid = (rInner + rOuter) / 2;
  const bleedHalfExtra = degAt(d.bleed, rInner);

  /* Background floods to the bleed so trimming can never expose the board. */
  const bleedShape = sectorPath(
    l,
    rInner - d.bleed,
    rOuter + d.bleed,
    l.startDeg - bleedHalfExtra,
    l.endDeg + bleedHalfExtra
  );
  const cutShape = sectorPath(l, rInner, rOuter, l.startDeg, l.endDeg);
  const safeShape = sectorPath(
    l,
    rInner + d.safeArea,
    rOuter - d.safeArea,
    l.startDeg + degAt(d.safeArea, rInner),
    l.foldDeg - degAt(d.safeArea, rInner)
  );

  const hasTagline = design.tagline.trim().length > 0;
  const nameRadius = mid + (hasTagline ? d.bandHeight * 0.13 : 0);
  const taglineRadius = mid - d.bandHeight * 0.2;
  const certRadius = rInner + d.safeArea + d.bandHeight * 0.05;

  /* Artwork stays inside the printable band; the glue lap is left clear. */
  const artFrom = l.startDeg + degAt(d.safeArea, rInner);
  const artTo = l.foldDeg - degAt(d.safeArea, rInner);

  const nameSize = d.bandHeight * (hasTagline ? 0.2 : 0.24);
  const taglineSize = d.bandHeight * 0.1;
  const certSize = Math.max(2.2, d.bandHeight * 0.052);

  const centre = bandCentre(l, d);
  const logoHeight = d.bandHeight - 2 * d.safeArea - (design.showCert ? certSize * 2.2 : 0);
  const logoWidth = logoHeight * (design.logoAspect > 0 ? design.logoAspect : 1);

  const parts: string[] = [];

  parts.push(`<path d="${bleedShape}" fill="${bg}"/>`);

  /* Only a self-contained image ever reaches the file — never a URL that would fetch on open. */
  const logo = design.logo && /^data:image\/(png|jpeg|svg\+xml|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(design.logo)
    ? design.logo
    : null;

  if (logo) {
    parts.push(
      `<g transform="rotate(${n(centre.deg)} ${n(centre.x)} ${n(centre.y)})">` +
        `<image href="${logo}" x="${n(centre.x - logoWidth / 2)}" y="${n(
          centre.y - logoHeight / 2 - (design.showCert ? certSize : 0)
        )}" width="${n(logoWidth)}" height="${n(logoHeight)}" preserveAspectRatio="xMidYMid meet"/>` +
        `</g>`
    );
  } else if (design.businessName.trim()) {
    parts.push(
      `<path id="name-path" d="${arcPath(l, nameRadius, artFrom, artTo)}" fill="none"/>`,
      `<text fill="${ink}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${n(
        nameSize
      )}" letter-spacing="${n(nameSize * 0.02)}" dominant-baseline="middle">` +
        `<textPath href="#name-path" startOffset="50%" text-anchor="middle">${esc(
          design.businessName.trim()
        )}</textPath></text>`
    );
  }

  if (hasTagline) {
    parts.push(
      `<path id="tagline-path" d="${arcPath(l, taglineRadius, artFrom, artTo)}" fill="none"/>`,
      `<text fill="${ink}" fill-opacity="0.75" font-family="Helvetica, Arial, sans-serif" font-size="${n(
        taglineSize
      )}" letter-spacing="${n(taglineSize * 0.06)}" dominant-baseline="middle">` +
        `<textPath href="#tagline-path" startOffset="50%" text-anchor="middle">${esc(
          design.tagline.trim()
        )}</textPath></text>`
    );
  }

  if (design.showCert) {
    parts.push(
      `<path id="cert-path" d="${arcPath(l, certRadius, artFrom, artTo)}" fill="none"/>`,
      `<text fill="${ink}" fill-opacity="0.6" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${n(
        certSize
      )}" letter-spacing="${n(certSize * 0.18)}" dominant-baseline="middle">` +
        `<textPath href="#cert-path" startOffset="50%" text-anchor="middle">${CERT_LINE}</textPath></text>`
    );
  }

  if (guides) {
    const fold = radialPath(l, rInner, rOuter, l.foldDeg);
    /*
     * The cut and fold lines get a pale line underneath them. A dark stroke disappears on a dark
     * sleeve and a pale one disappears on a pale sleeve; laid over each other, one of the two is
     * always visible whatever colour the café picks.
     */
    parts.push(
      `<g fill="none">`,
      `<path d="${cutShape}" stroke="#ffffff" stroke-width="0.7" stroke-opacity="0.9"/>`,
      `<path d="${fold}" stroke="#ffffff" stroke-width="0.7" stroke-opacity="0.9"/>`,
      `<g stroke-width="0.25">`,
      `<path d="${bleedShape}" stroke="#e8735c" stroke-dasharray="1.5 1.5"/>`,
      `<path d="${cutShape}" stroke="#1a1a1a"/>`,
      `<path d="${safeShape}" stroke="#4a9cd4" stroke-dasharray="1 1"/>`,
      `<path d="${fold}" stroke="#1a1a1a" stroke-dasharray="2 1.5"/>`,
      `</g></g>`
    );
  }

  parts.push(cropMarks(l));

  const title = `cupcasa sleeve — ${d.label}${design.businessName.trim() ? ` — ${esc(design.businessName.trim())}` : ""}`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
    ` width="${n(l.width)}mm" height="${n(l.height)}mm" viewBox="0 0 ${n(l.width)} ${n(l.height)}">`,
    `<title>${title}</title>`,
    `<desc>1:1 at ${n(l.width)} × ${n(l.height)} mm. Cut line from the ${d.label} sleeve dieline; ${d.bleed}mm bleed; ${d.glueLap.width}mm glue lap.</desc>`,
    parts.join(""),
    `</svg>`,
  ].join("");
}

/** Corner marks outside the bleed, so the trimmer has something to line up on. */
function cropMarks(l: ReturnType<typeof layout>): string {
  const m = l.margin;
  const len = m * 0.7;
  const seg: string[] = [];
  const corners: Array<[number, number, number, number]> = [
    [0, m, len, m],
    [m, 0, m, len],
    [l.width, m, l.width - len, m],
    [l.width - m, 0, l.width - m, len],
    [0, l.height - m, len, l.height - m],
    [m, l.height, m, l.height - len],
    [l.width, l.height - m, l.width - len, l.height - m],
    [l.width - m, l.height, l.width - m, l.height - len],
  ];
  for (const [x1, y1, x2, y2] of corners) {
    seg.push(`M ${n(x1)} ${n(y1)} L ${n(x2)} ${n(y2)}`);
  }
  return `<path d="${seg.join(" ")}" stroke="#1a1a1a" stroke-width="0.2" fill="none"/>`;
}

export const sleeveFileName = (design: SleeveDesign) =>
  `cupcasa-sleeve-${design.size}oz-${(design.businessName.trim() || "artwork")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.svg`;
