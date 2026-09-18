import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Role = Database["public"]["Enums"]["user_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Authoritative session: the auth user + their profile row (RLS-scoped). Cached per request. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;
  return { user, profile, supabase };
});

export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireRole(...roles: Role[]) {
  const s = await requireSession();
  if (!roles.includes(s.profile.role)) {
    redirect(s.profile.role === "client" ? "/portal" : "/admin");
  }
  return s;
}

export const isStaffRole = (r: Role) => r === "staff" || r === "admin";
