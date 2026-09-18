import type { Metadata } from "next";
import { Ban, ShieldCheck, ArrowRight, Sprout, Search, Leaf } from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { Speckle } from "@/components/brand";
import { CertBadge } from "@/components/cert-badge";
import { CERT, RESIN_CERTS, RESIN_CERT_HOLDER, RESIN_CERT_VALID_UNTIL, RESIN_REGISTER_URL, MATERIAL_CLAIM } from "@/lib/certs";

export const metadata: Metadata = {
  title: "Sustainability",
  description:
    "PHA-lined paper cups certified home compostable by DIN CERTCO (TÜV Rheinland group), certificate 9P0326. No PE, no PLA, no microplastics.",
};

const pillars = [
  {
    icon: Sprout,
    title: "Compostable at home",
    text: "No industrial facility required. Certified to break down in a backyard compost, not just in theory.",
  },
  {
    icon: Ban,
    title: "No PE, no PLA, no microplastics",
    text: "The lining is PHA — a material microbes make and microbes eat — instead of a plastic film that never really goes away.",
  },
  {
    icon: Search,
    title: "Verifiable, not just claimed",
    text: `Certificate ${CERT.number} is issued by DIN CERTCO, part of the TÜV Rheinland group. The lining material carries its own public registrations as well.`,
  },
];

const certs = [
  {
    name: `${CERT.title} — DIN CERTCO ${CERT.number}`,
    body: "The cup is independently certified by DIN CERTCO (TÜV Rheinland group) to break down in home and garden compost conditions.",
    tag: "Certified",
    icon: ShieldCheck,
  },
  {
    name: `PHA lining resin — DIN CERTCO ${RESIN_CERTS[0].number}`,
    body: `The lining material itself (${RESIN_CERT_HOLDER}) holds DIN CERTCO registrations for home & garden composting (${RESIN_CERTS[0].number}), industrial composting (${RESIN_CERTS[1].number}) and the Seedling mark (${RESIN_CERTS[2].number}), valid to ${RESIN_CERT_VALID_UNTIL}.`,
    tag: "Material",
    href: RESIN_REGISTER_URL,
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
            cupcasa cups are paper with a plant-based PHA lining, independently certified
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
              { v: CERT.number, l: "DIN CERTCO certificate, home compostable" },
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
          Certificates are issued by DIN CERTCO, part of the TÜV Rheinland group. Certificate documents are
          available on request at hello@cupcasa.com.
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
