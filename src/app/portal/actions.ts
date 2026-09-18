"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CAFE_COOKIE, getPortalContext } from "@/lib/auth/cafe-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeConfigured, publicEnv } from "@/lib/env";
import { createBillingPortalSession, createCardSetupSession } from "@/lib/stripe/customers";

const uuid = z.string().uuid();
type Msg = { ok?: string; error?: string };
// Explicit `never` annotation lets TypeScript narrow after `if (!ok) back(...)`.
const back: (path: string, msg: Msg) => never = (path, msg) => {
  const q = new URLSearchParams(msg.error ? { error: msg.error } : { ok: msg.ok ?? "" });
  redirect(`${path}?${q}`);
};

/** Verifies the selected café belongs to the signed-in client (the cookie is user input). */
async function ctxFor(cafeId: string) {
  const ctx = await getPortalContext();
  const cafe = ctx.cafes.find((c) => c.id === cafeId);
  if (!cafe) throw new Error("Not a member of this café");
  return { ...ctx, cafe };
}

export async function switchCafe(cafeId: string) {
  const ctx = await getPortalContext();
  if (!ctx.cafes.some((c) => c.id === cafeId)) return;
  (await cookies()).set(CAFE_COOKIE, cafeId, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/portal", "layout");
}

const countSchema = z.object({ cafe_id: uuid, product_id: uuid, sleeves: z.coerce.number().int().min(0).max(10_000) });
export async function recordCount(formData: FormData) {
  const p = countSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) back("/portal", { error: "Enter a whole number of sleeves." });
  const { supabase } = await ctxFor(p.data.cafe_id);
  const { data: product } = await supabase.from("products").select("units_per_sleeve").eq("id", p.data.product_id).single();
  if (!product) back("/portal", { error: "Unknown product." });
  const units = p.data.sleeves * product!.units_per_sleeve;
  const { error } = await supabase.rpc("record_stock_count", { p_cafe: p.data.cafe_id, p_product: p.data.product_id, p_units: units, p_source: "manual" });
  if (error) back("/portal", { error: error.message });
  revalidatePath("/portal");
  back("/portal", { ok: "Thanks! Your count is updated." });
}

const reorderSchema = z.object({ cafe_id: uuid, product_id: uuid, cases: z.coerce.number().int().min(1).max(50) });
export async function requestReorder(formData: FormData) {
  const p = reorderSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) back("/portal", { error: "Choose how many cases." });
  const { supabase } = await ctxFor(p.data.cafe_id);
  const { data, error } = await supabase.rpc("request_reorder", { p_cafe: p.data.cafe_id, p_product: p.data.product_id, p_cases: p.data.cases });
  if (error) back("/portal", { error: error.message });
  // Payment happens in the reorder pipeline (step 6). Until then the request sits as "approved" for staff.
  revalidatePath("/portal", "layout");
  redirect(`/portal/reorders?ok=${encodeURIComponent(`Reorder for ${data!.cases} case${data!.cases > 1 ? "s" : ""} placed. We'll confirm shortly.`)}`);
}

const respondSchema = z.object({ reorder_id: uuid, decision: z.enum(["approve", "decline"]) });
export async function respondReorder(formData: FormData) {
  const p = respondSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) back("/portal/reorders", { error: "Invalid request." });
  const { supabase } = await getPortalContext();
  const { error } = await supabase.rpc("respond_to_reorder", { p_reorder: p.data.reorder_id, p_approve: p.data.decision === "approve", p_via: "portal" });
  if (error) back("/portal/reorders", { error: error.message });
  revalidatePath("/portal", "layout");
  back("/portal/reorders", { ok: p.data.decision === "approve" ? "Approved. We'll process your order." : "Skipped. We'll check in again in a week." });
}

