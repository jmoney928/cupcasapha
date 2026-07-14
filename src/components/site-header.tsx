"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, Leaf } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { CartDrawer } from "@/components/cart-drawer";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/why-pha", label: "Why PHA" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/wholesale", label: "Wholesale" },
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
      <div className="bg-espresso text-cream text-center text-xs sm:text-sm py-2 px-4 font-semibold">
        <Leaf className="inline-block w-4 h-4 mr-1.5 -mt-0.5 text-leaf-bright" />
        Now taking deposits — reserve your cups with a $200 deposit · arriving October 2026
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-cream/90 backdrop-blur-md shadow-[0_4px_24px_rgba(58,36,23,0.08)]"
            : "bg-cream"
        }`}
      >
        <div className="section-pad flex items-center justify-between h-18 py-3">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/brand/cupcasa-wordmark.png"
              alt="cupcasa"
              width={170}
              height={64}
              priority
              className="h-10 sm:h-12 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-full font-semibold text-espresso/80 hover:text-espresso hover:bg-cream-deep transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open cart"
              className="relative p-2.5 rounded-full hover:bg-cream-deep transition-colors"
            >
              <ShoppingBag className="w-6 h-6 text-espresso" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-coral text-cream text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            <Link
              href="/wholesale"
              className="btn-pill hidden sm:inline-flex bg-leaf text-cream px-5 py-2.5 text-sm shadow-[0_5px_0_0_#3f7d28]"
            >
              Get a quote
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

        {/* mobile menu */}
        {open && (
          <div className="lg:hidden section-pad pb-6 flex flex-col gap-1 bg-cream border-t border-caramel/20">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-2xl font-semibold text-espresso hover:bg-cream-deep"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/wholesale"
              onClick={() => setMobileOpen(false)}
              className="btn-pill bg-leaf text-cream px-5 py-3 mt-2 shadow-[0_5px_0_0_#3f7d28]"
            >
              Get a wholesale quote
            </Link>
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
