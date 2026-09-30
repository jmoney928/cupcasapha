/**
 * The bundle builder's model: what a bundle is, what it costs, and what is still missing before
 * it can be ordered.
 *
 * Two kinds of buyer walk the same flow, and the very first question is which one you are. That
 * fork is not cosmetic: a café buys cases of a thousand against a deposit, a person buys a pack
 * outright, and the two price lists are far enough apart that showing both to the same buyer
 * reads as a markup rather than a tier. So `who` decides which quantities exist from then on,
 * and nobody is shown the other side's prices.
 *
 * Every figure is derived from the catalogue. Nothing here hard-codes a price.
 */
import { BUNDLES, CAFE_OFFER } from "@/lib/cafe-offer";
import { MIN_TRIO_CENTS, PACK_SIZES, perTrioCents, type PackSize } from "@/lib/packs";
import { products } from "@/lib/products";
import type { CupSize } from "@/lib/calc/catalog";

export const BUNDLE_SIZES: CupSize[] = [8, 12, 16];

/* ------------------------------------------------------------------ who it is for */

export type BuyerKind = "self" | "cafe";

export type BuyerOption = {
  id: BuyerKind;
  name: string;
  blurb: string;
  /** The three or four things that are true of this path, for a checklist on the card. */
  points: string[];
};

/*
 * The café card deliberately quotes no per-set price. A consumer who reads "27¢ a set" two lines
 * above their own 57¢ concludes they are being overcharged, and no amount of explaining a case of
 * a thousand undoes that. The café sheet is one click away instead, which is the right place for
 * anyone who wants the numbers before they commit.
 */
export const BUYER_OPTIONS: BuyerOption[] = [
  {
    id: "self",
    name: "For me",
    blurb:
      "A pack for a home, an office, a market stall, a pop-up — anything that is not a café ordering by the pallet.",
    points: [
      "Packs of 100, 200 or 500 complete sets",
      `From ${MIN_TRIO_CENTS}¢ a set, all in`,
      "Paid at checkout, shipped December 2026",
    ],
  },
  {
    id: "cafe",
    name: "For my café",
    blurb:
      "Cases of a thousand at published café pricing, reserved against one flat deposit rather than paid up front.",
    points: [
      `Cases of ${CAFE_OFFER.caseCount.toLocaleString()} at café pricing`,
      `Your first ${CAFE_OFFER.trialCount} cups, lids and sleeves free`,
      "Cup Casa OS included, not upsold",
    ],
  },
];

export const buyerOption = (id: BuyerKind): BuyerOption =>
  BUYER_OPTIONS.find((b) => b.id === id) ?? BUYER_OPTIONS[0];

/* ----------------------------------------------------------------- what is in it */

export type BundleParts = "all" | "cupSleeve" | "cupLid";

export type PartsOption = {
  id: BundleParts;
  name: string;
  /** The parts themselves, for a checklist. */
  includes: string[];
  blurb: string;
  hasSleeve: boolean;
  hasLid: boolean;
};

export const PARTS_OPTIONS: PartsOption[] = [
  {
    id: "all",
    name: "The full set",
    includes: ["Cup", "Lid", "Printed sleeve"],
    blurb: "Everything a hot drink needs. The cup is single wall, so the sleeve is what makes it comfortable to hold.",
    hasSleeve: true,
    hasLid: true,
  },
  {
    id: "cupSleeve",
    name: "Cup and sleeve",
    includes: ["Cup", "Printed sleeve"],
    blurb: "For cold pours, or if you already stock a lid that fits.",
    hasSleeve: true,
    hasLid: false,
  },
  {
    id: "cupLid",
    name: "Cup and lid",
    includes: ["Cup", "Lid"],
    blurb: "No branding. The plain cup and a lid, nothing printed.",
    hasSleeve: false,
    hasLid: true,
  },
];

export const partsOption = (id: BundleParts): PartsOption =>
  PARTS_OPTIONS.find((p) => p.id === id) ?? PARTS_OPTIONS[0];

/* ----------------------------------------------------------------- how many */

export type BundleQty =
  | { kind: "pack"; packSize: PackSize }
  | { kind: "case"; cases: number };

export const CASE_UNITS = 1000;
export const MAX_CASES = 250;

/** How many cups the bundle actually contains. */
export const unitsIn = (qty: BundleQty): number =>
  qty.kind === "pack" ? qty.packSize : qty.cases * CASE_UNITS;

/** Which kind of quantity this buyer is offered. The other kind never appears to them. */
export const qtyKindFor = (who: BuyerKind): BundleQty["kind"] => (who === "cafe" ? "case" : "pack");

/** Whether a saved or deep-linked quantity belongs to this buyer at all. */
export const qtyFitsWho = (who: BuyerKind, qty: BundleQty): boolean => qty.kind === qtyKindFor(who);

/* ----------------------------------------------------------------- price */

/**
 * Dropping a part from the set does not refund its à la carte price, because the set was never
 * the sum of its parts. On the café sheet the set is 27¢ where cup + lid + sleeve à la carte is
 * 42¢ — bought together the lid costs 2¢ and the sleeve 4¢. Those two deltas are the whole
 * pricing relationship, and they hold at all three sizes, so the same subtraction gives a
 * consumer pack its cup-and-sleeve and cup-and-lid prices too.
 *
 * They are exported because the contents step is asked before the quantity is known, and a
 * saving of 2¢ is true at every quantity where an absolute price is not.
 */
export const LID_IN_SET_CENTS = 2;
export const SLEEVE_IN_SET_CENTS = 4;

