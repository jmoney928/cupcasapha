import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ClipboardCheck, FileWarning, Link2, QrCode, Users } from "lucide-react";
import { Reveal } from "@/components/ui";
import { BinderBuilder } from "@/components/compliance/binder-builder";
import { WORKSAFE_SOURCES, REVIEW_PENDING_NOTE } from "@/lib/compliance/disclaimer";
import { SDS_REVIEW_YEARS } from "@/lib/compliance/sds";

export const metadata: Metadata = {
  title: "Free WHMIS & safety binder for BC cafés",
  description:
    "Generate the WHMIS and WorkSafeBC paperwork your café is supposed to have: hazardous products inventory, safety data sheet index, young worker orientation, and monthly inspection forms. Free, from Cup Casa.",
  alternates: { canonical: "https://cupcasa.com/compliance" },
  openGraph: {
    title: "The paperwork your café is supposed to have",
    description: "A WHMIS and safety binder for BC cafés, generated in about two minutes. Free.",
    url: "https://cupcasa.com/compliance",
  },
};

const included = [
  { icon: FileWarning, title: "Hazardous products inventory", text: "Everything on site, where it's kept, and its main hazard — the list an inspector asks for first." },
  { icon: QrCode, title: "Safety data sheet index", text: "A QR code and address per product, pointing at the manufacturer's current sheet." },
  { icon: Users, title: "Young worker orientation", text: "The three topics WorkSafeBC requires, with a sign-off sheet and a training record for the worker's file." },
  { icon: ClipboardCheck, title: "Forms and checklists", text: "Incident report and a monthly safety inspection walk-round, prefilled with your details." },
];

export default function CompliancePage() {
  return (
    <>
      <section className="section-pad pt-12 pb-8">
        <div className="max-w-3xl">
          <span className="label-caps text-coral">Free for BC cafés</span>
          <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl mt-4 leading-[1]">
            The paperwork your café is <span className="text-coral">supposed to have.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-5">
            Every hazardous product in your shop needs a safety data sheet your staff can actually reach, and every
            new hire needs a documented orientation. Most cafés have neither. Tick what you keep on site and we&apos;ll
            build the binder — about two minutes, no charge.
          </p>
        </div>
      </section>

      <section className="section-pad pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {included.map((x, i) => (
            <Reveal key={x.title} delay={i * 70}>
              <div className="h-full rounded-3xl border border-espresso/10 bg-white/70 p-5">
                <x.icon className="h-6 w-6 text-coral" strokeWidth={1.6} />
                <h2 className="font-display text-lg font-extrabold mt-3">{x.title}</h2>
                <p className="text-sm text-espresso/65 mt-1">{x.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad pb-12">
        <BinderBuilder />
      </section>

      <section className="section-pad py-10">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2.5rem] bg-cream-deep/60 border border-espresso/8 p-8">
            <Link2 className="h-7 w-7 text-coral mb-4" strokeWidth={1.6} />
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold">We link the sheets. We don&apos;t copy them.</h2>
            <p className="text-espresso/70 mt-3">
              A safety data sheet photocopied into a binder is out of date the moment the manufacturer revises it, and
              you&apos;d have no way of knowing. Your binder carries a QR code per product that opens the manufacturer&apos;s
              own current sheet. We check those links nightly and fix them at our end, so you never open a dead one.
            </p>
          </div>
          <div className="rounded-[2.5rem] bg-espresso text-cream p-8">
            <AlertTriangle className="h-7 w-7 text-coral mb-4" strokeWidth={1.6} />
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-cream">
              The {SDS_REVIEW_YEARS}-year rule almost nobody tracks
            </h2>
            <p className="text-cream/65 mt-3">
              In British Columbia, safety data sheets must be checked at least every three years to confirm they still
              hold current information. It&apos;s a BC-specific requirement and it catches people out. Your binder is
              stamped with its own review date, so you know exactly when to regenerate it.
            </p>
          </div>
        </div>
      </section>

      <section className="section-pad pb-14">
        <div className="rounded-3xl border border-espresso/10 bg-white/70 p-6 text-sm text-espresso/65">
          <p className="font-display text-base font-extrabold text-espresso">Where this comes from, and what it isn&apos;t</p>
          <p className="mt-2">
            Built against WorkSafeBC&apos;s own published guidance:{" "}
            {WORKSAFE_SOURCES.map((x, i) => (
              <span key={x.url}>
                {i > 0 && " and "}
                <a href={x.url} target="_blank" rel="noopener noreferrer" className="underline font-semibold">{x.label}</a>
              </span>
            ))}
            .
          </p>
          <p className="mt-2">
            <b>{REVIEW_PENDING_NOTE}</b>
          </p>
          <p className="mt-2">
            This is a template for your use. Verify it against current WorkSafeBC requirements and your suppliers&apos;
            current safety data sheets. Cup Casa does not certify your workplace, and we&apos;re not a safety consultancy —
            we make <Link href="/why-pha" className="underline font-semibold">compostable cups</Link>, and we built this
            because every café we walked into was missing it.
          </p>
        </div>
      </section>
    </>
  );
}
