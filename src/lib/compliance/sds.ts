import registry from "../../../content/sds/registry.json";

/**
 * SDS registry. We are an index, not a publisher — see docs/SPEC.md, "SDS generator — link out,
 * never mirror". Nothing here mirrors a manufacturer's PDF, so their sheet is always the current one.
 */
export type SdsCategory =
  | "machine_cleaner" | "descaler" | "milk_line" | "sanitizer"
  | "bleach" | "degreaser" | "dish_detergent" | "drain_cleaner" | "gas";

export type SdsProduct = {
  id: string;
  name: string;
  manufacturer: string;
  category: SdsCategory;
  /** The manufacturer's own SDS page. Durable, and always the current sheet. */
  manufacturerSdsUrl?: string;
  /** A direct link, only present once a human confirmed it is the sheet for this exact product. */
  directSdsUrl?: string;
  sdsRevision?: string;
  hazardSummary: string;
  typicalLocation: string;
  /** Why we can't link a sheet, shown to the café instead of a dead link. */
  sourceNote?: string;
};

export const CATEGORY_LABELS: Record<SdsCategory, string> = {
  machine_cleaner: "Espresso machine cleaner",
  descaler: "Descaler",
  milk_line: "Milk line / steam wand",
  sanitizer: "Sanitizer",
  bleach: "Bleach",
  degreaser: "Degreaser",
  dish_detergent: "Dish detergent",
  drain_cleaner: "Drain cleaner",
  gas: "Compressed gas",
};

export const sdsProducts: SdsProduct[] = (registry.products as SdsProduct[]).slice();
export const registryVerifiedAt = registry.verifiedAt;

export const sdsProduct = (id: string) => sdsProducts.find((p) => p.id === id);

/** The link we print and QR-encode: a confirmed direct sheet if we have one, else the manufacturer's index. */
export const bestSdsUrl = (p: SdsProduct): string | null => p.directSdsUrl ?? p.manufacturerSdsUrl ?? null;

/**
 * WorkSafeBC requires SDSs to be reviewed at least every three years to confirm they are current.
 * This is a BC-specific rule and the reason the binder carries a review date at all.
 */
export const SDS_REVIEW_YEARS = 3;

export function reviewDueDate(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + SDS_REVIEW_YEARS);
  return d;
}

export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "America/Vancouver" }).format(d);
