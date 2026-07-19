import type { Metadata } from "next";
import { Package, Gift, TrendingDown, Truck, Leaf, Check } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import { blankProducts, printedProducts, formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Wholesale & Bulk",
  description:
    "Wholesale PHA cups for cafés, chains and distributors — blank or custom-printed (+$0.05/cup). Tiered volume pricing, free samples, and dedicated support. Request a quote.",
};

const tiers = [
  { name: "Starter", range: "1–9 cases", discount: "List price", note: "Buy online instantly" },
  { name: "Café", range: "10–49 cases", discount: "Up to 8% off", note: "Best for single locations" },
  { name: "Volume", range: "50–199 cases", discount: "Up to 15% off", note: "Multi-site & growing brands" },
  { name: "Distributor", range: "200+ cases", discount: "Custom pricing", note: "Pallet & container freight" },
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
            Stock genuinely compostable cups — blank, or custom-printed with your brand —
            across your whole operation. Tell us what you need and we&apos;ll send a tailored
            quote, plus free samples to prove the quality.
          </p>
        </div>
      </section>

      {/* base pricing */}
      <section className="section-pad py-6">
        <div className="mb-6">
          <span className="label-caps text-coral">Per-cup pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">
            Blank, or printed with your brand.
          </h2>
          <p className="text-espresso/60 mt-2 max-w-xl">
            Every size is double-wall, sold by the case of 1,000. Custom printing adds a
            flat <strong className="text-coral">+$0.05/cup</strong> — full-colour, your
            artwork, edge-to-edge.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {blankProducts.map((blank, i) => {
            const printed = printedProducts[i];
            return (
              <div
                key={blank.slug}
                className="rounded-3xl bg-cream-deep/50 border border-espresso/8 p-6"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-2xl font-extrabold">{blank.size}</p>
                  <span className="label-caps text-espresso/40">Double wall</span>
                </div>
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-espresso/70">Blank</span>
                    <span className="font-display font-bold">
                      {formatPrice(blank.pricePerCup)}
                      <span className="text-espresso/50 text-sm font-normal">/cup</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-espresso/8 pt-2.5">
                    <span className="text-espresso/70">
                      Custom printed{" "}
                      <span className="text-coral text-xs font-bold">+$0.05</span>
                    </span>
                    <span className="font-display font-bold text-coral">
                      {formatPrice(printed.pricePerCup)}
                      <span className="text-coral/60 text-sm font-normal">/cup</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-espresso/45 mt-4">
                  {formatPrice(blank.casePrice)} blank ·{" "}
                  {formatPrice(printed.casePrice)} printed / case
                </p>
              </div>
            );
          })}
        </div>
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
              { name: "message", label: "Anything else?", type: "textarea" },
            ]}
          />
        </div>
      </section>
    </>
  );
}
