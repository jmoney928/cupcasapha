"use client";

import Link from "next/link";
import { ArrowRight, Plus, Check } from "lucide-react";
import { useState } from "react";
import { type Product, formatPrice } from "@/lib/products";
import { Cup } from "@/components/cup";
import { useCart } from "@/components/cart-context";

const bg: Record<string, string> = {
  coral: "bg-coral-soft/40",
  caramel: "bg-caramel-light/40",
  leaf: "bg-leaf-bright/30",
};

export function ProductCard({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(product.slug, 1);
    setAdded(true);
    setOpen(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group rounded-[2rem] bg-white/70 border border-caramel/20 overflow-hidden flex flex-col hover:shadow-[0_20px_50px_rgba(58,36,23,0.12)] transition-shadow duration-300">
      <Link
        href={`/shop/${product.slug}`}
        className={`relative ${bg[product.accent] ?? "bg-cream-deep"} pt-8 pb-2 flex justify-center`}
      >
        {product.doubleWall && (
          <span className="absolute top-4 left-4 bg-espresso text-cream text-xs font-bold px-3 py-1 rounded-full">
            Double wall
          </span>
        )}
        <span className="absolute top-4 right-4 bg-cream text-espresso text-xs font-bold px-3 py-1 rounded-full">
          {product.size}
        </span>
        <div className="w-32 transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-3">
          <Cup tone={product.accent as "coral"} doubleWall={product.doubleWall} />
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-bold">{product.name}</h3>
          <span className="font-display font-bold text-coral whitespace-nowrap">
            {formatPrice(product.casePrice)}
          </span>
        </div>
        <p className="text-sm text-espresso/60 mb-1">{product.shortName}</p>
        <p className="text-sm text-espresso/70 flex-1">{product.blurb}</p>

        <div className="text-xs text-espresso/50 mt-3 mb-4">
          {formatPrice(product.pricePerCup)}/cup · case of {product.caseCount.toLocaleString()}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className={`btn-pill flex-1 py-3 text-sm shadow-[0_5px_0_0_#3f7d28] ${
              added ? "bg-leaf text-cream" : "bg-leaf text-cream"
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add case
              </>
            )}
          </button>
          <Link
            href={`/shop/${product.slug}`}
            className="btn-pill px-4 border-2 border-espresso/15 text-espresso hover:bg-cream-deep"
            aria-label={`View ${product.name}`}
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
