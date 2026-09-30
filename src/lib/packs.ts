/**
 * Consumer packs: a cup, a custom-printed sleeve and a lid, sold as one unit.
 *
 * Priced per trio in whole cents. The base price is the 8oz; each step up in size adds 2¢,
 * mirroring the ladder on the café case pricing so the two never tell different stories.
 */
import type { CupSize } from "@/lib/calc/catalog";
import { products } from "@/lib/products";

export const PACK_SIZES = [100, 200, 500] as const;
export type PackSize = (typeof PACK_SIZES)[number];

/** Per-trio price of the 8oz, in cents. Bigger pack, lower price. */
const BASE_CENTS: Record<PackSize, number> = { 100: 57, 200: 52, 500: 47 };

/** Each size step up the range adds this much per trio. */
const SIZE_STEP_CENTS = 2;

const SIZES: CupSize[] = [8, 12, 16];

export type Pack = {
  slug: string;
  packSize: PackSize;
  oz: CupSize;
  /** What one cup + sleeve + lid costs in this pack, in cents. */
  perTrioCents: number;
  /** The whole pack, in cents. Always an exact multiple, never a rounded float. */
  totalCents: number;
  name: string;
  shortName: string;
  image: string;
};

export const perTrioCents = (packSize: PackSize, oz: CupSize): number =>
  BASE_CENTS[packSize] + SIZES.indexOf(oz) * SIZE_STEP_CENTS;

function build(packSize: PackSize, oz: CupSize): Pack {
  const per = perTrioCents(packSize, oz);
  const product = products.find((p) => p.oz === oz);
  return {
    slug: `pack-${packSize}-${oz}oz`,
    packSize,
    oz,
    perTrioCents: per,
    totalCents: per * packSize,
    name: `${packSize} × ${oz}oz — cups, sleeves & lids`,
    shortName: product?.shortName ?? `${oz}oz`,
    image: `/products/${oz}oz-pha-cup.jpg`,
  };
}

export const packs: Pack[] = PACK_SIZES.flatMap((size) => SIZES.map((oz) => build(size, oz)));

export const getPack = (slug: string) => packs.find((p) => p.slug === slug);

/**
 * The cheapest a set can be — the biggest pack in the smallest size. Every "from …" on the
 * site reads this, so a reprice can never leave a headline quoting a price nobody can buy.
 */
export const MIN_TRIO_CENTS = Math.min(...packs.map((p) => p.perTrioCents));

/** The packs for one size, smallest first — what a size's buy panel renders. */
export const packsForSize = (oz: CupSize) => packs.filter((p) => p.oz === oz);
