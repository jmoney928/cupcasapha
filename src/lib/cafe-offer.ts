/**
 * The café / wholesale offer, as data. Every figure here is derived from the same catalogue the
 * shop and the calculator read, so a reprice can never leave one page quoting an old number.
 */
import { products, LID_CENTS, SLEEVE_CENTS, CAFE_TRIAL_COUNT } from "@/lib/products";
import { toCents } from "@/lib/calc/money";

export const CASE_COUNT = 1000;

/** Custom-printed cups are a volume item; sleeves are how a small café gets branding. */
export const CUSTOM_CUP_MINIMUM = 100_000;

/**
 * Bought as a set, the parts come in under their own list prices. Keyed by cup size, in cents.
 * Read these as prices, not as sums: the set is what a café actually orders, so it is the
 * number that gets quoted, and the à la carte figures above exist for the odd top-up order.
 */
export const BUNDLES: Record<number, { cupSleeve: number; cupLid: number; all: number }> = {
  8: { cupSleeve: 25, cupLid: 23, all: 27 },
  12: { cupSleeve: 27, cupLid: 25, all: 29 },
  16: { cupSleeve: 29, cupLid: 27, all: 31 },
};

export type CafeRow = {
  oz: number;
  size: string;
  shortName: string;
  perCupCents: number;
  caseDollars: number;
  /** The set — cup, lid and custom sleeve — which is what a served drink costs. */
  perServeCents: number;
  /** Cup and sleeve, no lid. For cold pours and for cafés that lid from their own stock. */
  cupSleeveCents: number;
  /** Cup and lid, no sleeve. */
  cupLidCents: number;
};

export const cafeRows: CafeRow[] = products.map((p) => {
  const perCupCents = toCents(p.pricePerCup);
  const bundle = BUNDLES[p.oz];
  return {
    oz: p.oz,
    size: p.size,
    shortName: p.shortName,
    perCupCents,
    caseDollars: (perCupCents * CASE_COUNT) / 100,
    perServeCents: bundle.all,
    cupSleeveCents: bundle.cupSleeve,
    cupLidCents: bundle.cupLid,
  };
});

export const CAFE_OFFER = {
  caseCount: CASE_COUNT,
  lidCents: LID_CENTS,
  sleevePlainCents: SLEEVE_CENTS.plain,
  sleeveBrandedCents: SLEEVE_CENTS.branded,
  trialCount: CAFE_TRIAL_COUNT,
  customCupMinimum: CUSTOM_CUP_MINIMUM,
} as const;

export const centsLabel = (cents: number) => `${cents}¢`;
export const dollars = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
