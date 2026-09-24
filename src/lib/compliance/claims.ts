import { CERT, MATERIAL_CLAIM } from "@/lib/certs";

/**
 * What a café may and may not say about our cup.
 *
 * The Competition Act requires environmental claims to be backed by adequate and proper testing.
 * Our certification substantiates claims about THE CUP. It does not substantiate claims about the
 * café's operation, its waste stream, or where the cup actually ends up. That line is drawn
 * explicitly below and must not be blurred — see docs/SPEC.md, "Greenwashing and claims kit".
 *
 * ⚠️ Awaiting its review pass by a lawyer. Until then this is a starting point, not advice.
 */

export const APPROVED_CLAIMS = {
  menuLine: [
    "Served in a certified home-compostable cup.",
    "Our cups compost at home. No plastic lining.",
    `Certified home compostable · ${MATERIAL_CLAIM}`,
  ],
  chalkboard: [
    "This cup is lined with PHA, not plastic. It's certified home compostable, so it breaks down in a backyard compost — not in 400 years.",
    "No polyethylene. No PLA. No microplastics. Our cups are certified home compostable by DIN CERTCO.",
  ],
  website: [
    `We serve our coffee in cups from Cup Casa. They're paper lined with PHA — a material microbes make from plant oils — instead of the polyethylene or PLA lining used in most takeaway cups. The lining is certified home compostable by DIN CERTCO, part of the TÜV Rheinland group, under certificate ${CERT.number}. That means the cup is tested to break down in a backyard compost, not only in an industrial facility. It contains no PE, no PLA and no microplastics.`,
  ],
} as const;

export type ClaimWarning = { avoid: string; why: string; insteadSay: string };

export const CLAIMS_TO_AVOID: ClaimWarning[] = [
  {
    avoid: "\"Biodegradable\"",
    why: "Unqualified, it implies the cup disappears anywhere, in any timeframe. Regulators treat bare 'biodegradable' as misleading because it says nothing about conditions or duration.",
    insteadSay: "\"Certified home compostable\" — a specific, tested claim with a certificate behind it.",
  },
  {
    avoid: "\"Eco-friendly\", \"green\", \"planet-friendly\"",
    why: "Vague benefit claims with nothing measurable behind them. They are the textbook example regulators give of a claim that cannot be substantiated.",
    insteadSay: "The specific attribute you can prove: what the lining is, and what it is certified to do.",
  },
  {
    avoid: "\"100% compostable\" where the cup goes in the garbage",
    why: "If your customers have no realistic way to compost it, a blanket claim overstates what actually happens to the cup.",
    insteadSay: "\"Certified home compostable — compost it at home, or ask us.\" Say what you actually offer.",
  },
  {
    avoid: "A recycling symbol on a compostable item",
    why: "Cups of any kind contaminate paper recycling, and a chasing-arrows mark tells customers the opposite of what to do.",
    insteadSay: "Compost or garbage. Never the blue bin.",
  },
  {
    avoid: "\"We're zero waste\" / \"we're plastic free\" on the strength of the cup",
    why: "This is a claim about your whole operation. Our certificate covers the cup only, and cannot back a statement about your waste stream, your lids, your milk cartons or your supply chain.",
    insteadSay: "\"Our cups are certified home compostable.\" Keep the claim to the thing that was tested.",
  },
  {
    avoid: "\"Compostable in your green bin\" (in the CRD)",
    why: "The regional organics programme is built for food scraps and soiled paper; compostable containers are not part of it and get pulled out at the sorting line.",
    insteadSay: "\"Composts at home — not accepted in the green bin here.\" Check your municipality's current list.",
  },
];

export const SUBSTANTIATION = {
  certificate: `${CERT.title} — DIN CERTCO ${CERT.number}`,
  issuer: CERT.issuer,
  scope: "The cup: paper with a PHA (polyhydroxyalkanoate) lining. Certification covers the product as supplied.",
  doesNotCover: [
    "Your café's overall waste stream or recycling rate",
    "Lids, sleeves, straws or anything else you serve with the cup",
    "What actually happens to a cup after a customer takes it away",
    "Any carbon, emissions or \"plastic saved from the ocean\" figure",
  ],
  legalBasis:
    "Under the Competition Act, environmental claims must be supported by adequate and proper testing carried out before the claim is made. Our certification is that testing, for the cup. Claims you make about your own operation need their own basis.",
  regulator: {
    label: "Competition Bureau — environmental claims and greenwashing",
    url: "https://ised-isde.canada.ca/site/competition-bureau-canada/en/environmental-claims-and-greenwashing",
  },
} as const;
