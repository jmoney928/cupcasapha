import { NextResponse } from "next/server";
import Stripe from "stripe";

// Returns minimal order info for a completed Checkout Session,
// used by the success page to fire a Meta Pixel Purchase event.
export async function GET(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;
  const id = new URL(req.url).searchParams.get("session_id");
  if (!key || !id) return NextResponse.json({});

  try {
    const stripe = new Stripe(key);
    const s = await stripe.checkout.sessions.retrieve(id);
    return NextResponse.json({
      value: Math.round((s.amount_total ?? 0)) / 100,
      currency: (s.currency ?? "cad").toUpperCase(),
      paid: s.payment_status === "paid",
    });
  } catch (err) {
    console.error("session lookup failed:", err);
    return NextResponse.json({});
  }
}
