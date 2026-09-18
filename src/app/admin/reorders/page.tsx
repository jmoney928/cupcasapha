import Link from "next/link";
import { requireStaff } from "@/lib/auth/admin-context";
import { PageHeader, Badge, Flash, Table, th, td, EmptyState } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { cad, dateTime, sizeLabel } from "@/lib/format";
import { staffRespondReorder, fulfillReorder } from "../actions";
import type { Database } from "@/lib/supabase/database.types";

type ReorderStatus = Database["public"]["Enums"]["reorder_status"];

export const metadata = { title: "Reorders" };
const FILTERS: Record<string, ReorderStatus[]> = {
  pending: ["suggested", "sms_sent"],
  approved: ["approved"],
  failed: ["failed"],
  processing: ["charged", "invoiced", "shipped"],
  done: ["delivered", "declined"],
  all: [],
};

export default async function ReordersQueue({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const filter = sp.status && FILTERS[sp.status] ? sp.status : "pending";
  let q = supabase.from("reorders").select("*, cafe:cafes(id, name, payment_terms, sms_opt_in), product:products(size_oz, printed)").order("created_at", { ascending: false }).limit(200);
  if (FILTERS[filter].length) q = q.in("status", FILTERS[filter]);
  const { data } = await q;

  return (
    <>
      <PageHeader title="Reorder queue" />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="mb-3 flex flex-wrap gap-1">
        {Object.keys(FILTERS).map((k) => (
          <Link key={k} href={`/admin/reorders?status=${k}`} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === k ? "bg-espresso text-cream" : "bg-white"}`}>{k}</Link>
        ))}
      </div>
      {!data?.length ? <EmptyState>Nothing here.</EmptyState> : (
        <Table>
          <thead><tr><th className={th}>Created</th><th className={th}>Café</th><th className={th}>Item</th><th className={th}>Amount</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id}>
                <td className={td}>{dateTime(r.created_at)}</td>
                <td className={td}><Link href={`/admin/cafes/${r.cafe?.id}`} className="font-semibold hover:underline">{r.cafe?.name}</Link><div className="text-xs text-cocoa">{r.cafe?.payment_terms}{r.cafe?.sms_opt_in ? "" : " · no SMS"}</div></td>
                <td className={td}>{r.cases}× {sizeLabel(r.product!)}{r.days_of_cover_at_creation != null && <div className="text-xs text-cocoa">{Math.floor(Number(r.days_of_cover_at_creation))} days cover when suggested</div>}</td>
                <td className={td}>{cad(r.amount_cents)}</td>
                <td className={td}><Badge value={r.status} />{r.failure_reason && <div className="text-xs text-coral-deep">{r.failure_reason}</div>}{r.approved_via && <div className="text-xs text-cocoa">via {r.approved_via}</div>}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    {["suggested", "sms_sent", "failed"].includes(r.status) && (
                      <>
                        <form action={staffRespondReorder}><input type="hidden" name="reorder_id" value={r.id} /><input type="hidden" name="decision" value="approve" /><input type="hidden" name="back" value={`/admin/reorders?status=${filter}`} /><SubmitButton size="sm" variant="leaf" confirm="Approve on the café's behalf? This is logged.">{r.status === "failed" ? "Retry" : "Approve"}</SubmitButton></form>
                        <form action={staffRespondReorder}><input type="hidden" name="reorder_id" value={r.id} /><input type="hidden" name="decision" value="decline" /><input type="hidden" name="back" value={`/admin/reorders?status=${filter}`} /><SubmitButton size="sm" variant="ghost">Decline</SubmitButton></form>
                      </>
                    )}
                    {r.status === "approved" && (
                      <form action={fulfillReorder}><input type="hidden" name="reorder_id" value={r.id} /><input type="hidden" name="back" value={`/admin/reorders?status=${filter}`} /><SubmitButton size="sm" variant="dark">{r.cafe?.payment_terms === "net30" ? "Invoice & create order" : "Charge & create order"}</SubmitButton></form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
