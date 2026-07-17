import type { Metadata } from "next";
import { Leaf, Truck, Recycle, ShieldCheck } from "lucide-react";
import { blankProducts, printedProducts } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/ui";

export const metadata: Metadata = {
  title: "Shop PHA Cups",
  description:
    "Fully compostable PHA cups in 8oz, 12oz and 16oz — blank or custom-printed with your brand. Sold by the case of 1,000. Reserve with a $200 deposit.",
};

const perks = [
  { icon: Truck, text: "Ships by the case of 1,000" },
  { icon: Leaf, text: "TÜV certified — home & marine compostable" },
  { icon: Recycle, text: "100% plastic-free PHA" },
  { icon: ShieldCheck, text: "Blank or custom-printed" },
];

export default function ShopPage() {
  return (
    <>
      <section className="section-pad pt-12 pb-8 text-center">
        <span className="label-caps text-coral">The shop</span>
        <h1 className="font-display text-5xl sm:text-6xl mt-4">Pick your cups.</h1>
        <p className="text-lg text-espresso/70 mt-4 max-w-xl mx-auto">
          Blank or custom-printed, 100% PHA, sold by the case of 1,000. Reserve now
          with a <strong>$200 deposit</strong> — cups arriving{" "}
          <strong>October 2026</strong>. Need volume?{" "}
          <a href="/wholesale" className="text-coral font-semibold underline">Go wholesale</a>.
        </p>
      </section>

      <section className="section-pad pb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {perks.map((p) => (
            <div
              key={p.text}
              className="flex items-center gap-3 bg-cream-deep/50 border border-espresso/8 rounded-2xl px-4 py-3 text-sm font-semibold text-espresso/80"
            >
              <p.icon className="w-5 h-5 text-coral shrink-0" />
              {p.text}
            </div>
          ))}
        </div>
      </section>

      {/* Custom printed */}
      <section className="section-pad py-10">
        <div className="mb-6">
          <span className="label-caps text-coral">Custom printed</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">
            Your design, on the cup.
          </h2>
          <p className="text-espresso/60 mt-2 max-w-xl">
            Full-colour printing with your artwork (+$0.05/cup). Send your design after
            you reserve, or{" "}
            <a href="/wholesale" className="text-coral font-semibold underline">start a design</a>.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {printedProducts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Blank */}
      <section className="section-pad py-10">
        <div className="mb-6">
          <span className="label-caps text-coral">Blank cups</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">
            Ready to go, unbranded.
          </h2>
          <p className="text-espresso/60 mt-2 max-w-xl">
            Clean, undecorated PHA cups — perfect as-is, or add your own sleeve or stamp.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blankProducts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
