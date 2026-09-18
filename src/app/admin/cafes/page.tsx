import Link from "next/link";
import { requireStaff } from "@/lib/auth/admin-context";
import { PageHeader, Badge, ButtonLink, Table, th, td, Flash } from "@/components/app/ui";
import { daysOfCover, coverLevel, sizeLabel } from "@/lib/format";

export const metadata = { title: "Cafés" };

export default async function CafesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const { data: cafes } = await supabase.from("cafes").select("*, stock:cafe_stock(est_on_hand, daily_burn, reorder_point, product:products(size_oz, printed, active))").order("name");

  const q = (sp.q ?? "").toLowerCase();
  const list = (cafes ?? []).filter((c) => !q || c.name.toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q));

  return (
    <>
      <PageHeader title="Cafés" action={<ButtonLink href="/admin/cafes/new" size="sm">+ New café</ButtonLink>} />
      <Flash ok={sp.ok} error={sp.error} />
      <form className="mb-3"><input name="q" defaultValue={sp.q ?? ""} placeholder="Search name or city" className="w-full max-w-sm rounded-full border bg-white px-4 py-2 text-sm" /></form>
      <Table>
        <thead><tr><th className={th}>Café</th><th className={th}>Terms</th><th className={th}>SMS</th><th className={th}>Auto-ship</th><th className={th}>Stock</th></tr></thead>
        <tbody>
          {list.map((c) => {
            const tracked = c.stock.filter((s) => s.product?.active && s.daily_burn > 0);
            return (
              <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                <td className={td}><Link href={`/admin/cafes/${c.id}`} className="font-semibold hover:underline">{c.name}</Link><div className="text-xs text-cocoa">{[c.city, c.province].filter(Boolean).join(", ")}{!c.active && " · inactive"}</div></td>
                <td className={td}><Badge value={c.payment_terms} /></td>
                <td className={td}>{c.sms_opt_in ? <Badge value="green" label="opted in" /> : <Badge value="client" label="no" />}</td>
                <td className={td}>{c.auto_ship ? "yes" : "no"}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    {tracked.length === 0 && <span className="text-xs text-cocoa">not tracked</span>}
                    {tracked.map((s, i) => {
                      const lvl = coverLevel(s.est_on_hand, s.daily_burn, s.reorder_point);
                      return <Badge key={i} value={lvl} label={`${sizeLabel(s.product!)} ${Math.floor(daysOfCover(s.est_on_hand, s.daily_burn))}d`} />;
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
