/**
 * Single source of truth for certification claims. Everything on the site that mentions a
 * certificate reads from here, so a number, link or wording change happens in one place.
 *
 * The certificates are held by the PHA resin maker and cover the lining material
 * (Poly(3-hydroxybutyrate-co-4-hydroxybutyrate)), not the assembled cup. Copy must therefore say
 * "lining certified", never "cup certified". Issued by DIN CERTCO, part of the TÜV Rheinland group.
 * Public register: https://www.dincertco.tuv.com/companies/89794?locale=en
 */
export const CERT_HOLDER = "Beijing PhaBuilder Biotechnology Co., Ltd";
export const CERT_MATERIAL = "Poly(3-hydroxybutyrate-co-4-hydroxybutyrate) (PHA)";
export const CERT_VALID_UNTIL = "2029-04-30";

/** Home & garden composting — the headline claim. */
export const CERT = {
  number: "9R0050",
  title: "Lining certified home compostable",
  short: "Home-compostable lining",
  scheme: "DIN-Geprüft Home Compostable — compostable materials for home and garden composting (NF T51-800)",
  issuer: "DIN CERTCO (TÜV Rheinland group)",
  entryUrl: "https://www.dincertco.tuv.com/registrations/60170011?locale=en",
  registerUrl: "https://www.dincertco.tuv.com/companies/89794?locale=en",
  /**
   * DIN-Geprüft Home Compostable mark. Artwork and usage rules must be requested from DIN CERTCO
   * (or the material supplier); it may not be copied from the web. Drop the file at
   * public/certs/din-geprueft-home-compostable.svg (or .png) and set this to its path.
   */
  logoSrc: null as string | null,
} as const;

/** Where a visitor can verify the headline certificate. */
export const certVerifyUrl: string = CERT.entryUrl;

/** Supporting certificates for the same material. */
export const OTHER_CERTS = [
  {
    number: "9K0239",
    title: "Lining certified industrially compostable",
    scheme: "DIN-Geprüft Industrial Compostable (DIN EN 13432, AS 4736)",
    entryUrl: "https://www.dincertco.tuv.com/registrations/60170009?locale=en",
  },
  {
    number: "7W0623",
    title: "Seedling mark — compostable material",
    scheme: "DIN EN 13432 / ASTM D6400 (European Bioplastics Seedling)",
    entryUrl: "https://www.dincertco.tuv.com/registrations/60170008?locale=en",
  },
] as const;

export const MATERIAL_CLAIM = "No PE, no PLA, no microplastics — PHA lining";
export const MATERIAL_SHORT = "No PE · no PLA · no microplastics";
export const CERT_SHORT = `${CERT.short} — DIN CERTCO ${CERT.number}`;
