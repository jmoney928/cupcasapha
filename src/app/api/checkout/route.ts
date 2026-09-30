import { NextResponse } from "next/server";
import Stripe from "stripe";
import { findSku } from "@/lib/skus";
import { DEPOSIT_CENTS } from "@/lib/deposit";
import { sanitiseArtwork, type Artwork } from "@/lib/artwork";
import { Resend } from "resend";

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

  let body: { items?: IncomingItem[]; artwork?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const artwork = sanitiseArtwork(body.artwork);

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
      const art = artwork.find((a) => a.slug === sku.slug);
      line_items.push({
        quantity: item.qty,
        price_data: {
          currency: "cad",
          unit_amount: sku.unitPriceCents,
          product_data: {
            name: `cupcasa — ${sku.name}`,
            // Stripe caps a description at 500; the sleeve summary is the useful half.
            description: `${sku.meta}${art?.summary ? ` · Sleeve: ${art.summary}` : ""}`.slice(0, 500),
          },
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
        // Stripe allows 50 keys of 500 characters. The sleeve description lives here so the
        // payment record alone is enough to know what was ordered, with no other system.
        ...Object.fromEntries(
          artwork
            .slice(0, 10)
            .map((a, i) => [
              `sleeve_${i + 1}`,
              `${a.slug}: ${a.summary}${a.svg ? "" : " [ARTWORK FILE MISSING — ask the customer]"}`.slice(0, 490),
            ])
        ),
      },
    });
    // The file goes now rather than on payment: by the time the webhook fires the browser that
    // held it is gone. An abandoned checkout costs us a stray email; the other way round costs
    // us the artwork for an order somebody paid for.
    await sendArtwork(artwork, session.id).catch((err) =>
      console.error("Artwork email failed (order unaffected):", err)
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Emails the print files to us, one attachment per sleeve, tagged with the Checkout Session that
 * will pay for them. The webhook's order email carries the same id, so the two meet in the inbox.
 *
 * Never throws into the checkout path: a failure here must not cost a sale.
 */
async function sendArtwork(artwork: Artwork[], sessionId: string) {
  const withFiles = artwork.filter((a) => a.svg);
  if (withFiles.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — artwork not sent.");
    return;
  }
  const to = process.env.LEADS_EMAIL ?? "hello@cupcasa.com";
  const from = process.env.LEADS_FROM ?? "cupcasa cups <onboarding@resend.dev>";

  const lines = artwork
    .map((a) => `${a.slug} (${a.oz}oz): ${a.summary}${a.svg ? "" : " — FILE MISSING, ask the customer"}`)
    .join("\n");

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: `Sleeve artwork — checkout ${sessionId.slice(-8)}`,
    text:
      `Artwork for a checkout in progress.\n\nSession: ${sessionId}\n\n${lines}\n\n` +
      `This arrives when checkout starts, so it may not have been paid for. The order email ` +
      `for this session confirms that.`,
    attachments: withFiles.map((a) => ({
      filename: `${a.slug}-sleeve.svg`,
      content: Buffer.from(a.svg as string).toString("base64"),
    })),
  });
}
