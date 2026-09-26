"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { blankProducts } from "@/lib/products";
import { packsForSize } from "@/lib/packs";
import { formatCents } from "@/lib/skus";
import { useCart } from "@/components/cart-context";

/** Compact buy row — one card per size, quoting and adding that size's entry pack. */
export function ReserveStrip() {
  /* The 100-set pack is the way in; the product page is where the bigger packs are chosen. */
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
      {blankProducts.map((p) => {
        const entry = packsForSize(p.oz as 8 | 12 | 16)[0];
        return (
        <div
          key={p.slug}
          className="rounded-3xl bg-cream-deep/50 border border-espresso/8 p-6 flex flex-col"
        >
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-extrabold">{p.size}</span>
            <span className="font-display text-xl font-bold text-coral">
              {formatCents(entry.totalCents)}
            </span>
          </div>
          <p className="text-sm text-espresso/55 mt-1">
            {p.shortName} · {entry.packSize} cups, sleeves &amp; lids · {entry.perTrioCents}¢ a set
          </p>
          <button
            onClick={() => reserve(entry.slug)}
            className="btn-pill mt-5 bg-coral text-white py-3 text-sm hover:bg-coral-deep"
          >
            {added === entry.slug ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add {entry.packSize} sets
              </>
            )}
          </button>
        </div>
        );
      })}
    </div>
  );
}
