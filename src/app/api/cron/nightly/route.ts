import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runNightly } from "@/lib/engine/nightly";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Called by pg_cron (0004_cron.sql) or Vercel Cron with `Authorization: Bearer CRON_SECRET`. */
export async function POST(request: Request) {
  if (!authorizeCron(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await runNightly();
  return NextResponse.json({ ok: summary.errors.length === 0, summary });
}
export const GET = POST; // Vercel Cron uses GET
