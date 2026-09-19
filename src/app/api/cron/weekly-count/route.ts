import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runWeeklyCount } from "@/lib/engine/weekly-count";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!authorizeCron(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await runWeeklyCount();
  return NextResponse.json({ ok: summary.errors.length === 0, summary });
}
export const GET = POST;
