import { AlertTriangle, ClipboardCheck, FileWarning, Link2, MessageSquareWarning, QrCode, Stethoscope, Trash2, Users } from "lucide-react";
import { PageHeader, Card } from "@/components/app/ui";
import { BinderBuilder } from "@/components/compliance/binder-builder";
import { QuickGenerate } from "@/components/compliance/quick-generate";
import { GrantsList } from "@/components/compliance/grants-list";
import { REVIEW_PENDING_NOTE, WORKSAFE_SOURCES } from "@/lib/compliance/disclaimer";
import { SDS_REVIEW_YEARS } from "@/lib/compliance/sds";
import { getPortalContext } from "@/lib/auth/cafe-context";

export const metadata = { title: "Compliance", robots: { index: false } };

export default async function PortalCompliancePage() {
  const { cafe } = await getPortalContext();

  return (
    <>
      <PageHeader title="Compliance" eyebrow={cafe.name}>
        The paperwork you&apos;re supposed to have, generated from what you actually keep on site.
      </PageHeader>

      <Card title="WHMIS & safety binder" className="mb-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          {[
            { icon: FileWarning, t: "Hazard inventory", d: "Everything on site, where it's kept, its main hazard." },
            { icon: QrCode, t: "SDS index", d: "A QR per product, opening the manufacturer's current sheet." },
            { icon: Users, t: "Young worker pack", d: "The three required topics, with a sign-off record." },
            { icon: ClipboardCheck, t: "Forms", d: "Incident report and monthly inspection walk-round." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl bg-cream/60 p-3">
              <x.icon className="h-5 w-5 text-coral" strokeWidth={1.6} />
              <p className="mt-2 font-bold">{x.t}</p>
              <p className="text-xs text-cocoa">{x.d}</p>
            </div>
          ))}
        </div>
        <BinderBuilder />
      </Card>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card title="Claims & greenwashing kit">
          <MessageSquareWarning className="h-5 w-5 text-coral" strokeWidth={1.6} />
          <p className="mt-2 text-sm text-cocoa">
            What you can say about a compostable cup, what you can&apos;t, and a substantiation page to hand anyone
            who asks.
          </p>
          <QuickGenerate kind="claims" cta="Get the claims kit" />
        </Card>
        <Card title="Bin signage">
          <Trash2 className="h-5 w-5 text-coral" strokeWidth={1.6} />
          <p className="mt-2 text-sm text-cocoa">
            Back-of-house poster, customer decals and a staff briefing. Honest about the green bin.
          </p>
          <QuickGenerate kind="signage" cta="Get the signage" needsMunicipality />
        </Card>
        <Card title="Health self-audit">
          <Stethoscope className="h-5 w-5 text-coral" strokeWidth={1.6} />
          <p className="mt-2 text-sm text-cocoa">
            The walk-round Island Health does, as a checklist you can do first.
          </p>
          <QuickGenerate kind="audit" cta="Get the self-audit" />
        </Card>
      </div>

      <Card title="Grants & rebates" className="mb-4">
        <GrantsList />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Why we link sheets instead of copying them">
          <Link2 className="h-5 w-5 text-coral mb-2" strokeWidth={1.6} />
          <p className="text-sm text-cocoa">
            A safety data sheet photocopied into a binder is out of date the moment the manufacturer revises it, and
            you&apos;d have no way of knowing. Yours carries a QR per product that opens the manufacturer&apos;s own
            current sheet. We check those links nightly and fix them at our end, so you never open a dead one.
          </p>
        </Card>
        <Card title={`The ${SDS_REVIEW_YEARS}-year rule`}>
          <AlertTriangle className="h-5 w-5 text-coral mb-2" strokeWidth={1.6} />
          <p className="text-sm text-cocoa">
            In BC, safety data sheets must be checked at least every three years to confirm they still hold current
            information. Your binder is stamped with its own review date, so you know when to regenerate it.
          </p>
        </Card>
      </div>

      <p className="mt-6 text-xs text-cocoa">
        Built against{" "}
        {WORKSAFE_SOURCES.map((x, i) => (
          <span key={x.url}>
            {i > 0 && " and "}
            <a href={x.url} target="_blank" rel="noopener noreferrer" className="underline">{x.label}</a>
          </span>
        ))}
        . {REVIEW_PENDING_NOTE} Templates for your use — Cup Casa does not certify your workplace.
      </p>
    </>
  );
}
