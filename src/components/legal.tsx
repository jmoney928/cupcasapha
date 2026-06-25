import type { ReactNode } from "react";

export function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="section-pad py-16">
      <div className="max-w-3xl mx-auto">
        <p className="font-display font-bold text-coral uppercase tracking-wide text-sm">
          cupcasa cups
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">{title}</h1>
        <p className="text-sm text-espresso/50 mt-3">Last updated: {updated}</p>
        {intro && <div className="text-lg text-espresso/75 mt-6 space-y-4">{intro}</div>}
        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </section>
  );
}

export function Clause({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold flex gap-3">
        <span className="text-caramel">{n}.</span>
        <span>{title}</span>
      </h2>
      <div className="mt-3 space-y-3 text-espresso/80 leading-relaxed">{children}</div>
    </div>
  );
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-leaf shrink-0" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="bg-butter/40 text-espresso font-semibold rounded px-1.5 py-0.5">
      {children}
    </span>
  );
}
