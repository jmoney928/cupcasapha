/**
 * Cup prices for the calculator come from the product catalogue, never hard-coded, so a reprice
 * updates every quoted figure. See docs/SPEC.md, "Module 1 — The maths".
 *
 * When the OS `products` table exists this reads from there instead; the shape stays the same.
 */
import { products } from "@/lib/products";
import { toCents, type Cents } from "./money";

export type CupSize = 8 | 12 | 16;

export type CupOption = { sizeOz: CupSize; label: string; shortName: string; pricePerCupCents: Cents };

/** Blank cups, one entry per size, cheapest first. */
export const cupOptions: CupOption[] = products
  .filter((p): p is typeof p & { oz: CupSize } => [8, 12, 16].includes(p.oz))
  .map((p) => ({
    sizeOz: p.oz,
    label: `${p.oz}oz`,
    shortName: p.shortName,
    pricePerCupCents: toCents(p.pricePerCup),
  }))
  .sort((a, b) => a.sizeOz - b.sizeOz);

/** The size most cafés pour most of. */
export const DEFAULT_CUP_SIZE: CupSize = 12;

export const cupOption = (sizeOz: CupSize): CupOption =>
  cupOptions.find((c) => c.sizeOz === sizeOz) ?? cupOptions[0];
