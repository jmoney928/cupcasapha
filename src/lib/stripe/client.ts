import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let stripe: Stripe | null | undefined;
/** Returns null when STRIPE_SECRET_KEY is not configured so pages can degrade gracefully. */
export function getStripe(): Stripe | null {
  if (stripe === undefined) {
    const key = serverEnv().STRIPE_SECRET_KEY;
    stripe = key ? new Stripe(key) : null;
  }
  return stripe;
}
