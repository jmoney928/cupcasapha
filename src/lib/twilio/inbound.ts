import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeConfigured } from "@/lib/env";
import { processReorderPayment } from "@/lib/stripe/charge";
import { sendSms } from "./send";
import { approvedSms, countThanksSms, declinedSms, helpSms, paymentLinkSms, unrecognizedSms } from "./templates";
import type { Database } from "@/lib/supabase/database.types";

export const twilioInboundSchema = z.object({
  MessageSid: z.string().min(1),
  From: z.string().min(1),
  To: z.string().min(1),
  Body: z.string().default(""),
  AccountSid: z.string().optional(),
  NumMedia: z.string().optional(),
});
export type TwilioInbound = z.infer<typeof twilioInboundSchema>;

type Db = ReturnType<typeof createAdminClient>;
type Prompt = Database["public"]["Tables"]["sms_prompts"]["Row"];

export type InboundOutcome =
  | "duplicate" | "unknown_number" | "approved" | "declined" | "count_recorded"
  | "stop" | "start" | "help" | "needs_review";

const YES = /^(y|ya|yes+|yeah|yep|yup|ok|okay|sure|confirm|approve|do it|send it|please)\b/i;
const NO = /^(n|no+|nope|nah|skip|not now|decline|pass)\b/i;
const STOP = /^(stop|stopall|unsubscribe|cancel|end|quit|revoke)\b/i;
const START = /^(start|unstop|yes to texts|subscribe|resume)\b/i;
const HELP = /^(help|info|support|\?)\b/i;
/** A reply that is only a number (optionally hedged or with a unit) is a stock count. */
const COUNT = /^\s*(?:about|approx\.?|approximately|around|roughly|~|maybe)?\s*(\d{1,4})(?:\s*(?:sleeves?|sleves?|slvs?|pcs?|packs?|cups?))?\s*[.!]?\s*$/i;

