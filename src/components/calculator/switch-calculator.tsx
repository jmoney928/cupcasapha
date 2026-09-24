"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Info, Loader2 } from "lucide-react";
import { calculateRoi, roiSentence, ACCEPTANCE, PRICE_INCREASE_OPTIONS_CENTS, TYPICAL_CURRENT_CUP_COST_CENTS } from "@/lib/calc/roi";
import { formatCad, formatCadPrecise, toCents } from "@/lib/calc/money";
import { cupOption, cupOptions, DEFAULT_CUP_SIZE, type CupSize } from "@/lib/calc/catalog";
import { SURVEY } from "@/lib/calc/survey";

const field = "w-full rounded-xl border border-espresso/15 bg-white px-3 py-2.5 text-base outline-none focus:border-espresso";
const chip = (active: boolean) =>
  `rounded-full px-3.5 py-1.5 text-sm font-bold transition ${active ? "bg-espresso text-cream" : "bg-white text-espresso border border-espresso/15 hover:bg-cream-deep"}`;

export function SwitchCalculator() {
  const [cupsPerDay, setCupsPerDay] = useState(250);
  const [daysOpen, setDaysOpen] = useState(7);
  const [drinkPrice, setDrinkPrice] = useState("5.75");
  const [cupCost, setCupCost] = useState("0.14");
  const [increaseCents, setIncreaseCents] = useState<number>(15);
  const [size, setSize] = useState<CupSize>(DEFAULT_CUP_SIZE);
  const [conservative, setConservative] = useState(false);

  const cup = cupOption(size);

  const result = useMemo(() => {
    const safe = (v: string, fallback: number) => {
      try { return toCents(v); } catch { return fallback; }
    };
    return calculateRoi({
      cupsPerDay,
      daysOpenPerWeek: daysOpen,
      currentCupCostCents: safe(cupCost, TYPICAL_CURRENT_CUP_COST_CENTS),
      cupcasaCupCostCents: cup.pricePerCupCents,
      drinkPriceCents: safe(drinkPrice, 575),
      priceIncreaseCents: increaseCents,
      acceptance: conservative ? ACCEPTANCE.conservative : ACCEPTANCE.measured,
    });
  }, [cupsPerDay, daysOpen, cupCost, drinkPrice, increaseCents, conservative, cup.pricePerCupCents]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
      {/* ---------------- inputs ---------------- */}
      <div className="rounded-3xl border border-espresso/10 bg-white/70 p-5">
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 flex items-baseline justify-between">
              <span className="font-bold">Cups a day</span>
              <span className="font-display text-xl font-extrabold">{cupsPerDay.toLocaleString("en-CA")}</span>
            </span>
            <input
              type="range" min={25} max={1500} step={25} value={cupsPerDay}
              onChange={(e) => setCupsPerDay(Number(e.target.value))}
              className="w-full accent-coral"
              aria-label="Cups a day"
            />
            <input
              type="number" min={0} max={20000} value={cupsPerDay}
              onChange={(e) => setCupsPerDay(Math.max(0, Number(e.target.value)))}
              className={`${field} mt-2`} inputMode="numeric" aria-label="Cups a day, exact"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block font-bold">Drink price</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40">$</span>
                <input value={drinkPrice} onChange={(e) => setDrinkPrice(e.target.value)} inputMode="decimal" className={`${field} pl-7`} aria-label="Average drink price" />
              </div>
              <span className="mt-1 block text-xs text-espresso/50">Your signature latte</span>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-bold">Days open</span>
              <input
                type="number" min={1} max={7} value={daysOpen}
                onChange={(e) => setDaysOpen(Math.min(7, Math.max(1, Number(e.target.value))))}
                className={field} inputMode="numeric" aria-label="Days open per week"
              />
              <span className="mt-1 block text-xs text-espresso/50">per week</span>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 flex items-baseline justify-between">
              <span className="font-bold">Your cup cost now</span>
              <button type="button" onClick={() => setCupCost((TYPICAL_CURRENT_CUP_COST_CENTS / 100).toFixed(2))} className="text-xs font-bold text-coral underline-offset-2 hover:underline">
                Not sure?
              </button>
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40">$</span>
              <input value={cupCost} onChange={(e) => setCupCost(e.target.value)} inputMode="decimal" className={`${field} pl-7`} aria-label="Current cup cost" />
            </div>
            <span className="mt-1 block text-xs text-espresso/50">Per cup, what you pay today</span>
          </label>

          <div>
            <span className="mb-2 block font-bold">Add to the drink price</span>
            <div className="flex flex-wrap gap-2">
              {PRICE_INCREASE_OPTIONS_CENTS.map((cents) => (
                <button key={cents} type="button" onClick={() => setIncreaseCents(cents)} className={chip(increaseCents === cents)}>
                  +{formatCadPrecise(cents)}
                </button>
              ))}
              <button type="button" onClick={() => setIncreaseCents(0)} className={chip(increaseCents === 0)}>
                No increase
              </button>
            </div>
          </div>

          <div>
            <span className="mb-2 block font-bold">Cup size</span>
            <div className="flex flex-wrap gap-2">
              {cupOptions.map((o) => (
                <button key={o.sizeOz} type="button" onClick={() => setSize(o.sizeOz)} className={chip(size === o.sizeOz)}>
                  {o.label} · {formatCadPrecise(o.pricePerCupCents)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-cream p-3 text-sm">
            <input type="checkbox" checked={conservative} onChange={(e) => setConservative(e.target.checked)} className="mt-0.5 h-4 w-4 accent-leaf" />
            <span>
              <span className="font-bold">Run it conservatively</span>
              <span className="block text-xs text-espresso/60">
                Assume {Math.round(ACCEPTANCE.conservative * 100)}% of customers accept the increase instead of the{" "}
                {Math.round(ACCEPTANCE.measured * 100)}% our survey measured.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* ---------------- result ---------------- */}
      <div className="space-y-5">
        <div className={`rounded-3xl border-2 p-6 ${result.isNetLoss ? "border-espresso/20 bg-white/70" : "border-leaf/40 bg-leaf/5"}`}>
          {result.isNetLoss ? (
            <>
              <div className="label-caps text-caramel">On these numbers</div>
              <p className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                The cups cost you {formatCad(Math.abs(result.netGainCents))} a year more than they bring in.
              </p>
              <p className="mt-3 text-espresso/70">
                That&apos;s the honest arithmetic, and we&apos;d rather show it than dress it up.{" "}
                {increaseCents === 0
                  ? "Most cafés close the gap with a small price increase — try +$0.15 above, which is what our survey tested."
                  : "A slightly larger increase closes it. So does the part this calculator can't price: being the only café in town serving a certified home-compostable cup."}
              </p>
            </>
          ) : (
            <>
              <div className="label-caps text-caramel">Net annual gain</div>
              <div className="font-display text-5xl font-extrabold tracking-tight text-leaf sm:text-6xl">
                {formatCad(result.netGainCents)}
              </div>
              <p className="mt-3 text-espresso/75">{roiSentence(result, formatCad)}</p>
            </>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-espresso/10 pt-4 text-sm">
            <div>
              <div className="label-caps text-caramel">{result.addedCupCostCents >= 0 ? "Added cup cost" : "Cup cost saved"}</div>
              <div className="font-display text-xl font-extrabold">{formatCad(Math.abs(result.addedCupCostCents))}</div>
              <div className="text-xs text-espresso/50">per year</div>
            </div>
            <div>
              <div className="label-caps text-caramel">Added revenue</div>
              <div className="font-display text-xl font-extrabold">{formatCad(result.addedRevenueCents)}</div>
              <div className="text-xs text-espresso/50">per year</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-espresso/50">
            Based on {result.annualCups.toLocaleString("en-CA")} cups a year and {Math.round(result.acceptance * 100)}% of
            customers accepting the increase. Before tax and delivery.
          </p>
        </div>

        {/* per-cup table — owners think in cents per cup */}
        <div className="overflow-hidden rounded-3xl border border-espresso/10 bg-white/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso/15">
                <th className="px-4 py-3 text-left label-caps text-caramel">Per cup</th>
                <th className="px-4 py-3 text-right label-caps text-caramel">Now</th>
                <th className="px-4 py-3 text-right label-caps text-caramel">With Cup Casa</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-espresso/10">
                <td className="px-4 py-3 font-semibold">Cup cost</td>
                <td className="px-4 py-3 text-right">{formatCadPrecise(result.perCup.currentCupCostCents)}</td>
                <td className="px-4 py-3 text-right">{formatCadPrecise(result.perCup.cupcasaCupCostCents)}</td>
              </tr>
              <tr className="border-b border-espresso/10">
                <td className="px-4 py-3 font-semibold">Drink price</td>
                <td className="px-4 py-3 text-right">{formatCadPrecise(result.perCup.currentDrinkPriceCents)}</td>
                <td className="px-4 py-3 text-right">{formatCadPrecise(result.perCup.newDrinkPriceCents)}</td>
              </tr>
              <tr className="bg-cream/60">
                <td className="px-4 py-3 font-bold">Margin change</td>
                <td className="px-4 py-3 text-right text-espresso/40">—</td>
                <td className={`px-4 py-3 text-right font-bold ${result.perCup.marginChangeCents >= 0 ? "text-leaf" : "text-coral-deep"}`}>
                  {result.perCup.marginChangeCents >= 0 ? "+" : "−"}
                  {formatCadPrecise(Math.abs(result.perCup.marginChangeCents))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ProofBlock />
        <LeadForm result={result} sizeLabel={cup.label} priceIncreaseCents={increaseCents} conservative={conservative} inputs={{ cupsPerDay, daysOpen, drinkPrice, cupCost }} />
      </div>
    </div>
  );
}

function ProofBlock() {
  const max = Math.max(...SURVEY.results.map((r) => r.pct));
  return (
    <div className="rounded-3xl bg-espresso p-6 text-cream">
      <p className="font-display text-xl font-extrabold leading-snug">
        We asked {SURVEY.respondents} people on {SURVEY.place} whether they&apos;d pay $0.15 more for a coffee.
      </p>
      <ul className="mt-5 space-y-2.5">
        {SURVEY.results.map((r) => (
          <li key={r.label} className="flex items-center gap-3">
            <span className="w-14 shrink-0 font-display text-2xl font-extrabold text-coral">{r.pct}%</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream/15">
              <span className="block h-full rounded-full bg-coral" style={{ width: `${(r.pct / max) * 100}%` }} />
            </span>
            <span className="w-36 shrink-0 text-right text-sm text-cream/70">yes, for {r.label.toLowerCase()}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-start gap-2 text-xs text-cream/50">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {SURVEY.method}{" "}
          <a href={SURVEY.instagram} target="_blank" rel="noopener noreferrer" className="underline">
            Watch the interviews →
          </a>
        </span>
      </p>
    </div>
  );
}

function LeadForm({
  result, sizeLabel, priceIncreaseCents, conservative, inputs,
}: {
  result: ReturnType<typeof calculateRoi>;
  sizeLabel: string;
  priceIncreaseCents: number;
  conservative: boolean;
  inputs: { cupsPerDay: number; daysOpen: number; drinkPrice: string; cupCost: string };
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/calculator/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          cafe: form.get("cafe"),
          email: form.get("email"),
          sizeLabel,
          priceIncreaseCents,
          conservative,
          inputs,
          result: {
            annualCups: result.annualCups,
            addedCupCostCents: result.addedCupCostCents,
            addedRevenueCents: result.addedRevenueCents,
            netGainCents: result.netGainCents,
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex items-start gap-3 rounded-3xl border border-leaf/40 bg-leaf/10 p-6">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf text-cream">
          <Check className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-lg font-extrabold">On its way.</p>
          <p className="text-sm text-espresso/70">
            Your breakdown is in your inbox as a PDF. If you&apos;d rather talk it through, Jack and Sulli come to you —{" "}
            <a href="/launch#contact" className="font-semibold underline">book 15 minutes</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-espresso/10 bg-white/70 p-6">
      <p className="font-display text-lg font-extrabold">Email me this breakdown</p>
      <p className="mt-1 text-sm text-espresso/60">A one-page PDF with your numbers and the survey behind them. No newsletter.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input name="name" required placeholder="Your name" autoComplete="name" className={field} aria-label="Your name" />
        <input name="cafe" required placeholder="Café name" autoComplete="organization" className={field} aria-label="Café name" />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className={field} aria-label="Email" />
      </div>
      {state === "error" && <p className="mt-3 text-sm font-semibold text-coral-deep">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-pill mt-4 bg-coral px-6 py-3 text-sm text-white hover:bg-coral-deep disabled:opacity-60">
        {state === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Send me the PDF <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
