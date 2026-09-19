import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeConfigured, twilioConfigured } from "@/lib/env";
import { sendSms } from "@/lib/twilio/send";
import { reorderApprovalSms, paymentLinkSms } from "@/lib/twilio/templates";
import { processReorderPayment } from "@/lib/stripe/charge";
import type { Database } from "@/lib/supabase/database.types";

type Reorder = Database["public"]["Tables"]["reorders"]["Row"];

export type NightlySummary = {
  expired_prompts: number;
  reorders_created: number;
  sms_sent: number;
  auto_charged: number;
  invoiced: number;
  payment_failed: number;
  awaiting_stripe: number; // approved but Stripe not configured → staff records payment manually
  left_suggested: number;
  approved_processed: number;
  errors: string[];
};

/**
 * The nightly job:
 *  1. expire unanswered SMS prompts (their reorders → declined, 7-day cooldown)
 *  2. recompute stock + create suggested reorders (SQL engine)
 *  3. per café: auto-ship → approve + charge; SMS opt-in → one approval text; else leave suggested
 *  4. take any other approved reorders (portal/staff) to payment
 */
export async function runNightly(): Promise<NightlySummary> {
  const db = createAdminClient();
  const s: NightlySummary = { expired_prompts: 0, reorders_created: 0, sms_sent: 0, auto_charged: 0, invoiced: 0, payment_failed: 0, awaiting_stripe: 0, left_suggested: 0, approved_processed: 0, errors: [] };
  const { data: run } = await db.from("cron_runs").insert({ job: "nightly" }).select("id").single();

  try {
    const { data: expired, error: eErr } = await db.rpc("expire_sms_prompts");
    if (eErr) s.errors.push(`expire: ${eErr.message}`); else s.expired_prompts = expired ?? 0;

    const { data: created, error: cErr } = await db.rpc("run_reorder_engine");
    if (cErr) throw new Error(`engine: ${cErr.message}`);
    s.reorders_created = created?.length ?? 0;

    // group new suggestions by café
    const byCafe = new Map<string, Reorder[]>();
    for (const r of created ?? []) byCafe.set(r.cafe_id, [...(byCafe.get(r.cafe_id) ?? []), r]);

    for (const [cafeId, reorders] of byCafe) {
      try {
        const { data: cafe } = await db.from("cafes").select("*").eq("id", cafeId).single();
        if (!cafe) continue;
        const ids = reorders.map((r) => r.id);
        const { data: withProducts } = await db.from("reorders").select("*, product:products(size_oz, printed)").in("id", ids);
        const items = (withProducts ?? []).map((r) => ({
          size_oz: r.product!.size_oz, printed: r.product!.printed, cases: r.cases, amount_cents: r.amount_cents,
          days: r.days_of_cover_at_creation != null ? Number(r.days_of_cover_at_creation) : null, id: r.id,
        }));

        if (cafe.auto_ship) {
          for (const r of reorders) {
            const { error } = await db.rpc("respond_to_reorder", { p_reorder: r.id, p_approve: true, p_via: "auto" });
            if (error) { s.errors.push(`auto-approve ${r.id}: ${error.message}`); continue; }
            const res = await processReorderPayment(db, r.id, "auto");
            if (res.ok) { if (res.kind === "charged") s.auto_charged++; else s.invoiced++; }
            else if (res.reason === "stripe_not_configured") s.awaiting_stripe++;
            else {
              s.payment_failed++;
              if (res.paymentLink && cafe.sms_opt_in && cafe.phone && twilioConfigured()) {
                await sendSms(db, cafe.id, paymentLinkSms(res.paymentLink)).then(() => s.sms_sent++).catch((e) => s.errors.push(`sms ${cafe.id}: ${e.message}`));
              }
            }
          }
          continue;
        }

        if (cafe.sms_opt_in && cafe.phone && twilioConfigured()) {
          const msgId = await sendSms(db, cafe.id, reorderApprovalSms(items));
          await db.from("reorders").update({ status: "sms_sent" }).in("id", ids);
          await db.from("sms_prompts").insert({ cafe_id: cafe.id, kind: "reorder_approval", reorder_ids: ids, sent_message_id: msgId, sent_at: new Date().toISOString() });
          s.sms_sent++;
          continue;
        }

        s.left_suggested += reorders.length; // visible in portal + admin queue; no channel to text
      } catch (e) {
        s.errors.push(`cafe ${cafeId}: ${(e as Error).message}`);
      }
    }

    // approved reorders that never reached payment (portal approvals while Stripe was down, staff approvals, etc.)
    if (stripeConfigured()) {
      const { data: approved } = await db.from("reorders").select("id, cafe_id").eq("status", "approved");
      for (const r of approved ?? []) {
        try {
          const res = await processReorderPayment(db, r.id, "nightly");
          s.approved_processed++;
          if (res.ok) { if (res.kind === "charged") s.auto_charged++; else s.invoiced++; }
          else {
            s.payment_failed++;
            const { data: cafe } = await db.from("cafes").select("id, sms_opt_in, phone").eq("id", r.cafe_id).single();
            if (res.paymentLink && cafe?.sms_opt_in && cafe.phone && twilioConfigured()) {
              await sendSms(db, cafe.id, paymentLinkSms(res.paymentLink)).then(() => s.sms_sent++).catch((e) => s.errors.push(`sms ${cafe.id}: ${e.message}`));
            }
          }
        } catch (e) {
          s.errors.push(`payment ${r.id}: ${(e as Error).message}`);
        }
      }
    }
  } catch (e) {
    s.errors.push((e as Error).message);
  }

  if (run) await db.from("cron_runs").update({ finished_at: new Date().toISOString(), summary: s, error: s.errors.length ? s.errors.join("; ") : null }).eq("id", run.id);
  return s;
}
