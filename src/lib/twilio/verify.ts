import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * Twilio request signature: base64(HMAC-SHA1(authToken, url + sorted(key+value for each POST param))).
 * https://www.twilio.com/docs/usage/security#validating-requests
 *
 * The URL must be exactly what Twilio called, including scheme, host and query string. Behind a proxy
 * (Vercel) the request URL can come through as http/internal host, so we rebuild it from the forwarded
 * headers and allow TWILIO_WEBHOOK_URL to pin it explicitly.
 */
export function verifyTwilioSignature(request: Request, params: Record<string, string>, signature: string | null): boolean {
  const token = serverEnv().TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;

  for (const url of candidateUrls(request)) {
    const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
    const expected = createHmac("sha1", token).update(Buffer.from(data, "utf-8")).digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

function candidateUrls(request: Request): string[] {
  const pinned = process.env.TWILIO_WEBHOOK_URL;
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const forwarded = `${proto}://${host}${url.pathname}${url.search}`;
  return [...new Set([pinned, forwarded, url.toString()].filter(Boolean) as string[])];
}

/** Empty TwiML: we send replies through the REST API so every message is recorded in sms_messages. */
export const emptyTwiml = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
