"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string; exact?: boolean };

const isActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

/** Mobile bottom tab bar (portal). */
export function TabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-cream/95 backdrop-blur md:hidden" aria-label="Primary">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${isActive(pathname, it) ? "text-coral" : "text-cocoa"}`}
            >
              <span aria-hidden className="text-lg leading-none">{it.icon}</span>
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Desktop sidebar / mobile horizontal scroller (admin) and desktop top nav (portal). */
export function SideNav({ items, variant = "sidebar" }: { items: NavItem[]; variant?: "sidebar" | "top" }) {
  const pathname = usePathname();
  const base = "rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap transition";
  return (
    <nav aria-label="Primary" className={variant === "sidebar" ? "flex gap-1 overflow-x-auto md:flex-col md:overflow-visible" : "hidden gap-1 md:flex"}>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`${base} ${isActive(pathname, it) ? "bg-espresso text-cream" : "text-espresso hover:bg-espresso/5"}`}
        >
          <span aria-hidden className="mr-1.5">{it.icon}</span>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
