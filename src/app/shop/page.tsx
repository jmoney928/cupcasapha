import type { Metadata } from "next";
import { Leaf, Truck, Recycle, ShieldCheck } from "lucide-react";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { Reveal, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Shop PHA Cups",
  description:
    "Blank, fully compostable PHA cups in 8oz, 12oz, and 16oz double wall. Sold by the case of 1,000. Buy online or order wholesale.",
};

const perks = [
  { icon: Truck, text: "Ships by the case of 1,000" },
  { icon: Leaf, text: "Home, industrial & marine compostable" },
  { icon: Recycle, text: "100% plastic-free PHA" },
  { icon: ShieldCheck, text: "Blank — your brand, or none at all" },
];

export default function ShopPage() {
  return (
    <>
      <section className="section-pad pt-12 pb-8 text-center relative overflow-hidden">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[40rem] h-72 rounded-full bg-leaf-bright/15 blur-3xl" />
        <div className="relative">
          <Eyebrow color="coral">The shop</Eyebrow>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5">
            Pick your cups.
          </h1>
          <p className="text-lg text-espresso/70 mt-4 max-w-xl mx-auto">
            Every cup is 100% PHA and totally blank. Sold by the case of 1,000 —
            need more? <a href="/wholesale" className="text-coral font-semibold underline">Go wholesale</a>.
          </p>
        </div>
      </section>

      <section className="section-pad pb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {perks.map((p) => (
            <div
              key={p.text}
              className="flex items-center gap-3 bg-white/60 border border-caramel/20 rounded-2xl px-4 py-3 text-sm font-semibold text-espresso/80"
            >
              <p.icon className="w-5 h-5 text-leaf shrink-0" />
              {p.text}
            </div>
          ))}
        </div>
      </section>

      <section className="section-pad py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={i * 100}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
