import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Service-role client. BYPASSES RLS. Only for webhooks, cron, and admin-API calls
 * (user invites) after the caller has been authorized in code. Never import from a client component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
