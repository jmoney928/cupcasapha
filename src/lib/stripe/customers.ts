import "server-only";
import { getStripe } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import type { Cafe } from "@/lib/auth/cafe-context";

/** Find or create the Stripe customer for a café and persist the id. */
export async function ensureStripeCustomer(cafe: Pick<Cafe, "id" | "name" | "contact_email" | "phone" | "stripe_customer_id">) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  if (cafe.stripe_customer_id) return cafe.stripe_customer_id;
  const customer = await stripe.customers.create({
    name: cafe.name,
    email: cafe.contact_email ?? undefined,
    phone: cafe.phone ?? undefined,
    metadata: { cafe_id: cafe.id },
  });
  const admin = createAdminClient();
  await admin.from("cafes").update({ stripe_customer_id: customer.id }).eq("id", cafe.id);
  return customer.id;
}

/** Hosted page to add/replace a card. Returns a URL to redirect to. */
export async function createCardSetupSession(cafe: Parameters<typeof ensureStripeCustomer>[0]) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  const customer = await ensureStripeCustomer(cafe);
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer,
    currency: "cad",
    payment_method_types: ["card"],
    success_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/portal/settings?ok=${encodeURIComponent("Card saved. Future reorders will charge it.")}`,
    cancel_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/portal/settings`,
    metadata: { cafe_id: cafe.id },
  });
  return session.url!;
}

/** Stripe Customer Portal for managing the saved card, invoices, and billing details. */
export async function createBillingPortalSession(cafe: Parameters<typeof ensureStripeCustomer>[0]) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  const customer = await ensureStripeCustomer(cafe);
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/portal/settings`,
  });
  return session.url;
}

/** True when the customer has a default card on file. */
export async function hasSavedCard(stripeCustomerId: string | null) {
  const stripe = getStripe();
  if (!stripe || !stripeCustomerId) return false;
  const customer = await stripe.customers.retrieve(stripeCustomerId, { expand: ["invoice_settings.default_payment_method"] });
  if (customer.deleted) return false;
  if (customer.invoice_settings.default_payment_method) return true;
  const pms = await stripe.customers.listPaymentMethods(stripeCustomerId, { type: "card", limit: 1 });
  return pms.data.length > 0;
}
