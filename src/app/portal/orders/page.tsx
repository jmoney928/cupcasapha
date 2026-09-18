import Link from "next/link";
import { getPortalContext } from "@/lib/auth/cafe-context";
import { Badge, EmptyState, PageHeader } from "@/components/app/ui";
import { cad, fullDate } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const { cafe, supabase } = await getPortalContext();
  const { data: orders } = await supabase
    .from("orders").select("*, items:order_items(cases, product:products(size_oz, printed))")
    .eq("cafe_id", cafe.id).order("created_at", { ascending: false }).limit(100);

  return (
    <>
      <PageHeader title="Orders" eyebrow={cafe.name} />
      {!orders?.length ? <EmptyState>No orders yet.</EmptyState> : (
        <ul className="divide-y rounded-2xl border bg-white/70">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/portal/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-cream/60">
                <div className="min-w-0">
                  <div className="font-semibold">{o.order_number} · {cad(o.total_cents)}</div>
                  <div className="truncate text-xs text-cocoa">
                    {fullDate(o.created_at)} · {o.items.map((i) => `${i.cases}× ${i.product?.size_oz}oz${i.product?.printed ? " printed" : ""}`).join(", ")}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {o.tracking_number && o.status === "shipped" && <span className="hidden text-xs text-cocoa sm:inline">Tracking {o.tracking_number}</span>}
                  <Badge value={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