/** What leaving a part out saves, per set — the only honest figure before a quantity exists. */
export const savingFor = (parts: BundleParts): number =>
  parts === "all" ? 0 : parts === "cupSleeve" ? LID_IN_SET_CENTS : SLEEVE_IN_SET_CENTS;

/** What one cup's worth of this bundle costs, in cents. */
export function unitCents(oz: CupSize, parts: BundleParts, qty: BundleQty): number {
  if (qty.kind === "case") {
    const b = BUNDLES[oz];
    return parts === "all" ? b.all : parts === "cupSleeve" ? b.cupSleeve : b.cupLid;
  }
  const set = perTrioCents(qty.packSize, oz);
  return set - savingFor(parts);
}

export const totalCents = (oz: CupSize, parts: BundleParts, qty: BundleQty): number =>
  unitCents(oz, parts, qty) * unitsIn(qty);

/* ----------------------------------------------------------------- the bundle */

export type Bundle = {
  /** Which buyer, and so which price list and which quantities. Asked first. */
  who: BuyerKind | null;
  oz: CupSize | null;
  parts: BundleParts | null;
  qty: BundleQty | null;
  /**
   * The design step has been seen and accepted. It gates progress, and it is deliberately not
   * the same as having drawn something: plenty of people will want the plain sleeve, or will
   * send artwork by email later, and neither should be stuck on the design step.
   */
  designed: boolean;
  /** Something was actually changed on the sleeve. Only affects what the review says. */
  artwork: boolean;
};

export const emptyBundle: Bundle = {
  who: null,
  oz: null,
  parts: null,
  qty: null,
  designed: false,
  artwork: false,
};

export const bundleProduct = (oz: CupSize) => products.find((p) => p.oz === oz);

/** Whether this bundle involves artwork at all — a cup-and-lid bundle skips the design step. */
export const needsDesign = (b: Bundle): boolean =>
  b.parts !== null && partsOption(b.parts).hasSleeve;

/* ----------------------------------------------------------------- the steps */

export type StepId = "who" | "size" | "parts" | "quantity" | "design" | "review";

export type Step = {
  id: StepId;
  title: string;
  short: string;
  /** Answerable by walking past it. Said out loud, so nobody feels stuck on it. */
  optional?: boolean;
};

/*
 * Contents before quantity, and not the other way round. Quantity is where the money appears,
 * and pricing a quantity means knowing what is in the set — asked the other way round, the
 * quantity step had to quote the full set and then change its own numbers a step later.
 */
const ALL_STEPS: Step[] = [
  { id: "who", title: "Who are these for?", short: "You" },
  { id: "size", title: "Pick your size", short: "Size" },
  { id: "parts", title: "What goes in it?", short: "Contents" },
  { id: "quantity", title: "How many?", short: "Quantity" },
  { id: "design", title: "Design your sleeve", short: "Design", optional: true },
  { id: "review", title: "Check it over", short: "Review" },
];

/** The steps this particular bundle walks. A bundle with no sleeve has nothing to design. */
export function stepsFor(b: Bundle): Step[] {
  if (b.parts !== null && !needsDesign(b)) return ALL_STEPS.filter((s) => s.id !== "design");
  return ALL_STEPS;
}

/** How many steps the flow is, before any of it is answered — for the headline on /shop. */
export const STEP_COUNT = ALL_STEPS.length;

/**
 * The first step that is not yet answered — where an arriving link should land, and how far a
 * deep link is allowed to jump. You cannot skip ahead to a step whose inputs do not exist yet.
 */
export function firstIncomplete(b: Bundle): StepId {
  if (b.who === null) return "who";
  if (b.oz === null) return "size";
  if (b.parts === null) return "parts";
  if (b.qty === null) return "quantity";
  return needsDesign(b) && !b.designed ? "design" : "review";
}

/** Clamp a requested step to one the bundle has actually earned. */
export function reachableStep(b: Bundle, wanted: StepId): StepId {
  const steps = stepsFor(b);
  const limit = firstIncomplete(b);
  const order = steps.map((s) => s.id);
  const wantedAt = order.indexOf(wanted);
  const limitAt = order.indexOf(limit);
  if (wantedAt === -1) return limit;
  return wantedAt <= limitAt ? wanted : limit;
}

/* ----------------------------------------------------------------- handing off to the cart */

/**
 * The cart only knows catalogue SKUs, and it should stay that way — the checkout route prices
 * from the catalogue so a tampered payload cannot set its own total. A full-set bundle maps
 * cleanly onto an existing SKU. A partial bundle does not, so it goes to the quote form instead
 * of inventing a SKU the server would refuse to price.
 */
export type Handoff =
  | { kind: "cart"; slug: string; qty: number }
  | { kind: "quote"; reason: string };

export function handoff(b: Bundle): Handoff | null {
  if (b.oz === null || b.qty === null || b.parts === null) return null;
  if (b.parts !== "all") {
    return {
      kind: "quote",
      reason:
        b.parts === "cupSleeve"
          ? "Cups and sleeves without lids are quoted rather than sold online."
          : "Plain cups and lids are quoted rather than sold online.",
    };
  }
  if (b.qty.kind === "pack") {
    return { kind: "cart", slug: `pack-${b.qty.packSize}-${b.oz}oz`, qty: 1 };
  }
  const product = bundleProduct(b.oz);
  if (!product) return null;
  return { kind: "cart", slug: product.slug, qty: b.qty.cases };
}

export const PACK_OPTIONS = PACK_SIZES;
