"use client";

import Image from "next/image";
import { Check, Store, User } from "lucide-react";
import { formatCents } from "@/lib/skus";
import { CAFE_OFFER } from "@/lib/cafe-offer";
import {
  BUNDLE_SIZES,
  BUYER_OPTIONS,
  CASE_UNITS,
  MAX_CASES,
  PACK_OPTIONS,
  PARTS_OPTIONS,
  bundleProduct,
  savingFor,
  totalCents,
  unitCents,
  type BundleParts,
  type BundleQty,
  type BuyerKind,
} from "@/lib/bundle";
import type { CupSize } from "@/lib/calc/catalog";

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

const Ticks = ({ points, tone = "leaf" }: { points: string[]; tone?: "leaf" | "coral" }) => (
  <ul className="mt-4 space-y-1.5">
    {points.map((p) => (
      <li key={p} className="flex items-start gap-2 text-sm font-semibold">
        <span
          className={`w-4 h-4 rounded-full grid place-items-center shrink-0 mt-0.5 ${
            tone === "leaf" ? "bg-leaf" : "bg-coral"
          }`}
        >
          <Check className="w-2.5 h-2.5 text-cream" />
        </span>
        {p}
      </li>
    ))}
  </ul>
);

/* ----------------------------------------------------------------------- who */

const WHO_ICON = { self: User, cafe: Store } as const;

/**
 * The fork. Asked first because it decides the price list, the quantities and how the thing is
 * paid for, and because a buyer who is shown the other side's numbers spends the rest of the
 * flow wondering which one applies to them.
 */
export function StepWho({
  value,
  onPick,
}: {
  value: BuyerKind | null;
  onPick: (who: BuyerKind) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-espresso/70 max-w-2xl">
        The two answers price differently and pay differently, so this is the one question we ask
        before showing you any numbers.
      </p>
      <div role="radiogroup" aria-label="Who the cups are for" className="grid sm:grid-cols-2 gap-4">
        {BUYER_OPTIONS.map((b) => {
          const Icon = WHO_ICON[b.id];
          return (
            <Choice key={b.id} selected={value === b.id} onSelect={() => onPick(b.id)}>
              <span
                className={`w-12 h-12 rounded-2xl grid place-items-center mb-4 ${
                  b.id === "cafe" ? "bg-leaf/15" : "bg-coral/12"
                }`}
              >
                <Icon className={`w-6 h-6 ${b.id === "cafe" ? "text-leaf" : "text-coral"}`} />
              </span>
              <p className="font-display text-2xl font-extrabold">{b.name}</p>
              <p className="text-sm text-espresso/65 mt-2">{b.blurb}</p>
              <Ticks points={b.points} tone={b.id === "cafe" ? "leaf" : "coral"} />
            </Choice>
          );
        })}
      </div>
      <p className="text-sm text-espresso/55">
        Running a café and want the published sheet before you start?{" "}
        <a
          href="/wholesale"
          className="font-bold underline decoration-coral decoration-2 underline-offset-2"
        >
          Café pricing is on one page
        </a>
        .
      </p>
    </div>
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
            {/* The cup itself, not a drawing of one — this is the step where you judge size. */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-cream-deep/40">
              <Image
                src={`/products/${oz}oz-cup.jpg`}
                alt={`The ${oz}oz cupcasa cup with its lid`}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover"
              />
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

/* -------------------------------------------------------------------- parts */

/** The three physical parts, so the choice below is a picture and not just a list of words. */
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

/** What each part is worth inside a set — the saving, read back as a price. */
const SET_DELTAS = { lid: savingFor("cupSleeve"), sleeve: savingFor("cupLid") };

/**
 * Contents, priced as a saving rather than a figure. This step runs before the quantity is
 * known, and the per-set price depends on it — but what leaving a part out saves does not, at
 * any quantity or either price list. So that is what it says.
 */
export function StepParts({
  oz,
  value,
  onPick,
}: {
  oz: CupSize;
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
          const src = item.src ?? `/products/${oz}oz-cup.jpg`;
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
        {PARTS_OPTIONS.map((o) => {
          const saving = savingFor(o.id);
          return (
            <Choice key={o.id} selected={value === o.id} onSelect={() => onPick(o.id)}>
              <p className="font-display text-xl font-extrabold">{o.name}</p>
              <p className="font-bold text-coral mt-1">
                {saving === 0 ? "Full price" : `${saving}¢ a set less`}
              </p>
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
          );
        })}
      </div>
      <p className="text-sm text-espresso/55">
        The set is not the sum of its parts — bought together the lid is {SET_DELTAS.lid}¢ and the
        sleeve {SET_DELTAS.sleeve}¢, which is why leaving one out takes that much off rather than
        its list price. Your price per set is on the next step.
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------- quantity */

/**
 * Quantity, and the first place a price appears. Only the buyer's own path is rendered: a person
 * buying a pack never sees case pricing, and a café never has to scroll past packs it cannot use.
 */
export function StepQuantity({
  who,
  oz,
  parts,
  value,
  onPick,
}: {
  who: BuyerKind;
  oz: CupSize;
  parts: BundleParts;
  value: BundleQty | null;
  onPick: (qty: BundleQty) => void;
}) {
  if (who === "cafe") {
    const cases = value?.kind === "case" ? value.cases : 1;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-leaf" />
          <p className="label-caps text-leaf">Café pricing · by the case</p>
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
                {CASE_UNITS.toLocaleString()} cups a case
              </p>
            </div>
            <p className="font-bold text-leaf text-lg">
              {unitCents(oz, parts, { kind: "case", cases: 1 })}¢ a set
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
                <strong>{formatCents(totalCents(oz, parts, { kind: "case", cases }))}</strong>
              </p>
            </div>
          )}
        </Choice>
        <p className="text-xs text-espresso/50">
          Cases are reserved against a flat deposit, with the balance settled when the container
          lands. Nothing is charged in full up front.
        </p>
        <p className="text-sm text-espresso/70 rounded-2xl bg-leaf/8 border border-leaf/20 p-4">
          Never ordered from us? Your first {CAFE_OFFER.trialCount} cups, lids and printed sleeves
          are free —{" "}
          <a
            href="/wholesale#free-100"
            className="font-bold underline decoration-coral decoration-2 underline-offset-2"
          >
            claim them here
          </a>{" "}
          and we will send your pricing with them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-coral" />
        <p className="label-caps text-coral">Packs · paid in full at checkout</p>
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
              <p className="mt-3 font-bold text-coral">{unitCents(oz, parts, qty)}¢ a set</p>
              <p className="text-xs text-espresso/50 mt-1">
                {formatCents(totalCents(oz, parts, qty))} · paid in full
              </p>
            </Choice>
          );
        })}
      </div>
      <p className="text-xs text-espresso/50">
        The bigger the pack the lower the price per set. Charged at checkout; cups ship December
        2026.
      </p>
    </div>
  );
}
