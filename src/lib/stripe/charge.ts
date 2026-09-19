import "server-only";
import Stripe from "stripe";
import { getStripe } from "./client";
import { ensureStripeCustomer } from "./customers";
import { publicEnv } from "@/lib/env";
import { createOrderFromReorder, loadReorder, type Db, type ReorderFull } from "@/lib/orders";
import { sizeLabel } from "@/lib/format";

export type PaymentResult =
  | { ok: true; kind: "charged" | "invoiced"; orderId: string; reorder: ReorderFull }
  | { ok: false; reason: string; paymentLink?: string; reorder: ReorderFull };

/**
 * Takes an APPROVED reorder to payment:
 *  - card customers → off-session PaymentIntent on the saved card. Declines / authentication required →
 *    a hosted Checkout link is created, the reorder is marked failed, and the link is returned for SMS/staff.
 *  - net-30 customers → Stripe Invoice (30-day terms) emailed to the café; order recorded as invoiced.
 * Idempotent: a second call for the same reorder reuses the Stripe objects via idempotency keys.
 */
export async function processReorderPayment(db: Db, reorderId: string, via: string): Promise<PaymentResult> {
  const r = await loadReorder(db, reorderId);
  if (r.status !== "approved") return { ok: false, reason: `reorder is ${r.status}, not approved`, reorder: r };

  const stripe = getStripe();
  if (!stripe) return { ok: false, reason: "stripe_not_configured", reorder: r };

  const description = `${r.cases} × ${r.product.name} (${r.cases * r.product.units_per_case} cups) — reorder ${r.id.slice(0, 8)}`;
  const customer = await ensureStripeCustomer(r.cafe);

  if (r.cafe.payment_terms === "net30") {
    const invoice = await stripe.invoices.create(
      {
        customer,
        collection_method: "send_invoice",
        days_until_due: 30,
        auto_advance: true,
        currency: "cad",
        description: `Cup Casa reorder for ${r.cafe.name}`,
        metadata: { reorder_id: r.id, cafe_id: r.cafe_id, via },
      },
      { idempotencyKey: `reorder-${r.id}-invoice` },
    );
    await stripe.invoiceItems.create(
      { customer, invoice: invoice.id, amount: r.subtotal_cents, currency: "cad", description },
      { idempotencyKey: `reorder-${r.id}-item` },
    );
    if (r.tax_cents > 0) {
      await stripe.invoiceItems.create(
        { customer, invoice: invoice.id, amount: r.tax_cents, currency: "cad", description: `Tax (${(r.cafe.tax_rate_bps / 100).toFixed(2)}%)` },
        { idempotencyKey: `reorder-${r.id}-tax` },
      );
    }
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id, {}, { idempotencyKey: `reorder-${r.id}-finalize` });
    await stripe.invoices.sendInvoice(finalized.id, {}, { idempotencyKey: `reorder-${r.id}-send` }).catch(() => undefined);
    const orderId = await createOrderFromReorder(db, r, {
      status: "invoiced",
      stripe_invoice_id: finalized.id,
      invoice_url: finalized.hosted_invoice_url ?? null,
    });
    return { ok: true, kind: "invoiced", orderId, reorder: r };
  }

  // ---- card on file ----
  const cust = await stripe.customers.retrieve(customer, { expand: ["invoice_settings.default_payment_method"] });
  let pm: string | null = null;
  if (!cust.deleted) {
    const d = cust.invoice_settings.default_payment_method;
    pm = typeof d === "string" ? d : d?.id ?? null;
    if (!pm) {
      const list = await stripe.customers.listPaymentMethods(customer, { type: "card", limit: 1 });
      pm = list.data[0]?.id ?? null;
    }
  }
  if (!pm) return await failWithLink(db, stripe, r, customer, "no_card_on_file", description);

  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: r.amount_cents,
        currency: "cad",
        customer,
        payment_method: pm,
        off_session: true,
        confirm: true,
        description,
        metadata: { reorder_id: r.id, cafe_id: r.cafe_id, via },
        expand: ["latest_charge"],
      },
      { idempotencyKey: `reorder-${r.id}-pi` },
    );
    if (pi.status === "succeeded") {
      const charge = pi.latest_charge as Stripe.Charge | null;
      const orderId = await createOrderFromReorder(db, r, {
        status: "paid",
        stripe_payment_intent_id: pi.id,
        receipt_url: charge?.receipt_url ?? null,
      });
      return { ok: true, kind: "charged", orderId, reorder: r };
    }
    return await failWithLink(db, stripe, r, customer, `payment_intent_${pi.status}`, description, pi.id);
  } catch (e) {
    const err = e as Stripe.errors.StripeError & { payment_intent?: Stripe.PaymentIntent };
    const code = err.code ?? err.type ?? "card_error";
    const decline = (err as Stripe.errors.StripeCardError).decline_code;
    return await failWithLink(db, stripe, r, customer, decline ? `${code}: ${decline}` : code, description, err.payment_intent?.id);
  }
}

/** Marks the reorder failed and creates a hosted Checkout link the café can pay from (SMS + admin). */
async function failWithLink(db: Db, stripe: Stripe, r: ReorderFull, customer: string, reason: string, description: string, piId?: string): Promise<PaymentResult> {
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer,
      currency: "cad",
      line_items: [{ quantity: 1, price_data: { currency: "cad", unit_amount: r.amount_cents, product_data: { name: `Cup Casa reorder — ${r.cases} × ${sizeLabel(r.product)} (incl. tax)` } } }],
      payment_intent_data: { setup_future_usage: "off_session", metadata: { reorder_id: r.id, cafe_id: r.cafe_id, recovery: "1" } },
      metadata: { reorder_id: r.id, cafe_id: r.cafe_id, recovery: "1" },
      success_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/portal/reorders?ok=${encodeURIComponent("Payment received — thanks! Your order is on its way to fulfilment.")}`,
      cancel_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/portal/reorders`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h, Stripe max
    },
    { idempotencyKey: `reorder-${r.id}-recovery-${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}` },
  );
  await db
    .from("reorders")
    .update({ status: "failed", failure_reason: reason, stripe_checkout_session_id: session.id, stripe_payment_intent_id: piId ?? r.stripe_payment_intent_id })
    .eq("id", r.id);
  return { ok: false, reason, paymentLink: session.url ?? undefined, reorder: { ...r, status: "failed" } };
}
