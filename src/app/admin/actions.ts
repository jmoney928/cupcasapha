"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff, requireAdmin } from "@/lib/auth/admin-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

const uuid = z.string().uuid();
type Msg = { ok?: string; error?: string };
// Explicit `never` annotation lets TypeScript narrow after `if (!ok) flash(...)`.
const flash: (path: string, msg: Msg) => never = (path, msg) => {
  const q = new URLSearchParams(msg.error ? { error: msg.error } : { ok: msg.ok ?? "" });
  redirect(`${path}?${q}`);
};
const onOff = z.literal("on").optional();

/* ----------------------------- cafés (staff) ----------------------------- */
const cafeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  contact_email: z.string().trim().email().or(z.literal("")),
  phone: z.string().trim().max(20),
  address_line1: z.string().trim().max(200),
  address_line2: z.string().trim().max(200),
  city: z.string().trim().max(100),
  province: z.string().trim().max(2),
  postal_code: z.string().trim().max(10),
  payment_terms: z.enum(["card", "net30"]),
  tax_rate_bps: z.coerce.number().int().min(0).max(3000),
  lead_time_days: z.coerce.number().int().min(0).max(60),
  safety_days: z.coerce.number().int().min(0).max(60),
  auto_ship: onOff,
  sms_opt_in: onOff,
  active: onOff,
});
const toE164 = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
};
const cafeRow = (d: z.infer<typeof cafeSchema>) => ({
  name: d.name,
  contact_email: d.contact_email || null,
  phone: toE164(d.phone),
  address_line1: d.address_line1 || null,
  address_line2: d.address_line2 || null,
  city: d.city || null,
  province: d.province.toUpperCase() || null,
  postal_code: d.postal_code.toUpperCase() || null,
  payment_terms: d.payment_terms,
  tax_rate_bps: d.tax_rate_bps,
  lead_time_days: d.lead_time_days,
  safety_days: d.safety_days,
  auto_ship: d.auto_ship === "on",
  sms_opt_in: d.sms_opt_in === "on",
  active: d.active === "on",
});

export async function createCafe(formData: FormData) {
  const { supabase } = await requireStaff();
  const p = cafeSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/cafes/new", { error: "Check the form: " + p.error.issues.map((i) => i.path.join(".")).join(", ") });
  const { data, error } = await supabase.from("cafes").insert(cafeRow(p.data)).select("id").single();
  if (error) flash("/admin/cafes/new", { error: error.message });
  revalidatePath("/admin", "layout");
  redirect(`/admin/cafes/${data!.id}?ok=Caf%C3%A9+created`);
}

export async function updateCafe(formData: FormData) {
  const { supabase } = await requireStaff();
  const id = uuid.parse(formData.get("cafe_id"));
  const p = cafeSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) flash(`/admin/cafes/${id}`, { error: "Check the form: " + p.error.issues.map((i) => i.path.join(".")).join(", ") });
  const { error } = await supabase.from("cafes").update(cafeRow(p.data)).eq("id", id);
  if (error) flash(`/admin/cafes/${id}`, { error: error.message });
  await supabase.rpc("refresh_cafe_stock", { p_cafe: id }); // lead/safety days change the reorder point
  revalidatePath("/admin", "layout");
  flash(`/admin/cafes/${id}`, { ok: "Saved" });
}

export async function addNote(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const p = z.object({ cafe_id: uuid, body: z.string().trim().min(1).max(2000) }).safeParse(Object.fromEntries(formData));
  if (!p.success) return;
  await supabase.from("cafe_notes").insert({ cafe_id: p.data.cafe_id, body: p.data.body, author_id: user.id });
  revalidatePath(`/admin/cafes/${p.data.cafe_id}`);
}

const stockSchema = z.object({ cafe_id: uuid, product_id: uuid, mode: z.enum(["count", "adjust", "baseline"]), value: z.coerce.number().int(), note: z.string().trim().max(200).optional() });
export async function adjustStock(formData: FormData) {
  const { supabase } = await requireStaff();
  const p = stockSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/cafes", { error: "Invalid stock adjustment." });
  const { cafe_id, product_id, mode, value, note } = p.data;
  let error: { message: string } | null = null;
  if (mode === "count") {
    ({ error } = await supabase.rpc("record_stock_count", { p_cafe: cafe_id, p_product: product_id, p_units: Math.max(0, value), p_source: "manual" }));
  } else if (mode === "adjust") {
    ({ error } = await supabase.rpc("adjust_stock", { p_cafe: cafe_id, p_product: product_id, p_qty_consumed: value, p_note: note || "manual adjustment" }));
  } else {
    ({ error } = await supabase.from("cafe_stock").update({ baseline_daily_burn: Math.max(0, value) }).eq("cafe_id", cafe_id).eq("product_id", product_id));
    if (!error) ({ error } = await supabase.rpc("refresh_cafe_stock", { p_cafe: cafe_id }));
  }
  if (error) flash(`/admin/cafes/${cafe_id}`, { error: error.message });
  revalidatePath(`/admin/cafes/${cafe_id}`);
  flash(`/admin/cafes/${cafe_id}`, { ok: "Stock updated" });
}

