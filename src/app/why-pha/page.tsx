import type { Metadata } from "next";
import {
  Leaf,
  FlaskConical,
  Sprout,
  Waves,
  Factory,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { Button, Reveal, Eyebrow } from "@/components/ui";
import { Cup } from "@/components/cup";

export const metadata: Metadata = {
  title: "Why PHA",
  description:
    "What is PHA? Polyhydroxyalkanoate is a plant-based biopolymer that's home, industrial AND marine compostable — unlike PLA, paper, or conventional plastic. Here's how it works.",
};

const steps = [
  {
    icon: Sprout,
    title: "Grown from plants",
    text: "PHA starts with plant-based oils and sugars — renewable feedstock, not petroleum.",
  },
  {
    icon: FlaskConical,
    title: "Brewed by microbes",
    text: "Bacteria ferment those plant oils and store PHA as natural energy granules — the same way we store fat.",
  },
  {
    icon: Leaf,
    title: "Shaped into cups",
    text: "The biopolymer is harvested and formed into sturdy, food-safe cups. No plastic lining, no PFAS.",
  },
  {
    icon: Waves,
    title: "Returns to nature",
    text: "When discarded, microbes recognise PHA as food and digest it — in soil, compost, or seawater. No microplastics left behind.",
  },
];

const rows = [
  { feature: "Made from renewable plants", pha: true, pla: true, paper: "lining", plastic: false },
  { feature: "Home compostable", pha: true, pla: false, paper: false, plastic: false },
  { feature: "Industrial compostable", pha: true, pla: true, paper: "lining", plastic: false },
  { feature: "Marine degradable", pha: true, pla: false, paper: false, plastic: false },
  { feature: "Soil biodegradable", pha: true, pla: false, paper: false, plastic: false },
  { feature: "No plastic lining / PFAS", pha: true, pla: true, paper: false, plastic: false },
  { feature: "Leaves no microplastics", pha: true, pla: "partial", paper: false, plastic: false },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-leaf text-cream">
        <Check className="w-4 h-4" />
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-coral/15 text-coral">
        <X className="w-4 h-4" />
      </span>
    );
  return (
    <span className="text-xs font-bold text-caramel uppercase">
      {value === "partial" ? "Sometimes" : "If lined"}
    </span>
  );
}

export default function WhyPhaPage() {
  return (
    <>
      {/* hero */}
      <section className="section-pad pt-12 pb-16 relative overflow-hidden">
        <div className="absolute -top-16 right-0 w-96 h-96 rounded-full bg-leaf-bright/20 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Eyebrow color="leaf">
              <FlaskConical className="w-4 h-4" /> The science, simply
            </Eyebrow>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5 leading-[0.95]">
              What on earth is <span className="text-leaf">PHA?</span>
            </h1>
            <p className="text-lg text-espresso/70 mt-6 max-w-lg">
              PHA — polyhydroxyalkanoate — is a biopolymer that microbes make from
              plants — and that other microbes eat when you&apos;re done with it. It&apos;s the
              rare material that&apos;s truly compostable at home, industrially,{" "}
              <em>and</em> in the ocean. That&apos;s why we build every cupcasa cup from it.
            </p>
            <div className="mt-8">
              <Button href="/shop" variant="leaf" size="lg">
                Shop PHA cups <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <div className="w-36 animate-float">
              <Cup tone="leaf" doubleWall />
            </div>
            <div className="w-32 animate-float-slow mt-12">
              <Cup tone="caramel" />
            </div>
          </div>
        </div>
      </section>

      {/* how it's made */}
      <section className="section-pad py-12">
        <Reveal>
          <h2 className="font-display text-4xl font-bold text-center mb-4">
            From plant to cup to soil
          </h2>
          <p className="text-center text-espresso/70 max-w-2xl mx-auto mb-12">
            PHA completes a genuine circle — every stage powered by biology, not petrochemistry.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <div className="relative h-full rounded-3xl bg-white/70 border border-caramel/20 p-6">
                <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-espresso text-cream font-display font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-leaf/15 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-leaf" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-espresso/70">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* comparison */}
      <section className="section-pad py-16">
        <Reveal>
          <div className="rounded-[2.5rem] bg-white/70 border border-caramel/20 p-6 sm:p-10 overflow-x-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">
              PHA vs. everything else
            </h2>
            <p className="text-espresso/70 mb-8">
              Not all &quot;eco&quot; cups are equal. Here&apos;s the honest comparison.
            </p>
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="py-3 pr-4 font-display text-lg">Property</th>
                  <th className="py-3 px-3 text-center font-display text-lg text-leaf">PHA (us)</th>
                  <th className="py-3 px-3 text-center font-display text-lg">PLA</th>
                  <th className="py-3 px-3 text-center font-display text-lg">Paper</th>
                  <th className="py-3 px-3 text-center font-display text-lg">Plastic</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.feature} className="border-t border-caramel/20">
                    <td className="py-3 pr-4 font-semibold text-espresso/80">{r.feature}</td>
                    <td className="py-3 px-3 text-center bg-leaf/5"><Cell value={r.pha} /></td>
                    <td className="py-3 px-3 text-center"><Cell value={r.pla} /></td>
                    <td className="py-3 px-3 text-center"><Cell value={r.paper} /></td>
                    <td className="py-3 px-3 text-center"><Cell value={r.plastic} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* disposal */}
      <section className="section-pad py-12">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-8">
            How to dispose of a cupcasa cup
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Sprout, t: "Home compost bin", d: "Toss it in your backyard compost — it breaks down with food scraps." },
              { icon: Factory, t: "Industrial / commercial", d: "Fits standard commercial composting collection where available." },
              { icon: Waves, t: "Worst case: it escapes", d: "Even if it ends up in waterways, PHA biodegrades — it won't linger for centuries." },
            ].map((c) => (
              <div key={c.t} className="bg-cream/10 rounded-3xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-leaf flex items-center justify-center mb-4">
                  <c.icon className="w-6 h-6 text-cream" />
                </div>
                <h3 className="font-display font-bold text-lg mb-1">{c.t}</h3>
                <p className="text-cream/70 text-sm">{c.d}</p>
              </div>
            ))}
          </div>
          <p className="text-cream/60 text-sm mt-6">
            Composting infrastructure varies by region — check your local guidelines.
            The point of PHA is that it breaks down responsibly across the widest range
            of end-of-life scenarios.
          </p>
        </div>
      </section>

      {/* cta */}
      <section className="section-pad py-16 text-center">
        <h2 className="font-display text-4xl font-bold">Convinced? We thought so.</h2>
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Button href="/shop" variant="primary" size="lg">
            Shop the cups <ArrowRight className="w-5 h-5" />
          </Button>
          <Button href="/sustainability" variant="outline" size="lg">
            See our impact
          </Button>
        </div>
      </section>
    </>
  );
}
