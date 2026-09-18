import Link from "next/link";
import type { ReactNode } from "react";

/* ---------- layout ---------- */
export function PageHeader({ title, eyebrow, action, children }: { title: string; eyebrow?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="label-caps text-caramel">{eyebrow}</div>}
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        {children && <p className="mt-1 text-sm text-cocoa">{children}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "", title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-2xl border bg-white/70 p-4 shadow-sm md:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value, hint, tone = "default", href }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "default" | "red" | "amber" | "green"; href?: string }) {
  const tones = {
    default: "border-caramel/30",
    red: "border-coral/60 bg-coral/5",
    amber: "border-butter bg-butter/20",
    green: "border-leaf/40 bg-leaf/5",
  };
  const body = (
    <div className={`rounded-2xl border bg-white/70 p-4 ${tones[tone]}`}>
      <div className="label-caps text-caramel">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-cocoa">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block transition hover:-translate-y-0.5">{body}</Link> : body;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed p-6 text-center text-sm text-cocoa">{children}</div>;
}

/* ---------- status ---------- */
const badgeTones: Record<string, string> = {
  // reorders
  suggested: "bg-butter/40 text-cocoa",
  sms_sent: "bg-sky/30 text-leaf",
  approved: "bg-leaf/15 text-leaf",
  charged: "bg-leaf/20 text-leaf",
  invoiced: "bg-leaf/15 text-leaf",
  shipped: "bg-espresso text-cream",
  delivered: "bg-leaf text-cream",
  declined: "bg-caramel/25 text-cocoa",
  failed: "bg-coral/20 text-coral-deep",
  // orders
  pending_payment: "bg-butter/40 text-cocoa",
  paid: "bg-leaf/15 text-leaf",
  cancelled: "bg-caramel/25 text-cocoa",
  // roles
  admin: "bg-espresso text-cream",
  staff: "bg-leaf/15 text-leaf",
  client: "bg-caramel/25 text-cocoa",
  owner: "bg-leaf/15 text-leaf",
  manager: "bg-caramel/25 text-cocoa",
  // levels
  green: "bg-leaf/15 text-leaf",
  amber: "bg-butter/60 text-cocoa",
  red: "bg-coral/20 text-coral-deep",
  card: "bg-caramel/25 text-cocoa",
  net30: "bg-sky/30 text-leaf",
};
export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeTones[value] ?? "bg-caramel/25 text-cocoa"}`}>
      {label ?? value.replace(/_/g, " ")}
    </span>
  );
}

/* ---------- forms ---------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-cocoa">{hint}</span>}
    </label>
  );
}
export const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-base outline-none focus:border-espresso";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Toggle({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border bg-white p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-5 w-5 accent-leaf" />
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-cocoa">{hint}</span>}
      </span>
    </label>
  );
}

const btn = {
  primary: "bg-coral text-white hover:bg-coral-deep",
  dark: "bg-espresso text-cream hover:bg-espresso-soft",
  leaf: "bg-leaf text-cream hover:bg-leaf-bright",
  outline: "border-2 border-espresso text-espresso hover:bg-espresso hover:text-cream",
  ghost: "text-espresso hover:bg-espresso/5",
  danger: "border-2 border-coral text-coral-deep hover:bg-coral hover:text-white",
};
export type BtnVariant = keyof typeof btn;
export function btnCls(variant: BtnVariant = "primary", size: "sm" | "md" = "md") {
  return `btn-pill ${btn[variant]} ${size === "sm" ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5 text-sm"} disabled:opacity-50`;
}
export function ButtonLink({ href, children, variant = "primary", size = "md" }: { href: string; children: ReactNode; variant?: BtnVariant; size?: "sm" | "md" }) {
  return <Link href={href} className={btnCls(variant, size)}>{children}</Link>;
}

/** Flash message driven by ?ok= / ?error= search params (server actions redirect with them). */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-coral/15 text-coral-deep" : "bg-leaf/15 text-leaf"}`} role="status">
      {error ?? ok}
    </div>
  );
}

/* ---------- tables ---------- */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto md:mx-0">
      <table className="w-full min-w-[560px] text-sm">{children}</table>
    </div>
  );
}
export const th = "px-3 py-2 text-left label-caps text-caramel font-bold whitespace-nowrap";
export const td = "px-3 py-2.5 border-t align-top";
