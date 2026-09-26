"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Plus, Check } from "lucide-react";
import { useState } from "react";
import { type Product } from "@/lib/products";
import { packsForSize } from "@/lib/packs";
import { formatCents } from "@/lib/skus";
import { useCart } from "@/components/cart-context";

export function ProductCard({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const [added, setAdded] = useState(false);

  /* The card quotes and adds the smallest pack; the product page is where the sizes are chosen. */
  const options = packsForSize(product.oz as 8 | 12 | 16);
  const entry = options[0];
  const best = options[options.length - 1];

  const handleAdd = () => {
    add(entry.slug, 1);
    setAdded(true);
    setOpen(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group rounded-[2rem] bg-white/70 border border-caramel/20 overflow-hidden flex flex-col hover:shadow-[0_20px_50px_rgba(58,36,23,0.12)] transition-shadow duration-300">
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <span className="absolute top-4 left-4 z-10 bg-espresso text-cream text-xs font-bold px-3 py-1 rounded-full">
          Home compostable
        </span>
        <span className="absolute top-4 right-4 z-10 bg-cream text-espresso text-xs font-bold px-3 py-1 rounded-full">
          {product.size}
        </span>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-bold">{product.name}</h3>
          <span className="font-display font-bold text-coral whitespace-nowrap">
            {formatCents(entry.totalCents)}
          </span>
        </div>
        <p className="text-sm text-espresso/60 mb-1">{product.shortName}</p>
        <p className="text-sm text-espresso/70 flex-1">{product.blurb}</p>

        <div className="text-xs text-espresso/50 mt-3 mb-4">
          {entry.packSize} sets · {entry.perTrioCents}¢ each, down to {best.perTrioCents}¢ at{" "}
          {best.packSize}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className={`btn-pill flex-1 py-3 text-sm text-white ${
              added ? "bg-leaf" : "bg-coral hover:bg-coral-deep"
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add {entry.packSize}
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
