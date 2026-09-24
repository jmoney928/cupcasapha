import { NextResponse } from "next/server";
import { Resend } from "resend";
import { sdsProducts, bestSdsUrl } from "@/lib/compliance/sds";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Check = { id: string; name: string; url: string; status: number | null; ok: boolean };

/**
 * Nightly SDS link health check. Broken links go to us, never to the café — they should never
 * open a dead link in a compliance document. See docs/SPEC.md, "SDS generator — link out, never mirror".
 *
 * Authorised with `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this automatically).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!secret || token !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const targets = sdsProducts
    .map((p) => ({ p, url: bestSdsUrl(p) }))
    .filter((t): t is { p: (typeof sdsProducts)[number]; url: string } => Boolean(t.url));

  const checks: Check[] = await Promise.all(
    targets.map(async ({ p, url }) => {
      const status = await probe(url);
      return { id: p.id, name: p.name, url, status, ok: status !== null && status < 400 };
    }),
  );

  const broken = checks.filter((c) => !c.ok);
  if (broken.length > 0) {
    console.error("SDS link check: broken", JSON.stringify(broken));
    await alert(broken);
  }
  return NextResponse.json({ ok: broken.length === 0, checked: checks.length, broken });
}
export const POST = GET;

/** HEAD first; some hosts reject it, so fall back to a ranged GET before calling a link dead. */
async function probe(url: string): Promise<number | null> {
  const headers = { "User-Agent": "CupCasa-SDS-LinkCheck/1.0 (+https://cupcasa.com)" };
  for (const init of [{ method: "HEAD", headers }, { method: "GET", headers: { ...headers, Range: "bytes=0-2048" } }]) {
    try {
      const res = await fetch(url, { ...init, redirect: "follow", signal: AbortSignal.timeout(15_000) });
      if (res.status < 400) return res.status;
      if (init.method === "GET") return res.status;
    } catch {
      // try the next method
    }
  }
  return null;
}

async function alert(broken: Check[]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const to = process.env.LEADS_EMAIL ?? "hello@cupcasa.com";
  const from = process.env.LEADS_FROM ?? "Cup Casa <onboarding@resend.dev>";
  await new Resend(apiKey).emails
    .send({
      from, to,
      subject: `SDS link check — ${broken.length} broken`,
      text: `These SDS links are failing and need re-sourcing in content/sds/registry.json before a café sees them:\n\n${broken.map((b) => `- ${b.name}: ${b.url} (${b.status ?? "no response"})`).join("\n")}`,
    })
    .catch((e) => console.error("SDS alert email failed", e));
}
