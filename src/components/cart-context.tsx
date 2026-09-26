"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { findSku, knownSkus, type SkuKind } from "@/lib/skus";
import { fbqTrack } from "@/lib/fbq";

export type CartItem = { slug: string; qty: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  /** Consumer packs, paid in full at checkout. In cents. */
  packSubtotalCents: number;
  /** Café cases, reserved against a deposit. In cents. */
  caseSubtotalCents: number;
  hasPacks: boolean;
  hasCases: boolean;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "cupcasa-cart";

/** Carts saved before packs existed stored `cases`; read those, drop anything unrecognised. */
function parseStored(raw: string): CartItem[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { slug, qty, cases } = entry as { slug?: unknown; qty?: unknown; cases?: unknown };
    const n = Number(qty ?? cases);
    if (typeof slug !== "string" || !knownSkus.has(slug) || !Number.isFinite(n) || n <= 0) return [];
    return [{ slug, qty: Math.floor(n) }];
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(parseStored(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
    }
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => {
    const totalFor = (kind: SkuKind) =>
      items.reduce((sum, it) => {
        const sku = findSku(it.slug);
        return sku?.kind === kind ? sum + sku.unitPriceCents * it.qty : sum;
      }, 0);

    const kinds = items.map((it) => findSku(it.slug)?.kind);

    return {
      items,
      count: items.reduce((n, it) => n + it.qty, 0),
      packSubtotalCents: totalFor("pack"),
      caseSubtotalCents: totalFor("case"),
      hasPacks: kinds.includes("pack"),
      hasCases: kinds.includes("case"),
      isOpen,
      setOpen,
      add: (slug, qty = 1) => {
        const sku = findSku(slug);
        if (sku)
          fbqTrack("AddToCart", {
            content_ids: [slug],
            content_type: "product",
            content_name: sku.name,
            contents: [{ id: slug, quantity: qty }],
            value: (sku.unitPriceCents * qty) / 100,
            currency: "CAD",
          });
        setItems((prev) => {
          const found = prev.find((i) => i.slug === slug);
          if (found) return prev.map((i) => (i.slug === slug ? { ...i, qty: i.qty + qty } : i));
          return [...prev, { slug, qty }];
        });
      },
      setQty: (slug, qty) =>
        setItems((prev) =>
          qty <= 0 ? prev.filter((i) => i.slug !== slug) : prev.map((i) => (i.slug === slug ? { ...i, qty } : i))
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
