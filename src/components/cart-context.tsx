"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products } from "@/lib/products";

export type CartItem = { slug: string; cases: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (slug: string, cases?: number) => void;
  setCases: (slug: string, cases: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "cupcasa-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => {
    const subtotal = items.reduce((sum, it) => {
      const p = products.find((x) => x.slug === it.slug);
      return sum + (p ? p.casePrice * it.cases : 0);
    }, 0);
    const count = items.reduce((n, it) => n + it.cases, 0);

    return {
      items,
      count,
      subtotal,
      isOpen,
      setOpen,
      add: (slug, cases = 1) =>
        setItems((prev) => {
          const found = prev.find((i) => i.slug === slug);
          if (found)
            return prev.map((i) =>
              i.slug === slug ? { ...i, cases: i.cases + cases } : i
            );
          return [...prev, { slug, cases }];
        }),
      setCases: (slug, cases) =>
        setItems((prev) =>
          cases <= 0
            ? prev.filter((i) => i.slug !== slug)
            : prev.map((i) => (i.slug === slug ? { ...i, cases } : i))
        ),
      remove: (slug) => setItems((prev) => prev.filter((i) => i.slug !== slug)),
      clear: () => setItems([]),
    };
  }, [items, isOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
