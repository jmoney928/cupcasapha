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
  doubleWall: boolean;
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
    pricePerCup: 0.2,
    shortName: "The Espresso",
    blurb: "Perfect for espresso, cortados & small cold pours.",
    description:
      "Our 8oz double-wall PHA cup is the everyday workhorse — sized for espresso drinks, small coffees and tasting pours. The insulated double wall keeps hands comfortable without a sleeve, and it is certified home compostable.",
    bestFor: ["Espresso & cortado", "Small hot drinks", "Sampling & tastings"],
    accent: "coral",
  },
  {
    oz: 12,
    pricePerCup: 0.22,
    shortName: "The Everyday",
    blurb: "The go-to size for lattes, drip & iced coffee.",
    description:
      "The 12oz is the café standard — roomy enough for a proper latte or a generous drip, light enough to keep your unit economics happy. Its double wall means no sleeve needed, and it's PHA-lined and certified home compostable.",
    bestFor: ["Lattes & cappuccinos", "Drip coffee", "Iced coffee"],
    accent: "caramel",
  },
  {
    oz: 16,
    pricePerCup: 0.24,
    shortName: "The Big One",
    blurb: "The biggest pour — for hot lattes & large iced drinks.",
    description:
      "Our flagship 16oz holds heat (and keeps hands comfortable) without a cardboard sleeve thanks to its double wall — less waste, lower cost, cleaner look. Paper with a PHA lining for hot lattes, large iced drinks and everything in between.",
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
    image: `/products/${b.oz}oz-pha-cup.png`,
    caseCount: 1000,
    casePrice: Math.round(pricePerCup * 1000 * 100) / 100,
    doubleWall: true,
    blurb: b.blurb,
    description: b.description,
    bestFor: b.bestFor,
    accent: b.accent,
    specs: [
      { label: "Capacity", value: `${b.oz} oz` },
      { label: "Material", value: "Paper with PHA lining — no PE, no PLA, no microplastics" },
      { label: "Wall", value: "Double wall (no sleeve needed)" },
      { label: "Finish", value: "Blank / unbranded" },
      { label: "Case count", value: "1,000 cups" },
      { label: "Certified", value: "Home compostable — DIN CERTCO 9P0326 (TÜV Rheinland group)" },
    ],
  };
}

export const products: Product[] = base.map(build);

/** All cups ship blank; kept as an alias for components that list the range. */
export const blankProducts = products;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
