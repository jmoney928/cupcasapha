"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { products, formatPrice } from "@/lib/products";
import { fbqTrack } from "@/lib/fbq";
import { Cup } from "@/components/cup";

export function CartDrawer() {
  const { items, isOpen, setOpen, setCases, remove, subtotal, count } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    setLoading(true);
    setError(null);
    fbqTrack("InitiateCheckout", {
      content_ids: items.map((i) => i.slug),
      contents: items.map((i) => ({ id: i.slug, quantity: i.cases })),
      num_items: count,
      value: Math.round(subtotal * 100) / 100,
      currency: "CAD",
    });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Checkout is not configured yet.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-espresso/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-cream shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between p-5 border-b border-caramel/25">
          <h2 className="font-display text-2xl font-bold">
            Your cart{count > 0 && <span className="text-coral"> ({count})</span>}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-full hover:bg-cream-deep"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 && (
            <div className="text-center py-16 text-espresso/60">
              <div className="w-24 mx-auto mb-4 opacity-60">
                <Cup tone="caramel" />
              </div>
              <p className="font-semibold">Your cart is empty</p>
              <p className="text-sm">Cups are sold by the case of 1,000.</p>
            </div>
          )}

          {items.map((item) => {
            const p = products.find((x) => x.slug === item.slug);
            if (!p) return null;
            return (
              <div
                key={item.slug}
                className="flex gap-4 bg-white/60 rounded-3xl p-4 border border-caramel/20"
              >
                <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden">
                  <Image src={p.image} alt={p.name} fill sizes="56px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-display font-bold leading-tight">{p.name}</p>
                      <p className="text-sm text-espresso/60">
                        {formatPrice(p.casePrice)} / case · {p.caseCount.toLocaleString()} cups
                      </p>
                    </div>
                    <button
                      onClick={() => remove(item.slug)}
                      className="text-espresso/40 hover:text-coral self-start"
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-cream-deep rounded-full p-1">
                      <button
                        onClick={() => setCases(item.slug, item.cases - 1)}
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-coral hover:text-cream"
                        aria-label="Decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">
                        {item.cases}
                      </span>
                      <button
                        onClick={() => setCases(item.slug, item.cases + 1)}
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-leaf hover:text-cream"
                        aria-label="Increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-display font-bold">
                      {formatPrice(p.casePrice * item.cases)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-caramel/25 space-y-3">
            <div className="rounded-2xl bg-coral/10 text-espresso/80 text-sm p-3 leading-snug">
              🎟️ Reserve your order with a <strong>$200 deposit</strong>. Cups are
              arriving <strong>October 2026</strong> — we&apos;ll bill the balance when
              they ship.
            </div>
            <div className="flex justify-between text-sm text-espresso/60">
              <span>Order value (reserved)</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Deposit due today</span>
              <span className="font-display font-bold">{formatPrice(200)}</span>
            </div>
            <p className="text-xs text-espresso/60">
              Need 50+ cases?{" "}
              <a href="/wholesale" className="underline font-semibold">
                Get wholesale pricing
              </a>
              .
            </p>
            {error && (
              <p className="text-sm text-coral font-semibold bg-coral/10 rounded-xl p-3">
                {error}
              </p>
            )}
            <button
              onClick={checkout}
              disabled={loading}
              className="btn-pill w-full bg-coral text-cream py-4 text-lg shadow-[0_6px_0_0_#c4452a] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Redirecting…
                </>
              ) : (
                "Pay $200 deposit"
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
