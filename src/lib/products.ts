export type Product = {
  slug: string;
  name: string;
  shortName: string;
  size: string;
  ozLabel: string;
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

const make = (
  slug: string,
  shortName: string,
  oz: number,
  pricePerCup: number,
  doubleWall: boolean,
  blurb: string,
  description: string,
  bestFor: string[],
  accent: string,
  extraSpecs: { label: string; value: string }[] = []
): Product => ({
  slug,
  name: `${oz}oz PHA Cup`,
  shortName,
  size: `${oz}oz`,
  ozLabel: `${oz} oz`,
  pricePerCup,
  image: `/products/${slug}.png`,
  caseCount: 1000,
  casePrice: Math.round(pricePerCup * 1000 * 100) / 100,
  doubleWall,
  blurb,
  description,
  bestFor,
  accent,
  specs: [
    { label: "Capacity", value: `${oz} oz` },
    { label: "Material", value: "100% PHA (polyhydroxyalkanoate)" },
    { label: "Wall", value: doubleWall ? "Double wall (no sleeve needed)" : "Single wall" },
    { label: "Branding", value: "Blank / unbranded" },
    { label: "Case count", value: "1,000 cups" },
    { label: "End of life", value: "Home, industrial & marine compostable" },
    ...extraSpecs,
  ],
});

export const products: Product[] = [
  make(
    "8oz-pha-cup",
    "The Espresso",
    8,
    0.2,
    true,
    "Perfect for espresso, cortados & small cold pours.",
    "Our 8oz double-wall PHA cup is the everyday workhorse — sized for espresso drinks, small coffees and tasting pours. The insulated double wall keeps hands comfortable without a sleeve. Made entirely from plant-based PHA, it looks crisp and clean while quietly breaking down in home compost, industrial facilities, soil, and even marine environments.",
    ["Espresso & cortado", "Small hot drinks", "Sampling & tastings"],
    "coral"
  ),
  make(
    "12oz-pha-cup",
    "The Everyday",
    12,
    0.22,
    true,
    "The go-to size for lattes, drip & iced coffee.",
    "The 12oz is the café standard — roomy enough for a proper latte or a generous drip, light enough to keep your unit economics happy. Its double wall means no sleeve needed. Fully PHA, fully blank, and fully compostable across home, industrial and marine streams.",
    ["Lattes & cappuccinos", "Drip coffee", "Iced coffee"],
    "caramel"
  ),
  make(
    "16oz-pha-cup",
    "The Big One",
    16,
    0.24,
    true,
    "The biggest pour — for hot lattes & large iced drinks.",
    "Our flagship 16oz holds heat (and keeps hands comfortable) without a cardboard sleeve thanks to its double wall — less waste, lower cost, cleaner look. Built from 100% PHA for hot lattes, large iced drinks and everything in between, and it composts at home, in industrial facilities, and in the ocean.",
    ["Large lattes", "Big iced drinks", "Smoothies & cold brew"],
    "leaf"
  ),
];

export const getProduct = (slug: string) =>
  products.find((p) => p.slug === slug);

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
