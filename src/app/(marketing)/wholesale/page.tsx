import type { Metadata } from "next";
import { Package, Gift, Truck, Leaf, Check, Printer, Sparkles } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import { cafeRows, CAFE_OFFER, dollars } from "@/lib/cafe-offer";
import { MIN_TRIO_CENTS } from "@/lib/packs";

export const metadata: Metadata = {
  title: "For Cafés — Pricing & Cup Casa OS",
  description:
    "Café pricing on compostable PHA cups: 18, 20 and 22¢ a cup by the case of 1,000, or 27–31¢ for the set with a lid and a printed sleeve. Cup Casa OS at no charge. New cafés get their first 100 cups, lids and sleeves free. Custom-printed cups at 100,000+.",
};

const perks = [
  { icon: Sparkles, title: "Cup Casa OS free", text: "Reorder autopilot, costing, compliance and brand tools, bundled with your cups." },
  { icon: Gift, title: "First 100 free", text: "A hundred cups, lids and custom sleeves, free — for working cafés, before you spend anything." },
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
            order cups. Your first hundred — cups, lids and sleeves — are free.
          </p>
          <div className="mt-8">
            <a
              href="#free-100"
              className="btn-pill bg-coral text-white px-6 py-3.5 text-lg hover:bg-coral-deep"
            >
              <Gift className="w-5 h-5" /> Claim your free hundred
            </a>
          </div>
        </div>
      </section>

      {/* the free hundred — the first thing a café should see it can do */}
      <section id="free-100" className="section-pad py-10 scroll-mt-24">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-12">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 items-start">
            <div>
              <Eyebrow color="coral">
                <Gift className="w-4 h-4" /> Free for new cafés
              </Eyebrow>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold mt-5 leading-[0.95]">
                Try us with a<br />
                <span className="text-coral">hundred, free.</span>
              </h2>
              <p className="text-cream/75 mt-6">
                {CAFE_OFFER.trialCount} cups, {CAFE_OFFER.trialCount} lids and{" "}
                {CAFE_OFFER.trialCount} sleeves printed with your own artwork. Free, including
                freight, for a café that has not ordered from us before — a hundred complete
                servings, enough to run a week of mornings and hear what your regulars say.
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  "A hundred of each — cup, lid and printed sleeve",
                  "Your artwork on the sleeve, not ours",
                  "Freight included, US & Canada",
                  "No card, no deposit, nothing owed after",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 font-semibold">
                    <span className="w-6 h-6 rounded-full bg-leaf grid place-items-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-cream" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>

              {/*
               * Said plainly rather than buried. A hundred printed cups is real money, and a
               * café would rather know the rule up front than be refused after filling a form.
               */}
              <div className="mt-8 rounded-2xl bg-cream/10 border border-cream/15 p-5">
                <p className="font-display text-lg font-bold">One per café, and we do check.</p>
                <p className="text-sm text-cream/70 mt-2">
                  This is for working cafés. A website or an Instagram with your address on it is
                  all we need — we are not asking for paperwork, we just cannot send a hundred
                  printed cups to somebody&apos;s kitchen. If you are not a café but you want to
                  try the cups,{" "}
                  <a href="/shop" className="underline font-semibold text-cream">
                    a pack of 100 is {MIN_TRIO_CENTS}¢ a set
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-cream text-espresso p-6 sm:p-8">
              <p className="font-display text-2xl font-extrabold">Tell us about your café</p>
              <p className="text-sm text-espresso/65 mt-2">
                We reply within one business day, and the box goes out the same week.
              </p>
              <div className="mt-5">
                <LeadForm
                  type="trial"
                  submitLabel="Send my free hundred"
                  successTitle="On its way to being checked."
                  successText="We'll look you up and come back within one business day. If anything is missing we'll just ask."
                  fields={[
                    { name: "company", label: "Café name", required: true },
                    { name: "proof", label: "Website or Instagram", required: true },
                    { name: "address", label: "Street address", required: true, full: true },
                    { name: "city", label: "City & province/state", required: true },
                    { name: "phone", label: "Café phone", type: "tel", required: true },
                    { name: "name", label: "Your name", required: true },
                    {
                      name: "role",
                      label: "Your role",
                      type: "select",
                      required: true,
                      options: ["Owner", "Manager", "Barista", "Something else"],
                    },
                    { name: "email", label: "Email", type: "email", required: true, full: true },
                    {
                      name: "volume",
                      label: "Roughly how many cups a week?",
                      type: "select",
                      required: true,
                      options: ["Under 500", "500–1,000", "1,000–3,000", "3,000–10,000", "10,000+"],
                      full: true,
                    },
                  ]}
                />
              </div>
            </div>
          </div>
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
              <div className="mt-4 pt-4 border-t border-espresso/10 flex items-baseline justify-between">
                <span className="text-espresso/70 text-sm">The set</span>
                <span className="font-display font-bold text-2xl">{row.perServeCents}¢</span>
              </div>
              <p className="text-xs text-espresso/45 mt-2">
                Cup, lid and your printed sleeve. Cup and sleeve {row.cupSleeveCents}¢, cup and
                lid {row.cupLidCents}¢.
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
            <p className="font-display text-3xl font-extrabold mt-2">{CAFE_OFFER.sleeveBrandedCents}¢</p>
            <p className="text-sm text-espresso/70 mt-2">
              Printed with your artwork on our own UV press, so there is no minimum run. Blank
              stock, white or kraft, is {CAFE_OFFER.sleevePlainCents}¢.
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
              If you have not ordered from us before, ask for the free hundred and we will send
              it with your pricing. We typically reply within one business day.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Published pricing, no negotiation",
                "Custom-printed cups at 100,000+",
                "Custom sleeves at any quantity",
                "First 100 cups, lids and sleeves free",
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
