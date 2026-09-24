import { NextResponse } from "next/server";
import { z } from "zod";
import JSZip from "jszip";
import { renderToBuffer } from "@react-pdf/renderer";
import { renderPng } from "@/lib/brand/render";
import { certPost, menuChip, storyPost, switchedPost, TEMPLATES, type BrandInput, type TemplateKey } from "@/lib/brand/templates";
import { BrandPrintPdf } from "@/lib/pdf/brand-print";
import { DIELINES } from "@/lib/brand/dielines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colours must look like #e8735c");
const dataUrl = z.string().startsWith("data:image/").max(6_000_000).optional().nullable();

const schema = z.object({
  cafeName: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(160).optional(),
  primary: hex,
  secondary: hex,
  template: z.enum(TEMPLATES.map((t) => t.key) as [TemplateKey, ...TemplateKey[]]),
  logoPng: dataUrl,
  monoPng: dataUrl,
});

/**
 * One click, the whole set. Assets are generated on the fly and zipped — nothing is stored, so there
 * is no per-café queue and no design hour. See docs/SPEC.md, "Module 7 — Outputs".
 *
 * The sleeve is absent by design: it needs the supplier's dieline in writing before anything prints.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });

  const b: BrandInput = { ...parsed.data, logoPng: parsed.data.logoPng ?? null, monoPng: parsed.data.monoPng ?? null };
  const zip = new JSZip();

  // Elements are built outside the try: react-pdf renders them, not React, but the linter is right
  // that JSX in a try block reads as if errors would be caught, and they wouldn't be.
  const printPieces = (["window-decal", "till-card", "a-frame"] as const).map((piece) => ({
    piece,
    element: BrandPrintPdf({ ...b, logoPng: b.logoPng, piece }),
  }));

  try {
    const [switched, cert, story, chip] = await Promise.all([
      renderPng(switchedPost(b), 1080, 1080),
      renderPng(certPost(b), 1080, 1080),
      renderPng(storyPost(b), 1080, 1920),
      renderPng(menuChip(b), 900, 260),
    ]);
    const social = zip.folder("social")!;
    social.file("instagram-weve-switched.png", switched);
    social.file("instagram-certification.png", cert);
    social.file("instagram-story.png", story);
    zip.folder("menu")!.file("menu-chip.png", chip);

    const print = zip.folder("print")!;
    for (const { piece, element } of printPieces) {
      print.file(`${piece}.pdf`, await renderToBuffer(element));
    }
    if (b.monoPng) zip.folder("logo")!.file("logo-mono.png", Buffer.from(b.monoPng.split(",")[1], "base64"));

    zip.file("README.txt", readme(b));

    const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    console.info("brand kit", JSON.stringify({ cafe: b.cafeName, template: b.template, bytes: out.length }));
    return new NextResponse(new Uint8Array(out), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="brand-kit-${slug(b.cafeName)}.zip"`,
      },
    });
  } catch (e) {
    console.error("brand kit failed", (e as Error).message);
    return NextResponse.json({ error: "We couldn't build the kit. Try a different logo file, or email hello@cupcasa.com." }, { status: 500 });
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "cafe";

const readme = (b: BrandInput) => `Cup Casa brand kit — ${b.cafeName}
Template: ${TEMPLATES.find((t) => t.key === b.template)?.label}
Colours: ${b.primary} / ${b.secondary}

social/    Instagram posts (1080×1080) and a story (1080×1920). Post as-is.
menu/      A small mark for a printed menu.
print/     Print-ready PDFs at trim with ${DIELINES["window-decal"].bleed}mm bleed and crop marks.
             window-decal.pdf  ${DIELINES["window-decal"].trim.width}×${DIELINES["window-decal"].trim.height}mm
             till-card.pdf     ${DIELINES["till-card"].trim.width}×${DIELINES["till-card"].trim.height}mm, folds at the half
             a-frame.pdf       A1 (${DIELINES["a-frame"].trim.width}×${DIELINES["a-frame"].trim.height}mm) — check your frame takes A1
logo/      Your logo as a single-colour version, which is what the cheapest printing needs.

Cup sleeves aren't in this kit yet. A sleeve has its own trim, seam allowance and cone warp, and we
won't generate artwork against a guessed dieline — that's how you end up with 5,000 unusable sleeves.
Ask us and we'll send yours once the supplier confirms it.

Made by Cup Casa · hello@cupcasa.com
`;
