import Link from "next/link";
import { getPortalContext } from "@/lib/auth/cafe-context";
import { Card, Badge, Flash, Input, Select, EmptyState, btnCls } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { cad, num, daysOfCover, coverLevel, nextReorderLabel, sizeLabel, relative } from "@/lib/format";
import { recordCount, requestReorder } from "./actions";

export const metadata = { title: "Stock" };

export default async function PortalDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { cafe, supabase } = await getPortalContext();

  const [{ data: stock }, { data: pending }] = await Promise.all([
    supabase.from("cafe_stock").select("*, product:products(*)").eq("cafe_id", cafe.id),
    supabase.from("reorders").select("id").eq("cafe_id", cafe.id).in("status", ["suggested", "sms_sent", "failed"]),
  ]);
  const rows = (stock ?? [])
    .filter((s) => s.product && s.product.active)
    .sort((a, b) => a.product!.sort_order - b.product!.sort_order || a.product!.size_oz - b.product!.size_oz);
  const tracked = rows.filter((s) => s.daily_burn > 0 || s.est_on_hand > 0);

  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      {pending && pending.length > 0 && (
        <Link href="/portal/reorders" className="mb-4 block rounded-2xl bg-coral px-4 py-3 text-sm font-bold text-white shadow-sm">
          {pending.length} reorder{pending.length > 1 ? "s" : ""} waiting for your approval →
        </Link>
      )}

      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="label-caps text-caramel">{cafe.name}</div>
          <h1 className="text-2xl">Your cups</h1>
        </div>
        <Link href="/portal/sustainability" className="text-xs font-bold text-leaf underline-offset-2 hover:underline">Impact →</Link>
      </div>

      {tracked.length === 0 && (
        <EmptyState>We haven’t started tracking stock for this café yet. Tap “Update count” on a size below to get going.</EmptyState>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((s) => {
          const p = s.product!;
          const days = daysOfCover(s.est_on_hand, s.daily_burn);
          const level = coverLevel(s.est_on_hand, s.daily_burn, s.reorder_point);
          const sleeves = Math.round(s.est_on_hand / p.units_per_sleeve);
          const suggestedCases = s.daily_burn > 0 ? Math.max(1, Math.ceil((s.daily_burn * 21 - s.est_on_hand) / p.units_per_case)) : 1;
          const tone = { green: "border-leaf/40", amber: "border-butter", red: "border-coral/70" }[level];
          return (
            <Card key={s.id} className={`border-2 ${tone}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-xl font-extrabold">{sizeLabel(p)}</div>
                  <div className="text-xs text-cocoa">{p.name}</div>
                </div>
                <Badge value={level} label={level === "red" ? "Running low" : level === "amber" ? "Order soon" : "Stocked"} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-cream p-2">
                  <div className="font-display text-2xl font-extrabold">{s.daily_burn > 0 ? (Number.isFinite(days) ? Math.floor(days) : "∞") : "—"}</div>
                  <div className="label-caps text-caramel">days left</div>
                </div>
                <div className="rounded-xl bg-cream p-2">
                  <div className="font-display text-2xl font-extrabold">{num(sleeves)}</div>
                  <div className="label-caps text-caramel">sleeves</div>
                </div>
                <div className="rounded-xl bg-cream p-2">
                  <div className="font-display text-2xl font-extrabold">{num(s.est_on_hand)}</div>
                  <div className="label-caps text-caramel">cups (est.)</div>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 text-xs text-cocoa">
                <dt>Using about</dt><dd className="text-right font-semibold text-espresso">{s.daily_burn > 0 ? `${Math.round(s.daily_burn)} cups/day` : "not enough data"}</dd>
                <dt>Next reorder</dt><dd className="text-right font-semibold text-espresso">{nextReorderLabel(s.est_on_hand, s.daily_burn, s.reorder_point)}</dd>
                <dt>Last count</dt><dd className="text-right font-semibold text-espresso">{relative(s.last_count_at)}</dd>
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <details className="group">
                  <summary className={`${btnCls("outline", "sm")} w-full cursor-pointer list-none`}>Update count</summary>
                  <form action={recordCount} className="mt-2 flex gap-2">
                    <input type="hidden" name="cafe_id" value={cafe.id} />
                    <input type="hidden" name="product_id" value={p.id} />
                    <Input name="sleeves" type="number" inputMode="numeric" min={0} placeholder="sleeves" aria-label="Sleeves on hand" required />
                    <SubmitButton size="sm" variant="dark">Save</SubmitButton>
                  </form>
                  <p className="mt-1 text-[11px] text-cocoa">1 sleeve = {p.units_per_sleeve} cups</p>
                </details>
                <details className="group">
                  <summary className={`${btnCls("primary", "sm")} w-full cursor-pointer list-none`}>Reorder now</summary>
                  <form action={requestReorder} className="mt-2 flex gap-2">
                    <input type="hidden" name="cafe_id" value={cafe.id} />
                    <input type="hidden" name="product_id" value={p.id} />
                    <Select name="cases" defaultValue={String(suggestedCases)} aria-label="Cases">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} case{n > 1 ? "s" : ""} · {cad(n * p.price_per_case_cents)}</option>
                      ))}
                    </Select>
                    <SubmitButton size="sm">Order</SubmitButton>
                  </form>
                  <p className="mt-1 text-[11px] text-cocoa">{num(p.units_per_case)} cups per case, plus tax</p>
                </details>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
