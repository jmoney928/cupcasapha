import Link from "next/link";
import { requireStaff } from "@/lib/auth/admin-context";
import { PageHeader, EmptyState, Card } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { dateTime, relative } from "@/lib/format";
import { markReviewed } from "../actions";

export const metadata = { title: "SMS inbox" };

export default async function SmsInbox() {
  const { supabase } = await requireStaff();
  const [{ data: flagged }, { data: recent }] = await Promise.all([
    supabase.from("sms_messages").select("*, cafe:cafes(id, name)").eq("needs_review", true).order("created_at", { ascending: false }),
    supabase.from("sms_messages").select("cafe_id, body, direction, created_at, from_phone, cafe:cafes(id, name)").order("created_at", { ascending: false }).limit(300),
  ]);
  // one row per conversation (latest message)
  const seen = new Set<string>();
  const threads = (recent ?? []).filter((m) => { const k = m.cafe_id ?? m.from_phone; if (seen.has(k)) return false; seen.add(k); return true; });

  return (
    <>
      <PageHeader title="SMS inbox">Replies we couldn’t interpret are flagged here. Manual replies are sent from a café’s thread.</PageHeader>
      <Card title={`Needs review (${flagged?.length ?? 0})`} className="mb-4">
        {!flagged?.length ? <EmptyState>All clear.</EmptyState> : (
          <ul className="divide-y text-sm">
            {flagged.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><b>{m.cafe ? <Link href={`/admin/sms/${m.cafe.id}`} className="hover:underline">{m.cafe.name}</Link> : m.from_phone}</b>: “{m.body}” <span className="text-xs text-cocoa">{relative(m.created_at)}</span></span>
                <form action={markReviewed}><input type="hidden" name="message_id" value={m.id} /><SubmitButton size="sm" variant="ghost">Mark reviewed</SubmitButton></form>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Conversations">
        {threads.length === 0 ? <EmptyState>No messages yet.</EmptyState> : (
          <ul className="divide-y text-sm">
            {threads.map((m, i) => (
              <li key={i}>
                <Link href={m.cafe ? `/admin/sms/${m.cafe.id}` : "#"} className="flex items-center justify-between gap-3 py-2 hover:underline">
                  <span className="min-w-0"><b>{m.cafe?.name ?? `Unknown ${m.from_phone}`}</b><span className="ml-2 truncate text-cocoa">{m.direction === "outbound" ? "You: " : ""}{m.body}</span></span>
                  <span className="shrink-0 text-xs text-cocoa">{dateTime(m.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
