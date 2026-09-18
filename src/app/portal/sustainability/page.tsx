import { getPortalContext } from "@/lib/auth/cafe-context";
import { Card, PageHeader, StatTile } from "@/components/app/ui";
import { num, fullDate } from "@/lib/format";

export const metadata = { title: "Impact" };

export default async function SustainabilityPage() {
  const { cafe, supabase } = await getPortalContext();
  const { data: delivered } = await supabase
    .from("orders").select("delivered_at, items:order_items(units, cases)").eq("cafe_id", cafe.id).eq("status", "delivered");
  const cups = (delivered ?? []).flatMap((o) => o.items).reduce((a, i) => a + i.units, 0);
  const cases = (delivered ?? []).flatMap((o) => o.items).reduce((a, i) => a + i.cases, 0);
  const first = (delivered ?? []).map((o) => o.delivered_at).filter(Boolean).sort()[0];

  return (
    <>
      <PageHeader title="Your impact" eyebrow={cafe.name}>Only what we can stand behind: cups actually delivered to you.</PageHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="PHA cups supplied" value={num(cups)} tone="green" hint={first ? `since ${fullDate(first)}` : "no deliveries yet"} />
        <StatTile label="Cases delivered" value={num(cases)} />
        <StatTile label="Certification" value="TÜV OK Compost HOME" hint="OK Biodegradable MARINE" />
      </div>
      <Card className="mt-4" title="What this means">
        <p className="text-sm text-cocoa">Every cup above is lined with PHA instead of polyethylene, so it can go in home compost rather than landfill. We don’t estimate carbon or plastic “saved” because those figures depend on what you’d have used otherwise and how the cup is disposed of. If you need numbers for a report, email hello@cupcasa.com and we’ll share the certification documents.</p>
      </Card>
    </>
  );
}
