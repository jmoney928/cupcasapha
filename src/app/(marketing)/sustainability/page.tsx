import type { Metadata } from "next";
import { Ban, ShieldCheck, ArrowRight, Sprout, Search, Leaf } from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { Speckle } from "@/components/brand";
import { CertBadge } from "@/components/cert-badge";
import { CERT, OTHER_CERTS, CERT_HOLDER, CERT_VALID_UNTIL, certVerifyUrl, MATERIAL_CLAIM } from "@/lib/certs";

export const metadata: Metadata = {
  title: "Sustainability",
  description:
    "Paper cups with a PHA lining certified home compostable by DIN CERTCO (TÜV Rheinland group), certificate 9R0050. No PE, no PLA, no microplastics.",
};

const pillars = [
  {
    icon: Sprout,
    title: "Compostable at home",
    text: "No industrial facility required. The PHA lining is certified to break down in a backyard compost, not just in theory.",
  },
  {
    icon: Ban,
    title: "No PE, no PLA, no microplastics",
    text: "The lining is PHA — a material microbes make and microbes eat — instead of a plastic film that never really goes away.",
  },
  {
    icon: Search,
    title: "Verifiable, not just claimed",
    text: `Certificate ${CERT.number} is issued by DIN CERTCO and listed on its public register, valid to ${CERT_VALID_UNTIL}. Look it up yourself.`,
  },
];

const certs = [
  {
    name: `${CERT.title} — DIN CERTCO ${CERT.number}`,
    body: `The PHA lining material is certified by DIN CERTCO (TÜV Rheinland group) for home and garden composting. Holder: ${CERT_HOLDER}. Valid to ${CERT_VALID_UNTIL}.`,
    tag: "Certified",
    href: certVerifyUrl,
    icon: ShieldCheck,
  },
  {
    name: `${OTHER_CERTS[0].title} — DIN CERTCO ${OTHER_CERTS[0].number}`,
    body: `${OTHER_CERTS[0].scheme}. Also holds the Seedling mark, DIN CERTCO ${OTHER_CERTS[1].number}.`,
    tag: "Certified",
    href: OTHER_CERTS[0].entryUrl,
    icon: Leaf,
  },
  {
    name: MATERIAL_CLAIM,
    body: "Paper cup, PHA lining. No polyethylene, no PLA — nothing that fragments into microplastics.",
    tag: "Material",
    icon: Ban,
  },
  {
    name: "Plant-based lining",
    body: "PHA is brewed from renewable plant oils by microbes — not petroleum.",
    tag: "Material",
    icon: Sprout,
  },
];

export default function SustainabilityPage() {
  return (
    <>
      {/* hero */}
      <section className="section-pad pt-12 pb-16">
        <div className="max-w-3xl">
          <span className="label-caps text-coral">Our mission</span>
          <h1 className="font-display text-5xl sm:text-6xl mt-4 leading-[0.98]">
            Certified to <span className="text-coral">return to nature.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-6">
            cupcasa cups are paper with a plant-based PHA lining that is independently certified
            home compostable by DIN CERTCO, part of the TÜV Rheinland group. No PE, no PLA,
            no microplastics — nothing that lingers for centuries.
          </p>
          <div className="mt-6"><CertBadge /></div>
        </div>
      </section>

      {/* pillars */}
      <section className="section-pad py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 90}>
              <div className="h-full">
                <div className="w-14 h-14 rounded-2xl border-2 border-espresso/12 flex items-center justify-center mb-5">
                  <p.icon className="w-7 h-7 text-coral" strokeWidth={1.6} />
                </div>
                <h3 className="font-display text-2xl font-extrabold mb-2">{p.title}</h3>
                <p className="text-espresso/65 leading-relaxed">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* stat band */}
      <section className="section-pad py-12">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-14">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { v: "0%", l: "PE or PLA in the lining" },
              { v: CERT.number, l: "DIN CERTCO certificate, home-compostable lining" },
              { v: "100%", l: "plant-based PHA lining" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-5xl font-extrabold text-coral tabular-nums">{s.v}</div>
                <p className="text-cream/70 mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* certifications */}
      <section className="section-pad py-14">
        <Reveal>
          <span className="label-caps text-coral">Independently verified</span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 mb-8">
            Certified, not just claimed.
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-5">
          {certs.map((c, i) => (
            <Reveal key={c.name} delay={i * 70}>
              <div className="flex gap-4 rounded-3xl bg-cream-deep/50 border border-espresso/8 p-6 h-full">
                <div
                  className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${
                    c.tag === "Certified" ? "bg-leaf text-cream" : "bg-espresso/8 text-espresso"
                  }`}
                >
                  <c.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg leading-tight">{c.name}</h3>
                  <p className="text-espresso/65 text-sm mt-1">{c.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`label-caps ${c.tag === "Certified" ? "text-leaf" : "text-espresso/40"}`}>{c.tag}</span>
                    {c.href && (
                      <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline text-espresso/70 hover:text-espresso">
                        View on the DIN CERTCO register →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-xs text-espresso/45 mt-5 max-w-2xl">
          Certificates cover the PHA lining material and are held by its manufacturer, {CERT_HOLDER}. They are
          issued by DIN CERTCO, part of the TÜV Rheinland group, and listed on its public register:{" "}
          <a href={CERT.registerUrl} target="_blank" rel="noopener noreferrer" className="underline">all three entries</a>.
        </p>
      </section>

      {/* cta */}
      <section className="section-pad pb-8">
        <div className="relative rounded-[2.5rem] bg-coral text-white overflow-hidden p-8 sm:p-14 text-center">
          <Speckle className="absolute bottom-0 right-0 w-1/2 h-2/3 text-white/25" />
          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold">
              Better cup. Waste nothing.
            </h2>
            <p className="text-white/85 mt-4 max-w-xl mx-auto">
              A cup your customers love to hold — and the planet doesn&apos;t have to carry.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <Button href="/shop" variant="cream" size="lg">
                Reserve cups <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href="/why-pha" variant="dark" size="lg">
                The material
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
