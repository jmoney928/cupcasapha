import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin-context";
import { PageHeader, Card, Field, Input, Select, Flash, Badge, Table, th, td } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { relative } from "@/lib/format";
import { inviteStaff, setRole, attachClient, removeMembership } from "../actions";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireAdmin();
  const [{ data: profiles }, { data: cafes }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").order("role").order("email"),
    supabase.from("cafes").select("id, name").order("name"),
    supabase.from("cafe_members").select("cafe_id, user_id, member_role, cafe:cafes(name)"),
  ]);
  const byUser = new Map<string, NonNullable<typeof memberships>>();
  (memberships ?? []).forEach((m) => byUser.set(m.user_id, [...(byUser.get(m.user_id) ?? []), m]));

  return (
    <>
      <PageHeader title="Users" />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card title="Invite staff">
          <form action={inviteStaff} className="grid gap-3 sm:grid-cols-3">
            <Field label="Name"><Input name="full_name" /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Role"><Select name="role" defaultValue="staff"><option value="staff">Staff</option><option value="admin">Admin</option></Select></Field>
            <div className="sm:col-span-3"><SubmitButton size="sm" variant="dark">Send invite</SubmitButton></div>
          </form>
        </Card>
        <Card title="Invite a café user">
          <form action={attachClient} className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input name="full_name" /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Café"><Select name="cafe_id" required><option value="">Choose…</option>{(cafes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Role"><Select name="member_role" defaultValue="owner"><option value="owner">Owner</option><option value="manager">Manager</option></Select></Field>
            <div className="sm:col-span-2"><SubmitButton size="sm" variant="dark">Invite & link</SubmitButton></div>
          </form>
        </Card>
      </div>

      <Table>
        <thead><tr><th className={th}>User</th><th className={th}>Role</th><th className={th}>Cafés</th><th className={th}>Joined</th></tr></thead>
        <tbody>
          {(profiles ?? []).map((p) => (
            <tr key={p.id}>
              <td className={td}><b>{p.full_name || "—"}</b><div className="text-xs text-cocoa">{p.email}</div></td>
              <td className={td}>
                {p.id === user.id ? <Badge value={p.role} /> : (
                  <form action={setRole} className="flex items-center gap-1">
                    <input type="hidden" name="user_id" value={p.id} />
                    <Select name="role" defaultValue={p.role} className="!w-auto !py-1 text-xs"><option value="client">client</option><option value="staff">staff</option><option value="admin">admin</option></Select>
                    <SubmitButton size="sm" variant="ghost">Set</SubmitButton>
                  </form>
                )}
              </td>
              <td className={td}>
                <div className="flex flex-wrap gap-1">
                  {(byUser.get(p.id) ?? []).map((m) => (
                    <form key={m.cafe_id} action={removeMembership} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs">
                      <input type="hidden" name="cafe_id" value={m.cafe_id} /><input type="hidden" name="user_id" value={p.id} />
                      <Link href={`/admin/cafes/${m.cafe_id}`} className="font-semibold hover:underline">{m.cafe?.name}</Link> <span className="text-cocoa">{m.member_role}</span>
                      <button className="ml-1 text-coral-deep" title="Remove">×</button>
                    </form>
                  ))}
                </div>
              </td>
              <td className={td}>{relative(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
