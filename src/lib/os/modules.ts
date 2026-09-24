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
  /** The fuller description, shown when a café opens the module on the overview page. */
  detail: string;
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
    blurb: "What a better cup costs you, what it earns back, and what you keep. Yours to run before you buy anything.",
    detail: "Put in your cups a day, your drink price and what you pay for cups now. It works out what the switch costs you over a year, what the price increase earns back, and what you keep — then shows the same thing per cup, because that's how owners actually think about it. If the honest answer is that you'd lose money, it says so rather than dressing it up. Open to anyone, no account needed." },
  { id: "recipe-costing", name: "Recipe costing", pillar: "margin", status: "building",
    blurb: "Every drink priced to the cent, updated automatically when milk or beans move. Flags the ones below target margin and tells you the price that fixes it.",
    detail: "Build each drink once — shots, milk, syrup, cup, lid — and we cost it to the cent against a BC price library you can override anywhere you know better. When milk or beans move, every recipe recosts itself and you get a note naming the drinks that fell below target margin and the price that puts them back. Packaging costs pull from your live prices, so nothing goes stale. Labour and overhead are deliberately left out and offered as an optional input: fold them in and every drink looks unprofitable, and you stop trusting the tool." },
  { id: "price-nudge", name: "Price review nudge", pillar: "margin", status: "planned",
    blurb: "A monthly note when your costs have moved and your menu hasn't, with the increase that puts you back on target.",
    detail: "A monthly note, sent only when there's something real to say. It watches what your ingredients have done against the date you last changed your menu, and tells you what a small increase across your top drinks would be worth over a year. If you raised prices recently it stays quiet — a nudge that ignores what you just did is a nudge you unsubscribe from." },
  { id: "catering", name: "Catering quotes", pillar: "margin", status: "planned",
    blurb: "Office drops, weddings and markets priced properly, on your real costs, in a branded quote.",
    detail: "Office drops, weddings, markets and film crews, priced on your actual recipe costs rather than a guess. It models drinks per guest by event type, adds the setup and teardown time everyone forgets, and covers travel and staff. You get a branded quote with a minimum guest count, a confirmation deadline and a cancellation policy — the three things cafés leave off and later regret. Your margin shows on your screen, never on the customer's copy." },
  { id: "daypart", name: "Daypart analysis", pillar: "margin", status: "planned",
    blurb: "Which hours actually pay, against what you're staffing.",
    detail: "Sales by hour and weekday against what you're staffing, so you can see which hours actually pay. One honest limit: we can see your sales, not your rota, so you tell us roughly who's on and we do the rest." },

  // ordering
  { id: "reorder", name: "Reorder autopilot", pillar: "ordering", status: "building",
    blurb: "We watch your stock and text you before you run out. Reply YES and it's on the van — no order form, no phone call.",
    detail: "We estimate what you have left from what you've been using, and text you before you run out — not after. Reply YES and it's on the van; reply with a number to change the amount; reply STOP and we never text again. One message a week, maximum, and we never charge a card without a reply. A silence is not consent." },
  { id: "delivery-optimiser", name: "Delivery-fee optimiser", pillar: "ordering", status: "building",
    blurb: "If a second size is due soon, we bundle it and tell you what that saves — rather than charging you two delivery fees.",
    detail: "Before we text you, we check every size. If a second one is due within three weeks we bundle it and tell you what skipping a second delivery fee saves. You also get the per-cup landed cost at each order size, delivery included, so you can see for yourself why a bigger order is cheaper. It's the one feature that actively costs us a delivery fee, and that's the point." },
  { id: "order-history", name: "Orders, invoices and tracking", pillar: "ordering", status: "building",
    blurb: "Every order, invoice and tracking number in one place instead of your inbox.",
    detail: "Every order, invoice and tracking number in one place, with the balance and the delivery date, instead of scrolling your inbox for a PDF from four months ago." },
  { id: "impact", name: "Impact certificates", pillar: "brand", status: "planned",
    blurb: "A dated monthly certificate of what you've actually served — useful when you're bidding for corporate or campus accounts.",
    detail: "A dated monthly certificate of what you've actually been served — cups delivered, and the plastic lining avoided by using a PHA-lined cup instead of a conventional one. Deliberately narrow: no carbon figure, no \"plastic saved from the ocean\", nothing we can't stand behind. Useful when you're bidding for a corporate, campus or municipal account and someone asks a green procurement question." },

  // compliance
  { id: "whmis", name: "WHMIS & safety binder", pillar: "compliance", status: "live",
    blurb: "Hazard inventory, safety data sheet index, young-worker orientation and the forms an inspector asks for.",
    detail: "Tick what you keep on site and we build the binder: a hazardous products inventory with locations, a safety data sheet index with a QR code per product, the new and young worker orientation WorkSafeBC requires with a sign-off record for the worker's file, café-specific safe work procedures, an incident report and a monthly inspection checklist. We link each manufacturer's sheet rather than copying it, so you always open the current version, and we check those links nightly at our end. In BC sheets must be reviewed every three years — your binder is stamped with its own review date." },
  { id: "claims", name: "Claims & greenwashing kit", pillar: "compliance", status: "live",
    blurb: "Exactly what you can say about a compostable cup, what you can't, and the paperwork that backs it.",
    detail: "Approved language for a menu line, a chalkboard and your website, each one a claim our certification actually supports. Then the claims to avoid — \"biodegradable\" on its own, \"eco-friendly\", a recycling symbol on a compostable cup — and a defensible replacement for each. Plus a substantiation page you can hand a customer, a procurement officer or an inspector. It draws the line clearly: our certificate covers the cup, not your waste stream." },
  { id: "signage", name: "Bin signage", pillar: "compliance", status: "live",
    blurb: "Back-of-house poster, customer bin decals and a staff briefing, honest about what your local programme takes.",
    detail: "A back-of-house poster showing where everything goes, customer-facing bin decals sized for a standard opening, and a one-page briefing so your staff can answer the cup question without guessing. It's honest about the green bin: the regional organics programme is built for food scraps and soiled paper, so our cups go in compost, not there." },
  { id: "health-audit", name: "Health self-audit", pillar: "compliance", status: "live",
    blurb: "The walk-round Island Health does, as a checklist you can do first.",
    detail: "The walk-round an inspector does, as a checklist you can do first — temperatures and logs, handwashing, sanitizer concentration, storage and separation, surfaces, pests, and whether your FOODSAFE certification and permit are current. You get a dated PDF with a fix-by log, and keeping the completed sheets shows improvement over time." },
  { id: "grants", name: "Grants & rebates", pillar: "compliance", status: "live",
    blurb: "Funding a BC café can actually apply for, each checked and dated.",
    detail: "Funding a BC café can actually apply for — hiring and wage subsidies, start-up financing, energy-efficiency rebates — filtered by what you're trying to do. Each one links to the funder's own page and carries the date we last checked it, and anything we haven't re-verified in six months is hidden rather than shown stale." },

  // brand
  { id: "brand-kit", name: "Brand kit generator", pillar: "brand", status: "live",
    blurb: "Upload your logo, get signage, window decals, till cards and social posts — print-ready, in about a minute.",
    detail: "Upload your logo and we do the parts you can't: check it will actually print, pull a palette out of it, and generate the single-colour version cheap printing needs. Pick one of six templates and a colour, and you get an A-frame poster, a window decal, a tent-fold till card, a menu chip and a set of Instagram posts announcing your switch — print pieces at trim with bleed and crop marks. Six templates on purpose: a full design tool produces something worse and you blame the tool." },
  { id: "locator", name: "Store locator listing", pillar: "brand", status: "building",
    blurb: "We advertise, people land on the map, and they find you. You're on it from the day you launch.",
    detail: "We run ads that bring people to a map of every café serving the cup. You're on it from the day you launch, with your address, hours and a link to your own site — and you can see how many people viewed your listing and clicked through. Early numbers will be small, and we'll show you the real ones rather than a vague claim about exposure." },
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
