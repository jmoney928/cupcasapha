/**
 * What Cup Casa OS includes, as data. The public overview page renders this; nothing here describes
 * how a tool works internally — that lives in the app.
 *
 * `retailPerMonth` is only ever shown when `comparable` names a real product a café could go and
 * price themselves. The spec is explicit that an inflated stack number is the thing a sharp owner
 * tests, and being caught inflating it undoes the honest-supplier position. Rows without a
 * comparable are listed as included, with no number attached.
 */
export type ModuleStatus = "live" | "building" | "planned";

export type OsModule = {
  id: string;
  name: string;
  pillar: "margin" | "ordering" | "compliance" | "brand";
  /** One line, in the café's terms, about what it does for them. */
  blurb: string;
  status: ModuleStatus;
  /** Monthly retail of a comparable product, in dollars. Only set alongside `comparable`. */
  retailPerMonth?: number;
  /** The real product that price points at. Required before any number is shown. */
  comparable?: string;
};

export const PILLARS = {
  margin: { label: "Margin", line: "Know what every drink actually costs you, and what to charge." },
  ordering: { label: "Ordering", line: "Never run out, never over-order, never place an order by hand." },
  compliance: { label: "Compliance", line: "The paperwork you're supposed to have, generated and kept current." },
  brand: { label: "Brand", line: "Your logo on everything, print-ready, without a designer." },
} as const;

export const OS_MODULES: OsModule[] = [
  // margin
  { id: "roi", name: "Switch calculator", pillar: "margin", status: "live",
    blurb: "What a better cup costs you, what it earns back, and what you keep. Yours to run before you buy anything." },
  { id: "recipe-costing", name: "Recipe costing", pillar: "margin", status: "building",
    blurb: "Every drink priced to the cent, updated automatically when milk or beans move. Flags the ones below target margin and tells you the price that fixes it." },
  { id: "price-nudge", name: "Price review nudge", pillar: "margin", status: "planned",
    blurb: "A monthly note when your costs have moved and your menu hasn't, with the increase that puts you back on target." },
  { id: "catering", name: "Catering quotes", pillar: "margin", status: "planned",
    blurb: "Office drops, weddings and markets priced properly, on your real costs, in a branded quote." },
  { id: "daypart", name: "Daypart analysis", pillar: "margin", status: "planned",
    blurb: "Which hours actually pay, against what you're staffing." },

  // ordering
  { id: "reorder", name: "Reorder autopilot", pillar: "ordering", status: "building",
    blurb: "We watch your stock and text you before you run out. Reply YES and it's on the van — no order form, no phone call." },
  { id: "delivery-optimiser", name: "Delivery-fee optimiser", pillar: "ordering", status: "building",
    blurb: "If a second size is due soon, we bundle it and tell you what that saves — rather than charging you two delivery fees." },
  { id: "order-history", name: "Orders, invoices and tracking", pillar: "ordering", status: "building",
    blurb: "Every order, invoice and tracking number in one place instead of your inbox." },
  { id: "impact", name: "Impact certificates", pillar: "compliance", status: "planned",
    blurb: "A dated monthly certificate of what you've actually served — useful when you're bidding for corporate or campus accounts." },

  // compliance
  { id: "whmis", name: "WHMIS & safety binder", pillar: "compliance", status: "live",
    blurb: "Hazard inventory, safety data sheet index, young-worker orientation and the forms an inspector asks for." },
  { id: "claims", name: "Claims & greenwashing kit", pillar: "compliance", status: "live",
    blurb: "Exactly what you can say about a compostable cup, what you can't, and the paperwork that backs it." },
  { id: "signage", name: "Bin signage", pillar: "compliance", status: "live",
    blurb: "Back-of-house poster, customer bin decals and a staff briefing, honest about what your local programme takes." },
  { id: "health-audit", name: "Health self-audit", pillar: "compliance", status: "live",
    blurb: "The walk-round Island Health does, as a checklist you can do first." },
  { id: "grants", name: "Grants & rebates", pillar: "compliance", status: "live",
    blurb: "Funding a BC café can actually apply for, each checked and dated." },

  // brand
  { id: "brand-kit", name: "Brand kit generator", pillar: "brand", status: "live",
    blurb: "Upload your logo, get signage, window decals, till cards and social posts — print-ready, in about a minute." },
  { id: "locator", name: "Store locator listing", pillar: "brand", status: "building",
    blurb: "We advertise, people land on the map, and they find you. You're on it from the day you launch." },
  { id: "loyalty", name: "Till loyalty", pillar: "brand", status: "planned",
    retailPerMonth: 99, comparable: "Standalone café loyalty platforms, typically $50–99/mo",
    blurb: "A phone number at the till. No app, no card, no scan." },
  { id: "reviews", name: "Review routing", pillar: "brand", status: "planned",
    retailPerMonth: 200, comparable: "Standalone review-management tools, typically $200–400/mo",
    blurb: "Ask every customer for feedback after they buy, and make leaving a public review easy." },
];

export const STATUS_LABELS: Record<ModuleStatus, string> = {
  live: "Available now",
  building: "With your first order",
  planned: "On the roadmap",
};

export const byPillar = (pillar: OsModule["pillar"]) => OS_MODULES.filter((m) => m.pillar === pillar);

/** Only counts modules with a named comparable, so the figure can always be checked. */
export const pricedModules = () => OS_MODULES.filter((m) => m.retailPerMonth && m.comparable);
export const verifiedStackTotal = () => pricedModules().reduce((sum, m) => sum + (m.retailPerMonth ?? 0), 0);
export const liveCount = () => OS_MODULES.filter((m) => m.status === "live").length;
