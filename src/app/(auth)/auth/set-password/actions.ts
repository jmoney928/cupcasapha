"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ password: z.string().min(8), full_name: z.string().trim().min(1).max(120).optional() });

export async function setPassword(formData: FormData) {
  const parsed = schema.safeParse({ password: formData.get("password"), full_name: formData.get("full_name") || undefined });
  if (!parsed.success) redirect("/auth/set-password?error=Password+must+be+at+least+8+characters");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(`/auth/set-password?error=${encodeURIComponent(error.message)}`);
  if (parsed.data.full_name) await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  redirect(profile?.role === "client" ? "/portal" : "/admin");
}
