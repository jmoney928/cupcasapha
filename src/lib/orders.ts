import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Db = SupabaseClient<Database>;
export type ReorderRow = Database["public"]["Tables"]["reorders"]["Row"];
export type CafeRow = Database["public"]["Tables"]["cafes"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ReorderFull = ReorderRow & { cafe: CafeRow; product: ProductRow };

export async function loadReorder(db: Db, id: string): Promise<ReorderFull> {
  const { data, error } = await db.from("reorders").select("*, cafe:cafes(*), product:products(*)").eq("id", id).single();
  if (error || !data || !data.cafe || !data.product) throw new Error(`Reorder ${id} not found`);
  return data as ReorderFull;
}

/** Creates the order + line item for a reorder and advances the reorder status. Idempotent per reorder. */
export async function createOrderFromReorder(
  db: Db,
  r: ReorderFull,
  opts: {
    status: "paid" | "invoiced" | "pending_payment";
    stripe_payment_intent_id?: string | null;
    stripe_invoice_id?: string | null;
    invoice_url?: string | null;
    receipt_url?: string | null;
    created_by?: string | null;
  },
) {
  const { data: existing } = await db.from("orders").select("id").eq("reorder_id", r.id).maybeSingle();
  if (existing) return existing.id;

  const { data: order, error } = await db
    .from("orders")
    .insert({
      cafe_id: r.cafe_id,
      reorder_id: r.id,
      status: opts.status,
      subtotal_cents: r.subtotal_cents,
      tax_cents: r.tax_cents,
      total_cents: r.amount_cents,
      stripe_payment_intent_id: opts.stripe_payment_intent_id ?? null,
      stripe_invoice_id: opts.stripe_invoice_id ?? null,
      invoice_url: opts.invoice_url ?? null,
      receipt_url: opts.receipt_url ?? null,
      created_by: opts.created_by ?? null,
      ship_to: {
        name: r.cafe.name,
        address_line1: r.cafe.address_line1,
        address_line2: r.cafe.address_line2,
        city: r.cafe.city,
        province: r.cafe.province,
        postal_code: r.cafe.postal_code,
        phone: r.cafe.phone,
      },
    })
    .select("id")
    .single();
  if (error || !order) throw new Error(`Order insert failed: ${error?.message}`);

  const { error: iErr } = await db.from("order_items").insert({
    order_id: order.id,
    product_id: r.product_id,
    cases: r.cases,
    units: r.cases * r.product.units_per_case,
    unit_price_cents: r.product.price_per_case_cents,
    line_total_cents: r.subtotal_cents,
  });
  if (iErr) throw new Error(`Order item insert failed: ${iErr.message}`);

  const reorderStatus = opts.status === "invoiced" ? "invoiced" : opts.status === "paid" ? "charged" : "approved";
  await db
    .from("reorders")
    .update({
      status: reorderStatus,
      stripe_payment_intent_id: opts.stripe_payment_intent_id ?? r.stripe_payment_intent_id,
      stripe_invoice_id: opts.stripe_invoice_id ?? r.stripe_invoice_id,
      failure_reason: null,
    })
    .eq("id", r.id);
  return order.id;
}
