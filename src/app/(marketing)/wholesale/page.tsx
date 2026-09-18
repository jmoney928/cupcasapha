import type { Metadata } from "next";
import { Package, Gift, TrendingDown, Truck, Leaf, Check, Printer } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import { products, formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Wholesale & Bulk",
  description:
    "Wholesale compostable PHA cups for cafés, chains and distributors. Tiered volume pricing, free samples, and custom printing on orders of 100,000+ cups. Request a quote.",
};

const tiers = [
  { name: "Starter", range: "1–9 cases", discount: "List price", note: "Buy online instantly" },
  { name: "Café", range: "10–49 cases", discount: "Up to 8% off", note: "Best for single locations" },
  { name: "Volume", range: "50–199 cases", discount: "Up to 15% off", note: "Multi-site & growing brands · custom printing from 100 cases" },
  { name: "Distributor", range: "200+ cases", discount: "Custom pricing", note: "Pallet & container freight · custom printing available" },
];

const perks = [
  { icon: TrendingDown, title: "Tiered pricing", text: "The more you order, the lower your per-cup cost." },
  { icon: Gift, title: "Free samples", text: "Try every size before you commit a single dollar." },
  { icon: Truck, title: "Freight sorted", text: "Pallet and LTL freight to your door, US & Canada." },
  { icon: Package, title: "Reliable supply", text: "Consistent stock so you never run dry mid-service." },
];

export default function WholesalePage() {
  return (
    <>
      {/* hero */}
      <section className="section-pad pt-12 pb-12 relative overflow-hidden">
        <div className="absolute -top-10 right-0 w-96 h-96 rounded-full bg-coral-soft/30 blur-3xl" />
        <div className="relative max-w-3xl">
          <Eyebrow color="coral">For cafés, chains & distributors</Eyebrow>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5 leading-[0.95]">
            Wholesale cups,<br />
            <span className="text-coral">priced for volume.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-6">
            Stock genuinely compostable cups across your whole operation — and put
            your brand on them at 100,000 cups or more. Tell us what you need and
            we&apos;ll send a tailored quote, plus free samples to prove the quality.
          </p>
        </div>
      </section>

      {/* base pricing */}
      <section className="section-pad py-6">
        <div className="mb-6">
          <span className="label-caps text-coral">Per-cup pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">
            Simple list pricing.
          </h2>
          <p className="text-espresso/60 mt-2 max-w-xl">
            Every size is double-wall and ships blank, sold by the case of 1,000.
            Volume tiers below bring the per-cup price down from here.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.slug}
              className="rounded-3xl bg-cream-deep/50 border border-espresso/8 p-6"
            >
              <div className="flex items-baseline justify-between">
                <p className="font-display text-2xl font-extrabold">{p.size}</p>
                <span className="label-caps text-espresso/40">Double wall</span>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-espresso/70">{p.shortName}</span>
                <span className="font-display font-bold text-coral">
                  {formatPrice(p.pricePerCup)}
                  <span className="text-coral/60 text-sm font-normal">/cup</span>
                </span>
              </div>
              <p className="text-xs text-espresso/45 mt-4">
                {formatPrice(p.casePrice)} per case of {p.caseCount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* custom printing at volume */}
      <section className="section-pad py-6">
        <Reveal>
          <div className="rounded-3xl bg-espresso text-cream p-8 sm:p-10 grid md:grid-cols-[auto_1fr_auto] gap-6 items-center">
            <div className="w-14 h-14 rounded-2xl bg-coral/20 flex items-center justify-center shrink-0">
              <Printer className="w-7 h-7 text-coral" strokeWidth={1.6} />
            </div>
            <div>
              <span className="label-caps text-coral">Custom printing · 100,000+ cups</span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
                Your brand on the cup, at volume.
              </h2>
              <p className="text-cream/65 mt-2 max-w-2xl">
                Full-colour, edge-to-edge printing with your artwork is available on orders of
                100,000 cups or more (100 cases, any mix of sizes). Ask for it in your quote
                request and we&apos;ll include printed pricing and lead times.
              </p>
            </div>
            <a
              href="#samples"
              className="btn-pill bg-coral text-white px-6 py-3 text-sm hover:bg-coral-deep whitespace-nowrap"
            >
              Quote with printing
            </a>
          </div>
        </Reveal>
      </section>

      {/* tiers */}
      <section className="section-pad py-12">
        <Reveal>
          <h2 className="font-display text-4xl font-bold mb-2">Volume tiers</h2>
          <p className="text-espresso/70 mb-8">
            Indicative tiers — your exact quote depends on sizes, volume and freight.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div
                className={`h-full rounded-3xl p-6 border ${
                  i === 2
                    ? "bg-espresso text-cream border-espresso"
                    : "bg-white/70 border-caramel/20"
                }`}
              >
                <p className={`font-display text-xl font-bold ${i === 2 ? "text-leaf-bright" : "text-coral"}`}>
                  {t.name}
                </p>
                <p className={`text-sm mt-1 ${i === 2 ? "text-cream/70" : "text-espresso/60"}`}>
                  {t.range}
                </p>
                <p className="font-display text-2xl font-bold mt-4">{t.discount}</p>
                <p className={`text-sm mt-2 ${i === 2 ? "text-cream/70" : "text-espresso/60"}`}>
                  {t.note}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* perks */}
      <section className="section-pad py-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {perks.map((p) => (
            <div key={p.title} className="rounded-3xl bg-white/70 border border-caramel/20 p-6">
              <div className="w-12 h-12 rounded-2xl bg-leaf/15 flex items-center justify-center mb-4">
                <p.icon className="w-6 h-6 text-leaf" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{p.title}</h3>
              <p className="text-sm text-espresso/70">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* quote form */}
      <section id="samples" className="section-pad py-16">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 items-start">
          <div>
            <Eyebrow color="leaf">
              <Leaf className="w-4 h-4" /> Get a quote
            </Eyebrow>
            <h2 className="font-display text-4xl font-bold mt-4">
              Tell us what you need.
            </h2>
            <p className="text-espresso/70 mt-4">
              Quote requests come with free samples by default. We typically reply within
              one business day.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Custom volume pricing",
                "Custom printing on 100,000+ cups",
                "Free samples of every size",
                "Freight to the US & Canada",
                "Net terms available for established accounts",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 font-semibold text-espresso/80">
                  <span className="w-6 h-6 rounded-full bg-leaf flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-cream" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <LeadForm
            type="wholesale"
            submitLabel="Request quote & samples"
            successTitle="Quote request received!"
            successText="We'll send your tailored pricing and free samples shortly."
            fields={[
              { name: "name", label: "Your name", required: true },
              { name: "company", label: "Business name", required: true },
              { name: "email", label: "Email", type: "email", required: true },
              { name: "phone", label: "Phone", type: "tel" },
              {
                name: "volume",
                label: "Estimated monthly volume",
                type: "select",
                options: ["1–9 cases", "10–49 cases", "50–199 cases", "200+ cases"],
                required: true,
              },
              {
                name: "sizes",
                label: "Sizes you're interested in",
                type: "select",
                options: ["8oz", "12oz", "16oz", "A mix of sizes"],
              },
              {
                name: "printing",
                label: "Custom printing?",
                type: "select",
                options: ["No — blank cups", "Yes — 100,000+ cups with our artwork", "Not sure yet"],
              },
              { name: "message", label: "Anything else?", type: "textarea" },
            ]}
          />
        </div>
      </section>
    </>
  );
}
