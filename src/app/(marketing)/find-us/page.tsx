import type { Metadata } from "next";
import { ArrowRight, Coffee, Store, Megaphone } from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { Particles } from "@/components/brand";
import { LeadForm } from "@/components/lead-form";
import { StoreLocator } from "@/components/store-locator/locator";
import { stockists } from "@/lib/stockists";

export const metadata: Metadata = {
  title: "Find us",
  description: "Find cafés and shops pouring cupcasa home-compostable cups near you. Search by city or postal code, or nominate your local café.",
};

export default function FindUsPage() {
  const featured = stockists.filter((s) => s.featured);
  const cities = [...new Set(stockists.map((s) => s.city))];

  return (
    <>
      {/* hero */}
      <section className="section-pad pt-12 pb-8">
        <div className="max-w-3xl">
          <span className="label-caps text-coral">Store locator</span>
          <h1 className="font-display text-5xl sm:text-6xl mt-4 leading-[0.98]">
            Looking for cupcasa <span className="text-coral">IRL?</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-5 max-w-xl">
            Find a café pouring our home-compostable cups near you. Search by city or postal
            code, or let your phone do the finding.
          </p>
          <p className="flex items-center gap-2 text-sm text-espresso/50 mt-4">
            <Particles className="w-6 h-4 text-coral" />
            {stockists.length} locations across {cities.length} cities — and growing.
          </p>
        </div>
      </section>

      {/* locator */}
      <section className="section-pad pb-12">
        <StoreLocator />
      </section>

      {/* featured row (Bloom-style retailer strip) */}
      {featured.length > 0 && (
        <section className="section-pad py-8">
          <Reveal>
            <div className="rounded-[2.5rem] bg-cream-deep/60 border border-espresso/8 p-8 sm:p-10">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                  <span className="label-caps text-coral">Pouring cupcasa</span>
                  <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">Featured cafés.</h2>
                </div>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 rounded-3xl bg-white/70 border border-espresso/8 p-4">
                    <div className="w-12 h-12 rounded-2xl bg-coral/15 flex items-center justify-center shrink-0">
                      <Coffee className="w-6 h-6 text-coral" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-extrabold leading-tight truncate">{s.name}</div>
                      <div className="text-sm text-espresso/60">{s.city}, {s.province}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
      )}

      {/* two CTAs: cafés + customers */}
      <section className="section-pad py-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-12">
            <div className="w-12 h-12 rounded-2xl bg-coral/20 flex items-center justify-center mb-5">
              <Store className="w-6 h-6 text-coral" strokeWidth={1.6} />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">Run a café?</h2>
            <p className="text-cream/65 mt-3 max-w-md">
              Get on the map. Reserve cups, or request free samples and wholesale pricing — and
              we&apos;ll list you here the day your first case lands.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Button href="/shop" variant="primary" size="md">Reserve cups <ArrowRight className="w-4 h-4" /></Button>
              <Button href="/wholesale" variant="cream" size="md">Free samples</Button>
            </div>
          </div>
          <div id="nominate" className="rounded-[2.5rem] bg-white/70 border border-espresso/8 p-8 sm:p-12 scroll-mt-24">
            <div className="w-12 h-12 rounded-2xl bg-leaf/15 flex items-center justify-center mb-5">
              <Megaphone className="w-6 h-6 text-leaf" strokeWidth={1.6} />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">Nominate your café.</h2>
            <p className="text-espresso/65 mt-3 mb-6 max-w-md">
              Don&apos;t see your favourite spot? Tell us where you&apos;d like to see cupcasa and
              we&apos;ll send them samples.
            </p>
            <LeadForm
              type="nominate-cafe"
              submitLabel="Send nomination"
              successTitle="Thanks — we're on it!"
              successText="We'll reach out to the café with samples and let you know when they're pouring cupcasa."
              fields={[
                { name: "cafe", label: "Café name", required: true },
                { name: "cafe_city", label: "City / neighbourhood", required: true },
                { name: "email", label: "Your email (optional, so we can tell you when they switch)", type: "email" },
                { name: "message", label: "Anything else?", type: "textarea" },
              ]}
            />
          </div>
        </div>
      </section>
    </>
  );
}
