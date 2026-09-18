import { getPortalContext } from "@/lib/auth/cafe-context";
import { Card, Field, Input, Select, Flash, PageHeader, Badge } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { inviteMember, removeMember } from "../../actions";

export const metadata = { title: "Team" };

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { cafe, supabase, isOwner, user } = await getPortalContext();
  const { data: members } = await supabase.from("cafe_members").select("user_id, member_role, profile:profiles(full_name, email)").eq("cafe_id", cafe.id);

  return (
    <>
      <PageHeader title="Team" eyebrow={cafe.name}>People who can see stock, approve reorders and change settings for this location.</PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Members">
          <ul className="divide-y text-sm">
            {(members ?? []).map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{m.profile?.full_name || m.profile?.email || "Invited"}{m.user_id === user.id ? " (you)" : ""}</div>
                  <div className="truncate text-xs text-cocoa">{m.profile?.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={m.member_role} />
                  {isOwner && m.user_id !== user.id && (
                    <form action={removeMember}>
                      <input type="hidden" name="cafe_id" value={cafe.id} />
                      <input type="hidden" name="user_id" value={m.user_id} />
                      <SubmitButton variant="ghost" size="sm" confirm="Remove this person from the café?">Remove</SubmitButton>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        {isOwner ? (
          <Card title="Invite someone">
            <form action={inviteMember} className="space-y-3">
              <input type="hidden" name="cafe_id" value={cafe.id} />
              <Field label="Name"><Input name="full_name" autoComplete="off" /></Field>
              <Field label="Email"><Input name="email" type="email" required /></Field>
              <Field label="Role" hint="Managers can do everything except manage the team.">
                <Select name="member_role" defaultValue="manager"><option value="manager">Manager</option><option value="owner">Owner</option></Select>
              </Field>
              <SubmitButton>Send invite</SubmitButton>
            </form>
          </Card>
        ) : (
          <Card title="Invite someone"><p className="text-sm text-cocoa">Only owners can invite team members.</p></Card>
        )}
      </div>
    </>
  );
}
