import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { serverEnv } from "@/lib/env";

/**
 * Sends one SMS to a café and records it in sms_messages. Uses Twilio's REST API directly
 * (no SDK) to keep the bundle small. Full inbound handling arrives in step 6.
 */
export async function sendSms(db: SupabaseClient<Database>, cafeId: string, body: string) {
  const env = serverEnv();
  const { data: cafe } = await db.from("cafes").select("id, phone, sms_opt_in").eq("id", cafeId).single();
  if (!cafe?.phone) throw new Error("Café has no phone number");
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) throw new Error("Twilio not configured");

  const params = new URLSearchParams({ To: cafe.phone, Body: body });
  if (env.TWILIO_MESSAGING_SERVICE_SID) params.set("MessagingServiceSid", env.TWILIO_MESSAGING_SERVICE_SID);
  else if (env.TWILIO_FROM_NUMBER) params.set("From", env.TWILIO_FROM_NUMBER);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = (await res.json()) as { sid?: string; status?: string; message?: string; code?: number };
  const { data: row } = await db.from("sms_messages").insert({
    cafe_id: cafe.id, direction: "outbound", from_phone: env.TWILIO_FROM_NUMBER ?? env.TWILIO_MESSAGING_SERVICE_SID ?? "cupcasa", to_phone: cafe.phone,
    body, twilio_sid: json.sid ?? null, status: res.ok ? json.status ?? "queued" : "failed", error_code: res.ok ? null : String(json.code ?? res.status),
  }).select("id").single();
  if (!res.ok) throw new Error(json.message ?? `Twilio error ${res.status}`);
  return row!.id;
}
