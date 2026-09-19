import { cad, sizeLabel } from "@/lib/format";

type Item = { size_oz: number; printed: boolean; cases: number; amount_cents: number; days?: number | null };

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/** One text per café per night, covering every size that is low. YES approves all of them. */
export function reorderApprovalSms(items: Item[]) {
  const total = items.reduce((a, i) => a + i.amount_cents, 0);
  if (items.length === 1) {
    const i = items[0];
    const days = i.days != null && Number.isFinite(i.days) ? `~${Math.max(0, Math.floor(i.days))} days` : "a few days";
    return `Cup Casa: you're ${days} from running out of ${sizeLabel(i)} cups. Reply YES to send ${plural(i.cases, "case")} (${cad(total)} incl. tax) or NO to skip.`;
  }
  const low = items.map((i) => `${sizeLabel(i)}${i.days != null && Number.isFinite(i.days) ? ` (~${Math.max(0, Math.floor(i.days))} days)` : ""}`).join(" and ");
  const send = items.map((i) => `${plural(i.cases, "case")} ${sizeLabel(i)}`).join(" + ");
  return `Cup Casa: you're running low on ${low}. Reply YES to send ${send} (${cad(total)} incl. tax) or NO to skip.`;
}

export const countRequestSms = (p: { size_oz: number; printed: boolean }) =>
  `Cup Casa: roughly how many sleeves of ${sizeLabel(p)} do you have left? Reply with a number.`;

export const countThanksSms = (p: { size_oz: number; printed: boolean }, sleeves: number, next?: { size_oz: number; printed: boolean }) =>
  `Thanks! ${sleeves} sleeves of ${sizeLabel(p)} noted.${next ? ` And roughly how many sleeves of ${sizeLabel(next)}? Reply with a number.` : ""}`;

export const approvedSms = (items: Item[]) =>
  `Thanks! ${items.map((i) => `${plural(i.cases, "case")} of ${sizeLabel(i)}`).join(" + ")} are on the way. We'll text you the tracking number.`;

export const declinedSms = () => `No problem — we'll skip this one and check in again next week. Reply HELP any time.`;

export const paymentLinkSms = (link: string) =>
  `Cup Casa: we couldn't charge the card on file for your reorder. Pay securely here (link expires in 24h): ${link}`;

export const shippedSms = (o: { order_number: string; carrier: string | null; tracking_number: string | null }) =>
  `Cup Casa: order ${o.order_number} has shipped${o.carrier ? ` via ${o.carrier}` : ""}${o.tracking_number ? `, tracking ${o.tracking_number}` : ""}. Reply HELP for help.`;

export const helpSms = () =>
  `Cup Casa cup replenishment. Reply YES/NO to a reorder text, or a number to a stock check. STOP to opt out. Questions: hello@cupcasa.com`;

export const stopSms = () => `You're opted out of Cup Casa texts. Reply START to opt back in.`;

export const unrecognizedSms = () =>
  `Sorry, we didn't catch that. Reply YES or NO to a reorder text, or a number for a stock check. Reply HELP for options.`;
