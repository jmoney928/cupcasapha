"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-context";

export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
