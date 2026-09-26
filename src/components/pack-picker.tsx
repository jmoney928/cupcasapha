"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { packsForSize, type Pack } from "@/lib/packs";
import { formatCents } from "@/lib/skus";
import type { CupSize } from "@/lib/calc/catalog";

/**
 * The consumer buy panel: pick a pack size, pick how many, add. Each pack is a matched set of
 * cups, custom-printed sleeves and lids, so there is nothing to mix and match and nothing to
 * get wrong. Cafés buying by the case go through /wholesale instead.
 */
export function PackPicker({ oz }: { oz: CupSize }) {
  const options = packsForSize(oz);
  const [selected, setSelected] = useState<Pack>(options[1] ?? options[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add, setOpen } = useCart();

  const handleAdd = () => {
    add(selected.slug, qty);
    setAdded(true);
    setOpen(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = option.slug === selected.slug;
          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => setSelected(option)}
              aria-pressed={isSelected}
              className={`w-full flex items-center justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "border-coral bg-coral/10"
                  : "border-espresso/10 bg-white/60 hover:border-espresso/25"
              }`}
            >
              <span>
                <span className="font-display font-bold text-lg block leading-tight">
                  {option.packSize} sets
                </span>
                <span className="text-sm text-espresso/60">
                  {option.packSize} cups · {option.packSize} custom sleeves · {option.packSize} lids
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="font-display font-bold text-lg block leading-tight">
                  {formatCents(option.totalCents)}
                </span>
                <span className="text-sm text-espresso/60">{option.perTrioCents}¢ a set</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="font-display text-3xl font-bold text-coral">
          {formatCents(selected.totalCents * qty)}
        </div>
        <div className="flex items-center gap-2 bg-cream-deep rounded-full p-1.5">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-coral hover:text-cream transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="w-14 text-center">
            <div className="font-display font-bold text-lg leading-none">{qty}</div>
            <div className="text-[10px] text-espresso/50 uppercase font-bold">packs</div>
          </div>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-leaf hover:text-cream transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="btn-pill w-full bg-coral text-white py-4 text-lg hover:bg-coral-deep"
      >
        {added ? (
          <>
            <Check className="w-5 h-5" /> Added to cart
          </>
        ) : (
          <>
            <ShoppingBag className="w-5 h-5" /> Add to cart
          </>
        )}
      </button>
      <p className="text-xs text-espresso/60 text-center">
        Paid in full today · cups arriving <strong>December 2026</strong>.
      </p>
    </div>
  );
}
