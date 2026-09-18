import Link from "next/link";
import { requireStaff } from "@/lib/auth/admin-context";
import { PageHeader, Badge, Flash, Card, Input, Select, EmptyState } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { cad, dateTime, sizeLabel } from "@/lib/format";
import { markShipped, markDelivered } from "../actions";

export const metadata = { title: "Fulfillment" };

export default async function FulfillmentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const { data } = await supabase
    .from("orders").select("*, cafe:cafes(id, name, phone, sms_opt_in), items:order_items(cases, units, product:products(size_oz, printed))")
    .in("status", ["paid", "invoiced", "shipped"]).order("created_at");
  const toShip = (data ?? []).filter((o) => o.status !== "shipped");
  const inTransit = (data ?? []).filter((o) => o.status === "shipped");
  const addr = (o: NonNullable<typeof data>[number]) => {
    const a = (o.ship_to ?? {}) as Record<string, string | null>;
    return [a.address_line1, a.address_line2, a.city, a.province, a.postal_code].filter(Boolean).join(", ");
  };

  return (
    <>
      <PageHeader title="Fulfillment">Marking shipped texts the café their tracking number. Marking delivered adds the cups to their stock.</PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <h2 className="mb-2 text-base font-bold">To ship ({toShip.length})</h2>
      {toShip.length === 0 ? <EmptyState>Nothing to pack.</EmptyState> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {toShip.map((o) => (
            <Card key={o.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg font-extrabold">{o.order_number} · <Link href={`/admin/cafes/${o.cafe?.id}`} className="hover:underline">{o.cafe?.name}</Link></div>
                  <div className="text-sm">{o.items.map((i) => `${i.cases}× ${sizeLabel(i.product!)}`).join(", ")} · {cad(o.total_cents)}</div>
                  <div className="text-xs text-cocoa">{addr(o) || "No address on file!"} · {dateTime(o.created_at)}</div>
                </div>
                <Badge value={o.status} />
              </div>
              <form action={markShipped} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="order_id" value={o.id} />
                <Select name="carrier" className="!w-auto" defaultValue="Canada Post"><option>Canada Post</option><option>Purolator</option><option>UPS</option><option>FedEx</option><option>Courier</option><option>Pickup</option></Select>
                <Input name="tracking_number" placeholder="Tracking #" className="!w-48" required />
                <SubmitButton variant="dark">Mark shipped</SubmitButton>
              </form>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-8 text-base font-bold">In transit ({inTransit.length})</h2>
      {inTransit.length === 0 ? <EmptyState>Nothing in transit.</EmptyState> : (
        <ul className="divide-y rounded-2xl border bg-white/70">
          {inTransit.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span><b>{o.order_number}</b> · {o.cafe?.name} · {o.carrier} {o.tracking_number} · shipped {dateTime(o.shipped_at)}</span>
              <form action={markDelivered}><input type="hidden" name="order_id" value={o.id} /><SubmitButton size="sm" variant="leaf" confirm="Mark delivered and add stock to the café?">Mark delivered</SubmitButton></form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
