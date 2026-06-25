import type { Metadata } from "next";
import {
  Leaf,
  Droplets,
  Recycle,
  Award,
  Sparkles,
  ArrowRight,
  Ban,
} from "lucide-react";
import { Button, Reveal, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sustainability",
  description:
    "Our mission: replace single-use plastic with cups that genuinely return to nature. PHA, blank by design, certified compostable. Here's our impact and our standards.",
};

const pillars = [
  {
    icon: Droplets,
    title: "Marine-safe by default",
    text: "Most ocean plastic outlives us. PHA biodegrades in seawater — so the worst-case ending isn't a 450-year one.",
  },
  {
    icon: Ban,
    title: "Blank = less waste",
    text: "Unbranded cups don't get tossed when a promo ends or a logo changes. One spec, fewer dead stock pallets.",
  },
  {
    icon: Recycle,
    title: "No plastic, no PFAS",
    text: "No polyethylene lining, no forever chemicals — just a single, fully compostable material.",
  },
];

const certs = [
  { name: "Industrial compostable", body: "Designed to ASTM D6400 / EN 13432 standards" },
  { name: "Home compostable", body: "Breaks down in backyard compost conditions" },
  { name: "Marine biodegradable", body: "Degrades in marine environments — ASTM D6691 class" },
  { name: "BPA & PFAS free", body: "No bisphenols, no per-/poly-fluoroalkyl substances" },
];

export default function SustainabilityPage() {
  return (
    <>
      {/* hero */}
      <section className="section-pad pt-12 pb-16 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-leaf-bright/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <Eyebrow color="leaf">
            <Leaf className="w-4 h-4" /> Our mission
          </Eyebrow>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5 leading-[0.95]">
            Good for the drink. <br />
            <span className="text-leaf">Better for the planet.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-6">
            Billions of &quot;paper&quot; cups go to landfill every year because they&apos;re
            secretly plastic-lined. We started cupcasa to make the opposite true: a cup
            that performs like the ones you know, but actually returns to the earth.
          </p>
        </div>
      </section>

      {/* pillars */}
      <section className="section-pad py-10">
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <div className="h-full rounded-3xl bg-white/70 border border-caramel/20 p-7">
                <div className="w-14 h-14 rounded-2xl bg-leaf/15 flex items-center justify-center mb-5">
                  <p.icon className="w-7 h-7 text-leaf" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{p.title}</h3>
                <p className="text-espresso/70">{p.text}</p>
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
              { v: "3 streams", l: "home · industrial · marine compostable" },
              { v: "100%", l: "of orders ship blank & unbranded" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-5xl font-bold text-leaf-bright">{s.v}</div>
                <p className="text-cream/70 mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* certifications */}
      <section className="section-pad py-12">
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-7 h-7 text-coral" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Standards we build to
            </h2>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-5">
          {certs.map((c, i) => (
            <Reveal key={c.name} delay={i * 80}>
              <div className="flex gap-4 rounded-3xl bg-white/70 border border-caramel/20 p-6">
                <div className="w-12 h-12 shrink-0 rounded-full bg-leaf flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-cream" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">{c.name}</h3>
                  <p className="text-espresso/70 text-sm">{c.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-xs text-espresso/50 mt-5 max-w-2xl">
          Certification claims shown are the standards our cups are engineered to meet.
          Replace with your specific certificate numbers and bodies (e.g. BPI, TÜV
          Austria OK Compost) once finalised.
        </p>
      </section>

      {/* cta */}
      <section className="section-pad py-16 text-center">
        <h2 className="font-display text-4xl font-bold">Join the plastic-free pour.</h2>
        <p className="text-espresso/70 mt-4 max-w-xl mx-auto">
          Every case you swap is thousands of cups that won&apos;t outlive us in a landfill.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Button href="/shop" variant="primary" size="lg">
            Shop cups <ArrowRight className="w-5 h-5" />
          </Button>
          <Button href="/wholesale" variant="outline" size="lg">
            Wholesale enquiries
          </Button>
        </div>
      </section>
    </>
  );
}
