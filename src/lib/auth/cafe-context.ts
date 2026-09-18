import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "./session";
import type { Database } from "@/lib/supabase/database.types";

export const CAFE_COOKIE = "cc_cafe";
export type Cafe = Database["public"]["Tables"]["cafes"]["Row"];

/**
 * Client portal context: the cafés this user belongs to and the currently selected one.
 * Selection lives in a cookie; it is validated against membership on every request.
 */
export const getPortalContext = cache(async () => {
  const { user, profile, supabase } = await requireRole("client");
  const { data: memberships } = await supabase
    .from("cafe_members")
    .select("member_role, cafe:cafes(*)")
    .eq("user_id", user.id);

  const cafes = (memberships ?? [])
    .map((m) => ({ ...(m.cafe as Cafe), member_role: m.member_role }))
    .filter((c) => c.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (cafes.length === 0) redirect("/portal/no-cafe");

  const cookieStore = await cookies();
  const wanted = cookieStore.get(CAFE_COOKIE)?.value;
  const cafe = cafes.find((c) => c.id === wanted) ?? cafes[0];

  return { user, profile, supabase, cafes, cafe, isOwner: cafe.member_role === "owner" };
});
