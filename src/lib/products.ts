export type Product = {
  slug: string;
  name: string;
  shortName: string;
  size: string;
  ozLabel: string;
  oz: number;
  pricePerCup: number; // in dollars
  image: string;
  caseCount: number;
  casePrice: number; // pricePerCup * caseCount
  /** Single wall — a sleeve is what makes a hot drink comfortable to hold. */
  singleWall: true;
  blurb: string;
  description: string;
  bestFor: string[];
  accent: string; // brand token name
  specs: { label: string; value: string }[];
};

type Base = {
  oz: number;
  pricePerCup: number;
  shortName: string;
  blurb: string;
  description: string;
  bestFor: string[];
  accent: string;
};

const base: Base[] = [
  {
    oz: 8,
    pricePerCup: 0.18,
    shortName: "The Espresso",
    blurb: "Perfect for espresso, cortados & small cold pours.",
    description:
      "Our 8oz PHA cup is the everyday workhorse — sized for espresso drinks, small coffees and tasting pours. Single wall, so pair it with a sleeve for hot pours, and certified home compostable.",
    bestFor: ["Espresso & cortado", "Small hot drinks", "Sampling & tastings"],
    accent: "coral",
  },
  {
    oz: 12,
    pricePerCup: 0.20,
    shortName: "The Everyday",
    blurb: "The go-to size for lattes, drip & iced coffee.",
    description:
      "The 12oz is the café standard — roomy enough for a proper latte or a generous drip, light enough to keep your unit economics happy. Single wall, so pair it with a sleeve for hot pours, and certified home compostable.",
    bestFor: ["Lattes & cappuccinos", "Drip coffee", "Iced coffee"],
    accent: "caramel",
  },
  {
    oz: 16,
    pricePerCup: 0.22,
    shortName: "The Big One",
    blurb: "The biggest pour — for hot lattes & large iced drinks.",
    description:
      "Our flagship 16oz is the biggest pour — hot lattes, large iced drinks and everything in between. Paper with a PHA lining, single wall, so pair it with a sleeve for hot drinks.",
    bestFor: ["Large lattes", "Big iced drinks", "Smoothies & cold brew"],
    accent: "leaf",
  },
];

function build(b: Base): Product {
  const pricePerCup = b.pricePerCup;
  return {
    slug: `${b.oz}oz-pha-cup`,
    name: `${b.oz}oz PHA Cup`,
    shortName: b.shortName,
    size: `${b.oz}oz`,
    ozLabel: `${b.oz} oz`,
    oz: b.oz,
    pricePerCup,
    image: `/products/${b.oz}oz-cup.jpg`,
    caseCount: 1000,
    casePrice: Math.round(pricePerCup * 1000 * 100) / 100,
    singleWall: true,
    blurb: b.blurb,
    description: b.description,
    bestFor: b.bestFor,
    accent: b.accent,
    specs: [
      { label: "Capacity", value: `${b.oz} oz` },
      { label: "Material", value: "Paper with PHA lining — no PE, no PLA, no microplastics" },
      { label: "Wall", value: "Single wall — add a sleeve for hot drinks" },
      { label: "Finish", value: "Blank cup — your design prints on the sleeve" },
      { label: "Sold in", value: "Packs of 100, 200 or 500 sets" },
      { label: "Certified", value: "Home compostable — TÜV Rheinland" },
    ],
  };
}

export const products: Product[] = base.map(build);

/** All cups ship blank; kept as an alias for components that list the range. */
export const blankProducts = products;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);

/* ------------------------------------------------------------------ accessories */

/**
 * Lids and sleeves, priced in whole cents so nothing is ever derived from a float.
 * One lid fits all three cup sizes.
 */
export const LID_CENTS = 9;

/** Sleeves are printed in-house on a UV printer, so there is no minimum run. */
export const SLEEVE_CENTS = {
  /** Blank stock, white or kraft. */
  plain: 8,
  /** Printed with the café's own artwork. */
  branded: 15,
} as const;

/**
 * What a café that has never ordered from us gets, free, to try the cups in real service:
 * a hundred each of cups, lids and custom-printed sleeves. One of each per drink, so a
 * hundred complete servings — enough to run a week of mornings and decide.
 */
export const CAFE_TRIAL_COUNT = 100;
