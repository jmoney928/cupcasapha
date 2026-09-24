import data from "../../../content/grants.json";

export type Grant = {
  id: string; name: string; funder: string; amountRange: string;
  purpose: "hiring" | "startup" | "energy" | "export" | "other";
  deadlineKind: "rolling" | "annual" | "closed";
  eligibility: string[]; url: string; verifiedAt: string; nextDeadline?: string;
};

const STALE_AFTER_DAYS = 183; // two quarters

export const allGrants: Grant[] = data.grants as Grant[];

const daysSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86_400_000;

export const isStale = (g: Grant) => daysSince(g.verifiedAt) > STALE_AFTER_DAYS;

/**
 * Anything unverified for two quarters is hidden rather than shown stale. A café that misses a
 * deadline on our bad data is the one failure mode in this module that costs them real money.
 */
export const liveGrants = (): Grant[] => allGrants.filter((g) => g.deadlineKind !== "closed" && !isStale(g));

export const PURPOSE_LABELS: Record<Grant["purpose"], string> = {
  hiring: "Hiring & wages",
  startup: "Starting up",
  energy: "Energy & equipment",
  export: "Growth & export",
  other: "Other",
};
