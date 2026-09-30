import type { Metadata } from "next";
import { Suspense } from "react";
import { Leaf, Package, Palette, Recycle } from "lucide-react";
import { MIN_TRIO_CENTS } from "@/lib/packs";
import { STEP_COUNT } from "@/lib/bundle";
import { CERT_SHORT, MATERIAL_SHORT } from "@/lib/certs";
import { BundleBuilder } from "@/components/bundle/builder";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Build Your Bundle",
  description: `Build a bundle of PHA-lined paper cups, lids and custom-printed sleeves — 8oz, 12oz or 16oz, by the pack or by the case. Design the sleeve as you go. Certified home compostable by TÜV Rheinland. From ${MIN_TRIO_CENTS}¢ a set.`,
};

const perks = [
  { icon: Package, text: "Cups, sleeves and lids in one bundle" },
  { icon: Leaf, text: CERT_SHORT },
  { icon: Recycle, text: MATERIAL_SHORT },
  { icon: Palette, text: "Design the sleeve as you go — or skip it" },
];

export default function ShopPage() {
  return (
    <>
      <section className="section-pad pt-12 pb-8">
        <div className="max-w-2xl">
          <Eyebrow color="coral">
            <Package className="w-4 h-4" /> Build your bundle
          </Eyebrow>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5 leading-[0.95]">
            {STEP_COUNT} steps to
            <br />
            <span className="text-coral">your own cup.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-6">
            Tell us who they are for, pick a size, choose what goes in the set, say how many, and
            put your name on the sleeve. From <strong>{MIN_TRIO_CENTS}¢ a set</strong> by the pack,
            or café pricing by the case — arriving <strong>December 2026</strong>.
          </p>
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-7">
          {perks.map((p) => (
            <li
              key={p.text}
              className="flex items-center gap-2 text-sm font-semibold text-espresso/70"
            >
              <p.icon className="w-4 h-4 text-leaf shrink-0" />
              {p.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="section-pad pb-20">
        {/* The builder reads the URL itself on mount; the boundary stays as a safety net. */}
        <Suspense fallback={<div className="h-12 rounded-full bg-espresso/5 animate-pulse" />}>
          <BundleBuilder />
        </Suspense>
      </section>
    </>
  );
}
