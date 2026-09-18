import { notFound } from "next/navigation";
import { getPortalContext } from "@/lib/auth/cafe-context";
import { Badge, Card, PageHeader, ButtonLink } from "@/components/app/ui";
import { cad, num, fullDate, dateTime } from "@/lib/format";

export const metadata = { title: "Order" };

const steps = ["paid", "shipped", "delivered"] as const;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cafe, supabase } = await getPortalContext();
  const { data: o } = await supabase
    .from("orders").select("*, items:order_items(*, product:products(*))").eq("id", id).eq("cafe_id", cafe.id).maybeSingle();
  if (!o) notFound();
  const stepIdx = o.status === "invoiced" ? 0 : steps.indexOf(o.status as (typeof steps)[number]);

  return (
    <>
      <PageHeader title={o.order_number} eyebrow="Order" action={<Badge value={o.status} />}>Placed {fullDate(o.created_at)}</PageHeader>

      {o.status !== "cancelled" && o.status !== "pending_payment" && (
        <ol className="mb-5 grid grid-cols-3 gap-1 text-center text-xs font-bold">
          {steps.map((s, i) => (
            <li key={s} className={`rounded-full py-1.5 ${i <= stepIdx ? "bg-leaf text-cream" : "bg-caramel/20 text-cocoa"}`}>{s}</li>
          ))}
        </ol>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Items">
          <ul className="divide-y text-sm">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between py-2">
                <span>{i.cases} × {i.product?.name} <span className="text-cocoa">({num(i.units)} cups)</span></span>
                <span className="font-semibold">{cad(i.line_total_cents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{cad(o.subtotal_cents)}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{cad(o.tax_cents)}</dd></div>
            {o.shipping_cents > 0 && <div className="flex justify-between"><dt>Shipping</dt><dd>{cad(o.shipping_cents)}</dd></div>}
            <div className="flex justify-between font-bold"><dt>Total</dt><dd>{cad(o.total_cents)}</dd></div>
          </dl>
        </Card>
        <Card title="Delivery">
          <dl className="space-y-2 text-sm">
            <div><dt className="label-caps text-caramel">Carrier / tracking</dt><dd>{o.tracking_number ? `${o.carrier ?? ""} ${o.tracking_number}`.trim() : "Not shipped yet"}</dd></div>
            <div><dt className="label-caps text-caramel">Shipped</dt><dd>{dateTime(o.shipped_at)}</dd></div>
            <div><dt className="label-caps text-caramel">Delivered</dt><dd>{dateTime(o.delivered_at)}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {o.invoice_url && <ButtonLink href={o.invoice_url} variant="dark" size="sm">Download invoice</ButtonLink>}
            {o.receipt_url && <ButtonLink href={o.receipt_url} variant="outline" size="sm">Receipt</ButtonLink>}
            {!o.invoice_url && !o.receipt_url && <span className="text-xs text-cocoa">Invoice will appear here once payment is processed.</span>}
          </div>
        </Card>
      </div>
    </>
  );
}