/** Normalise to E.164 so "+1 (416) 555-0101" matches a stored "+14165550101". */
function e164(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

/**
 * Handles one inbound SMS. Always records the message first, so nothing is lost even if the
 * rest fails. Idempotent on MessageSid: Twilio retries are answered without repeating side effects.
 */
export async function handleInbound(msg: TwilioInbound): Promise<{ outcome: InboundOutcome; detail?: string }> {
  const db = createAdminClient();
  const from = e164(msg.From);
  const body = msg.Body.trim();

  const { data: seen } = await db.from("sms_messages").select("id").eq("twilio_sid", msg.MessageSid).maybeSingle();
  if (seen) return { outcome: "duplicate" };

  const { data: cafe } = await db.from("cafes").select("*").eq("phone", from).maybeSingle();

  const { data: row } = await db
    .from("sms_messages")
    .insert({
      cafe_id: cafe?.id ?? null,
      direction: "inbound",
      from_phone: from,
      to_phone: e164(msg.To),
      body,
      twilio_sid: msg.MessageSid,
      status: "received",
      needs_review: !cafe,
    })
    .select("id")
    .single();
  const messageId = row?.id ?? null;

  if (!cafe) return { outcome: "unknown_number", detail: `no café with phone ${from}` };

  // ---- opt-out / opt-in / help (Twilio also enforces STOP at the carrier level) ----
  if (STOP.test(body)) {
    // Twilio's own opt-out handling sends the confirmation and blocks further messages to this
    // number (error 21610), so we only record consent state here and cancel what is outstanding.
    await db.from("cafes").update({ sms_opt_in: false }).eq("id", cafe.id);
    await db.from("sms_prompts").update({ status: "cancelled" }).eq("cafe_id", cafe.id).eq("status", "open");
    return { outcome: "stop" };
  }
  if (START.test(body)) {
    await db.from("cafes").update({ sms_opt_in: true, sms_opt_in_source: "sms" }).eq("id", cafe.id);
    await safeSend(db, cafe.id, helpSms());
    return { outcome: "start" };
  }
  if (HELP.test(body)) {
    await safeSend(db, cafe.id, helpSms());
    return { outcome: "help" };
  }

  // ---- resolve against the café's open prompts ----
  const { data: prompts } = await db
    .from("sms_prompts").select("*").eq("cafe_id", cafe.id).eq("status", "open").order("created_at", { ascending: false });
  const approval = (prompts ?? []).find((p) => p.kind === "reorder_approval");
  const counts = (prompts ?? []).filter((p) => p.kind === "count_request").sort((a, b) => a.created_at.localeCompare(b.created_at));

  const countMatch = body.match(COUNT);
  if (countMatch && counts.length > 0) {
    return await recordCount(db, cafe.id, counts, Number(countMatch[1]), messageId);
  }

  if (YES.test(body) && approval) return await approve(db, cafe, approval, messageId);
  if (NO.test(body) && approval) {
    for (const id of approval.reorder_ids) await db.rpc("respond_to_reorder", { p_reorder: id, p_approve: false, p_via: "sms" });
    await db.from("sms_prompts").update({ status: "answered", answered_at: new Date().toISOString(), answer_message_id: messageId }).eq("id", approval.id);
    await safeSend(db, cafe.id, declinedSms());
    return { outcome: "declined" };
  }

  // A YES/NO with nothing outstanding, a number with no count round, or anything else → staff inbox.
  if (messageId) await db.from("sms_messages").update({ needs_review: true }).eq("id", messageId);
  await safeSend(db, cafe.id, unrecognizedSms());
  return { outcome: "needs_review", detail: approval || counts.length ? "unparsed reply" : "no open prompt" };
}

/** YES → approve every reorder in the prompt, then take payment. */
async function approve(db: Db, cafe: Database["public"]["Tables"]["cafes"]["Row"], prompt: Prompt, messageId: string | null): Promise<{ outcome: InboundOutcome; detail?: string }> {
  const approved: string[] = [];
  for (const id of prompt.reorder_ids) {
    const { error } = await db.rpc("respond_to_reorder", { p_reorder: id, p_approve: true, p_via: "sms" });
    if (!error) approved.push(id);
  }
  await db.from("sms_prompts").update({ status: "answered", answered_at: new Date().toISOString(), answer_message_id: messageId }).eq("id", prompt.id);

  const { data: items } = await db.from("reorders").select("cases, amount_cents, product:products(size_oz, printed)").in("id", approved.length ? approved : ["00000000-0000-0000-0000-000000000000"]);
  const summary = (items ?? []).map((r) => ({ cases: r.cases, amount_cents: r.amount_cents, size_oz: r.product!.size_oz, printed: r.product!.printed }));

  if (!stripeConfigured()) {
    await safeSend(db, cafe.id, approvedSms(summary));
    return { outcome: "approved", detail: "stripe not configured — staff will take payment" };
  }

  let failedLink: string | null = null;
  let failedReason = "";
  for (const id of approved) {
    const res = await processReorderPayment(db, id, "sms");
    if (!res.ok) { failedLink = res.paymentLink ?? failedLink; failedReason = res.reason; }
  }
  if (failedLink) {
    await safeSend(db, cafe.id, paymentLinkSms(failedLink));
    return { outcome: "approved", detail: `payment failed: ${failedReason}` };
  }
  await safeSend(db, cafe.id, approvedSms(summary));
  return { outcome: "approved" };
}

/** A number answers the oldest open count prompt; the next size is asked immediately. */
async function recordCount(db: Db, cafeId: string, counts: Prompt[], sleeves: number, messageId: string | null): Promise<{ outcome: InboundOutcome; detail?: string }> {
  const current = counts[0];
  const { data: product } = await db.from("products").select("id, size_oz, printed, units_per_sleeve").eq("id", current.product_id!).single();
  if (!product) return { outcome: "needs_review", detail: "prompt has no product" };

  const { error } = await db.rpc("record_stock_count", {
    p_cafe: cafeId, p_product: product.id, p_units: sleeves * product.units_per_sleeve, p_source: "sms_count",
  });
  if (error) return { outcome: "needs_review", detail: `count failed: ${error.message}` };

  await db.from("sms_prompts").update({ status: "answered", answered_at: new Date().toISOString(), answer_message_id: messageId }).eq("id", current.id);

  const next = counts[1];
  let nextProduct: { size_oz: number; printed: boolean } | undefined;
  if (next?.product_id) {
    const { data: np } = await db.from("products").select("size_oz, printed").eq("id", next.product_id).single();
    if (np) {
      nextProduct = np;
      const sid = await safeSend(db, cafeId, countThanksSms(product, sleeves, np));
      await db.from("sms_prompts").update({ sent_message_id: sid, sent_at: new Date().toISOString() }).eq("id", next.id);
      return { outcome: "count_recorded", detail: `${sleeves} sleeves of ${product.size_oz}oz; asked next size` };
    }
  }
  await safeSend(db, cafeId, countThanksSms(product, sleeves, nextProduct));
  return { outcome: "count_recorded", detail: `${sleeves} sleeves of ${product.size_oz}oz` };
}

/** Never let a failed outbound reply turn into a Twilio retry of the whole webhook. */
async function safeSend(db: Db, cafeId: string, body: string): Promise<string | null> {
  try {
    return await sendSms(db, cafeId, body);
  } catch (e) {
    console.error("outbound reply failed", (e as Error).message);
    return null;
  }
}
