import type { Metadata } from "next";
import { Heart, Leaf, Coffee, ArrowRight } from "lucide-react";
import { Button, Reveal, Eyebrow } from "@/components/ui";
import { Cup } from "@/components/cup";

export const metadata: Metadata = {
  title: "About",
  description:
    "cupcasa makes blank, fully PHA compostable cups — the eco essentials behind great cafés. Here's why we exist.",
};

const values = [
  { icon: Leaf, title: "Planet first", text: "If it can't return to nature, we won't sell it. PHA, full stop." },
  { icon: Coffee, title: "Built for service", text: "Cups that perform shift after shift — heat, ice, and everything between." },
  { icon: Heart, title: "Honest, always", text: "No greenwashing, no asterisks. Just clear claims we can back up." },
];

export default function AboutPage() {
  return (
    <>
      <section className="section-pad pt-12 pb-12 relative overflow-hidden">
        <div className="absolute -top-10 right-0 w-96 h-96 rounded-full bg-caramel-light/30 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Eyebrow color="caramel">Our story</Eyebrow>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5 leading-[0.95]">
              The home of <span className="text-coral">honest cups.</span>
            </h1>
            <p className="text-lg text-espresso/70 mt-6">
              &quot;Casa&quot; means home — and cupcasa is the home for cups that do right by
              the planet. We were tired of &quot;eco&quot; cups that were really plastic in
              disguise, so we built a range from a single material that genuinely composts:
              PHA. Blank, beautiful, and built to disappear the good way.
            </p>
            <div className="mt-8">
              <Button href="/shop" variant="primary" size="lg">
                Shop the range <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <div className="w-32 animate-float">
              <Cup tone="coral" />
            </div>
            <div className="w-36 animate-float-slow mt-10">
              <Cup tone="leaf" doubleWall />
            </div>
            <div className="w-28 animate-float mt-4" style={{ animationDelay: "0.8s" }}>
              <Cup tone="caramel" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 100}>
              <div className="h-full rounded-3xl bg-white/70 border border-caramel/20 p-7">
                <div className="w-14 h-14 rounded-2xl bg-coral/15 flex items-center justify-center mb-5">
                  <v.icon className="w-7 h-7 text-coral" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{v.title}</h3>
                <p className="text-espresso/70">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad py-16">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-14 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            A subsite of cupcasa
          </h2>
          <p className="text-cream/75 mt-4 max-w-2xl mx-auto">
            cupcasa cups is our dedicated home for fully PHA, unbranded foodservice cups —
            the same care for coffee, now for the cup it comes in.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Button href="/why-pha" variant="leaf" size="lg">
              Why PHA
            </Button>
            <Button href="/wholesale" variant="cream" size="lg">
              Wholesale
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
