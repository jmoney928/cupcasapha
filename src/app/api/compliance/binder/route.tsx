import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { WorkSafeBinderPdf } from "@/lib/pdf/worksafe-binder";
import { buildBinderItems, binderDates } from "@/lib/compliance/binder";
import { sdsProducts } from "@/lib/compliance/sds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ids = new Set(sdsProducts.map((p) => p.id));

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  cafe: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  address: z.string().trim().max(200).optional(),
  selections: z
    .array(z.object({ productId: z.string().refine((v) => ids.has(v), "Unknown product"), location: z.string().trim().max(80).optional() }))
    .min(1, "Pick at least one product you keep on site")
    .max(60),
});

/**
 * Generates the WHMIS binder and emails it. This one is gated — the binder is what a café trades an
 * email address for (docs/SPEC.md, "Module 5"). The PDF comes straight back in the response so they
 * get it immediately even if the email is slow.
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
  const { name, cafe, email, address, selections } = parsed.data;

  const items = await buildBinderItems(selections);
  if (items.length === 0) return NextResponse.json({ error: "Pick at least one product you keep on site." }, { status: 400 });
  const { generatedOn, reviewDueOn } = binderDates();

  const pdf = await renderToBuffer(
    <WorkSafeBinderPdf
      cafeName={cafe}
      preparedBy={name}
      address={address}
      generatedOn={generatedOn}
      reviewDueOn={reviewDueOn}
      items={items}
    />,
  );

  const unlinked = items.filter((i) => !i.url).length;
  console.info("compliance binder", JSON.stringify({ cafe, email, products: items.length, unlinked }));

  const apiKey = process.env.RESEND_API_KEY;
  const leadsTo = process.env.LEADS_EMAIL ?? "hello@cupcasa.com";
  const from = process.env.LEADS_FROM ?? "Cup Casa <onboarding@resend.dev>";
  const filename = `whmis-binder-${cafe.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "cafe"}.pdf`;

  if (apiKey) {
    const resend = new Resend(apiKey);
    const attachments = [{ filename, content: pdf.toString("base64") }];
    const results = await Promise.allSettled([
      resend.emails.send({
        from,
        to: email,
        replyTo: leadsTo,
        subject: `Your WHMIS & safety binder — ${cafe}`,
        text: `Hi ${name},\n\nYour binder for ${cafe} is attached. Print it and keep it where your staff can reach it.\n\nTwo things worth knowing:\n\n1. In BC, safety data sheets have to be checked every three years. Yours is dated ${generatedOn}, so the next review is due ${reviewDueOn}. Re-generate it then, or sooner if you change products.\n2. We link to each manufacturer's sheet rather than copying it, so you always open the current version.${unlinked ? `\n\n${unlinked} of your products need a sheet from your own supplier — they're listed in section 2.` : ""}\n\nWe make certified home-compostable cups, and we built this because every café we visited was missing it. No obligation either way.\n\nJack and Sulli\nCup Casa · hello@cupcasa.com`,
        attachments,
      }),
      resend.emails.send({
        from,
        to: leadsTo,
        replyTo: email,
        subject: `Binder lead — ${cafe}`,
        text: `${name} · ${cafe} · ${email}${address ? `\n${address}` : ""}\n\n${items.length} products, ${unlinked} needing supplier sheets:\n${items.map((i) => `- ${i.product.name} (${i.location})`).join("\n")}`,
        attachments,
      }),
    ]);
    results.forEach((r, i) => { if (r.status === "rejected") console.error(`binder email ${i} failed`, r.reason); });
  } else {
    console.warn("RESEND_API_KEY not set — binder not emailed.");
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Binder-Products": String(items.length),
    },
  });
}
