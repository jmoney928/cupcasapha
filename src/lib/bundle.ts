/**
 * The bundle builder's model: what a bundle is, what it costs, and what is still missing before
 * it can be ordered.
 *
 * Two kinds of buyer walk the same five steps and diverge only on quantity. Someone buying a pack
 * pays in full at checkout; a café reserving cases pays one flat deposit and settles the balance
 * when the container lands. That split already exists in the cart and the checkout route, so this
 * file describes the bundle and defers to `skus.ts` for anything the cart has to price.
 *
 * Every figure is derived from the catalogue. Nothing here hard-codes a price.
 */
import { BUNDLES } from "@/lib/cafe-offer";
import { PACK_SIZES, perTrioCents, type PackSize } from "@/lib/packs";
import { products } from "@/lib/products";
import type { CupSize } from "@/lib/calc/catalog";

export const BUNDLE_SIZES: CupSize[] = [8, 12, 16];

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

/* ----------------------------------------------------------------- price */

/**
 * Dropping a part from the set does not refund its à la carte price, because the set was never
 * the sum of its parts. On the café sheet the set is 27¢ where cup + lid + sleeve à la carte is
 * 42¢ — bought together the lid costs 2¢ and the sleeve 4¢. Those two deltas are the whole
 * pricing relationship, and they hold at all three sizes, so the same subtraction gives a
 * consumer pack its cup-and-sleeve and cup-and-lid prices too.
 */
const LID_IN_SET_CENTS = 2;
const SLEEVE_IN_SET_CENTS = 4;

/** What one cup's worth of this bundle costs, in cents. */
export function unitCents(oz: CupSize, parts: BundleParts, qty: BundleQty): number {
  if (qty.kind === "case") {
    const b = BUNDLES[oz];
    return parts === "all" ? b.all : parts === "cupSleeve" ? b.cupSleeve : b.cupLid;
  }
  const set = perTrioCents(qty.packSize, oz);
  if (parts === "all") return set;
  return parts === "cupSleeve" ? set - LID_IN_SET_CENTS : set - SLEEVE_IN_SET_CENTS;
}

export const totalCents = (oz: CupSize, parts: BundleParts, qty: BundleQty): number =>
  unitCents(oz, parts, qty) * unitsIn(qty);

/* ----------------------------------------------------------------- the bundle */

export type Bundle = {
  oz: CupSize | null;
  qty: BundleQty | null;
  parts: BundleParts | null;
  /**
   * The design step has been seen and accepted. It gates progress, and it is deliberately not
   * the same as having drawn something: plenty of people will want the plain sleeve, or will
   * send artwork by email later, and neither should be stuck on step four.
   */
  designed: boolean;
  /** Something was actually changed on the sleeve. Only affects what the review says. */
  artwork: boolean;
};

export const emptyBundle: Bundle = {
  oz: null,
  qty: null,
  parts: null,
  designed: false,
  artwork: false,
};

export const bundleProduct = (oz: CupSize) => products.find((p) => p.oz === oz);

/** Whether this bundle involves artwork at all — a cup-and-lid bundle skips the design step. */
export const needsDesign = (b: Bundle): boolean =>
  b.parts !== null && partsOption(b.parts).hasSleeve;

/* ----------------------------------------------------------------- the steps */

export type StepId = "size" | "quantity" | "parts" | "design" | "review";

export type Step = { id: StepId; title: string; short: string };

const ALL_STEPS: Step[] = [
  { id: "size", title: "Pick your size", short: "Size" },
  { id: "quantity", title: "How many?", short: "Quantity" },
  { id: "parts", title: "What goes in it?", short: "Contents" },
  { id: "design", title: "Design your sleeve", short: "Design" },
  { id: "review", title: "Check it over", short: "Review" },
];

/** The steps this particular bundle walks. A bundle with no sleeve has nothing to design. */
export function stepsFor(b: Bundle): Step[] {
  if (b.parts !== null && !needsDesign(b)) return ALL_STEPS.filter((s) => s.id !== "design");
  return ALL_STEPS;
}

/**
 * The first step that is not yet answered — where an arriving link should land, and how far a
 * deep link is allowed to jump. You cannot skip ahead to a step whose inputs do not exist yet.
 */
export function firstIncomplete(b: Bundle): StepId {
  if (b.oz === null) return "size";
  if (b.qty === null) return "quantity";
  if (b.parts === null) return "parts";
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
