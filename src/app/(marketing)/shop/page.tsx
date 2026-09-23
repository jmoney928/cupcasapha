import type { Metadata } from "next";
import { Leaf, Truck, Recycle, Layers } from "lucide-react";
import { products } from "@/lib/products";
import { CERT_SHORT, MATERIAL_SHORT } from "@/lib/certs";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/ui";

export const metadata: Metadata = {
  title: "Shop PHA Cups",
  description:
    "PHA-lined paper cups in 8oz, 12oz and 16oz — certified home compostable by DIN CERTCO, no PE, no PLA. Double wall, sold by the case of 1,000. Reserve with a $200 deposit.",
};

const perks = [
  { icon: Truck, text: "Ships by the case of 1,000" },
  { icon: Leaf, text: CERT_SHORT },
  { icon: Recycle, text: MATERIAL_SHORT },
  { icon: Layers, text: "Double wall — no sleeve needed" },
];

export default function ShopPage() {
  return (
    <>
      <section className="section-pad pt-12 pb-8 text-center">
        <span className="label-caps text-coral">The shop</span>
        <h1 className="font-display text-5xl sm:text-6xl mt-4">Pick your cups.</h1>
        <p className="text-lg text-espresso/70 mt-4 max-w-xl mx-auto">
          Blank, unbranded, PHA-lined paper — sold by the case of 1,000. Reserve now
          with a <strong>$200 deposit</strong> — cups arriving{" "}
          <strong>December 2026</strong>. Need volume?{" "}
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

      <section className="section-pad py-10">
        <div className="mb-6">
          <span className="label-caps text-coral">Three sizes</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">
            Ready to go, unbranded.
          </h2>
          <p className="text-espresso/60 mt-2 max-w-xl">
            Clean, undecorated PHA cups — perfect as-is, or add your own sleeve or stamp.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={i * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
