import { getPortalContext } from "@/lib/auth/cafe-context";
import { Card, Badge, Flash, EmptyState, PageHeader } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { cad, fullDate, sizeLabel } from "@/lib/format";
import { respondReorder } from "../actions";

export const metadata = { title: "Reorders" };
const PENDING = ["suggested", "sms_sent", "failed"] as const;

export default async function ReordersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { cafe, supabase } = await getPortalContext();
  const { data } = await supabase
    .from("reorders").select("*, product:products(*)").eq("cafe_id", cafe.id).order("created_at", { ascending: false }).limit(50);
  const all = data ?? [];
  const pending = all.filter((r) => (PENDING as readonly string[]).includes(r.status));
  const history = all.filter((r) => !(PENDING as readonly string[]).includes(r.status));

  return (
    <>
      <PageHeader title="Reorders" eyebrow={cafe.name}>Suggested top-ups based on how fast you’re going through cups.</PageHeader>
      <Flash ok={sp.ok} error={sp.error} />

      <h2 className="mb-2 text-base font-bold">Waiting for you</h2>
      {pending.length === 0 ? <EmptyState>Nothing to approve right now. We’ll text you when a size is running low.</EmptyState> : (
        <div className="grid gap-3 md:grid-cols-2">
          {pending.map((r) => (
            <Card key={r.id} className="border-2 border-coral/60">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg font-extrabold">{r.cases} case{r.cases > 1 ? "s" : ""} of {sizeLabel(r.product!)}</div>
                  <div className="text-xs text-cocoa">{r.product!.units_per_case * r.cases} cups · {cad(r.subtotal_cents)} + tax = <b>{cad(r.amount_cents)}</b></div>
                  {r.days_of_cover_at_creation != null && <div className="mt-1 text-xs text-cocoa">You had about {Math.floor(Number(r.days_of_cover_at_creation))} days left when we suggested this.</div>}
                  {r.status === "failed" && <div className="mt-1 text-xs font-semibold text-coral-deep">Payment didn’t go through{r.failure_reason ? `: ${r.failure_reason}` : ""}. Approve again to retry, or update your card in Settings.</div>}
                </div>
                <Badge value={r.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <form action={respondReorder}><input type="hidden" name="reorder_id" value={r.id} /><input type="hidden" name="decision" value="decline" /><SubmitButton variant="outline" className="w-full">Skip</SubmitButton></form>
                <form action={respondReorder}><input type="hidden" name="reorder_id" value={r.id} /><input type="hidden" name="decision" value="approve" /><SubmitButton className="w-full">Approve {cad(r.amount_cents)}</SubmitButton></form>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-8 text-base font-bold">History</h2>
      {history.length === 0 ? <EmptyState>No past reorders yet.</EmptyState> : (
        <ul className="divide-y rounded-2xl border bg-white/70">
          {history.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <div className="font-semibold">{r.cases} × {sizeLabel(r.product!)} · {cad(r.amount_cents)}</div>
                <div className="text-xs text-cocoa">{fullDate(r.created_at)}{r.approved_via ? ` · via ${r.approved_via}` : ""}</div>
              </div>
              <Badge value={r.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
