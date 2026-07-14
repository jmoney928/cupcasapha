import { NextResponse } from "next/server";
import Stripe from "stripe";
import { products } from "@/lib/products";

type IncomingItem = { slug: string; cases: number };

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

  const items = (body.items ?? []).filter(
    (i) => i && typeof i.slug === "string" && Number(i.cases) > 0
  );
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const stripe = new Stripe(key);
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  // Flat $200 reservation deposit — regardless of sizes/quantities in the cart.
  // Cups are arriving October 2026; the balance is settled when they ship.
  const DEPOSIT_CAD = 200;

  const reserved = items
    .map((item) => {
      const product = products.find((p) => p.slug === item.slug);
      return product ? `${item.cases}× ${product.name}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: DEPOSIT_CAD * 100,
        product_data: {
          name: "cupcasa — Reservation Deposit",
          description: `$${DEPOSIT_CAD} deposit to reserve your order. Cups arriving October 2026.${
            reserved ? ` Reserving: ${reserved}.` : ""
          }`,
        },
      },
    },
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: false },
      metadata: { type: "reservation_deposit", reserved: reserved.slice(0, 490) },
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
