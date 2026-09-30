/**
 * The café / wholesale offer, as data. Every figure here is derived from the same catalogue the
 * shop and the calculator read, so a reprice can never leave one page quoting an old number.
 */
import { products, LID_CENTS, SLEEVE_CENTS, CAFE_TRIAL_COUNT } from "@/lib/products";
import { toCents } from "@/lib/calc/money";

export const CASE_COUNT = 1000;

/** Custom-printed cups are a volume item; sleeves are how a small café gets branding. */
export const CUSTOM_CUP_MINIMUM = 100_000;

export type CafeRow = {
  oz: number;
  size: string;
  shortName: string;
  perCupCents: number;
  caseDollars: number;
  /** Cup + lid + sleeve at the repeat-order sleeve price — what a served drink actually costs. */
  perServeCents: number;
};

export const cafeRows: CafeRow[] = products.map((p) => {
  const perCupCents = toCents(p.pricePerCup);
  return {
    oz: p.oz,
    size: p.size,
    shortName: p.shortName,
    perCupCents,
    caseDollars: (perCupCents * CASE_COUNT) / 100,
    perServeCents: perCupCents + LID_CENTS + SLEEVE_CENTS.withCups,
  };
});

export const CAFE_OFFER = {
  caseCount: CASE_COUNT,
  lidCents: LID_CENTS,
  sleeveStandaloneCents: SLEEVE_CENTS.standalone,
  sleeveWithCupsCents: SLEEVE_CENTS.withCups,
  trialCount: CAFE_TRIAL_COUNT,
  customCupMinimum: CUSTOM_CUP_MINIMUM,
} as const;

export const centsLabel = (cents: number) => `${cents}¢`;
export const dollars = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