const settingsSchema = z.object({
  cafe_id: uuid,
  name: z.string().trim().min(1).max(120),
  contact_email: z.string().trim().email().or(z.literal("")),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/).or(z.literal("")),
  address_line1: z.string().trim().max(200),
  address_line2: z.string().trim().max(200),
  city: z.string().trim().max(100),
  province: z.string().trim().max(2),
  postal_code: z.string().trim().max(10),
  sms_opt_in: z.literal("on").optional(),
  auto_ship: z.literal("on").optional(),
});
/** Normalise Canadian numbers to E.164 so Twilio matches inbound texts. */
const toE164 = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
};
export async function updateSettings(formData: FormData) {
  const p = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) back("/portal/settings", { error: "Please check the highlighted fields." });
  const d = p.data;
  const { supabase } = await ctxFor(d.cafe_id);
  const { error } = await supabase
    .from("cafes")
    .update({
      name: d.name,
      contact_email: d.contact_email || null,
      phone: toE164(d.phone),
      address_line1: d.address_line1 || null,
      address_line2: d.address_line2 || null,
      city: d.city || null,
      province: d.province.toUpperCase() || null,
      postal_code: d.postal_code.toUpperCase() || null,
      sms_opt_in: d.sms_opt_in === "on",
      auto_ship: d.auto_ship === "on",
    })
    .eq("id", d.cafe_id);
  if (error) back("/portal/settings", { error: error.message.includes("cafes_phone_key") ? "That phone number is already used by another café." : error.message });
  revalidatePath("/portal", "layout");
  back("/portal/settings", { ok: "Settings saved." });
}

export async function manageCard(formData: FormData) {
  const cafeId = uuid.parse(formData.get("cafe_id"));
  const { cafe } = await ctxFor(cafeId);
  if (!stripeConfigured()) back("/portal/settings", { error: "Card payments are not set up yet. Please contact Cup Casa." });
  const url = cafe.stripe_customer_id ? await createBillingPortalSession(cafe) : await createCardSetupSession(cafe);
  redirect(url);
}

export async function addCard(formData: FormData) {
  const cafeId = uuid.parse(formData.get("cafe_id"));
  const { cafe } = await ctxFor(cafeId);
  if (!stripeConfigured()) back("/portal/settings", { error: "Card payments are not set up yet. Please contact Cup Casa." });
  redirect(await createCardSetupSession(cafe));
}

const inviteSchema = z.object({ cafe_id: uuid, email: z.string().trim().email(), full_name: z.string().trim().max(120), member_role: z.enum(["owner", "manager"]) });
export async function inviteMember(formData: FormData) {
  const p = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) back("/portal/settings/team", { error: "Enter a valid email." });
  const { cafe, supabase, isOwner } = await ctxFor(p.data.cafe_id);
  if (!isOwner) back("/portal/settings/team", { error: "Only owners can invite people." });

  // The auth admin API needs the service role; authorization (owner of this café) was checked above.
  const admin = createAdminClient();
  let userId: string | undefined;
  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(p.data.email, {
    data: { full_name: p.data.full_name },
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/portal`,
  });
  if (error) {
    // Already registered: look them up and just attach.
    const { data: existing } = await admin.from("profiles").select("id, role").eq("email", p.data.email).maybeSingle();
    if (!existing) back("/portal/settings/team", { error: error.message });
    if (existing.role !== "client") back("/portal/settings/team", { error: "That email belongs to Cup Casa staff." });
    userId = existing.id;
  } else {
    userId = invited!.user.id;
  }
  // Membership insert runs as the owner (RLS: owners may add members to their café).
  const { error: mErr } = await supabase.from("cafe_members").insert({ cafe_id: cafe.id, user_id: userId!, member_role: p.data.member_role });
  if (mErr && !mErr.message.includes("duplicate")) back("/portal/settings/team", { error: mErr.message });
  revalidatePath("/portal/settings/team");
  back("/portal/settings/team", { ok: `Invitation sent to ${p.data.email}.` });
}

export async function removeMember(formData: FormData) {
  const p = z.object({ cafe_id: uuid, user_id: uuid }).safeParse(Object.fromEntries(formData));
  if (!p.success) back("/portal/settings/team", { error: "Invalid request." });
  const { supabase, user, isOwner } = await ctxFor(p.data.cafe_id);
  if (!isOwner) back("/portal/settings/team", { error: "Only owners can remove people." });
  if (p.data.user_id === user.id) back("/portal/settings/team", { error: "You can't remove yourself." });
  const { error } = await supabase.from("cafe_members").delete().eq("cafe_id", p.data.cafe_id).eq("user_id", p.data.user_id);
  if (error) back("/portal/settings/team", { error: error.message });
  revalidatePath("/portal/settings/team");
  back("/portal/settings/team", { ok: "Removed." });
}
