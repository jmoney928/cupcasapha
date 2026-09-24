import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { RoiBreakdownPdf } from "@/lib/pdf/roi-breakdown";
import { calculateRoi } from "@/lib/calc/roi";
import { WorkSafeBinderPdf } from "@/lib/pdf/worksafe-binder";
import { buildBinderItems, binderDates } from "@/lib/compliance/binder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Development-only PDF preview, so a template can be eyeballed without filling in a form.
 *   http://localhost:3000/api/dev/pdf/roi
 *   http://localhost:3000/api/dev/pdf/roi-loss
 * Returns 404 in production.
 */
const templates = {
  roi: () => (
    <RoiBreakdownPdf
      result={calculateRoi({ cupsPerDay: 250, daysOpenPerWeek: 7, currentCupCostCents: 14, cupcasaCupCostCents: 22, drinkPriceCents: 575, priceIncreaseCents: 15 })}
      cafeName="Northside Roasters" contactName="Jack" sizeLabel="12oz" priceIncreaseCents={15} generatedOn="September 24, 2026"
    />
  ),
  "roi-loss": () => (
    <RoiBreakdownPdf
      result={calculateRoi({ cupsPerDay: 250, daysOpenPerWeek: 7, currentCupCostCents: 8, cupcasaCupCostCents: 22, drinkPriceCents: 575, priceIncreaseCents: 0 })}
      cafeName="Thrifty Beans" contactName="Sam" sizeLabel="12oz" priceIncreaseCents={0} generatedOn="September 24, 2026"
    />
  ),
} as const;

/** The binder needs QR codes generated first, so it gets its own async branch. */
async function binder() {
  const items = await buildBinderItems([
    { productId: "urnex-cafiza", location: "Under bar" },
    { productId: "urnex-rinza", location: "Under bar" },
    { productId: "urnex-dezcal", location: "Under bar" },
    { productId: "quat-sanitizer", location: "Sanitizer bucket" },
    { productId: "chlorine-bleach", location: "Chemical cupboard" },
    { productId: "dish-detergent", location: "Under the dish machine" },
  ]);
  const { generatedOn, reviewDueOn } = binderDates();
  return (
    <WorkSafeBinderPdf cafeName="Northside Roasters" preparedBy="Jack" address="412 Danforth Ave, Victoria BC"
      generatedOn={generatedOn} reviewDueOn={reviewDueOn} items={items} />
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ template: string }> }) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  const { template } = await params;
  if (template === "binder") {
    const pdf = await renderToBuffer(await binder());
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="binder.pdf"` } });
  }
  const make = templates[template as keyof typeof templates];
  if (!make) return NextResponse.json({ error: `unknown template`, available: [...Object.keys(templates), "binder"] }, { status: 404 });
  const pdf = await renderToBuffer(make());
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${template}.pdf"` },
  });
}
