"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { CartDrawer } from "@/components/cart-drawer";
import { Logo, Particles } from "@/components/brand";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/why-pha", label: "The Material" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/wholesale", label: "Custom & Wholesale" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, setOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* announcement bar */}
      <div className="bg-espresso text-cream text-center text-xs sm:text-sm py-2.5 px-4 font-medium tracking-tight">
        Now taking deposits — reserve your cups with{" "}
        <span className="text-coral font-semibold">$200</span> · shipping{" "}
        <span className="font-semibold">October 2026</span>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-cream/85 backdrop-blur-md border-b border-espresso/10"
            : "bg-cream border-b border-transparent"
        }`}
      >
        <div className="section-pad flex items-center justify-between h-16 sm:h-18">
          <Link href="/" className="flex items-center shrink-0" aria-label="cupcasa home">
            <Logo variant="black" priority className="h-8 sm:h-10 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 rounded-full text-sm font-semibold text-espresso/70 hover:text-espresso hover:bg-cream-deep transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open cart"
              className="relative p-2.5 rounded-full hover:bg-cream-deep transition-colors"
            >
              <ShoppingBag className="w-5 h-5 text-espresso" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-coral text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            <Link
              href="/wholesale"
              className="btn-pill hidden sm:inline-flex bg-coral text-white px-5 py-2.5 text-sm hover:bg-coral-deep"
            >
              Start your design
              <Particles className="w-5 h-3 text-white/90" />
            </Link>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="lg:hidden p-2.5 rounded-full hover:bg-cream-deep"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden section-pad pb-6 flex flex-col gap-1 bg-cream border-t border-espresso/10">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl font-semibold text-espresso hover:bg-cream-deep"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/wholesale"
              onClick={() => setMobileOpen(false)}
              className="btn-pill bg-coral text-white px-5 py-3 mt-2 hover:bg-coral-deep"
            >
              Start your design
            </Link>
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
