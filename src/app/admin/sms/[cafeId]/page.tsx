import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/admin-context";
import { PageHeader, Card, Textarea, Badge } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { dateTime } from "@/lib/format";
import { twilioConfigured } from "@/lib/env";

export const metadata = { title: "SMS thread" };

export default async function SmsThread({ params }: { params: Promise<{ cafeId: string }> }) {
  const { cafeId } = await params;
  const { supabase } = await requireStaff();
  const [{ data: cafe }, { data: msgs }, { data: prompts }] = await Promise.all([
    supabase.from("cafes").select("id, name, phone, sms_opt_in").eq("id", cafeId).maybeSingle(),
    supabase.from("sms_messages").select("*").eq("cafe_id", cafeId).order("created_at"),
    supabase.from("sms_prompts").select("*, product:products(size_oz, printed)").eq("cafe_id", cafeId).eq("status", "open"),
  ]);
  if (!cafe) notFound();

  return (
    <>
      <PageHeader title={cafe.name} eyebrow="SMS thread" action={<Link href={`/admin/cafes/${cafe.id}`} className="text-sm font-bold underline">Café →</Link>}>
        {cafe.phone ?? "no phone"} · {cafe.sms_opt_in ? "opted in" : "NOT opted in"}{prompts?.length ? ` · waiting on: ${prompts.map((p) => p.kind.replace("_", " ")).join(", ")}` : ""}
      </PageHeader>
      <Card>
        <ul className="space-y-2">
          {(msgs ?? []).map((m) => (
            <li key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.direction === "outbound" ? "ml-auto bg-espresso text-cream" : "bg-white"}`}>
              <div>{m.body}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] opacity-70">{dateTime(m.created_at)} {m.status && `· ${m.status}`} {m.needs_review && <Badge value="failed" label="needs review" />}</div>
            </li>
          ))}
          {!msgs?.length && <li className="text-sm text-cocoa">No messages yet.</li>}
        </ul>
        <form action="/admin/sms/reply" method="post" className="mt-4 flex gap-2">
          <input type="hidden" name="cafe_id" value={cafe.id} />
          <Textarea name="body" rows={2} placeholder={twilioConfigured() ? "Reply as Cup Casa…" : "Twilio is not configured yet (step 6)"} disabled={!twilioConfigured()} required />
          <SubmitButton variant="dark" className="self-end">Send</SubmitButton>
        </form>
      </Card>
    </>
  );
}
