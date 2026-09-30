import type { Metadata } from "next";
import Link from "next/link";
import { StandaloneSleeveEditor } from "@/components/sleeve/standalone";
import { SLEEVE_DIELINES } from "@/lib/sleeve/dielines";
import { Eyebrow } from "@/components/ui";
import { Palette } from "lucide-react";

export const metadata: Metadata = {
  title: "Design Your Sleeve",
  description:
    "Put your name or logo on a cupcasa sleeve and download a print-ready file at true size. Built on the real dieline — 8oz, 12oz and 16oz, with bleed, glue lap and crop marks.",
};

export default function SleevePage() {
  const sizes = Object.values(SLEEVE_DIELINES);
  return (
    <>
      <section className="section-pad pt-12 pb-8">
        <div className="max-w-2xl">
          <Eyebrow color="coral">
            <Palette className="w-4 h-4" /> Sleeve designer
          </Eyebrow>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5 leading-[0.95]">
            Your name on the cup,<br />
            <span className="text-coral">in about a minute.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-6">
            Add text, your logo and shapes, move them around, and download a print-ready file. It
            all sits on the real sleeve dieline — the same curved band our printer cuts — so what
            comes out is ready to print rather than a mock-up.
          </p>
          <p className="text-sm text-espresso/55 mt-4">
            Nothing is uploaded. Your logo stays on your own machine and the file is built in your
            browser. When you like it, <strong>Order this sleeve</strong> carries the design
            straight into the bundle builder — you will not have to draw it twice.
          </p>
        </div>
      </section>

      <section className="section-pad pb-12">
        <StandaloneSleeveEditor />
      </section>

      <section className="section-pad pb-16">
        <div className="rounded-[2rem] bg-espresso text-cream p-8 sm:p-12">
          <h2 className="font-display text-3xl font-extrabold">Why a sleeve, not a printed cup</h2>
          <p className="text-cream/70 mt-4 max-w-2xl">
            The cup is single wall, so a sleeve is what makes a hot drink comfortable to hold — and
            it is also the cheapest way to get your brand on it. We print sleeves in-house on a UV
            press, so there is no minimum and no setup fee. Printing the cup itself starts at
            100,000.
          </p>
          <dl className="grid sm:grid-cols-3 gap-4 mt-8">
            {sizes.map((d) => (
              <div key={d.size} className="rounded-2xl bg-cream/10 p-5">
                <dt className="font-display text-xl font-bold">{d.label}</dt>
                <dd className="text-cream/65 text-sm mt-2">
                  {Math.round(d.arcBottom)} × {d.bandHeight} mm of print, sitting {d.bandOnCup.from}–
                  {d.bandOnCup.to} mm above the base.
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/shop" className="btn-pill bg-coral text-white px-6 py-3 hover:bg-coral-deep">
              Build your bundle
            </Link>
            <Link href="/wholesale" className="btn-pill bg-cream text-espresso px-6 py-3 hover:bg-cream-deep">
              Café pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
