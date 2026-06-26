import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

// Stripe needs the raw request body to verify the signature.
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!key || !webhookSecret) {
    console.error("Stripe webhook not configured (missing key or signing secret).");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const stripe = new Stripe(key);
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await notifyOrder(stripe, session);
    } catch (err) {
      // Don't make Stripe retry forever over an email hiccup — log and ack.
      console.error("Order notification failed:", err);
    }
  }

  return NextResponse.json({ received: true });
}

async function notifyOrder(stripe: Stripe, session: Stripe.Checkout.Session) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_EMAIL ?? "hello@cupcasa.com";
  const from = process.env.LEADS_FROM ?? "cupcasa cups <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — order email not sent.");
    return;
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 50,
  });
  const fmt = (cents: number | null | undefined, cur: string) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: (cur || "cad").toUpperCase(),
    }).format((cents ?? 0) / 100);

  const cur = session.currency ?? "cad";
  const items = lineItems.data
    .map((li) => `${li.quantity} × ${li.description} — ${fmt(li.amount_total, cur)}`)
    .join("\n");

  const cd = session.customer_details;
  // Shipping address location varies by Stripe API version; read it defensively.
  const ship = session as unknown as {
    shipping_details?: { address?: Stripe.Address };
    collected_information?: { shipping_details?: { address?: Stripe.Address } };
  };
  const addr =
    ship.collected_information?.shipping_details?.address ??
    ship.shipping_details?.address ??
    cd?.address;
  const addrStr = addr
    ? [addr.line1, addr.line2, `${addr.city ?? ""} ${addr.state ?? ""} ${addr.postal_code ?? ""}`, addr.country]
        .filter(Boolean)
        .join(", ")
    : "—";

  const total = fmt(session.amount_total, cur);
  const name = cd?.name ?? "Customer";
  const email = cd?.email ?? "—";
  const phone = cd?.phone ?? "—";

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    replyTo: cd?.email ? cd.email : undefined,
    subject: `🎉 New order — ${total} (${name})`,
    text: `New order on cupcasa.com\n\nTotal: ${total}\n\nItems:\n${items}\n\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone}\nShip to: ${addrStr}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#3a2417;margin-bottom:2px">🎉 New order — ${esc(total)}</h2>
        <p style="color:#6f4a30;margin-top:0">via cupcasa.com</p>
        <h3 style="color:#3a2417;margin-bottom:6px">Items</h3>
        <p style="color:#3a2417;white-space:pre-line;margin-top:0">${esc(items)}</p>
        <h3 style="color:#3a2417;margin-bottom:6px">Customer</h3>
        <table style="border-collapse:collapse;color:#3a2417">
          <tr><td style="padding:4px 12px 4px 0;color:#6f4a30">Name</td><td>${esc(name)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6f4a30">Email</td><td>${esc(email)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6f4a30">Phone</td><td>${esc(phone)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6f4a30;vertical-align:top">Ship to</td><td>${esc(addrStr)}</td></tr>
        </table>
      </div>`,
  });
}
