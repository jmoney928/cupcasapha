"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-context";
import { clearArtwork } from "@/lib/artwork";

export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // The order is placed and we already have the file; holding somebody's logo on what may
    // be a shared machine serves no purpose.
    clearArtwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
