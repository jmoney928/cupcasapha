import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { calculateRoi, ACCEPTANCE, roiSentence } from "@/lib/calc/roi";
import { formatCad, toCents } from "@/lib/calc/money";
import { cupOption, type CupSize } from "@/lib/calc/catalog";
import { RoiBreakdownPdf } from "@/lib/pdf/roi-breakdown";

export const runtime = "nodejs"; // @react-pdf/renderer needs Node
export const dynamic = "force-dynamic";

const decimal = z.string().trim().regex(/^\$?\s*\d+(\.\d{1,2})?$/, "Enter an amount like 5.75");

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  cafe: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  sizeLabel: z.string().trim().max(10).optional(),
  priceIncreaseCents: z.coerce.number().int().min(0).max(500),
  conservative: z.boolean().default(false),
  inputs: z.object({
    cupsPerDay: z.coerce.number().int().min(0).max(20_000),
    daysOpen: z.coerce.number().int().min(1).max(7),
    drinkPrice: decimal,
    cupCost: decimal,
  }),
});

const sizeFromLabel = (label: string | undefined): CupSize => {
  const n = Number((label ?? "").replace(/\D/g, ""));
  return ([8, 12, 16] as const).includes(n as CupSize) ? (n as CupSize) : 12;
};

/**
 * "Email me this breakdown". The result is never gated — this runs after the numbers are on screen.
 *
 * The figures are recomputed here from the submitted inputs rather than trusting whatever the
 * browser posted, so the PDF can't be made to say something the calculator wouldn't.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const { name, cafe, email, priceIncreaseCents, conservative, inputs } = parsed.data;

  const cup = cupOption(sizeFromLabel(parsed.data.sizeLabel));
  const result = calculateRoi({
    cupsPerDay: inputs.cupsPerDay,
    daysOpenPerWeek: inputs.daysOpen,
    currentCupCostCents: toCents(inputs.cupCost),
    cupcasaCupCostCents: cup.pricePerCupCents,
    drinkPriceCents: toCents(inputs.drinkPrice),
    priceIncreaseCents,
    acceptance: conservative ? ACCEPTANCE.conservative : ACCEPTANCE.measured,
  });

  const generatedOn = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "America/Vancouver" }).format(new Date());
  const pdf = await renderToBuffer(
    <RoiBreakdownPdf
      result={result}
      cafeName={cafe}
      contactName={name}
      sizeLabel={cup.label}
      priceIncreaseCents={priceIncreaseCents}
      generatedOn={generatedOn}
    />,
  );

  const apiKey = process.env.RESEND_API_KEY;
  const leadsTo = process.env.LEADS_EMAIL ?? "hello@cupcasa.com";
  const from = process.env.LEADS_FROM ?? "Cup Casa <onboarding@resend.dev>";

  // Qualification detail we want whether or not the send succeeds.
  console.info("calculator lead", JSON.stringify({ cafe, email, cupsPerDay: inputs.cupsPerDay, size: cup.label, netGainCents: result.netGainCents }));

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — breakdown not emailed.");
    return NextResponse.json({ ok: true, emailed: false });
  }

  const resend = new Resend(apiKey);
  const filename = `cup-casa-breakdown-${cafe.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "cafe"}.pdf`;
  const attachments = [{ filename, content: pdf.toString("base64") }];
  const headline = result.isNetLoss
    ? `your switch breakdown for ${cafe}`
    : `${formatCad(result.netGainCents)} a year — your switch breakdown`;

  const [toCafe, toUs] = await Promise.allSettled([
    resend.emails.send({
      from,
      to: email,
      replyTo: leadsTo,
      subject: `Cup Casa — ${headline}`,
      text: `Hi ${name},\n\nHere's the breakdown for ${cafe}, attached as a PDF.\n\n${roiSentence(result, formatCad)}\n\nThat's based on ${result.annualCups.toLocaleString("en-CA")} cups a year at ${cup.label}, and ${Math.round(result.acceptance * 100)}% of customers accepting the increase — the figure we measured asking 167 people on Victoria's Inner Harbour.\n\nIf you'd like to hold the cups and try them, we come to you. Just reply.\n\nJack and Sulli\nCup Casa · hello@cupcasa.com`,
      attachments,
    }),
    resend.emails.send({
      from,
      to: leadsTo,
      replyTo: email,
      subject: `Calculator lead — ${cafe} (${inputs.cupsPerDay}/day, ${formatCad(result.netGainCents)}/yr)`,
      text: `${name} · ${cafe} · ${email}\n\n${inputs.cupsPerDay} cups/day, ${inputs.daysOpen} days/week, ${cup.label}\nCurrent cup $${inputs.cupCost} · drink $${inputs.drinkPrice} · +${priceIncreaseCents}¢${conservative ? " (conservative)" : ""}\n\nNet ${formatCad(result.netGainCents)}/yr on ${result.annualCups.toLocaleString("en-CA")} cups.`,
      attachments,
    }),
  ]);

  if (toCafe.status === "rejected") {
    console.error("calculator lead: café email failed", toCafe.reason);
    return NextResponse.json({ error: "We couldn't send that email. Try again, or write to hello@cupcasa.com." }, { status: 502 });
  }
  if (toUs.status === "rejected") console.error("calculator lead: internal copy failed", toUs.reason);

  return NextResponse.json({ ok: true, emailed: true });
}
