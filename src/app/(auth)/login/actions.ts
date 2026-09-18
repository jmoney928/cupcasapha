"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

const emailSchema = z.object({ email: z.string().trim().email(), next: z.string().startsWith("/").optional() });
const passwordSchema = emailSchema.extend({ password: z.string().min(6) });

const safeNext = (next?: string) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "");

export async function sendMagicLink(formData: FormData) {
  const parsed = emailSchema.safeParse({ email: formData.get("email"), next: formData.get("next") || undefined });
  if (!parsed.success) redirect("/login?error=Enter+a+valid+email");
  const { email, next } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // invitation-only
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?sent=${encodeURIComponent(email)}`);
}

export async function signInWithPassword(formData: FormData) {
  const parsed = passwordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) redirect("/login?mode=password&error=Enter+your+email+and+password");
  const { email, password, next } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/login?mode=password&error=Wrong+email+or+password");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const home = profile?.role === "client" ? "/portal" : "/admin";
  redirect(safeNext(next) || home);
}
