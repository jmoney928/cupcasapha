import type { Metadata } from "next";
import { Droplets, Printer, Ban, ShieldCheck, ArrowRight } from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { Speckle } from "@/components/brand";

export const metadata: Metadata = {
  title: "Sustainability",
  description:
    "Custom-printed PHA cups, independently certified by TÜV Austria — OK Compost HOME and OK Biodegradable MARINE. Plastic-free, PFAS-free, and designed to return to nature.",
};

const pillars = [
  {
    icon: Printer,
    title: "Print without the guilt",
    text: "Full-colour custom printing on a cup that still composts. Your brand, minus the plastic.",
  },
  {
    icon: Droplets,
    title: "Marine-safe by default",
    text: "Most ocean plastic outlives us. PHA is certified to biodegrade in seawater — no 450-year afterlife.",
  },
  {
    icon: Ban,
    title: "No plastic, no PFAS",
    text: "No polyethylene lining, no forever chemicals — a single, home-compostable material.",
  },
];

const certs = [
  {
    name: "TÜV Austria — OK Compost HOME",
    body: "Independently certified to break down in home / backyard compost conditions.",
    tag: "Certified",
  },
  {
    name: "TÜV Austria — OK Biodegradable MARINE",
    body: "Independently certified to biodegrade in marine environments.",
    tag: "Certified",
  },
  {
    name: "Plastic-free & PFAS-free",
    body: "100% PHA — no polyethylene lining and no per-/poly-fluoroalkyl substances.",
    tag: "Material",
  },
  {
    name: "Plant-based",
    body: "Brewed from renewable plant oils by microbes — not petroleum.",
    tag: "Material",
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
            cupcasa cups are custom-printed on 100% PHA and independently certified by
            TÜV Austria to break down — at home and in the ocean. No plastic, no PFAS,
            nothing that lingers for centuries.
          </p>
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

      {/* impact stat band */}
      <section className="section-pad py-12">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-14">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { v: "0%", l: "petroleum plastic in our cups" },
              { v: "2", l: "TÜV Austria certifications" },
              { v: "100%", l: "plant-based PHA" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-5xl font-extrabold text-coral">{s.v}</div>
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
              <div className="flex gap-4 rounded-3xl bg-cream-deep/50 border border-espresso/8 p-6">
                <div
                  className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${
                    c.tag === "Certified" ? "bg-leaf text-cream" : "bg-espresso/8 text-espresso"
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg leading-tight">{c.name}</h3>
                  </div>
                  <p className="text-espresso/65 text-sm mt-1">{c.body}</p>
                  <span
                    className={`inline-block mt-2 label-caps ${
                      c.tag === "Certified" ? "text-leaf" : "text-espresso/40"
                    }`}
                  >
                    {c.tag}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-xs text-espresso/45 mt-5 max-w-2xl">
          TÜV Austria OK Compost HOME and OK Biodegradable MARINE certifications apply to
          the PHA cup material. Certificate numbers available on request.
        </p>
      </section>

      {/* cta */}
      <section className="section-pad pb-8">
        <div className="relative rounded-[2.5rem] bg-coral text-white overflow-hidden p-8 sm:p-14 text-center">
          <Speckle className="absolute bottom-0 right-0 w-1/2 h-2/3 text-white/25" />
          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold">
              Print better. Waste nothing.
            </h2>
            <p className="text-white/85 mt-4 max-w-xl mx-auto">
              A cup your customers love to hold — and the planet doesn&apos;t have to carry.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <Button href="/wholesale" variant="cream" size="lg">
                Start your design <ArrowRight className="w-5 h-5" />
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
