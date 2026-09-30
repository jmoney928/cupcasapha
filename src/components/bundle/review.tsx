"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Pencil } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { formatCents } from "@/lib/skus";
import { DEPOSIT_CENTS } from "@/lib/deposit";
import { CAFE_OFFER } from "@/lib/cafe-offer";
import {
  handoff,
  partsOption,
  totalCents,
  unitCents,
  unitsIn,
  type Bundle,
  type StepId,
} from "@/lib/bundle";
import { bundleProduct } from "@/lib/bundle";

function Line({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-espresso/8 last:border-0">
      <span className="text-espresso/60 text-sm shrink-0">{label}</span>
      <span className="font-semibold text-right">{value}</span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-coral text-sm font-bold hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
      )}
    </div>
  );
}

export function StepReview({ bundle, onGo }: { bundle: Bundle; onGo: (id: StepId) => void }) {
  const { add, setOpen } = useCart();
  const [busy, setBusy] = useState(false);

  if (bundle.oz === null || bundle.qty === null || bundle.parts === null) return null;

  const { oz, qty, parts } = bundle;
  const opt = partsOption(parts);
  const product = bundleProduct(oz);
  const units = unitsIn(qty);
  const total = totalCents(oz, parts, qty);
  const hand = handoff(bundle);

  const addToCart = () => {
    if (hand?.kind !== "cart") return;
    setBusy(true);
    add(hand.slug, hand.qty);
    setOpen(true);
    setBusy(false);
  };

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
      <div className="rounded-3xl bg-white/70 border border-caramel/20 p-6 sm:p-8">
        <h3 className="font-display text-2xl font-extrabold">Your bundle</h3>

        <div className="mt-4">
          <Line
            label="Size"
            value={`${oz}oz — ${product?.shortName ?? ""}`}
            onEdit={() => onGo("size")}
          />
          <Line
            label="Quantity"
            value={
              qty.kind === "pack"
                ? `${qty.packSize} sets`
                : `${qty.cases} case${qty.cases === 1 ? "" : "s"} · ${units.toLocaleString()} cups`
            }
            onEdit={() => onGo("quantity")}
          />
          <Line label="Contents" value={opt.includes.join(" · ")} onEdit={() => onGo("parts")} />
          {opt.hasSleeve && (
            <Line
              label="Sleeve artwork"
              value={bundle.artwork ? "Your design" : "Plain sleeve — send artwork later"}
              onEdit={() => onGo("design")}
            />
          )}
        </div>

        <div className="mt-6 pt-6 border-t-2 border-espresso/10 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-espresso/60">Each</span>
            <span className="font-bold">{unitCents(oz, parts, qty)}¢</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-espresso/60">
              {units.toLocaleString()} × {opt.name.toLowerCase()}
            </span>
            <span className="font-display text-3xl font-extrabold">{formatCents(total)}</span>
          </div>
          <p className="text-xs text-espresso/45">CAD, before tax and freight.</p>
        </div>
      </div>

      <div className="space-y-4">
        {hand?.kind === "cart" && qty.kind === "pack" && (
          <div className="rounded-3xl bg-espresso text-cream p-6">
            <p className="label-caps text-coral">Paid in full</p>
            <p className="font-display text-3xl font-extrabold mt-2">{formatCents(total)}</p>
            <p className="text-sm text-cream/70 mt-2">
              Charged at checkout. Cups ship December 2026.
            </p>
            <button
              type="button"
              onClick={addToCart}
              disabled={busy}
              className="btn-pill w-full justify-center bg-coral text-white py-3.5 mt-5 hover:bg-coral-deep disabled:opacity-70"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Add to cart <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {hand?.kind === "cart" && qty.kind === "case" && (
          <div className="rounded-3xl bg-espresso text-cream p-6">
            <p className="label-caps text-coral">Reserve your cases</p>
            <p className="font-display text-3xl font-extrabold mt-2">{formatCents(DEPOSIT_CENTS)}</p>
            <p className="text-sm text-cream/70 mt-2">
              One flat deposit however many cases you reserve. The balance of{" "}
              {formatCents(total)} is settled when the container lands, December 2026.
            </p>
            <button
              type="button"
              onClick={addToCart}
              disabled={busy}
              className="btn-pill w-full justify-center bg-coral text-white py-3.5 mt-5 hover:bg-coral-deep disabled:opacity-70"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reserve {qty.cases} case{qty.cases === 1 ? "" : "s"} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {hand?.kind === "quote" && (
          <div className="rounded-3xl bg-cream-deep/60 border-2 border-caramel/30 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-caramel shrink-0 mt-0.5" />
              <div>
                <p className="font-display text-xl font-extrabold">This one we quote</p>
                <p className="text-sm text-espresso/70 mt-2">{hand.reason}</p>
                <p className="text-sm text-espresso/70 mt-2">
                  Send it over and we will come back with a price, usually within one business day.
                </p>
              </div>
            </div>
            <a
              href={`/contact?bundle=${encodeURIComponent(
                `${oz}oz · ${opt.name} · ${qty.kind === "pack" ? `${qty.packSize} sets` : `${qty.cases} cases`}`
              )}`}
              className="btn-pill w-full justify-center bg-espresso text-cream py-3.5 mt-5 hover:bg-espresso-soft"
            >
              Ask for a price <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {opt.hasSleeve && !bundle.artwork && (
          <p className="text-sm text-espresso/60 rounded-2xl bg-cream-deep/40 p-4">
            No artwork yet. Order now and we will email you for it before anything goes to press,
            or{" "}
            <button type="button" onClick={() => onGo("design")} className="text-coral font-bold underline">
              design it now
            </button>
            .
          </p>
        )}

        {qty.kind === "case" && (
          <p className="text-xs text-espresso/50">
            Café orders include Cup Casa OS at no charge, and your first {CAFE_OFFER.trialCount}{" "}
            cups, lids and sleeves are free if you have not ordered before.
          </p>
        )}
      </div>
    </div>
  );
}
