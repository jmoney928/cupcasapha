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

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const item of items) {
    const product = products.find((p) => p.slug === item.slug);
    if (!product) continue;
    line_items.push({
      quantity: Math.floor(item.cases),
      price_data: {
        currency: "cad",
        unit_amount: Math.round(product.casePrice * 100), // price per case, in cents
        product_data: {
          name: `${product.name} — case of ${product.caseCount.toLocaleString()}`,
          description: `${product.shortName} · 100% PHA compostable · blank`,
        },
      },
    });
  }

  if (line_items.length === 0) {
    return NextResponse.json({ error: "No valid items." }, { status: 400 });
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