/* ----------------------------- reorders (staff) ----------------------------- */
export async function staffRespondReorder(formData: FormData) {
  const { supabase } = await requireStaff();
  const p = z.object({ reorder_id: uuid, decision: z.enum(["approve", "decline"]), back: z.string().startsWith("/").default("/admin/reorders") }).safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/reorders", { error: "Invalid request." });
  const { error } = await supabase.rpc("respond_to_reorder", { p_reorder: p.data.reorder_id, p_approve: p.data.decision === "approve", p_via: "staff" });
  if (error) flash(p.data.back, { error: error.message });
  await supabase.rpc("audit_event", { p_action: p.data.decision === "approve" ? "reorder.approved_on_behalf" : "reorder.declined_on_behalf", p_entity: "reorders", p_entity_id: p.data.reorder_id, p_diff: undefined });
  revalidatePath("/admin", "layout");
  flash(p.data.back, { ok: p.data.decision === "approve" ? "Approved on the café's behalf (logged)." : "Declined (logged)." });
}

/**
 * Turn an approved reorder into an order. Card charging / Stripe invoicing is wired in step 6;
 * until then this creates the order as paid (card) or invoiced (net30) so fulfilment can be tested.
 */
export async function fulfillReorder(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const p = z.object({ reorder_id: uuid, back: z.string().startsWith("/").default("/admin/reorders") }).safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/reorders", { error: "Invalid request." });
  const { data: r } = await supabase.from("reorders").select("*, cafe:cafes(*), product:products(*)").eq("id", p.data.reorder_id).single();
  if (!r || !r.cafe || !r.product) flash(p.data.back, { error: "Reorder not found." });
  if (r.status !== "approved") flash(p.data.back, { error: `Reorder is ${r.status}, not approved.` });

  const status = r.cafe.payment_terms === "net30" ? "invoiced" : "paid";
  const { data: order, error } = await supabase.from("orders").insert({
    cafe_id: r.cafe_id, reorder_id: r.id, status,
    subtotal_cents: r.subtotal_cents, tax_cents: r.tax_cents, total_cents: r.amount_cents,
    ship_to: { name: r.cafe.name, address_line1: r.cafe.address_line1, address_line2: r.cafe.address_line2, city: r.cafe.city, province: r.cafe.province, postal_code: r.cafe.postal_code },
    created_by: user.id,
  }).select("id").single();
  if (error) flash(p.data.back, { error: error.message });
  await supabase.from("order_items").insert({ order_id: order!.id, product_id: r.product_id, cases: r.cases, units: r.cases * r.product.units_per_case, unit_price_cents: r.product.price_per_case_cents, line_total_cents: r.subtotal_cents });
  await supabase.from("reorders").update({ status: r.cafe.payment_terms === "net30" ? "invoiced" : "charged" }).eq("id", r.id);
  revalidatePath("/admin", "layout");
  redirect(`/admin/fulfillment?ok=${encodeURIComponent("Order created and queued for shipping.")}`);
}

/* ----------------------------- fulfilment (staff) ----------------------------- */
export async function markShipped(formData: FormData) {
  const { supabase } = await requireStaff();
  const p = z.object({ order_id: uuid, carrier: z.string().trim().max(60), tracking_number: z.string().trim().min(1).max(80) }).safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/fulfillment", { error: "Tracking number is required." });
  const { error } = await supabase.from("orders").update({ status: "shipped", carrier: p.data.carrier || null, tracking_number: p.data.tracking_number }).eq("id", p.data.order_id);
  if (error) flash("/admin/fulfillment", { error: error.message });
  // The "shipped" SMS to the café is sent by the Twilio module (step 6).
  revalidatePath("/admin", "layout");
  flash("/admin/fulfillment", { ok: "Marked shipped." });
}

