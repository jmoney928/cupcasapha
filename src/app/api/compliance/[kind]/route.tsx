import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { WorkSafeBinderPdf } from "@/lib/pdf/worksafe-binder";
import { ClaimsKitPdf } from "@/lib/pdf/claims-kit";
import { BinSignagePdf } from "@/lib/pdf/bin-signage";
import { HealthAuditPdf } from "@/lib/pdf/health-audit";
import { buildBinderItems, binderDates } from "@/lib/compliance/binder";
import { sdsProducts } from "@/lib/compliance/sds";
import { municipality, municipalities } from "@/lib/compliance/municipalities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const productIds = new Set(sdsProducts.map((p) => p.id));
const municipalityIds = new Set(municipalities.map((m) => m.id));

const base = {
  name: z.string().trim().min(1).max(120),
  cafe: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  address: z.string().trim().max(200).optional(),
};

const schemas = {
  binder: z.object({
    ...base,
    selections: z
      .array(z.object({ productId: z.string().refine((v) => productIds.has(v), "Unknown product"), location: z.string().trim().max(80).optional() }))
      .min(1, "Pick at least one product you keep on site")
      .max(60),
  }),
  claims: z.object(base),
  signage: z.object({ ...base, municipalityId: z.string({ error: "Pick your municipality" }).refine((v) => municipalityIds.has(v), "Pick your municipality") }),
  audit: z.object(base),
} as const;

export type DocKind = keyof typeof schemas;

const META: Record<DocKind, { title: string; filename: string; subject: (cafe: string) => string; body: (name: string, cafe: string, extra: string) => string }> = {
  binder: {
    title: "WHMIS & safety binder",
    filename: "whmis-binder",
    subject: (cafe) => `Your WHMIS & safety binder — ${cafe}`,
    body: (name, cafe, extra) =>
      `Hi ${name},\n\nYour binder for ${cafe} is attached. Print it and keep it where your staff can reach it.\n\nIn BC, safety data sheets have to be checked every three years — your binder is stamped with its own review date. We link to each manufacturer's sheet rather than copying it, so you always open the current version.${extra}`,
  },
  claims: {
    title: "Claims & greenwashing kit",
    filename: "claims-kit",
    subject: (cafe) => `What you can say about your cups — ${cafe}`,
    body: (name, cafe) =>
      `Hi ${name},\n\nAttached is the claims kit for ${cafe}: the language our certification actually supports, the claims to avoid, and a substantiation page you can hand to anyone who asks.\n\nThe one rule worth remembering: our certificate covers the cup, not your café. Claims about your waste stream or your operation need their own basis.`,
  },
  signage: {
    title: "Bin signage",
    filename: "bin-signage",
    subject: (cafe) => `Your bin signage — ${cafe}`,
    body: (name, cafe) =>
      `Hi ${name},\n\nAttached is bin signage for ${cafe}: a back-of-house poster, customer-facing decals, and a one-page staff briefing on what to say when someone asks about the cup.\n\nNote the signage says our cups do not go in the municipal green bin. That programme is for food scraps and soiled paper, and compostable containers get pulled out at the sorting line. Ours compost at home, which is the point.`,
  },
  audit: {
    title: "Health self-audit",
    filename: "health-self-audit",
    subject: (cafe) => `Your pre-inspection self-audit — ${cafe}`,
    body: (name, cafe) =>
      `Hi ${name},\n\nAttached is a pre-inspection self-audit for ${cafe}, built around what Island Health looks at under the BC Food Premises Regulation.\n\nWalk it with a clipboard before someone else does. Keep the completed sheets — showing improvement over time is worth something in itself.`,
  },
};

/**
 * Generates a compliance document and emails it. Gated: the café trades an email address for the
 * document (docs/SPEC.md, Modules 5–6). The PDF comes back in the response so they have it
 * immediately even if the email is slow.
 */
export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!(kind in schemas)) return NextResponse.json({ error: "Unknown document." }, { status: 404 });
  const docKind = kind as DocKind;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schemas[docKind].safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const data = parsed.data;
  const { generatedOn, reviewDueOn } = binderDates();

  let doc: React.ReactElement<DocumentProps>;
  let extra = "";
  if (docKind === "binder") {
    const items = await buildBinderItems((data as z.infer<typeof schemas.binder>).selections);
    if (items.length === 0) return NextResponse.json({ error: "Pick at least one product you keep on site." }, { status: 400 });
    const unlinked = items.filter((i) => !i.url).length;
    if (unlinked) extra = `\n\n${unlinked} of your products need a sheet from your own supplier — they're listed in section 2.`;
    doc = <WorkSafeBinderPdf cafeName={data.cafe} preparedBy={data.name} address={data.address} generatedOn={generatedOn} reviewDueOn={reviewDueOn} items={items} />;
  } else if (docKind === "claims") {
    doc = <ClaimsKitPdf cafeName={data.cafe} preparedBy={data.name} generatedOn={generatedOn} />;
  } else if (docKind === "signage") {
    const m = municipality((data as z.infer<typeof schemas.signage>).municipalityId)!;
    doc = <BinSignagePdf cafeName={data.cafe} municipality={m} generatedOn={generatedOn} />;
  } else {
    doc = <HealthAuditPdf cafeName={data.cafe} preparedBy={data.name} generatedOn={generatedOn} healthAuthority="Island Health" />;
  }

  const pdf = await renderToBuffer(doc);
  const meta = META[docKind];
  const slug = data.cafe.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "cafe";
  const filename = `${meta.filename}-${slug}.pdf`;

  console.info("compliance document", JSON.stringify({ kind: docKind, cafe: data.cafe, email: data.email }));

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const leadsTo = process.env.LEADS_EMAIL ?? "hello@cupcasa.com";
    const from = process.env.LEADS_FROM ?? "Cup Casa <onboarding@resend.dev>";
    const attachments = [{ filename, content: pdf.toString("base64") }];
    const sign = "\n\nWe make certified home-compostable cups, and we built this because every café we visited was missing it. No obligation either way.\n\nJack and Sulli\nCup Casa · hello@cupcasa.com";
    const results = await Promise.allSettled([
      new Resend(apiKey).emails.send({
        from, to: data.email, replyTo: leadsTo,
        subject: meta.subject(data.cafe),
        text: meta.body(data.name, data.cafe, extra) + sign,
        attachments,
      }),
      new Resend(apiKey).emails.send({
        from, to: leadsTo, replyTo: data.email,
        subject: `${meta.title} lead — ${data.cafe}`,
        text: `${data.name} · ${data.cafe} · ${data.email}${data.address ? `\n${data.address}` : ""}\n\nDocument: ${meta.title}`,
        attachments,
      }),
    ]);
    results.forEach((r, i) => { if (r.status === "rejected") console.error(`${docKind} email ${i} failed`, r.reason); });
  } else {
    console.warn("RESEND_API_KEY not set — document not emailed.");
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
