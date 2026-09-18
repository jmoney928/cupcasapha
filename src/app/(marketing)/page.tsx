import Image from "next/image";
import {
  Leaf,
  Recycle,
  ArrowRight,
  Sprout,
  CupSoda,
  Coffee,
  Layers,
} from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { Particles, Speckle, Mark } from "@/components/brand";
import { ReserveStrip } from "@/components/reserve-strip";

const pillars = [
  { icon: Leaf, title: "Better material", text: "100% PHA — plant-based, plastic-free, and certified compostable. No lining, no PFAS." },
  { icon: Layers, title: "Hot or cold", text: "Double wall in every size — hot drinks stay comfortable to hold with no sleeve, cold drinks stay cold." },
  { icon: Recycle, title: "Returns to nature", text: "Composts at home, industrially, and in the ocean. It leaves nothing behind." },
];

const lifecycle = [
  { icon: CupSoda, label: "Made" },
  { icon: Coffee, label: "Used" },
  { icon: "particles" as const, label: "Returns" },
  { icon: Sprout, label: "To nature" },
];

export default function Home() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="section-pad pt-12 sm:pt-16 pb-16 relative overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="label-caps text-coral">Home compostable · plastic-free</span>
            <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl mt-4">
              Made for every drink.
              <br />
              <span className="text-coral">Made to disappear.</span>
            </h1>
            <p className="text-lg text-espresso/70 mt-6 max-w-md">
              Fully compostable PHA cups for hot coffee, cold brew, smoothies and
              everything in between — plant-based, plastic-free, and certified to return to nature.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button href="/shop" variant="primary" size="lg">
                Reserve cups <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href="/wholesale" variant="outline" size="lg">
                Wholesale pricing
              </Button>
            </div>
            <p className="flex items-center gap-2 text-sm text-espresso/50 mt-6">
              <Particles className="w-6 h-4 text-coral" />
              Better cup. Better future.
            </p>
          </div>

          <Reveal>
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] sm:aspect-square shadow-[0_30px_60px_rgba(26,26,26,0.15)]">
              <Image
                src="/rebrand/hero-cup.png"
                alt="A cream cupcasa PHA cup outdoors"
                fill
                priority
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <section className="bg-espresso text-cream/90 py-4 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center shrink-0">
              {[
                "Home compostable",
                "Industrially compostable",
                "Marine degradable",
                "Plant-based PHA",
                "Plastic-free",
                "PFAS-free",
                "Double wall",
              ].map((t) => (
                <span key={t} className="label-caps flex items-center mx-5 text-cream/80">
                  {t}
                  <span className="mx-5 text-coral">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- PILLARS ---------------- */}
      <section className="section-pad py-20">
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

      {/* ---------------- THE CUPS ---------------- */}
      <section className="section-pad py-8">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="label-caps text-coral">Three sizes</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 text-cream">
              One cup for every pour.
            </h2>
            <p className="text-cream/60 mt-4">
              8oz for espresso and small pours, 12oz for the everyday drink, 16oz for
              smoothies, cold brew and the big iced ones. All double wall, all 100% PHA,
              all shipped blank and ready to use.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { img: "/products/8oz-pha-cup.png", size: "8oz", name: "The Espresso" },
              { img: "/products/12oz-pha-cup.png", size: "12oz", name: "The Everyday" },
              { img: "/products/16oz-pha-cup.png", size: "16oz", name: "The Big One" },
            ].map((c, i) => (
              <Reveal key={c.size} delay={i * 90}>
                <a href={`/shop/${c.size}-pha-cup`} className="group relative block rounded-3xl overflow-hidden aspect-[4/5] bg-cream">
                  <Image
                    src={c.img}
                    alt={`${c.size} cupcasa PHA cup`}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-4 left-4 bg-cream text-espresso text-xs font-bold px-3 py-1 rounded-full">
                    {c.size}
                  </span>
                  <span className="absolute bottom-4 left-4 bg-espresso/80 text-cream text-xs font-bold px-3 py-1 rounded-full">
                    {c.name}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button href="/shop" variant="primary" size="lg">
              Shop the cups <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- LIFECYCLE ---------------- */}
      <section className="section-pad py-20 text-center">
        <Reveal>
          <span className="label-caps text-coral">The cupcasa circle</span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 mb-12">
            A better circle for every cup.
          </h2>
        </Reveal>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {lifecycle.map((step, i) => (
            <div key={step.label} className="flex items-center gap-4 sm:gap-8">
              <div className="flex flex-col items-center gap-3 w-24">
                <div className="w-16 h-16 rounded-full border-2 border-espresso/12 flex items-center justify-center text-espresso">
                  {step.icon === "particles" ? (
                    <Particles className="w-9 h-6 text-coral" />
                  ) : (
                    <step.icon className="w-7 h-7" strokeWidth={1.6} />
                  )}
                </div>
                <span className="label-caps text-espresso/70">{step.label}</span>
              </div>
              {i < lifecycle.length - 1 && (
                <ArrowRight className="w-5 h-5 text-espresso/30 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- CORAL PANEL (one deliberate high-impact) ---------------- */}
      <section className="section-pad py-8">
        <div className="relative rounded-[2.5rem] bg-coral text-white overflow-hidden p-8 sm:p-14">
          <Speckle className="absolute bottom-0 right-0 w-1/2 h-2/3 text-white/25" />
          <div className="relative max-w-xl">
            <h2 className="font-display text-4xl sm:text-6xl font-extrabold leading-[0.98]">
              Made for every drink.
              <br />
              Made to disappear.
            </h2>
            <p className="text-white/85 text-lg mt-5 max-w-md">
              Our PHA cups are plant-based, plastic-free, and designed to break
              down naturally — leaving nothing behind.
            </p>
            <div className="mt-8">
              <Button href="/why-pha" variant="cream" size="lg">
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- RESERVE / PRODUCTS ---------------- */}
      <section className="section-pad py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="label-caps text-coral">Reserve now · shipping Nov 2026</span>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-3">
                Three sizes. One deposit.
              </h2>
            </div>
            <Button href="/shop" variant="dark" size="md">
              Shop all <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Reveal>
        <Reveal>
          <ReserveStrip />
        </Reveal>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="section-pad pb-8">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="relative max-w-2xl mx-auto">
            <Mark variant="white" className="h-12 w-auto mx-auto mb-6" />
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold">
              Ready to switch?
            </h2>
            <p className="text-cream/70 text-lg mt-4">
              Better material. Returns to nature. Nothing left behind.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <Button href="/shop" variant="primary" size="lg">
                Reserve cups <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href="/contact" variant="cream" size="lg">
                Talk to us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
