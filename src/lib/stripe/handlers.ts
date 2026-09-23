import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { twilioConfigured } from "@/lib/env";
import { sendSms } from "@/lib/twilio/send";
import { paymentLinkSms } from "@/lib/twilio/templates";
import { createOrderFromReorder, loadReorder } from "@/lib/orders";

type Db = ReturnType<typeof createAdminClient>;

/**
 * Portal-side Stripe events. Everything here is keyed off reorder_id in metadata (set when we create
 * the PaymentIntent / Invoice / recovery Checkout Session), and every write is idempotent: the order
 * insert is skipped when one already exists for the reorder, and status updates are last-write-wins
 * on the same terminal state.
 */
export async function handlePortalStripeEvent(event: Stripe.Event): Promise<string> {
  const db = createAdminClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const reorderId = pi.metadata?.reorder_id;
      if (!reorderId) return "ignored: not a reorder payment";
      const r = await loadReorder(db, reorderId).catch(() => null);
      if (!r) return `ignored: reorder ${reorderId} not found`;
      const charge = typeof pi.latest_charge === "string" ? null : (pi.latest_charge as Stripe.Charge | null);
      await createOrderFromReorder(db, r, { status: "paid", stripe_payment_intent_id: pi.id, receipt_url: charge?.receipt_url ?? null });
      // A recovery-link payment leaves the reorder "failed"; clear that now it is paid.
      await db.from("reorders").update({ status: "charged", failure_reason: null, stripe_payment_intent_id: pi.id }).eq("id", reorderId);
      return `reorder ${reorderId} charged`;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const reorderId = pi.metadata?.reorder_id;
      if (!reorderId) return "ignored: not a reorder payment";
      const reason = pi.last_payment_error?.decline_code ?? pi.last_payment_error?.code ?? "payment_failed";
      const { data: current } = await db.from("reorders").select("status").eq("id", reorderId).maybeSingle();
      if (current?.status === "charged" || current?.status === "shipped" || current?.status === "delivered") return "ignored: already paid";
      await db.from("reorders").update({ status: "failed", failure_reason: reason, stripe_payment_intent_id: pi.id }).eq("id", reorderId);
      return `reorder ${reorderId} failed (${reason})`;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const reorderId = session.metadata?.reorder_id;
      const cafeId = session.metadata?.cafe_id;

      // Card saved from the portal (setup mode) — nothing to record beyond the customer link.
      if (session.mode === "setup") {
        if (cafeId && typeof session.customer === "string") {
          await db.from("cafes").update({ stripe_customer_id: session.customer }).eq("id", cafeId).is("stripe_customer_id", null);
        }
        return "card saved";
      }
      if (!reorderId) return "ignored: marketing checkout";

      // Recovery link paid: payment_intent.succeeded does the order; make the card reusable next time.
      if (typeof session.customer === "string" && cafeId) {
        await db.from("cafes").update({ stripe_customer_id: session.customer }).eq("id", cafeId).is("stripe_customer_id", null);
      }
      return `recovery session for reorder ${reorderId} completed`;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const reorderId = invoice.metadata?.reorder_id;
      if (!reorderId) return "ignored: not a reorder invoice";
      await db.from("orders").update({ status: "paid", invoice_url: invoice.hosted_invoice_url ?? null }).eq("stripe_invoice_id", invoice.id).eq("status", "invoiced");
      await db.from("reorders").update({ status: "charged", failure_reason: null }).eq("id", reorderId).eq("status", "invoiced");
      return `invoice for reorder ${reorderId} paid`;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const reorderId = invoice.metadata?.reorder_id;
      if (!reorderId) return "ignored: not a reorder invoice";
      await db.from("reorders").update({ status: "failed", failure_reason: "invoice_payment_failed" }).eq("id", reorderId);
      await notifyPaymentLink(db, invoice.metadata?.cafe_id, invoice.hosted_invoice_url);
      return `invoice for reorder ${reorderId} failed`;
    }

    default:
      return `ignored: ${event.type}`;
  }
}

async function notifyPaymentLink(db: Db, cafeId: string | undefined, url: string | null | undefined) {
  if (!cafeId || !url || !twilioConfigured()) return;
  const { data: cafe } = await db.from("cafes").select("id, sms_opt_in, phone").eq("id", cafeId).maybeSingle();
  if (!cafe?.sms_opt_in || !cafe.phone) return;
  await sendSms(db, cafe.id, paymentLinkSms(url)).catch((e) => console.error("payment link sms failed", (e as Error).message));
}

/** Events the portal cares about; anything else short-circuits to the marketing handler. */
export const PORTAL_EVENTS = new Set<Stripe.Event["type"]>([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
]);
