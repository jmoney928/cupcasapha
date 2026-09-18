/**
 * Single source of truth for certification claims. Everything on the site that mentions a
 * certificate reads from here, so a number, link or wording change happens in one place.
 *
 * Certificates are issued by DIN CERTCO, part of the TÜV Rheinland group.
 */
export const CERT = {
  number: "9P0326",
  title: "Certified home compostable",
  scheme: "DIN CERTCO — DIN-Geprüft Home Compostable",
  issuer: "DIN CERTCO (TÜV Rheinland group)",
  /**
   * Direct link to the public register entry. Register entries look like
   * https://www.dincertco.tuv.com/registrations/<internal-id>?locale=en — the internal id is NOT the
   * certificate number, so it has to be copied from the register once the entry is published.
   * Until then we link to the register search for the number.
   */
  entryUrl: null as string | null,
  searchUrl: "https://www.dincertco.tuv.com/search?locale=en&q=9P0326",
  registerUrl: "https://www.dincertco.tuv.com/?locale=en",
  /**
   * DIN-Geprüft Home Compostable mark. Artwork and usage rules must be requested from DIN CERTCO
   * (or the material supplier); it may not be copied from the web. Drop the file at
   * public/certs/din-geprueft-home-compostable.svg (or .png) and set this to its path.
   */
  logoSrc: null as string | null,
} as const;

/** Where a visitor can verify the certificate today. */
export const certVerifyUrl = CERT.entryUrl ?? CERT.searchUrl;

/** The lining resin's own registration, public on the DIN CERTCO register. */
export const LINING_CERT = {
  holder: "Beijing PhaBuilder Biotechnology Co., Ltd",
  number: "9R0050",
  scheme: "Compostable material for home and garden composting (NF T51-800)",
  url: "https://www.dincertco.tuv.com/registrations/60170011?locale=en",
} as const;

export const MATERIAL_CLAIM = "No PE, no PLA, no microplastics — PHA lining";
export const MATERIAL_SHORT = "No PE · no PLA · no microplastics";
export const CERT_SHORT = `${CERT.title} — DIN CERTCO ${CERT.number}`;
