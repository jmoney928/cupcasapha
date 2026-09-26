import type { Metadata } from "next";
import { Package, Gift, Truck, Leaf, Check, Printer, Sparkles } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import { cafeRows, CAFE_OFFER, dollars } from "@/lib/cafe-offer";

export const metadata: Metadata = {
  title: "For Cafés — Pricing & Cup Casa OS",
  description:
    "Café pricing on compostable PHA cups: 15, 17 and 19¢ a cup by the case of 1,000, 5¢ lids, custom sleeves, 1,000 free with your first order, and Cup Casa OS at no charge. Custom-printed cups at 100,000+.",
};

const perks = [
  { icon: Sparkles, title: "Cup Casa OS free", text: "Reorder autopilot, costing, compliance and brand tools, bundled with your cups." },
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
          <Eyebrow color="coral">For cafés &amp; wholesale</Eyebrow>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5 leading-[0.95]">
            Everything your café<br />
            <span className="text-coral">needs, one price.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-6">
            One price, published. Cups by the case of 1,000, lids that fit every size, and
            sleeves printed with your brand — plus Cup Casa OS at no charge for as long as you
            order cups. Free samples before you commit a dollar.
          </p>
        </div>
      </section>

      {/* the offer */}
      <section className="section-pad py-6">
        <div className="mb-6">
          <span className="label-caps text-coral">Café pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">
            The whole offer, on one page.
          </h2>
          <p className="text-espresso/60 mt-2 max-w-xl">
            Sold by the case of {CAFE_OFFER.caseCount.toLocaleString()}. No tiers to negotiate and
            no minimum beyond a single case.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {cafeRows.map((row) => (
            <div key={row.size} className="rounded-3xl bg-cream-deep/50 border border-espresso/8 p-6">
              <div className="flex items-baseline justify-between">
                <p className="font-display text-2xl font-extrabold">{row.size}</p>
                <span className="label-caps text-espresso/40">{row.shortName}</span>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-espresso/70">Per cup</span>
                <span className="font-display font-bold text-coral text-2xl">{row.perCupCents}¢</span>
              </div>
              <p className="text-xs text-espresso/45 mt-4">
                {dollars(row.caseDollars)} per case of {CAFE_OFFER.caseCount.toLocaleString()}
              </p>
              <p className="text-xs text-espresso/45 mt-1">
                {row.perServeCents}¢ a drink with a lid and a sleeve
              </p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <div className="rounded-3xl bg-white/70 border border-caramel/20 p-6">
            <p className="label-caps text-coral">Lids</p>
            <p className="font-display text-3xl font-extrabold mt-2">{CAFE_OFFER.lidCents}¢</p>
            <p className="text-sm text-espresso/70 mt-2">
              One lid fits all three sizes, so there is only ever one lid to stock. With any cup
              order.
            </p>
          </div>
          <div className="rounded-3xl bg-white/70 border border-caramel/20 p-6">
            <p className="label-caps text-coral">Custom sleeves</p>
            <p className="font-display text-3xl font-extrabold mt-2">{CAFE_OFFER.sleeveWithCupsCents}¢</p>
            <p className="text-sm text-espresso/70 mt-2">
              Your first {CAFE_OFFER.freeSleeves.toLocaleString()} are free with your first cup
              order. After that it is {CAFE_OFFER.sleeveWithCupsCents}¢ a sleeve while you keep
              ordering cups, or {CAFE_OFFER.sleeveStandaloneCents}¢ on their own.
            </p>
          </div>
          <div className="rounded-3xl bg-espresso text-cream p-6">
            <p className="label-caps text-coral">Cup Casa OS</p>
            <p className="font-display text-3xl font-extrabold mt-2">Free</p>
            <p className="text-sm text-cream/70 mt-2">
              Reorder autopilot, recipe costing, the compliance binder and the brand kit —
              included, not upsold. <a href="/os" className="underline font-semibold">See what&apos;s in it</a>.
            </p>
          </div>
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
                Full-colour, edge-to-edge printing on the cup itself starts at
                {" "}{CAFE_OFFER.customCupMinimum.toLocaleString()} cups (100 cases, any mix of sizes).
                Below that, your branding goes on the sleeve — printed here, no minimum, no setup fee.
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
                "Published pricing, no negotiation",
                "Custom-printed cups at 100,000+",
                "Custom sleeves at any quantity",
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
                options: ["1–4 cases", "5–19 cases", "20–99 cases", "100+ cases"],
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
                options: [
                  "Custom sleeves",
                  "Custom-printed cups (100,000+)",
                  "Blank cups, no printing",
                  "Not sure yet",
                ],
              },
              { name: "message", label: "Anything else?", type: "textarea" },
            ]}
          />
        </div>
      </section>
    </>
  );
}
