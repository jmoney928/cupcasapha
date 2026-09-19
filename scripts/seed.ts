/**
 * Seeds a realistic demo dataset: users for every role, 3 cafés, 3 SKUs, 30 days of usage,
 * delivered orders, pending reorders and an SMS thread. Idempotent: re-running replaces the seed cafés.
 *
 *   npm run seed            (reads .env.local; needs SUPABASE_SERVICE_ROLE_KEY)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
if (!url.includes("127.0.0.1") && !url.includes("localhost") && process.env.SEED_REMOTE !== "1") {
  throw new Error(`Refusing to seed a non-local project (${url}). Set SEED_REMOTE=1 to override.`);
}
const db = createClient<Database>(url, key, { auth: { persistSession: false } });
const PASSWORD = process.env.SEED_PASSWORD ?? "cupcasa-demo";
const daysAgo = (d: number, hour = 9) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(hour, 0, 0, 0); return t.toISOString(); };
const fail = (e: { message: string } | null, what: string) => { if (e) throw new Error(`${what}: ${e.message}`); };

async function ensureUser(email: string, full_name: string, role: "client" | "staff" | "admin") {
  const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  let id = existing?.id;
  if (!id) {
    const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name } });
    fail(error, `create ${email}`);
    id = data.user!.id;
  }
  fail((await db.from("profiles").update({ role, full_name }).eq("id", id)).error, `role ${email}`);
  return id;
}

async function main() {
  console.log("▸ users");
  const admin = await ensureUser("admin@cupcasa.test", "Ada Admin", "admin");
  const staff = await ensureUser("staff@cupcasa.test", "Sam Staff", "staff");
  const alice = await ensureUser("alice@northside.test", "Alice Nguyen", "client");
  const bob = await ensureUser("bob@commongrounds.test", "Bob Tremblay", "client");
  const carol = await ensureUser("carol@northside.test", "Carol Singh", "client");

  console.log("▸ products");
  const skus = [
    { sku: "PHA-8", name: "8oz PHA Cup", size_oz: 8, printed: false, price_per_case_cents: 20000, sort_order: 1 },
    { sku: "PHA-12", name: "12oz PHA Cup", size_oz: 12, printed: false, price_per_case_cents: 22000, sort_order: 2 },
    { sku: "PHA-16", name: "16oz PHA Cup", size_oz: 16, printed: false, price_per_case_cents: 24000, sort_order: 3 },
  ];
  // retire SKUs that are no longer part of the seed (e.g. old printed variants)
  await db.from("products").update({ active: false }).not("sku", "in", `(${skus.map((s) => `"${s.sku}"`).join(",")})`);
  const { data: products, error: pErr } = await db.from("products").upsert(skus.map((s) => ({ ...s, units_per_case: 1000, units_per_sleeve: 50, active: true })), { onConflict: "sku" }).select("id, sku");
  fail(pErr, "products");
  const P = Object.fromEntries(products!.map((p) => [p.sku, p.id]));

  console.log("▸ cafés (replacing previous seed)");
  const names = ["Northside Roasters", "Bloom Café", "Common Grounds"];
  const { data: old } = await db.from("cafes").select("id").in("name", names);
  await db.from("sms_messages").delete().like("twilio_sid", "SMseed%");
  if (old?.length) {
    const ids = old.map((c) => c.id);
    await db.from("orders").delete().in("cafe_id", ids);
    fail((await db.from("cafes").delete().in("id", ids)).error, "delete old cafés");
  }
  const { data: cafes, error: cErr } = await db.from("cafes").insert([
    { name: "Northside Roasters", address_line1: "412 Danforth Ave", city: "Toronto", province: "ON", postal_code: "M4K 1P3", phone: "+14165550101", contact_email: "hello@northside.test", payment_terms: "card", sms_opt_in: true, sms_opt_in_source: "portal", auto_ship: false, tax_rate_bps: 1300, lead_time_days: 3, safety_days: 5 },
    { name: "Bloom Café", address_line1: "2210 Main St", city: "Vancouver", province: "BC", postal_code: "V5T 3C8", phone: "+16045550102", contact_email: "orders@bloom.test", payment_terms: "net30", sms_opt_in: true, sms_opt_in_source: "staff", auto_ship: false, tax_rate_bps: 500, lead_time_days: 5, safety_days: 5 },
    { name: "Common Grounds", address_line1: "88 Bank St", city: "Ottawa", province: "ON", postal_code: "K1P 5N2", phone: "+16135550103", contact_email: "bob@commongrounds.test", payment_terms: "card", sms_opt_in: true, sms_opt_in_source: "portal", auto_ship: true, tax_rate_bps: 1300, lead_time_days: 3, safety_days: 5 },
  ]).select("id, name");
  fail(cErr, "cafés");
  const C = Object.fromEntries(cafes!.map((c) => [c.name, c.id]));

  console.log("▸ memberships");
  fail((await db.from("cafe_members").insert([
    { cafe_id: C["Northside Roasters"], user_id: alice, member_role: "owner" },
    { cafe_id: C["Bloom Café"], user_id: alice, member_role: "owner" },          // multi-location owner
    { cafe_id: C["Northside Roasters"], user_id: carol, member_role: "manager" },
    { cafe_id: C["Common Grounds"], user_id: bob, member_role: "owner" },
  ])).error, "members");

  // Per café/product: daily burn (cups/day), count taken 30 days ago, whether a case was delivered 20 days ago.
  type Plan = { cafe: string; sku: string; burn: number; count30: number; delivered: boolean };
  const plans: Plan[] = [
    { cafe: "Northside Roasters", sku: "PHA-12", burn: 120, count30: 4000, delivered: true },  // amber
    { cafe: "Northside Roasters", sku: "PHA-16", burn: 60, count30: 2500, delivered: true },   // green
    { cafe: "Northside Roasters", sku: "PHA-8", burn: 40, count30: 1500, delivered: true },    // green
    { cafe: "Bloom Café", sku: "PHA-12", burn: 150, count30: 4000, delivered: true },           // red → pending reorder
    { cafe: "Bloom Café", sku: "PHA-16", burn: 80, count30: 3000, delivered: true },            // green
    { cafe: "Common Grounds", sku: "PHA-8", burn: 50, count30: 2000, delivered: true },         // green
    { cafe: "Common Grounds", sku: "PHA-12", burn: 100, count30: 3500, delivered: true },       // amber
  ];

  console.log("▸ 30 days of usage");
  const events: Database["public"]["Tables"]["usage_events"]["Insert"][] = [];
  for (const pl of plans) {
    fail((await db.from("cafe_stock").update({ baseline_daily_burn: pl.burn, last_count_units: pl.count30, last_count_at: daysAgo(30, 7) })
      .eq("cafe_id", C[pl.cafe]).eq("product_id", P[pl.sku])).error, "stock anchor");
    for (let d = 29; d >= 1; d--) {
      const date = new Date(); date.setDate(date.getDate() - d);
      const dow = date.getDay();
      const factor = dow === 0 ? 0.55 : dow === 6 ? 1.25 : dow === 5 ? 1.1 : 1;
      const jitter = 0.85 + ((d * 7919 + pl.burn) % 30) / 100;
      events.push({ cafe_id: C[pl.cafe], product_id: P[pl.sku], qty: Math.round(pl.burn * factor * jitter), source: "manual", occurred_at: daysAgo(d, 21), note: "daily usage (seed)" });
    }
  }
  fail((await db.from("usage_events").insert(events)).error, "usage events");

  console.log("▸ delivered orders (20 days ago) + history");
  for (const cafe of names) {
    const items = plans.filter((p) => p.cafe === cafe && p.delivered);
    const subtotal = items.reduce((a, i) => a + skus.find((s) => s.sku === i.sku)!.price_per_case_cents, 0);
    const taxBps = cafe === "Bloom Café" ? 500 : 1300;
    const tax = Math.round((subtotal * taxBps) / 10000);
    for (const [ago, status] of [[50, "delivered"], [20, "delivered"]] as const) {
      const { data: order, error } = await db.from("orders").insert({
        cafe_id: C[cafe], status: cafe === "Bloom Café" ? "invoiced" : "paid", subtotal_cents: subtotal, tax_cents: tax, total_cents: subtotal + tax,
        created_at: daysAgo(ago + 3), carrier: "Canada Post", tracking_number: `CP${ago}${cafe.length}${Math.floor(subtotal / 100)}CA`,
        invoice_url: cafe === "Bloom Café" ? "https://invoice.stripe.com/i/example" : null, receipt_url: cafe !== "Bloom Café" ? "https://pay.stripe.com/receipts/example" : null,
        ship_to: { name: cafe },
      }).select("id").single();
      fail(error, "order");
      fail((await db.from("order_items").insert(items.map((i) => ({ order_id: order!.id, product_id: P[i.sku], cases: 1, units: 1000, unit_price_cents: skus.find((s) => s.sku === i.sku)!.price_per_case_cents, line_total_cents: skus.find((s) => s.sku === i.sku)!.price_per_case_cents })))).error, "items");
      fail((await db.from("orders").update({ status: "shipped", shipped_at: daysAgo(ago + 1) }).eq("id", order!.id)).error, "ship");
      fail((await db.from("orders").update({ status, delivered_at: daysAgo(ago, 11) }).eq("id", order!.id)).error, "deliver");
    }
  }

  console.log("▸ recompute stock + engine");
  fail((await db.rpc("refresh_cafe_stock")).error, "refresh");
  const { data: created, error: eErr } = await db.rpc("run_reorder_engine");
  fail(eErr, "engine");
  // Pretend the nightly job already texted the low café and it is waiting for a reply
  for (const r of created ?? []) {
    await db.from("reorders").update({ status: "sms_sent" }).eq("id", r.id);
    await db.from("sms_prompts").insert({ cafe_id: r.cafe_id, kind: "reorder_approval", reorder_ids: [r.id], sent_at: new Date().toISOString() });
  }

  console.log("▸ reorder history, failed payment, SMS thread");
  const north = C["Northside Roasters"];
  fail((await db.from("reorders").insert([
    { cafe_id: north, product_id: P["PHA-12"], cases: 2, subtotal_cents: 44000, tax_cents: 5720, amount_cents: 49720, status: "delivered", approved_via: "sms", responded_at: daysAgo(24), created_at: daysAgo(25) },
    { cafe_id: C["Common Grounds"], product_id: P["PHA-8"], cases: 1, subtotal_cents: 20000, tax_cents: 2600, amount_cents: 22600, status: "failed", approved_via: "auto", failure_reason: "card_declined: insufficient_funds", responded_at: daysAgo(1), created_at: daysAgo(1) },
  ])).error, "reorder history");
  fail((await db.from("sms_messages").insert([
    { cafe_id: north, direction: "outbound", from_phone: "+18005550000", to_phone: "+14165550101", body: "Cup Casa: you're ~6 days from running out of 12oz cups. Reply YES to send 2 cases ($497.20) or NO to skip.", twilio_sid: "SMseed001", status: "delivered", needs_review: false, created_at: daysAgo(25, 8) },
    { cafe_id: north, direction: "inbound", from_phone: "+14165550101", to_phone: "+18005550000", body: "YES", twilio_sid: "SMseed002", status: "received", needs_review: false, created_at: daysAgo(25, 9) },
    { cafe_id: north, direction: "outbound", from_phone: "+18005550000", to_phone: "+14165550101", body: "Thanks! 2 cases of 12oz are on the way. We'll text you the tracking number.", twilio_sid: "SMseed003", status: "delivered", needs_review: false, created_at: daysAgo(25, 9) },
    { cafe_id: north, direction: "outbound", from_phone: "+18005550000", to_phone: "+14165550101", body: "Cup Casa: roughly how many sleeves of 12oz do you have left? Reply with a number.", twilio_sid: "SMseed004", status: "delivered", needs_review: false, created_at: daysAgo(2, 9) },
    { cafe_id: north, direction: "inbound", from_phone: "+14165550101", to_phone: "+18005550000", body: "maybe like 20 or so? also can we get a sample of the 16oz", twilio_sid: "SMseed005", status: "received", needs_review: true, created_at: daysAgo(2, 10) },
  ])).error, "sms");
  fail((await db.from("cafe_notes").insert({ cafe_id: north, author_id: staff, body: "Owner prefers deliveries before 10am. Back door on Ferrier Ave." })).error, "note");
  fail((await db.from("cron_runs").insert({ job: "nightly", started_at: daysAgo(0, 3), finished_at: daysAgo(0, 3), summary: { reorders_created: created?.length ?? 0, sms_sent: created?.length ?? 0 } })).error, "cron run");

  const { data: stock } = await db.from("cafe_stock").select("est_on_hand, daily_burn, reorder_point, cafe:cafes(name), product:products(sku)").gt("daily_burn", 0);
  console.table((stock ?? []).map((s) => ({ cafe: s.cafe?.name, sku: s.product?.sku, on_hand: s.est_on_hand, burn: s.daily_burn, reorder_pt: s.reorder_point, days: Math.floor(s.est_on_hand / s.daily_burn) })));
  console.log(`\nDone. Sign in at /login with password "${PASSWORD}":`);
  console.log("  admin@cupcasa.test (admin)  staff@cupcasa.test (staff)");
  console.log("  alice@northside.test (owner of Northside + Bloom)  carol@northside.test (manager)  bob@commongrounds.test (owner)");
  void admin;
}

main().catch((e) => { console.error(e); process.exit(1); });
