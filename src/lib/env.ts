import { z } from "zod";

/**
 * Environment access. Public vars are inlined at build time by Next.js, so they are read
 * directly; server vars are validated lazily so a missing optional integration (Stripe,
 * Twilio) does not break unrelated pages.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  CRON_SECRET: z.string().min(8),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  TWILIO_WEBHOOK_URL: z.string().url().optional(),
  POS_TOKEN_ENC_KEY: z.string().optional(),
  SQUARE_APP_ID: z.string().optional(),
  SQUARE_APP_SECRET: z.string().optional(),
  SQUARE_ENV: z.enum(["sandbox", "production"]).optional(),
});

let cached: z.infer<typeof serverSchema> | null = null;
export function serverEnv() {
  if (!cached) {
    cached = serverSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      CRON_SECRET: process.env.CRON_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID,
      TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
      TWILIO_WEBHOOK_URL: process.env.TWILIO_WEBHOOK_URL,
      POS_TOKEN_ENC_KEY: process.env.POS_TOKEN_ENC_KEY,
      SQUARE_APP_ID: process.env.SQUARE_APP_ID,
      SQUARE_APP_SECRET: process.env.SQUARE_APP_SECRET,
      SQUARE_ENV: process.env.SQUARE_ENV as "sandbox" | "production" | undefined,
    });
  }
  return cached;
}

export const stripeConfigured = () => Boolean(serverEnv().STRIPE_SECRET_KEY);
export const twilioConfigured = () =>
  Boolean(serverEnv().TWILIO_ACCOUNT_SID && serverEnv().TWILIO_AUTH_TOKEN &&
    (serverEnv().TWILIO_MESSAGING_SERVICE_SID || serverEnv().TWILIO_FROM_NUMBER));
