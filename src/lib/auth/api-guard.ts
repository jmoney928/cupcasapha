import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Cup Casa OS tools are included with cup orders, never sold separately, so their API routes
 * require a signed-in account. Returns the user id, or null when there is no session.
 */
export async function requireApiSession(): Promise<{ userId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { userId: user.id } : null;
}