export async function markDelivered(formData: FormData) {
  const { supabase } = await requireStaff();
  const id = uuid.parse(formData.get("order_id"));
  const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", id);
  if (error) flash("/admin/fulfillment", { error: error.message });
  revalidatePath("/admin", "layout");
  flash("/admin/fulfillment", { ok: "Delivered. Stock has been added to the café." });
}

/* ----------------------------- SMS (staff) ----------------------------- */
export async function markReviewed(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const id = uuid.parse(formData.get("message_id"));
  await supabase.from("sms_messages").update({ needs_review: false, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", id);
  revalidatePath("/admin/sms");
}

/* ----------------------------- products (admin) ----------------------------- */
const productSchema = z.object({
  sku: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(120),
  size_oz: z.coerce.number().int().min(1).max(64),
  printed: onOff,
  units_per_case: z.coerce.number().int().min(1),
  units_per_sleeve: z.coerce.number().int().min(1),
  price_per_case_cents: z.coerce.number().int().min(0),
  sort_order: z.coerce.number().int().default(0),
  active: onOff,
});
export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("product_id") ? uuid.parse(formData.get("product_id")) : null;
  const p = productSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/products", { error: "Check the product form." });
  const row = { ...p.data, printed: p.data.printed === "on", active: p.data.active === "on" };
  const { error } = id ? await supabase.from("products").update(row).eq("id", id) : await supabase.from("products").insert(row);
  if (error) flash("/admin/products", { error: error.message });
  revalidatePath("/admin", "layout");
  flash("/admin/products", { ok: id ? "Product updated" : "Product added" });
}

/* ----------------------------- users (admin) ----------------------------- */
const inviteStaffSchema = z.object({ email: z.string().trim().email(), full_name: z.string().trim().max(120), role: z.enum(["staff", "admin"]) });
export async function inviteStaff(formData: FormData) {
  await requireAdmin();
  const p = inviteStaffSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/users", { error: "Enter a valid email." });
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(p.data.email, { data: { full_name: p.data.full_name }, redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/admin` });
  if (error) flash("/admin/users", { error: error.message });
  await admin.from("profiles").update({ role: p.data.role }).eq("id", data!.user.id);
  revalidatePath("/admin/users");
  flash("/admin/users", { ok: `Invited ${p.data.email} as ${p.data.role}.` });
}

export async function setRole(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const p = z.object({ user_id: uuid, role: z.enum(["client", "staff", "admin"]) }).safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/users", { error: "Invalid request." });
  if (p.data.user_id === user.id) flash("/admin/users", { error: "You can't change your own role." });
  const { error } = await supabase.from("profiles").update({ role: p.data.role }).eq("id", p.data.user_id);
  if (error) flash("/admin/users", { error: error.message });
  revalidatePath("/admin/users");
  flash("/admin/users", { ok: "Role updated." });
}

const attachSchema = z.object({ email: z.string().trim().email(), full_name: z.string().trim().max(120), cafe_id: uuid, member_role: z.enum(["owner", "manager"]) });
export async function attachClient(formData: FormData) {
  const { supabase } = await requireAdmin();
  const p = attachSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/users", { error: "Enter a valid email and pick a café." });
  const admin = createAdminClient();
  let userId: string;
  const { data: existing } = await admin.from("profiles").select("id, role").eq("email", p.data.email).maybeSingle();
  if (existing) {
    if (existing.role !== "client") flash("/admin/users", { error: "That email belongs to a staff member." });
    userId = existing.id;
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(p.data.email, { data: { full_name: p.data.full_name }, redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/portal` });
    if (error) flash("/admin/users", { error: error.message });
    userId = data!.user.id;
  }
  const { error } = await supabase.from("cafe_members").insert({ cafe_id: p.data.cafe_id, user_id: userId, member_role: p.data.member_role });
  if (error && !error.message.includes("duplicate")) flash("/admin/users", { error: error.message });
  revalidatePath("/admin", "layout");
  flash("/admin/users", { ok: `${p.data.email} linked to the café.` });
}

export async function removeMembership(formData: FormData) {
  const { supabase } = await requireAdmin();
  const p = z.object({ cafe_id: uuid, user_id: uuid }).safeParse(Object.fromEntries(formData));
  if (!p.success) flash("/admin/users", { error: "Invalid request." });
  await supabase.from("cafe_members").delete().eq("cafe_id", p.data.cafe_id).eq("user_id", p.data.user_id);
  revalidatePath("/admin", "layout");
  flash("/admin/users", { ok: "Membership removed." });
}
