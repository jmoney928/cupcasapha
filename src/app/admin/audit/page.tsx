import { requireAdmin } from "@/lib/auth/admin-context";
import { PageHeader, Table, th, td, Badge, EmptyState } from "@/components/app/ui";
import { dateTime } from "@/lib/format";

export const metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const page = Math.max(1, Number(sp.page ?? 1));
  const size = 100;
  let q = supabase.from("audit_log").select("*").order("id", { ascending: false }).range((page - 1) * size, page * size - 1);
  if (sp.entity) q = q.eq("entity", sp.entity);
  const { data: rows } = await q;
  // actor_id has no FK (actors may be deleted), so resolve names separately
  const actorIds = [...new Set((rows ?? []).map((a) => a.actor_id).filter((x): x is string => !!x))];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds) : { data: [] };
  const actorById = new Map((actors ?? []).map((a) => [a.id, a]));
  const data = (rows ?? []).map((a) => ({ ...a, actor: a.actor_id ? actorById.get(a.actor_id) ?? null : null }));
  const entities = ["cafes", "cafe_members", "products", "cafe_stock", "usage_events", "reorders", "orders", "order_items", "sms_prompts", "cafe_notes", "profiles"];

  return (
    <>
      <PageHeader title="Audit log">Every write by staff, admins, clients and the system, with the changed columns.</PageHeader>
      <form className="mb-3 flex gap-2">
        <select name="entity" defaultValue={sp.entity ?? ""} className="rounded-full border bg-white px-3 py-1.5 text-sm"><option value="">All entities</option>{entities.map((e) => <option key={e}>{e}</option>)}</select>
        <button className="btn-pill bg-espresso px-4 text-sm text-cream">Filter</button>
      </form>
      {!data?.length ? <EmptyState>No entries.</EmptyState> : (
        <Table>
          <thead><tr><th className={th}>When</th><th className={th}>Actor</th><th className={th}>Action</th><th className={th}>Entity</th><th className={th}>Changes</th></tr></thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id}>
                <td className={td}>{dateTime(a.created_at)}</td>
                <td className={td}>{a.actor ? <>{a.actor.full_name || a.actor.email} <Badge value={a.actor_role ?? "client"} /></> : <Badge value="client" label="system" />}</td>
                <td className={td}>{a.action}</td>
                <td className={td}>{a.entity}<div className="max-w-[140px] truncate text-[10px] text-cocoa">{a.entity_id}</div></td>
                <td className={td}><pre className="max-h-32 max-w-lg overflow-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(a.diff, null, 1)}</pre></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <div className="mt-3 flex gap-2 text-sm">
        {page > 1 && <a className="underline" href={`?page=${page - 1}${sp.entity ? `&entity=${sp.entity}` : ""}`}>← Newer</a>}
        {data?.length === size && <a className="underline" href={`?page=${page + 1}${sp.entity ? `&entity=${sp.entity}` : ""}`}>Older →</a>}
      </div>
    </>
  );
}
