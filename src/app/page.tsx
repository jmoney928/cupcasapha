import {
  Leaf,
  Waves,
  Sprout,
  Factory,
  ArrowRight,
  Sparkles,
  PackageCheck,
  Recycle,
} from "lucide-react";
import { Button, Reveal, Eyebrow } from "@/components/ui";
import { Cup } from "@/components/cup";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";

const stats = [
  { value: "100%", label: "PHA, plant-based" },
  { value: "3 ways", label: "Home · industrial · marine" },
  { value: "0", label: "Logos. Blank by design" },
  { value: "1,000", label: "Cups per case" },
];

const compostModes = [
  { icon: Sprout, title: "Home compost", text: "Breaks down in a backyard pile — no special facility needed." },
  { icon: Factory, title: "Industrial", text: "Meets commercial composting standards for fast breakdown." },
  { icon: Waves, title: "Marine", text: "Degrades in seawater — the gold standard most plastics fail." },
];

export default function Home() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative section-pad pt-12 pb-24 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-leaf-bright/20 blur-3xl" />
        <div className="absolute top-40 -left-24 w-80 h-80 rounded-full bg-coral-soft/30 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-bold leading-[0.95]">
              Cups that <span className="text-coral">disappear.</span>
              <br />
              The good way.
            </h1>
            <p className="text-lg sm:text-xl text-espresso/70 mt-6 max-w-lg">
              Blank, unbranded cups made from 100% PHA — the plant-based material
              that composts at home, in industrial facilities, and even in the
              ocean. Look good. Do good. No greenwashing.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Button href="/shop" variant="primary" size="lg">
                Shop cups <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href="/wholesale" variant="outline" size="lg">
                Order wholesale
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm font-semibold text-espresso/70">
              <span className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-leaf" /> Cases of 1,000
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-coral" /> From $0.20/cup
              </span>
              <span className="flex items-center gap-2">
                <Recycle className="w-4 h-4 text-caramel" /> Plastic-free
              </span>
            </div>
          </div>

          <div className="relative h-[380px] sm:h-[460px]">
            <div className="absolute left-[8%] top-6 w-40 sm:w-52 animate-float">
              <Cup tone="coral" label="8oz" />
            </div>
            <div className="absolute right-[6%] top-0 w-44 sm:w-60 animate-float-slow z-10">
              <Cup tone="caramel" label="12oz" />
            </div>
            <div
              className="absolute left-[34%] bottom-0 w-48 sm:w-64 animate-float z-20"
              style={{ animationDelay: "1.2s" }}
            >
              <Cup tone="leaf" doubleWall label="16oz" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <section className="bg-espresso text-cream py-5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center shrink-0">
              {[
                "Marine degradable",
                "Home compostable",
                "Industrial compostable",
                "Plant-based PHA",
                "Plastic-free",
                "BPA-free",
                "Unbranded & blank",
                "Soil biodegradable",
              ].map((t) => (
                <span key={t} className="flex items-center font-display font-semibold text-lg mx-6">
                  <Leaf className="w-5 h-5 text-leaf-bright mr-3" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="section-pad py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="text-center rounded-3xl bg-white/60 border border-caramel/20 py-8 px-4">
                <div className="font-display text-4xl sm:text-5xl font-bold text-coral">
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-espresso/60 mt-2">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- PRODUCTS ---------------- */}
      <section className="section-pad py-12">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <Eyebrow color="coral">The lineup</Eyebrow>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mt-4">
                Three sizes. One promise.
              </h2>
            </div>
            <Button href="/shop" variant="dark" size="md">
              Shop all <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={i * 100}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- WHY PHA ---------------- */}
      <section className="section-pad py-20">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-14 overflow-hidden relative">
          <div className="absolute -bottom-16 -right-10 w-72 opacity-20">
            <Cup tone="leaf" doubleWall />
          </div>
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Eyebrow color="leaf">
                <Leaf className="w-4 h-4" /> What is PHA?
              </Eyebrow>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mt-5">
                Made by nature. Returns to nature.
              </h2>
              <p className="text-cream/80 text-lg mt-5">
                PHA (polyhydroxyalkanoate) is a biopolymer brewed by microbes from
                plant-based oils. Unlike paper cups (plastic-lined) or PLA (needs an
                industrial plant), PHA breaks down wherever it lands — including the
                ocean. No microplastics. No forever chemicals.
              </p>
              <div className="mt-8">
                <Button href="/why-pha" variant="leaf" size="lg">
                  How PHA works <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {compostModes.map((m) => (
                <div key={m.title} className="flex gap-4 bg-cream/10 rounded-3xl p-5 backdrop-blur-sm">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-leaf flex items-center justify-center">
                    <m.icon className="w-6 h-6 text-cream" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-cream text-lg">{m.title}</h3>
                    <p className="text-cream/70 text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- WHOLESALE BAND ---------------- */}
      <section className="section-pad py-12">
        <Reveal>
          <div className="rounded-[2.5rem] bg-gradient-to-br from-coral to-coral-soft p-8 sm:p-14 text-cream flex flex-col lg:flex-row items-center gap-8 justify-between">
            <div className="max-w-xl">
              <Eyebrow color="caramel">For cafés & brands</Eyebrow>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4">
                Buying by the pallet? Let&apos;s talk volume.
              </h2>
              <p className="text-cream/90 mt-3 text-lg">
                Tiered wholesale pricing, free samples, and a dedicated contact for
                your café, chain or distribution business.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button href="/wholesale" variant="cream" size="lg">
                Get a quote
              </Button>
              <Button href="/wholesale#samples" variant="dark" size="lg">
                Free samples
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="section-pad py-20 text-center">
        <Reveal>
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-4xl sm:text-5xl font-bold">
              Ready to ditch the plastic?
            </h2>
            <p className="text-espresso/70 text-lg mt-4">
              Stock blank, beautiful, genuinely compostable cups your customers can
              feel good about.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <Button href="/shop" variant="primary" size="lg">
                Shop cups <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href="/sustainability" variant="outline" size="lg">
                Our impact
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
