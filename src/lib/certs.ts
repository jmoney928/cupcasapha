/**
 * Single source of truth for certification claims. Everything on the site that mentions a
 * certificate reads from here, so a number, link or wording change happens in one place.
 * Issued by DIN CERTCO, part of the TÜV Rheinland group.
 */

/** The cup's own certificate — the headline claim. */
export const CERT = {
  number: "9P0326",
  title: "Certified home compostable",
  scheme: "DIN-Geprüft Home Compostable",
  issuer: "DIN CERTCO (TÜV Rheinland group)",
  /**
   * Public register entry. Deliberately unset for now: the site shows the number without a link.
   * When it's time, paste the entry URL (https://www.dincertco.tuv.com/registrations/<id>?locale=en)
   * and every badge becomes a link automatically.
   */
  entryUrl: null as string | null,
  /**
   * DIN-Geprüft Home Compostable mark. Artwork and usage rules come from DIN CERTCO; it may not be
   * copied from the web. Drop the file at public/certs/din-geprueft-home-compostable.svg (or .png)
   * and set this to its path.
   */
  logoSrc: null as string | null,
} as const;

/** The PHA lining resin's own DIN CERTCO registrations (public), shown as supporting evidence. */
export const RESIN_CERT_HOLDER = "Beijing PhaBuilder Biotechnology Co., Ltd";
export const RESIN_CERT_VALID_UNTIL = "2029-04-30";
export const RESIN_CERTS = [
  {
    number: "9R0050",
    title: "PHA lining — home & garden compostable",
    scheme: "DIN-Geprüft Home Compostable (NF T51-800)",
    entryUrl: "https://www.dincertco.tuv.com/registrations/60170011?locale=en",
  },
  {
    number: "9K0239",
    title: "PHA lining — industrially compostable",
    scheme: "DIN-Geprüft Industrial Compostable (DIN EN 13432, AS 4736)",
    entryUrl: "https://www.dincertco.tuv.com/registrations/60170009?locale=en",
  },
  {
    number: "7W0623",
    title: "PHA lining — Seedling mark",
    scheme: "DIN EN 13432 / ASTM D6400",
    entryUrl: "https://www.dincertco.tuv.com/registrations/60170008?locale=en",
  },
] as const;
export const RESIN_REGISTER_URL = "https://www.dincertco.tuv.com/companies/89794?locale=en";

export const MATERIAL_CLAIM = "No PE, no PLA, no microplastics — PHA lining";
export const MATERIAL_SHORT = "No PE · no PLA · no microplastics";
export const CERT_SHORT = `${CERT.title} — DIN CERTCO ${CERT.number}`;
