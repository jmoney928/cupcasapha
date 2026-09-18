import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/admin-context";
import { PageHeader, Card, Badge, Flash, Input, Select, Textarea, Table, th, td, EmptyState } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { CafeFormFields } from "@/components/app/cafe-form";
import { BurnChart } from "@/components/app/burn-chart";
import { cad, num, dateTime, fullDate, daysOfCover, coverLevel, sizeLabel, relative, nextReorderLabel, isoDaysAgo, lastNDays } from "@/lib/format";
import { updateCafe, addNote, adjustStock, staffRespondReorder, fulfillReorder } from "../../actions";

export const metadata = { title: "Café" };

export default async function CafeDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, profile } = await requireStaff();
  const since = isoDaysAgo(30);

  const [{ data: cafe }, { data: stock }, { data: usage }, { data: reorders }, { data: orders }, { data: sms }, { data: notes }, { data: members }] = await Promise.all([
    supabase.from("cafes").select("*").eq("id", id).maybeSingle(),
    supabase.from("cafe_stock").select("*, product:products(*)").eq("cafe_id", id),
    supabase.from("usage_events").select("*, product:products(size_oz, printed)").eq("cafe_id", id).gte("occurred_at", since).order("occurred_at", { ascending: false }),
    supabase.from("reorders").select("*, product:products(size_oz, printed)").eq("cafe_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("orders").select("*, items:order_items(cases, product:products(size_oz, printed))").eq("cafe_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("sms_messages").select("*").eq("cafe_id", id).order("created_at", { ascending: false }).limit(15),
    supabase.from("cafe_notes").select("*, author:profiles(full_name)").eq("cafe_id", id).order("created_at", { ascending: false }),
    supabase.from("cafe_members").select("member_role, profile:profiles(full_name, email)").eq("cafe_id", id),
  ]);
  if (!cafe) notFound();

  const rows = (stock ?? []).filter((s) => s.product?.active).sort((a, b) => a.product!.size_oz - b.product!.size_oz);

  // burn chart: last 30 days, one series per product, consumed cups (non-delivery events)
  const days = lastNDays(30);
  const series = rows.map((s) => ({
    label: sizeLabel(s.product!),
    values: days.map((d) => (usage ?? []).filter((u) => u.product_id === s.product_id && u.source !== "delivery" && u.occurred_at.slice(0, 10) === d).reduce((a, u) => a + Math.max(0, u.qty), 0)),
  }));

  return (
    <>
      <PageHeader title={cafe.name} eyebrow="Café" action={<><Badge value={cafe.payment_terms} />{!cafe.active && <Badge value="failed" label="inactive" />}</>}>
        {[cafe.address_line1, cafe.city, cafe.province].filter(Boolean).join(", ")} · {cafe.phone ?? "no phone"} · SMS {cafe.sms_opt_in ? `opted in ${fullDate(cafe.sms_opt_in_at)}` : "not opted in"} · auto-ship {cafe.auto_ship ? "on" : "off"}
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />

      <Card title="Stock" className="mb-4">
        <Table>
          <thead><tr><th className={th}>Size</th><th className={th}>Est. on hand</th><th className={th}>Burn/day</th><th className={th}>Reorder pt</th><th className={th}>Cover</th><th className={th}>Next reorder</th><th className={th}>Last count</th><th className={th}>Adjust</th></tr></thead>
          <tbody>
            {rows.map((s) => {
              const lvl = coverLevel(s.est_on_hand, s.daily_burn, s.reorder_point);
              return (
                <tr key={s.id}>
                  <td className={td}><b>{sizeLabel(s.product!)}</b></td>
                  <td className={td}>{num(s.est_on_hand)}</td>
                  <td className={td}>{s.daily_burn} <span className="text-xs text-cocoa">({s.burn_source})</span></td>
                  <td className={td}>{num(s.reorder_point)}</td>
                  <td className={td}>{s.daily_burn > 0 ? <Badge value={lvl} label={`${Math.floor(daysOfCover(s.est_on_hand, s.daily_burn))} days`} /> : <span className="text-xs text-cocoa">no burn</span>}</td>
                  <td className={td}>{nextReorderLabel(s.est_on_hand, s.daily_burn, s.reorder_point)}</td>
                  <td className={td}>{num(s.last_count_units)} · {relative(s.last_count_at)}</td>
                  <td className={td}>
                    <form action={adjustStock} className="flex flex-wrap items-center gap-1">
                      <input type="hidden" name="cafe_id" value={id} /><input type="hidden" name="product_id" value={s.product_id} />
                      <Select name="mode" className="!w-auto !py-1 text-xs" defaultValue="count"><option value="count">set count (cups)</option><option value="adjust">consume (+/- cups)</option><option value="baseline">baseline burn/day</option></Select>
                      <Input name="value" type="number" className="!w-24 !py-1 text-xs" required />
                      <SubmitButton size="sm" variant="dark">Apply</SubmitButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Usage, last 30 days">
          {usage?.length ? <BurnChart days={days} series={series} /> : <EmptyState>No usage events yet.</EmptyState>}
          <ul className="mt-3 max-h-64 divide-y overflow-y-auto text-xs">
            {(usage ?? []).slice(0, 60).map((u) => (
              <li key={u.id} className="flex justify-between py-1.5">
                <span>{dateTime(u.occurred_at)} · {sizeLabel(u.product!)} · <Badge value={u.source === "delivery" ? "green" : "client"} label={u.source} /></span>
                <span className={u.source === "delivery" ? "text-leaf" : ""}>{u.source === "delivery" ? "+" : "−"}{num(Math.abs(u.qty))}{u.note ? ` · ${u.note}` : ""}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Reorders">
          {!reorders?.length ? <EmptyState>None yet.</EmptyState> : (
            <ul className="divide-y text-sm">
              {reorders.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{fullDate(r.created_at)} · {r.cases}× {sizeLabel(r.product!)} · {cad(r.amount_cents)} {r.approved_via && <span className="text-xs text-cocoa">via {r.approved_via}</span>}</span>
                  <span className="flex items-center gap-1">
                    <Badge value={r.status} />
                    {["suggested", "sms_sent", "failed"].includes(r.status) && (
                      <form action={staffRespondReorder}><input type="hidden" name="reorder_id" value={r.id} /><input type="hidden" name="decision" value="approve" /><input type="hidden" name="back" value={`/admin/cafes/${id}`} /><SubmitButton size="sm" variant="leaf" confirm="Approve on the café's behalf? This is logged.">Approve</SubmitButton></form>
                    )}
                    {r.status === "approved" && (
                      <form action={fulfillReorder}><input type="hidden" name="reorder_id" value={r.id} /><input type="hidden" name="back" value={`/admin/cafes/${id}`} /><SubmitButton size="sm" variant="dark">Create order</SubmitButton></form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Orders">
          {!orders?.length ? <EmptyState>No orders.</EmptyState> : (
            <ul className="divide-y text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <span><b>{o.order_number}</b> · {fullDate(o.created_at)} · {o.items.map((i) => `${i.cases}× ${sizeLabel(i.product!)}`).join(", ")} · {cad(o.total_cents)}</span>
                  <Badge value={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="SMS thread" action={<Link href={`/admin/sms/${id}`} className="text-xs font-bold underline">Open</Link>}>
          {!sms?.length ? <EmptyState>No messages.</EmptyState> : (
            <ul className="space-y-2 text-sm">
              {sms.slice(0, 6).map((m) => (
                <li key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.direction === "outbound" ? "ml-auto bg-espresso text-cream" : "bg-white"}`}>
                  <div>{m.body}</div><div className="mt-0.5 text-[10px] opacity-70">{dateTime(m.created_at)}{m.needs_review && " · needs review"}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Notes">
          <form action={addNote} className="mb-3 flex gap-2">
            <input type="hidden" name="cafe_id" value={id} />
            <Textarea name="body" rows={2} placeholder="Internal note…" required />
            <SubmitButton size="sm" variant="dark">Add</SubmitButton>
          </form>
          <ul className="divide-y text-sm">
            {(notes ?? []).map((n) => <li key={n.id} className="py-2"><div>{n.body}</div><div className="text-xs text-cocoa">{n.author?.full_name ?? "staff"} · {dateTime(n.created_at)}</div></li>)}
          </ul>
        </Card>

        <Card title="Logins">
          {!members?.length ? <EmptyState>No client logins linked. {profile.role === "admin" && <Link href="/admin/users" className="underline">Link one</Link>}</EmptyState> : (
            <ul className="divide-y text-sm">
              {members.map((m, i) => <li key={i} className="flex justify-between py-2"><span>{m.profile?.full_name || m.profile?.email}<span className="block text-xs text-cocoa">{m.profile?.email}</span></span><Badge value={m.member_role} /></li>)}
            </ul>
          )}
        </Card>
      </div>

      <details className="mt-6">
        <summary className="cursor-pointer font-display text-lg font-extrabold">Edit café details</summary>
        <form action={updateCafe} className="mt-3 space-y-4">
          <input type="hidden" name="cafe_id" value={id} />
          <CafeFormFields cafe={cafe} />
          <SubmitButton>Save changes</SubmitButton>
        </form>
      </details>
    </>
  );
}
