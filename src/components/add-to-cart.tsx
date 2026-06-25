"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { type Product, formatPrice } from "@/lib/products";

export function AddToCart({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const [cases, setCasesLocal] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(product.slug, cases);
    setAdded(true);
    setOpen(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display text-4xl font-bold text-coral">
            {formatPrice(product.casePrice * cases)}
          </div>
          <div className="text-sm text-espresso/60">
            {formatPrice(product.pricePerCup)}/cup · {(product.caseCount * cases).toLocaleString()} cups total
          </div>
        </div>
        <div className="flex items-center gap-2 bg-cream-deep rounded-full p-1.5">
          <button
            onClick={() => setCasesLocal((c) => Math.max(1, c - 1))}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-coral hover:text-cream transition-colors"
            aria-label="Decrease cases"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="w-14 text-center">
            <div className="font-display font-bold text-lg leading-none">{cases}</div>
            <div className="text-[10px] text-espresso/50 uppercase font-bold">cases</div>
          </div>
          <button
            onClick={() => setCasesLocal((c) => c + 1)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-leaf hover:text-cream transition-colors"
            aria-label="Increase cases"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="btn-pill w-full bg-coral text-cream py-4 text-lg shadow-[0_6px_0_0_#c4452a]"
      >
        {added ? (
          <>
            <Check className="w-5 h-5" /> Added to cart
          </>
        ) : (
          <>
            <ShoppingBag className="w-5 h-5" /> Add {cases} case{cases > 1 ? "s" : ""} to cart
          </>
        )}
      </button>
    </div>
  );
}
