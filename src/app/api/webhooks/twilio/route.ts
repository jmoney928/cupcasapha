import { NextResponse } from "next/server";
import { verifyTwilioSignature, emptyTwiml } from "@/lib/twilio/verify";
import { handleInbound, twilioInboundSchema } from "@/lib/twilio/inbound";

export const dynamic = "force-dynamic";

/**
 * Twilio inbound SMS webhook. Point your number's "A message comes in" at
 * https://<site>/api/webhooks/twilio (HTTP POST).
 *
 * Always answers 200 with empty TwiML once the signature checks out: replies are sent through the
 * REST API so they land in sms_messages, and a non-2xx would make Twilio retry a message we already
 * processed. Signature failures return 403.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const params = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;

  if (!verifyTwilioSignature(request, params, request.headers.get("x-twilio-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }

  const parsed = twilioInboundSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "bad payload" }, { status: 400 });

  try {
    const result = await handleInbound(parsed.data);
    console.info("twilio inbound", parsed.data.MessageSid, result.outcome, result.detail ?? "");
  } catch (e) {
    // Swallow: the message row is already stored and flagged; retrying would double-charge.
    console.error("twilio inbound failed", (e as Error).message);
  }
  return emptyTwiml();
}
