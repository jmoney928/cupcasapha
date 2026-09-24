import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator as CalcIcon } from "lucide-react";
import { Button } from "@/components/ui";
import { SwitchCalculator } from "@/components/calculator/switch-calculator";
import { SURVEY } from "@/lib/calc/survey";

export const metadata: Metadata = {
  title: "Switch calculator — what a compostable cup is worth to your café",
  description:
    "Work out what switching to Cup Casa's certified home-compostable cups costs you and earns you. 98% of 167 Victoria coffee drinkers said they'd pay $0.15 more.",
  alternates: { canonical: "https://cupcasa.com/calculator" },
  openGraph: {
    title: "What's a compostable cup worth to your café?",
    description: "Enter your numbers. See what the switch costs, what it earns, and what you keep.",
    url: "https://cupcasa.com/calculator",
  },
};

export default function CalculatorPage() {
  return (
    <>
      <section className="section-pad pt-12 pb-8">
        <div className="max-w-3xl">
          <span className="label-caps text-coral">For café owners</span>
          <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl mt-4 leading-[1]">
            What&apos;s a better cup <span className="text-coral">actually worth?</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-5">
            Put in your own numbers. We&apos;ll show you what the switch costs in cups, what it earns
            back at the till, and what you keep. No email needed to see the answer.
          </p>
        </div>
      </section>

      <section className="section-pad pb-12">
        <SwitchCalculator />
      </section>

      <section className="section-pad py-12">
        <div className="rounded-[2.5rem] bg-cream-deep/60 border border-espresso/8 p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <span className="label-caps text-coral">Where the {SURVEY.results[2].pct}% comes from</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-3">
                We didn&apos;t model this. We asked.
              </h2>
              <p className="text-espresso/70 mt-4">
                Most suppliers will tell you customers care about sustainability. We spent a few days on
                the Inner Harbour asking {SURVEY.respondents} coffee drinkers a single question, and{" "}
                {SURVEY.agreed} of them said yes. The calculator uses that measured figure, never a
                rounder, friendlier one.
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <Button href="/launch" variant="primary" size="md">
                  Become a launch café <ArrowRight className="w-4 h-4" />
                </Button>
                <Button href="/why-pha" variant="outline" size="md">
                  Why PHA
                </Button>
              </div>
            </div>
            <div className="rounded-3xl bg-white/70 border border-espresso/8 p-6">
              <CalcIcon className="w-7 h-7 text-coral mb-3" strokeWidth={1.6} />
              <p className="font-display text-lg font-extrabold">What the numbers assume</p>
              <ul className="mt-3 space-y-2 text-sm text-espresso/70">
                <li>Cup prices are our live list prices, before tax and delivery.</li>
                <li>Revenue assumes customers keep buying at the higher price, at the rate we measured.</li>
                <li>Nothing here models labour, waste or your drink mix — it&apos;s cups and price only.</li>
                <li>If the honest answer is a loss, we show you the loss.</li>
              </ul>
              <p className="mt-4 text-xs text-espresso/50">
                Want it checked against your actual invoices?{" "}
                <Link href="/launch#contact" className="underline font-semibold">Send them over</Link> and we&apos;ll do it with you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
