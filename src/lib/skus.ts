/**
 * One lookup for everything the cart can hold, so the drawer, the checkout route and the pixel
 * all price an item the same way.
 *
 * Two kinds sit side by side. A consumer pack is bought outright; a café case is reserved against
 * a deposit, with the balance settled when the container lands. The cart keeps them apart rather
 * than averaging them into one number, because they are not the same transaction.
 */
import { products } from "@/lib/products";
import { getPack, packs } from "@/lib/packs";

export type SkuKind = "pack" | "case";

export type Sku = {
  slug: string;
  kind: SkuKind;
  name: string;
  /** What one of it is called, for "3 packs" / "2 cases". */
  unit: string;
  unitPriceCents: number;
  image: string;
  href: string;
  /** The line under the name in the cart. */
  meta: string;
};

const packSku = (slug: string): Sku | undefined => {
  const p = getPack(slug);
  if (!p) return undefined;
  return {
    slug: p.slug,
    kind: "pack",
    name: `${p.packSize} × ${p.oz}oz pack`,
    unit: "pack",
    unitPriceCents: p.totalCents,
    image: p.image,
    href: `/shop?size=${p.oz}`,
    meta: `${p.packSize} cups, ${p.packSize} custom sleeves, ${p.packSize} lids · ${p.perTrioCents}¢ each`,
  };
};

const caseSku = (slug: string): Sku | undefined => {
  const p = products.find((x) => x.slug === slug);
  if (!p) return undefined;
  return {
    slug: p.slug,
    kind: "case",
    name: p.name,
    unit: "case",
    unitPriceCents: Math.round(p.casePrice * 100),
    image: p.image,
    href: `/shop?size=${p.oz}`,
    meta: `Case of ${p.caseCount.toLocaleString()} · ${Math.round(p.pricePerCup * 100)}¢ per cup`,
  };
};

export const findSku = (slug: string): Sku | undefined => packSku(slug) ?? caseSku(slug);

/** Every slug the cart will accept — used to drop stale entries from an old localStorage cart. */
export const knownSkus = new Set<string>([
  ...packs.map((p) => p.slug),
  ...products.map((p) => p.slug),
]);

export const formatCents = (cents: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
