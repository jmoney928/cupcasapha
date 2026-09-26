import { NextResponse } from "next/server";
import Stripe from "stripe";
import { findSku } from "@/lib/skus";
import { DEPOSIT_CENTS } from "@/lib/deposit";

type IncomingItem = { slug: string; qty: number };

export async function POST(req: Request) {
  // Accept either name (project uses STRIPE_API_KEY; STRIPE_SECRET_KEY also supported).
  const key = process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;

  if (!key) {
    return NextResponse.json(
      {
        error:
          "Online checkout isn't connected yet. Add your Stripe secret key to enable payments, or contact us to order.",
      },
      { status: 503 }
    );
  }

  let body: { items?: IncomingItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const items = (body.items ?? [])
    .filter((i) => i && typeof i.slug === "string" && Number.isFinite(Number(i.qty)) && Number(i.qty) > 0)
    .map((i) => ({ slug: i.slug, qty: Math.min(Math.floor(Number(i.qty)), 999) }));
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const stripe = new Stripe(key);
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  /*
   * Two kinds of line. A consumer pack is charged in full here and nothing is owed later.
   * A café case is reserved against one flat deposit however many cases are in the cart, with the
   * balance billed when the container lands — so cases never become a Stripe line item.
   *
   * Prices are looked up server-side from the catalogue; a tampered payload cannot set its own.
   */
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const reservedCases: string[] = [];

  for (const item of items) {
    const sku = findSku(item.slug);
    if (!sku) continue;
    if (sku.kind === "pack") {
      line_items.push({
        quantity: item.qty,
        price_data: {
          currency: "cad",
          unit_amount: sku.unitPriceCents,
          product_data: { name: `cupcasa — ${sku.name}`, description: sku.meta },
        },
      });
    } else {
      reservedCases.push(`${item.qty}× ${sku.name}`);
    }
  }

  const reserved = reservedCases.join(", ");

  if (reserved) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: DEPOSIT_CENTS,
        product_data: {
          name: "cupcasa — Case Reservation Deposit",
          description: `Deposit to reserve your cases. Cups arriving December 2026. Reserving: ${reserved}.`,
        },
      },
    });
  }

  if (line_items.length === 0) {
    return NextResponse.json({ error: "Nothing in your cart could be priced." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: false },
      metadata: {
        type: reserved ? "packs_and_reservation" : "packs",
        reserved: reserved.slice(0, 490),
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
