/**
 * Module 1 — Switch ROI calculator. See docs/SPEC.md, "Module 1".
 *
 * Pure functions only: no database, no React, no I/O. Every figure is integer cents.
 * These numbers go in front of café owners who will check them, so the arithmetic is
 * deliberately plain and never flattering.
 */
import type { Cents } from "./money";

export const WEEKS_PER_YEAR = 52;

/**
 * Share of customers who accept the price increase.
 *
 * The measured figure is 0.98 — 163 of 167 people surveyed on Victoria's Inner Harbour said they
 * would pay $0.15 more for a cup that is microplastic-free and home compostable. The spec's
 * standing rule is "never model it above your measured figure", so the default is the measured
 * 0.98 rather than a theoretical 1.0.
 */
export const ACCEPTANCE = { measured: 0.98, conservative: 0.9 } as const;
export type AcceptanceKey = keyof typeof ACCEPTANCE;

export const PRICE_INCREASE_OPTIONS_CENTS = [10, 15, 25] as const;
export type PriceIncreaseCents = (typeof PRICE_INCREASE_OPTIONS_CENTS)[number];

/** Typical figure offered behind "not sure?" on the current cup cost field. */
export const TYPICAL_CURRENT_CUP_COST_CENTS = 14;

export type RoiInput = {
  cupsPerDay: number;
  daysOpenPerWeek: number;
  /** What they pay per cup today, in cents. */
  currentCupCostCents: Cents;
  /** Our price per cup for the size they'd switch to, in cents. Sourced from the catalogue, never hard-coded. */
  cupcasaCupCostCents: Cents;
  /** Their signature drink price today, in cents. */
  drinkPriceCents: Cents;
  /** How much they'd add to the drink price, in cents. 0 is valid and models "I won't raise prices". */
  priceIncreaseCents: number;
  /** Defaults to the measured survey figure. */
  acceptance?: number;
};

export type RoiResult = {
  annualCups: number;
  /** Extra spend on cups per year. Negative when their current cup costs more than ours. */
  addedCupCostCents: Cents;
  /** Extra revenue per year from the price increase, after acceptance. */
  addedRevenueCents: Cents;
  /** addedRevenue − addedCupCost. The hero number. */
  netGainCents: Cents;
  /** Per-cup view, because owners think in cents per cup. May be fractional. */
  perCup: {
    currentCupCostCents: number;
    cupcasaCupCostCents: number;
    currentDrinkPriceCents: number;
    newDrinkPriceCents: number;
    /** Net margin movement per cup, after acceptance. */
    marginChangeCents: number;
  };
  acceptance: number;
  /**
   * True when the honest answer is a loss. The UI must reframe rather than show a red number,
   * and must never adjust the arithmetic to avoid it. See docs/SPEC.md, "Two things not to do".
   */
  isNetLoss: boolean;
};

const nonNegativeInt = (n: number, label: string): number => {
  if (!Number.isFinite(n)) throw new TypeError(`${label}: not a number`);
  return Math.max(0, Math.round(n));
};

/** Annual cups served. Days open per week is clamped to 0–7. */
export function annualCups(cupsPerDay: number, daysOpenPerWeek: number): number {
  const perDay = nonNegativeInt(cupsPerDay, "cupsPerDay");
  const days = Math.min(7, nonNegativeInt(daysOpenPerWeek, "daysOpenPerWeek"));
  return perDay * days * WEEKS_PER_YEAR;
}

export function calculateRoi(input: RoiInput): RoiResult {
  const acceptance = clampAcceptance(input.acceptance ?? ACCEPTANCE.measured);
  const cups = annualCups(input.cupsPerDay, input.daysOpenPerWeek);

  const cupCostDeltaCents = input.cupcasaCupCostCents - input.currentCupCostCents;
  const addedCupCostCents = Math.round(cups * cupCostDeltaCents);

  const effectiveIncreasePerCup = input.priceIncreaseCents * acceptance;
  const addedRevenueCents = Math.round(cups * effectiveIncreasePerCup);

  const netGainCents = addedRevenueCents - addedCupCostCents;

  return {
    annualCups: cups,
    addedCupCostCents,
    addedRevenueCents,
    netGainCents,
    perCup: {
      currentCupCostCents: input.currentCupCostCents,
      cupcasaCupCostCents: input.cupcasaCupCostCents,
      currentDrinkPriceCents: input.drinkPriceCents,
      newDrinkPriceCents: input.drinkPriceCents + input.priceIncreaseCents,
      marginChangeCents: effectiveIncreasePerCup - cupCostDeltaCents,
    },
    acceptance,
    isNetLoss: netGainCents < 0,
  };
}

function clampAcceptance(a: number): number {
  if (!Number.isFinite(a)) throw new TypeError("acceptance: not a number");
  // Never above the measured figure — modelling 100% acceptance is the kind of flattery
  // an owner checks and catches.
  return Math.min(ACCEPTANCE.measured, Math.max(0, a));
}

/**
 * The one-sentence summary under the hero number.
 * Deliberately states the cost before the gain — leading with the cost is what makes it believable.
 */
export function roiSentence(r: RoiResult, fmt: (c: number) => string): string {
  if (r.annualCups === 0) return "Enter your daily cup volume to see the numbers.";
  const cost = fmt(Math.abs(r.addedCupCostCents));
  const revenue = fmt(r.addedRevenueCents);
  const net = fmt(Math.abs(r.netGainCents));
  const costClause =
    r.addedCupCostCents >= 0
      ? `Switching costs you ${cost} more in cups`
      : `Switching saves you ${cost} on cups`;
  if (r.isNetLoss) return `${costClause} and earns you ${revenue} more in revenue, so you'd be ${net} down over a year.`;
  return `${costClause} and earns you ${revenue} more in revenue. You keep ${net}.`;
}
