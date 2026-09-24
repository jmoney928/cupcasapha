import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Coins, Lock, Package, ShieldCheck, Sparkles } from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { Particles } from "@/components/brand";
import { byPillar, liveCount, OS_MODULES, PILLARS, pricedModules, STATUS_LABELS, verifiedStackTotal, type ModuleStatus } from "@/lib/os/modules";

export const metadata: Metadata = {
  title: "Cup Casa OS — the software that comes with the cups",
  description:
    "Margin, ordering, compliance and brand tools for cafés. Recipe costing, reorder by text, WHMIS paperwork and a brand kit — included with your cups, not sold separately.",
  alternates: { canonical: "https://cupcasa.com/os" },
  openGraph: {
    title: "Cup Casa OS — included with your cups",
    description: "Margin · Ordering · Compliance · Brand. The software a café supplier should have been giving you all along.",
    url: "https://cupcasa.com/os",
  },
};

const PILLAR_ICONS = { margin: Coins, ordering: Package, compliance: ShieldCheck, brand: Sparkles } as const;

const statusChip = (s: ModuleStatus) =>
  s === "live" ? "bg-leaf/15 text-leaf" : s === "building" ? "bg-butter/50 text-cocoa" : "bg-caramel/20 text-cocoa";

export default function OsPage() {
  const priced = pricedModules();
  const total = verifiedStackTotal();

  return (
    <>
      {/* hero */}
      <section className="section-pad pt-12 pb-8">
        <div className="max-w-3xl">
          <span className="label-caps text-coral">Cup Casa OS</span>
          <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl mt-4 leading-[1]">
            The software your cup supplier <span className="text-coral">should have been giving you.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-5">
            Know what every drink costs. Never run out of cups. Have the paperwork an inspector asks for.
            Put your logo on everything without hiring a designer. It comes with the cups — we don&apos;t sell it
            separately and we never will.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button href="/launch" variant="primary" size="lg">
              Become a launch café <ArrowRight className="w-5 h-5" />
            </Button>
            <Button href="/calculator" variant="outline" size="lg">Run your numbers</Button>
          </div>
          <p className="flex items-center gap-2 text-sm text-espresso/50 mt-6">
            <Particles className="w-6 h-4 text-coral" />
            {liveCount()} tools ready today. The rest arrive with your first order.
          </p>
        </div>
      </section>

      {/* the invoice line */}
      <section className="section-pad py-8">
        <Reveal>
          <div className="rounded-[2.5rem] bg-espresso text-cream p-8 sm:p-12">
            <span className="label-caps text-coral">How it shows up</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-3 text-cream">
              A line on your invoice, every month.
            </h2>
            <div className="mt-7 rounded-2xl bg-cream/5 border border-cream/10 p-5 font-mono text-sm sm:text-base">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-cream/80">Cup Casa OS — Margin · Ordering · Compliance · Brand</span>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-cream/10 pt-2">
                <span className="text-cream/55">
                  {priced.length > 0 ? `Comparable tools retail from $${total}/mo` : "Comparable tools retail separately"}
                </span>
                <span className="font-bold text-leaf-bright">INCLUDED &nbsp; $0.00</span>
              </div>
            </div>
            {priced.length > 0 && (
              <p className="text-cream/45 text-xs mt-3">
                That figure counts only the parts where we can point you at a real product to price yourself
                ({priced.map((m) => m.name.toLowerCase()).join(", ")}). Everything else on this page is included too —
                we&apos;d rather understate it than be caught inflating a number.
              </p>
            )}
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {[
                { icon: Lock, t: "Never sold separately", d: "You can't buy it without buying cups. That's the deal, and it's why it stays free." },
                { icon: Check, t: "Never a reason to discount cups", d: "The software is what lets us hold our price instead of racing cheaper suppliers to the bottom." },
                { icon: Package, t: "Yours while you're a customer", d: "Stop ordering and it goes read-only — your data stays, and you can export all of it, any time." },
              ].map((r) => (
                <div key={r.t} className="rounded-2xl bg-cream/5 p-4">
                  <r.icon className="w-5 h-5 text-coral mb-2" strokeWidth={1.6} />
                  <p className="font-display font-extrabold">{r.t}</p>
                  <p className="text-cream/60 text-sm mt-1">{r.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* pillars + modules */}
      <section className="section-pad py-12">
        <div className="max-w-2xl mb-8">
          <span className="label-caps text-coral">What&apos;s in it</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-3">
            Four things, and they all point the same way.
          </h2>
          <p className="text-espresso/70 mt-3">
            Every part of this exists to make you more money per cup than we cost you. If a tool doesn&apos;t do
            that, it isn&apos;t here. Tap any of them for the detail.
          </p>
        </div>

        <div className="space-y-5">
          {(Object.keys(PILLARS) as (keyof typeof PILLARS)[]).map((key, i) => {
            const Icon = PILLAR_ICONS[key];
            const modules = byPillar(key);
            return (
              <Reveal key={key} delay={i * 60}>
                <div className="rounded-[2rem] border border-espresso/10 bg-white/70 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-coral/12 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-coral" strokeWidth={1.6} />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-extrabold">{PILLARS[key].label}</h3>
                      <p className="text-espresso/65">{PILLARS[key].line}</p>
                    </div>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2 mt-6">
                    {modules.map((m) => (
                      <li key={m.id}>
                        <details className="group rounded-2xl bg-cream/50 transition-colors open:bg-cream/80 sm:h-full">
                          <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-display font-extrabold">{m.name}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusChip(m.status)}`}>
                                  {STATUS_LABELS[m.status]}
                                </span>
                              </span>
                              <span className="mt-1 block text-sm text-espresso/65">{m.blurb}</span>
                            </span>
                            <span
                              aria-hidden
                              className="mt-0.5 shrink-0 text-xl leading-none text-coral transition-transform duration-200 group-open:rotate-45"
                            >
                              +
                            </span>
                          </summary>
                          <div className="px-4 pb-4 -mt-1">
                            <p className="border-t border-espresso/10 pt-3 text-sm leading-relaxed text-espresso/75">
                              {m.detail}
                            </p>
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* how you get in */}
      <section className="section-pad py-10">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2.5rem] bg-cream-deep/60 border border-espresso/8 p-8 sm:p-10">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold">How you get in</h2>
            <ol className="mt-5 space-y-4">
              {[
                ["Order cups", "There's no signup form. Your account is created when your first order is confirmed."],
                ["Set it up once", "Confirm your details, connect Square if you use it, and everything else fills itself in."],
                ["That's it", "No per-seat pricing, no add-ons, no upsell email in six months."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-display text-2xl font-extrabold text-coral leading-none">{i + 1}</span>
                  <span>
                    <span className="block font-display text-lg font-extrabold">{t}</span>
                    <span className="block text-sm text-espresso/65">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[2.5rem] bg-coral text-white p-8 sm:p-10 flex flex-col justify-center">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
              Try the part that works before you buy anything.
            </h2>
            <p className="text-white/85 mt-3">
              The switch calculator is open to anyone. Put in your own numbers and see what a better cup is
              worth to your café — no email, no account.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Button href="/calculator" variant="cream" size="md">
                Open the calculator <ArrowRight className="w-4 h-4" />
              </Button>
              <Button href="/launch" variant="dark" size="md">Talk to us</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad pb-14">
        <p className="text-xs text-espresso/50 max-w-3xl">
          Cup Casa OS is included with cup orders and is not sold separately. Tools marked{" "}
          <b>{STATUS_LABELS.building}</b> and <b>{STATUS_LABELS.planned}</b> are in development; nothing on this page
          is a commitment to a delivery date. Comparable retail figures reference third-party products a café can
          price independently and are shown only where such a comparison exists.{" "}
          <Link href="/launch" className="underline font-semibold">Ask us</Link> if you want to see any of it working
          before you order.
        </p>
      </section>
    </>
  );
}
