/** Money is stored in integer cents, CAD. */
export const cad = (cents: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export const num = (n: number) => new Intl.NumberFormat("en-CA").format(n);

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(new Date(iso)) : "—";

export const fullDate = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso))
    : "—";

export const dateTime = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
        new Date(iso),
      )
    : "—";

export const relative = (iso: string | null | undefined) => {
  if (!iso) return "never";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/** Days of cover from estimated stock and burn. Infinity when there is no burn. */
export const daysOfCover = (estOnHand: number, dailyBurn: number) =>
  dailyBurn > 0 ? estOnHand / dailyBurn : Number.POSITIVE_INFINITY;

export type CoverLevel = "green" | "amber" | "red";
/** red = at/below reorder point, amber = within 7 days of it, green otherwise. */
export const coverLevel = (estOnHand: number, dailyBurn: number, reorderPoint: number): CoverLevel => {
  if (dailyBurn <= 0) return "green";
  if (estOnHand <= reorderPoint) return "red";
  if (estOnHand <= reorderPoint + dailyBurn * 7) return "amber";
  return "green";
};

/** When the engine will next suggest a reorder: the day stock crosses the reorder point. */
export const nextReorderDate = (estOnHand: number, dailyBurn: number, reorderPoint: number) => {
  if (dailyBurn <= 0) return null;
  const days = Math.max(0, (estOnHand - reorderPoint) / dailyBurn);
  return new Date(Date.now() + days * 86400_000);
};

export const sizeLabel = (p: { size_oz: number; printed: boolean }) => `${p.size_oz}oz${p.printed ? " printed" : ""}`;

export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Helpers that touch the clock, kept out of component bodies (react-hooks/purity). */
export const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86400_000).toISOString();
export const lastNDays = (n: number) => Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 86400_000).toISOString().slice(0, 10));
export const isPast = (d: Date) => d.getTime() <= Date.now();
export const nextReorderLabel = (estOnHand: number, dailyBurn: number, reorderPoint: number) => {
  const next = nextReorderDate(estOnHand, dailyBurn, reorderPoint);
  if (!next) return "—";
  return isPast(next) ? "now" : shortDate(next.toISOString());
};
export const startOfMonthIso = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); };
