/**
 * Money is integer cents everywhere in lib/calc. Never floats — see docs/SPEC.md,
 * "Rounding and currency". Dollars only exist at the edges, for input parsing and display.
 */
export type Cents = number;

/**
 * "5.75" | "$5.75" | 5.75 → 575.
 *
 * Converts through the decimal string rather than multiplying by 100, because 0.145 * 100 is
 * 14.499999999999998 in binary floating point and would round down to 14¢. Throws on anything
 * that is not a plain decimal, so a stray input can never silently become 0 mid-formula.
 */
export function toCents(dollars: number | string): Cents {
  const s = (typeof dollars === "number" ? String(dollars) : dollars).trim().replace(/[$,\s]/g, "");
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(s)) throw new TypeError(`toCents: not a number (${String(dollars)})`);

  const negative = s.startsWith("-");
  const [whole = "0", fraction = ""] = s.replace(/^-/, "").split(".");
  const padded = (fraction + "000").slice(0, 3); // two cent digits plus one to round on
  let cents = Number(whole || "0") * 100 + Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) cents += 1; // round half up, as money does
  return negative ? -cents : cents;
}

export const fromCents = (c: Cents): number => c / 100;

export const formatCad = (c: Cents): string =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(c / 100);

/** Per-cup figures need the cents, e.g. "$0.22". Accepts fractional cents. */
export const formatCadPrecise = (c: number): string =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(c / 100);
