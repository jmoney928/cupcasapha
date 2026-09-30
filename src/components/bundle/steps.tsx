"use client";

import Image from "next/image";
import { Check, Store, User } from "lucide-react";
import { Cup } from "@/components/cup";
import { formatCents } from "@/lib/skus";
import {
  BUNDLE_SIZES,
  CASE_UNITS,
  MAX_CASES,
  PACK_OPTIONS,
  PARTS_OPTIONS,
  bundleProduct,
  totalCents,
  unitCents,
  type BundleParts,
  type BundleQty,
} from "@/lib/bundle";
import type { CupSize } from "@/lib/calc/catalog";

const TONES = { 8: "coral", 12: "caramel", 16: "leaf" } as const;

/** One selectable card. Everything in the flow is a radio at heart, so it behaves like one. */
function Choice({
  selected,
  onSelect,
  children,
  className = "",
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative text-left rounded-3xl border-2 p-5 transition-colors ${
        selected
          ? "border-coral bg-coral/6"
          : "border-espresso/10 bg-white/60 hover:border-espresso/30"
      } ${className}`}
    >
      {selected && (
        <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-coral grid place-items-center">
          <Check className="w-4 h-4 text-white" />
        </span>
      )}
      {children}
    </button>
  );
}

/* --------------------------------------------------------------------- size */

export function StepSize({ value, onPick }: { value: CupSize | null; onPick: (oz: CupSize) => void }) {
  return (
    <div role="radiogroup" aria-label="Cup size" className="grid sm:grid-cols-3 gap-4">
      {BUNDLE_SIZES.map((oz) => {
        const p = bundleProduct(oz);
        return (
          <Choice key={oz} selected={value === oz} onSelect={() => onPick(oz)}>
            <div className="w-20 mx-auto mb-3">
              <Cup tone={TONES[oz as 8 | 12 | 16]} />
            </div>
            <p className="font-display text-2xl font-extrabold">{oz}oz</p>
            <p className="label-caps text-espresso/40 mt-0.5">{p?.shortName}</p>
            <p className="text-sm text-espresso/70 mt-3">{p?.blurb}</p>
          </Choice>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- quantity */

export function StepQuantity({
  oz,
  value,
  onPick,
}: {
  oz: CupSize;
  value: BundleQty | null;
  onPick: (qty: BundleQty) => void;
}) {
  const cases = value?.kind === "case" ? value.cases : 1;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-coral" />
          <p className="label-caps text-coral">Buying for yourself</p>
        </div>
        <div role="radiogroup" aria-label="Pack size" className="grid sm:grid-cols-3 gap-4">
          {PACK_OPTIONS.map((packSize) => {
            const qty: BundleQty = { kind: "pack", packSize };
            return (
              <Choice
                key={packSize}
                selected={value?.kind === "pack" && value.packSize === packSize}
                onSelect={() => onPick(qty)}
              >
                <p className="font-display text-3xl font-extrabold">{packSize}</p>
                <p className="text-sm text-espresso/60">sets</p>
                <p className="mt-3 font-bold text-coral">{unitCents(oz, "all", qty)}¢ a set</p>
                <p className="text-xs text-espresso/50 mt-1">
                  {formatCents(totalCents(oz, "all", qty))} · paid in full
                </p>
              </Choice>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Store className="w-4 h-4 text-leaf" />
          <p className="label-caps text-leaf">Running a café</p>
        </div>
        <Choice
          selected={value?.kind === "case"}
          onSelect={() => onPick({ kind: "case", cases })}
          className="block w-full"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-extrabold">By the case</p>
              <p className="text-sm text-espresso/60 mt-0.5">
                {CASE_UNITS.toLocaleString()} cups a case, at café pricing
              </p>
            </div>
            <p className="font-bold text-leaf text-lg">
              {unitCents(oz, "all", { kind: "case", cases: 1 })}¢ a set
            </p>
          </div>

          {value?.kind === "case" && (
            <div
              className="mt-5 pt-5 border-t border-espresso/10 flex flex-wrap items-center gap-4"
              // The card is a button; the stepper inside it must not re-fire the card's onSelect.
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm font-bold">How many cases?</span>
              <div className="flex items-center gap-1">
                {[1, 2, 5, 10].map((n) => (
                  <span
                    key={n}
                    role="button"
                    tabIndex={0}
                    onClick={() => onPick({ kind: "case", cases: n })}
                    onKeyDown={(e) => e.key === "Enter" && onPick({ kind: "case", cases: n })}
                    className={`btn-pill px-3.5 py-1.5 text-sm border-2 cursor-pointer ${
                      cases === n ? "border-leaf bg-leaf text-cream" : "border-espresso/12"
                    }`}
                  >
                    {n}
                  </span>
                ))}
                <input
                  type="number"
                  min={1}
                  max={MAX_CASES}
                  value={cases}
                  aria-label="Number of cases"
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(MAX_CASES, Math.floor(Number(e.target.value) || 1)));
                    onPick({ kind: "case", cases: n });
                  }}
                  className="w-20 rounded-xl border border-espresso/20 bg-cream px-3 py-1.5 text-sm"
                />
              </div>
              <p className="text-sm text-espresso/60">
                {(cases * CASE_UNITS).toLocaleString()} cups ·{" "}
                <strong>{formatCents(totalCents(oz, "all", { kind: "case", cases }))}</strong>
              </p>
            </div>
          )}
        </Choice>
        <p className="text-xs text-espresso/50 mt-3">
          Cases are reserved against a flat deposit, with the balance settled when the container
          lands. Nothing is charged in full up front.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- parts */

/** The three physical parts, so the choice above is a picture and not just a list of words. */
const PARTS_PHOTOS = [
  {
    key: "cup" as const,
    title: "The cup",
    alt: "A blank PHA-lined paper cup",
    text: "Paper with a PHA lining. Single wall, blank, certified home compostable.",
    fit: "object-cover",
  },
  {
    key: "sleeve" as const,
    title: "Your sleeve",
    src: "/products/sleeve-printed.jpg",
    alt: "A kraft corrugated cup sleeve printed with the cupcasa wordmark",
    /* Our own mark is on the sample, so say so rather than let it read as theirs. */
    text: "Corrugated kraft, printed here on our own press — ours shown, yours on the pack.",
    fit: "object-cover",
  },
  {
    key: "lid" as const,
    title: "A bagasse lid",
    src: "/products/lid.png",
    alt: "A white moulded bagasse sip lid",
    text: "Moulded sugarcane fibre, not plastic — fully organic material that composts. One lid fits all three cup sizes.",
    fit: "object-contain",
    /* The lid is white on a white cut-out, so on a white tile it disappears entirely. */
    bg: "bg-cream-deep/60",
  },
];

export function StepParts({
  oz,
  qty,
  value,
  onPick,
}: {
  oz: CupSize;
  qty: BundleQty;
  value: BundleParts | null;
  onPick: (parts: BundleParts) => void;
}) {
  const opt = value ? PARTS_OPTIONS.find((o) => o.id === value) : null;
  const inBundle = (key: "cup" | "sleeve" | "lid") =>
    !opt || key === "cup" || (key === "sleeve" ? opt.hasSleeve : opt.hasLid);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-5">
        {PARTS_PHOTOS.map((item) => {
          const included = inBundle(item.key);
          const src = item.src ?? `/products/${oz}oz-pha-cup.jpg`;
          return (
            <div
              key={item.key}
              className={`rounded-3xl bg-white/60 border overflow-hidden transition-opacity ${
                included ? "border-caramel/20" : "border-espresso/8 opacity-35"
              }`}
            >
              <div className={`relative aspect-[4/3] ${item.bg ?? "bg-white"}`}>
                <Image
                  src={src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className={item.fit}
                />
                {!included && (
                  <span className="absolute top-3 right-3 rounded-full bg-espresso/75 text-cream text-xs font-bold px-2.5 py-1">
                    Not included
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold">{item.title}</h3>
                <p className="text-sm text-espresso/65 mt-1.5">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div role="radiogroup" aria-label="What goes in the bundle" className="grid sm:grid-cols-3 gap-4">
      {PARTS_OPTIONS.map((o) => (
        <Choice key={o.id} selected={value === o.id} onSelect={() => onPick(o.id)}>
          <p className="font-display text-xl font-extrabold">{o.name}</p>
          <p className="font-bold text-coral mt-1">{unitCents(oz, o.id, qty)}¢ each</p>
          <ul className="mt-4 space-y-1.5">
            {o.includes.map((part) => (
              <li key={part} className="flex items-center gap-2 text-sm font-semibold">
                <span className="w-4 h-4 rounded-full bg-leaf grid place-items-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-cream" />
                </span>
                {part}
              </li>
            ))}
          </ul>
          <p className="text-xs text-espresso/55 mt-4">{o.blurb}</p>
        </Choice>
      ))}
      </div>
    </div>
  );
}
