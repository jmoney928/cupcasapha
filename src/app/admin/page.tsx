import Link from "next/link";
import { requireStaff } from "@/lib/auth/admin-context";
import { StatTile, Card, Badge, EmptyState, PageHeader, Flash } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { runNightlyNow, runWeeklyCountNow } from "./actions";
import { cad, num, daysOfCover, sizeLabel, relative, startOfMonthIso } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function AdminOverview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();

  const [atRisk, awaiting, failed, toShip, revenue, lastRun] = await Promise.all([
    supabase.from("cafe_stock").select("*, cafe:cafes(id, name, active), product:products(size_oz, printed)").gt("daily_burn", 0).order("est_on_hand"),
    supabase.from("reorders").select("*, cafe:cafes(name), product:products(size_oz, printed)").in("status", ["suggested", "sms_sent"]).order("created_at"),
    supabase.from("reorders").select("*, cafe:cafes(name), product:products(size_oz, printed)").eq("status", "failed").order("updated_at", { ascending: false }),
    supabase.from("orders").select("id, order_number, total_cents, created_at, cafe:cafes(name)").in("status", ["paid", "invoiced"]).order("created_at"),
    supabase.from("orders").select("total_cents").in("status", ["paid", "invoiced", "shipped", "delivered"]).gte("created_at", startOfMonthIso()),
    supabase.from("cron_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const risk = (atRisk.data ?? []).filter((s) => s.cafe?.active && s.est_on_hand <= s.reorder_point);
  const mtd = (revenue.data ?? []).reduce((a, o) => a + o.total_cents, 0);

  return (
    <>
      <PageHeader
        title="Overview"
        action={
          <>
            <form action={runNightlyNow}><SubmitButton size="sm" variant="dark" confirm="Run the nightly reorder engine now? This may text cafés and charge cards.">Run nightly now</SubmitButton></form>
            <form action={runWeeklyCountNow}><SubmitButton size="sm" variant="outline" confirm="Send the weekly stock-count texts now?">Send count texts</SubmitButton></form>
          </>
        }
      >
        {lastRun.data ? `Last engine run (${lastRun.data.job}) ${relative(lastRun.data.started_at)}${lastRun.data.error ? " — with errors" : ""}` : "Engine has not run yet."}
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="At risk of stockout" value={risk.length} tone={risk.length ? "red" : "green"} href="/admin/cafes" />
        <StatTile label="Awaiting approval" value={awaiting.data?.length ?? 0} tone={awaiting.data?.length ? "amber" : "default"} href="/admin/reorders?status=pending" />
        <StatTile label="Failed payments" value={failed.data?.length ?? 0} tone={failed.data?.length ? "red" : "default"} href="/admin/reorders?status=failed" />
        <StatTile label="To ship" value={toShip.data?.length ?? 0} tone={toShip.data?.length ? "amber" : "default"} href="/admin/fulfillment" />
        <StatTile label="Revenue this month" value={cad(mtd)} tone="green" hint={`${revenue.data?.length ?? 0} orders`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Cafés running low" action={<Link href="/admin/cafes" className="text-xs font-bold underline">All cafés</Link>}>
          {risk.length === 0 ? <EmptyState>Everyone is stocked.</EmptyState> : (
            <ul className="divide-y text-sm">
              {risk.slice(0, 8).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <Link href={`/admin/cafes/${s.cafe!.id}`} className="font-semibold hover:underline">{s.cafe!.name} · {sizeLabel(s.product!)}</Link>
                  <span className="text-xs text-cocoa">{num(s.est_on_hand)} cups · ~{Math.floor(daysOfCover(s.est_on_hand, s.daily_burn))} days</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Awaiting café approval" action={<Link href="/admin/reorders" className="text-xs font-bold underline">Queue</Link>}>
          {!awaiting.data?.length ? <EmptyState>Nothing pending.</EmptyState> : (
            <ul className="divide-y text-sm">
              {awaiting.data.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span><b>{r.cafe?.name}</b> · {r.cases}× {sizeLabel(r.product!)} · {cad(r.amount_cents)}</span>
                  <span className="flex items-center gap-2 text-xs text-cocoa">{relative(r.created_at)} <Badge value={r.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Failed payments">
          {!failed.data?.length ? <EmptyState>No failed charges.</EmptyState> : (
            <ul className="divide-y text-sm">
              {failed.data.map((r) => (
                <li key={r.id} className="py-2"><b>{r.cafe?.name}</b> · {cad(r.amount_cents)} <span className="text-xs text-coral-deep">{r.failure_reason}</span></li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Orders to ship" action={<Link href="/admin/fulfillment" className="text-xs font-bold underline">Fulfillment</Link>}>
          {!toShip.data?.length ? <EmptyState>Nothing waiting to ship.</EmptyState> : (
            <ul className="divide-y text-sm">
              {toShip.data.slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2"><span><b>{o.order_number}</b> · {o.cafe?.name}</span><span className="text-xs text-cocoa">{cad(o.total_cents)} · {relative(o.created_at)}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
