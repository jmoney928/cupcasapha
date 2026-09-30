"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SleeveEditor } from "@/components/sleeve/editor";
import type { SleeveDoc } from "@/lib/sleeve/doc";
import {
  emptyBundle,
  firstIncomplete,
  reachableStep,
  stepsFor,
  type Bundle,
  type BundleParts,
  type BundleQty,
  type StepId,
} from "@/lib/bundle";
import type { CupSize } from "@/lib/calc/catalog";
import { Progress } from "./progress";
import { StepParts, StepQuantity, StepSize } from "./steps";
import { StepReview } from "./review";

const STORAGE_KEY = "cupcasa-bundle";

/** Only the answers are persisted. Artwork can carry megabytes of image data and is not stored. */
function load(): Bundle {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBundle;
    const p = JSON.parse(raw) as Partial<Bundle>;
    const oz = [8, 12, 16].includes(Number(p.oz)) ? (Number(p.oz) as CupSize) : null;
    const parts =
      p.parts === "all" || p.parts === "cupSleeve" || p.parts === "cupLid" ? p.parts : null;
    let qty: BundleQty | null = null;
    if (p.qty && typeof p.qty === "object") {
      const q = p.qty as BundleQty;
      if (q.kind === "pack" && [100, 200, 500].includes(q.packSize)) qty = q;
      if (q.kind === "case" && Number.isFinite(q.cases) && q.cases > 0) {
        qty = { kind: "case", cases: Math.floor(q.cases) };
      }
    }
    return { oz, qty, parts, designed: Boolean(p.designed), artwork: Boolean(p.artwork) };
  } catch {
    return emptyBundle;
  }
}

export function BundleBuilder() {
  const router = useRouter();
  const params = useSearchParams();

  // Start empty on both server and client, then adopt saved answers after mount — a stored
  // bundle must never make the first client render disagree with the server's.
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [ready, setReady] = useState(false);
  /* The live sleeve. A ref, not state — the editor emits on every keystroke and re-rendering
     the whole flow for each one would be wasteful and would fight the canvas. */
  const doc = useRef<SleeveDoc | null>(null);

  useEffect(() => {
    const saved = load();
    // A redirected product link carries its size; it wins over whatever was saved before.
    const asked = Number(params.get("size"));
    const seeded = [8, 12, 16].includes(asked)
      ? { ...saved, oz: asked as CupSize, ...(saved.oz === asked ? {} : { designed: false, artwork: false }) }
      : saved;
    setBundle(seeded);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
    } catch {}
  }, [bundle, ready]);

  const steps = useMemo(() => stepsFor(bundle), [bundle]);
  const wanted = (params.get("step") ?? "size") as StepId;
  const current = ready ? reachableStep(bundle, wanted) : "size";

  const go = useCallback(
    (id: StepId) => {
      // Always carry the step, including the first one. Pushing a bare "/shop" from a URL that
      // already has a query is a no-op in the App Router, which stranded both the clamp below
      // and the rail's way back to step one.
      router.push(`/shop?step=${id}`, { scroll: false });
      // The steps sit below the fold on a phone once the intro is scrolled past.
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router]
  );

  // A deep link past an unanswered step is clamped above; keep the URL honest about it.
  useEffect(() => {
    if (ready && wanted !== current) go(current);
  }, [ready, wanted, current, go]);

  const at = steps.findIndex((s) => s.id === current);
  const limit = firstIncomplete(bundle);
  const limitAt = steps.findIndex((s) => s.id === limit);
  const reached = useMemo(
    () => new Set(steps.slice(0, Math.max(limitAt, at) + 1).map((s) => s.id)),
    [steps, limitAt, at]
  );

  const set = (patch: Partial<Bundle>) => setBundle((b) => ({ ...b, ...patch }));

  /* Answering a step advances; re-answering an earlier one drops what no longer follows from it. */
  const pickSize = (oz: CupSize) => {
    set(bundle.oz === oz ? { oz } : { oz, designed: false, artwork: false });
    go("quantity");
  };
  const pickQty = (qty: BundleQty) => set({ qty });
  const pickParts = (parts: BundleParts) => {
    set({ parts, ...(parts === bundle.parts ? {} : { designed: false, artwork: false }) });
    go(parts === "cupLid" ? "review" : "design");
  };

  const next = steps[at + 1];
  const prev = steps[at - 1];
  const canAdvance =
    (current === "size" && bundle.oz !== null) ||
    (current === "quantity" && bundle.qty !== null) ||
    (current === "parts" && bundle.parts !== null) ||
    current === "design";

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto -mx-1 px-1">
        <Progress steps={steps} current={current} reached={reached} onGo={go} />
      </div>

      <div>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
          {steps[at]?.title ?? steps[0].title}
        </h2>
      </div>

      {current === "size" && <StepSize value={bundle.oz} onPick={pickSize} />}

      {current === "quantity" && bundle.oz !== null && (
        <StepQuantity oz={bundle.oz} value={bundle.qty} onPick={pickQty} />
      )}

      {current === "parts" && bundle.oz !== null && bundle.qty !== null && (
        <StepParts oz={bundle.oz} qty={bundle.qty} value={bundle.parts} onPick={pickParts} />
      )}

      {current === "design" && bundle.oz !== null && (
        <DesignStep
          oz={bundle.oz}
          docRef={doc}
          onDesigned={() => !bundle.artwork && set({ artwork: true, designed: true })}
        />
      )}

      {current === "review" && <StepReview bundle={bundle} docRef={doc} onGo={go} />}

      {current !== "review" && (
        <div className="flex items-center justify-between gap-3 pt-2">
          {prev ? (
            <button
              type="button"
              onClick={() => go(prev.id)}
              className="btn-pill px-5 py-3 border-2 border-espresso/15 hover:border-espresso/40"
            >
              <ArrowLeft className="w-4 h-4" /> {prev.short}
            </button>
          ) : (
            <span />
          )}
          {next && (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => {
                if (current === "design" && !bundle.designed) set({ designed: true });
                go(next.id);
              }}
              className="btn-pill px-6 py-3 bg-coral text-white hover:bg-coral-deep disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {current === "design" ? "Looks good" : `Next: ${next.short}`}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The editor, seeded with the size already chosen. "Designed" means the document moved off the
 * one the editor opens with — so arriving, looking, and leaving does not count as artwork.
 */
function DesignStep({
  oz,
  docRef,
  onDesigned,
}: {
  oz: CupSize;
  docRef: React.RefObject<SleeveDoc | null>;
  onDesigned: () => void;
}) {
  const initial = useRef<string | null>(null);

  const onChange = useCallback(
    (next: SleeveDoc) => {
      docRef.current = next;
      const shape = JSON.stringify(next);
      if (initial.current === null) {
        initial.current = shape;
        return;
      }
      if (shape !== initial.current) onDesigned();
    },
    [docRef, onDesigned]
  );

  return (
    <div className="space-y-4">
      <p className="text-espresso/70 max-w-2xl">
        This is the real {oz}oz dieline — the curved band our printer cuts, with its bleed and glue
        lap. Nothing is uploaded; your artwork stays on your machine and the print file is built in
        your browser.
      </p>
      <SleeveEditor initialSize={oz} lockSize onChange={onChange} />
    </div>
  );
}
