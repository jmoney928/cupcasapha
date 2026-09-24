import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { RoiBreakdownPdf } from "@/lib/pdf/roi-breakdown";
import { calculateRoi } from "@/lib/calc/roi";

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

export async function GET(_request: Request, { params }: { params: Promise<{ template: string }> }) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  const { template } = await params;
  const make = templates[template as keyof typeof templates];
  if (!make) return NextResponse.json({ error: `unknown template`, available: Object.keys(templates) }, { status: 404 });
  const pdf = await renderToBuffer(make());
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${template}.pdf"` },
  });
}
