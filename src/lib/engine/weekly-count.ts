import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { twilioConfigured } from "@/lib/env";
import { sendSms } from "@/lib/twilio/send";
import { countRequestSms } from "@/lib/twilio/templates";

export type WeeklySummary = { cafes: number; prompts_created: number; sms_sent: number; skipped: string[]; errors: string[] };

/**
 * Monday check-in. For each opted-in café we queue one count_request prompt per tracked size, but only
 * text the first; the inbound handler records the answer and sends the next size.
 */
export async function runWeeklyCount(): Promise<WeeklySummary> {
  const db = createAdminClient();
  const s: WeeklySummary = { cafes: 0, prompts_created: 0, sms_sent: 0, skipped: [], errors: [] };
  const { data: run } = await db.from("cron_runs").insert({ job: "weekly_count" }).select("id").single();

  try {
    if (!twilioConfigured()) { s.skipped.push("twilio_not_configured"); }
    const { data: cafes } = await db.from("cafes").select("id, name, phone, sms_opt_in").eq("active", true).eq("sms_opt_in", true).not("phone", "is", null);
    for (const cafe of cafes ?? []) {
      try {
        // a pending reorder-approval text can coexist (YES/NO vs a number are distinguishable); only an
        // unfinished count round blocks a new one
        const { data: open } = await db.from("sms_prompts").select("id").eq("cafe_id", cafe.id).eq("status", "open").eq("kind", "count_request").limit(1);
        if (open?.length) { s.skipped.push(`${cafe.name}: count round already open`); continue; }

        const { data: stock } = await db
          .from("cafe_stock").select("product_id, daily_burn, last_count_units, product:products(id, size_oz, printed, active, sort_order)")
          .eq("cafe_id", cafe.id);
        const tracked = (stock ?? [])
          .filter((r) => r.product?.active && (r.daily_burn > 0 || r.last_count_units > 0))
          .sort((a, b) => a.product!.sort_order - b.product!.sort_order || a.product!.size_oz - b.product!.size_oz);
        if (tracked.length === 0) { s.skipped.push(`${cafe.name}: nothing tracked`); continue; }
        if (!twilioConfigured()) continue;

        s.cafes++;
        const [first, ...rest] = tracked;
        const msgId = await sendSms(db, cafe.id, countRequestSms(first.product!));
        s.sms_sent++;
        const now = new Date().toISOString();
        const { error } = await db.from("sms_prompts").insert([
          { cafe_id: cafe.id, kind: "count_request" as const, product_id: first.product_id, sent_message_id: msgId, sent_at: now, status: "open" as const },
          ...rest.map((r) => ({ cafe_id: cafe.id, kind: "count_request" as const, product_id: r.product_id, sent_message_id: null, sent_at: null, status: "open" as const })),
        ]);
        if (error) throw new Error(error.message);
        s.prompts_created += tracked.length;
      } catch (e) {
        s.errors.push(`${cafe.name}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    s.errors.push((e as Error).message);
  }
  if (run) await db.from("cron_runs").update({ finished_at: new Date().toISOString(), summary: s, error: s.errors.length ? s.errors.join("; ") : null }).eq("id", run.id);
  return s;
}
