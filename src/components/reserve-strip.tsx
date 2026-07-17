"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { blankProducts, formatPrice } from "@/lib/products";
import { useCart } from "@/components/cart-context";

/** Compact reserve row — size + price + deposit CTA, no large imagery. */
export function ReserveStrip() {
  const { add, setOpen } = useCart();
  const [added, setAdded] = useState<string | null>(null);

  const reserve = (slug: string) => {
    add(slug, 1);
    setOpen(true);
    setAdded(slug);
    setTimeout(() => setAdded(null), 1500);
  };

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {blankProducts.map((p) => (
        <div
          key={p.slug}
          className="rounded-3xl bg-cream-deep/50 border border-espresso/8 p-6 flex flex-col"
        >
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-extrabold">{p.size}</span>
            <span className="font-display text-xl font-bold text-coral">
              {formatPrice(p.casePrice)}
            </span>
          </div>
          <p className="text-sm text-espresso/55 mt-1">
            {p.shortName} · {formatPrice(p.pricePerCup)}/cup · case of 1,000
          </p>
          <button
            onClick={() => reserve(p.slug)}
            className="btn-pill mt-5 bg-coral text-white py-3 text-sm hover:bg-coral-deep"
          >
            {added === p.slug ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Reserve · $200 deposit
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
