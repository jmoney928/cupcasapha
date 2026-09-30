"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Palette } from "lucide-react";
import { SleeveEditor } from "@/components/sleeve/editor";
import { resize, type SleeveDoc } from "@/lib/sleeve/doc";
import { hasStashedSleeve, takeSleeve } from "@/lib/sleeve/handoff";
import {
  emptyBundle,
  firstIncomplete,
  needsDesign,
  qtyFitsWho,
  reachableStep,
  stepsFor,
  type Bundle,
  type BundleParts,
  type BundleQty,
  type BuyerKind,
  type StepId,
} from "@/lib/bundle";
import type { CupSize } from "@/lib/calc/catalog";
import { Progress } from "./progress";
import { StepParts, StepQuantity, StepSize, StepWho } from "./steps";
import { StepReview } from "./review";

const STORAGE_KEY = "cupcasa-bundle";

/**
 * Only the answers are persisted. Artwork can carry megabytes of image data and is not stored, so
 * `artwork` is deliberately *not* restored either: after a reload the drawing really is gone, and
 * a review screen claiming "your design" when nothing survived would put an order into the
 * pipeline with no file behind it.
 */
function load(): Bundle {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBundle;
    const p = JSON.parse(raw) as Partial<Bundle>;
    const who = p.who === "self" || p.who === "cafe" ? p.who : null;
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
    // A saved pack against a café, or cases against a person, cannot both be true.
    if (qty && who && !qtyFitsWho(who, qty)) qty = null;
    return { who, oz, parts, qty, designed: Boolean(p.designed), artwork: false };
  } catch {
    return emptyBundle;
  }
}

/**
 * Writes the step into the address bar. A side effect, never the source of truth: the wizard
 * must keep working if this fails, and in odd embeds (in-app browsers, sandboxed webviews)
 * history calls can throw. Next integrates native pushState/replaceState with its router, so
 * this costs no server round-trip and no framework machinery at all.
 */
function mirror(id: StepId, replace = false) {
  try {
    const url = `/shop?step=${id}`;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  } catch {}
}

/**
 * Jump, do not glide, and say so explicitly: globals.css sets `html { scroll-behavior: smooth }`,
 * and an unspecified behaviour inherits that, so plain `scrollTo({top: 0})` animates. On a page
 * as tall as the design step the glide runs long enough that the next thing someone clicks
 * slides out from under the cursor — indistinguishable from a broken button. The catch covers
 * engines old enough to reject "instant" as an enum value rather than ignore it.
 */
function jumpToTop() {
  try {
    window.scrollTo({ top: 0, behavior: "instant" });
  } catch {
    window.scrollTo(0, 0);
  }
}

export function BundleBuilder() {
  // Start empty on both server and client, then adopt saved answers after mount — a stored
  // bundle must never make the first client render disagree with the server's.
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [ready, setReady] = useState(false);
  /** A design waiting to be picked up from the standalone sleeve designer. */
  const [carried, setCarried] = useState(false);
  /*
   * The step being shown — plain state, deliberately not derived from the URL. When it was, a
   * click had to survive the whole router pipeline before anything on screen changed, and any
   * failure in that pipeline froze every button while the selection ticks still rendered.
   * Advancing now needs nothing but React; the URL is written afterwards, and read only on
   * arrival and when the back button fires.
   */
  const [current, setCurrent] = useState<StepId>("who");
  /* The live sleeve. A ref, not state — the editor emits on every keystroke and re-rendering
     the whole flow for each one would be wasteful and would fight the canvas. */
  const doc = useRef<SleeveDoc | null>(null);
  /* For the popstate listener, which outlives any one render. */
  const bundleRef = useRef(bundle);
  bundleRef.current = bundle;

  useEffect(() => {
    const saved = load();
    const url = new URLSearchParams(window.location.search);
    // A redirected product link carries its size; it wins over whatever was saved before.
    const asked = Number(url.get("size"));
    const askedWho = url.get("who");
    let seeded = saved;
    if ([8, 12, 16].includes(asked)) {
      seeded =
        saved.oz === asked
          ? { ...seeded, oz: asked as CupSize }
          : { ...seeded, oz: asked as CupSize, designed: false, artwork: false };
    }
    if (askedWho === "self" || askedWho === "cafe") {
      const who = askedWho as BuyerKind;
      seeded = {
        ...seeded,
        who,
        qty: seeded.qty && qtyFitsWho(who, seeded.qty) ? seeded.qty : null,
      };
    }
    setBundle(seeded);
    setCarried(hasStashedSleeve());
    /* Land where the link asks, clamped to what the bundle has earned. A link that answers a
       step has answered it: "Reserve cases" arriving with ?who=cafe lands on size, not on the
       fork it just came through. */
    const askedStep = (url.get("step") as StepId | null) ?? firstIncomplete(seeded);
    const landing = reachableStep(seeded, askedStep);
    setCurrent(landing);
    mirror(landing, true);
    setReady(true);
  }, []);

  /* Back and forward move the wizard. This is the only place the URL is read after arrival. */
  useEffect(() => {
    const onPop = () => {
      const id = new URLSearchParams(window.location.search).get("step") as StepId | null;
      const b = bundleRef.current;
      setCurrent(reachableStep(b, id ?? firstIncomplete(b)));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...bundle, artwork: false }));
    } catch {}
  }, [bundle, ready]);

  const steps = useMemo(() => stepsFor(bundle), [bundle]);

  const go = useCallback((id: StepId) => {
    setCurrent(id);
    mirror(id);
    jumpToTop();
  }, []);

  const at = steps.findIndex((s) => s.id === current);
  const limit = firstIncomplete(bundle);
  const limitAt = steps.findIndex((s) => s.id === limit);
  const reached = useMemo(
    () => new Set(steps.slice(0, Math.max(limitAt, at) + 1).map((s) => s.id)),
    [steps, limitAt, at]
  );

  const set = (patch: Partial<Bundle>) => setBundle((b) => ({ ...b, ...patch }));

  /* Answering a step advances; re-answering an earlier one drops what no longer follows from it. */
  const pickWho = (who: BuyerKind) => {
    // Packs and cases are not interchangeable, so switching sides drops the quantity.
    set(bundle.who === who ? { who } : { who, qty: null });
    go("size");
  };
  /* The sleeve itself is kept across a size or contents change — `resize` carries the artwork
     onto the new band — but the step has to be accepted again, because the band is a new shape. */
  const pickSize = (oz: CupSize) => {
    set(bundle.oz === oz ? { oz } : { oz, designed: false });
    go("parts");
  };
  const pickParts = (parts: BundleParts) => {
    set({ parts, ...(parts === bundle.parts ? {} : { designed: false }) });
    go("quantity");
  };
  const pickQty = (qty: BundleQty, advance = false) => {
    set({ qty });
    if (advance) go(needsDesign({ ...bundle, qty }) ? "design" : "review");
  };

  const next = steps[at + 1];
  const prev = steps[at - 1];
  const canAdvance =
    (current === "who" && bundle.who !== null) ||
    (current === "size" && bundle.oz !== null) ||
    (current === "parts" && bundle.parts !== null) ||
    (current === "quantity" && bundle.qty !== null) ||
    current === "design";

  const step = steps[at] ?? steps[0];

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto -mx-1 px-1">
        <Progress steps={steps} current={current} reached={reached} onGo={go} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold">{step.title}</h2>
        {step.optional && (
          <span className="label-caps rounded-full bg-cream-deep/70 border border-espresso/10 px-3 py-1 text-espresso/60">
            Optional
          </span>
        )}
      </div>

      {carried && current !== "design" && (
        <p className="flex items-start gap-3 text-sm rounded-2xl bg-coral/8 border border-coral/25 p-4">
          <Palette className="w-4 h-4 text-coral shrink-0 mt-0.5" />
          <span>
            <strong>Your sleeve design came with you.</strong> Answer these and it will be waiting,
            resized, on the design step.
          </span>
        </p>
      )}

      {current === "who" && <StepWho value={bundle.who} onPick={pickWho} />}

      {current === "size" && <StepSize value={bundle.oz} onPick={pickSize} />}

      {current === "parts" && bundle.oz !== null && (
        <StepParts oz={bundle.oz} value={bundle.parts} onPick={pickParts} />
      )}

      {current === "quantity" && bundle.who !== null && bundle.oz !== null && bundle.parts !== null && (
        <StepQuantity
          who={bundle.who}
          oz={bundle.oz}
          parts={bundle.parts}
          value={bundle.qty}
          onPick={pickQty}
        />
      )}

      {current === "design" && bundle.oz !== null && (
        <DesignStep
          oz={bundle.oz}
          docRef={doc}
          onCarried={() => {
            setCarried(false);
            set({ artwork: true, designed: true });
          }}
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
              {current === "design"
                ? bundle.artwork
                  ? "Looks good"
                  : "Skip — send artwork later"
                : `Next: ${next.short}`}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The editor, seeded with the size already chosen and with whatever has been drawn so far.
 *
 * Three things can seed it, in order: the sleeve already drawn in this flow (so stepping out to
 * review and back does not wipe it), a design carried in from the standalone designer, or nothing.
 * "Designed" means the document moved off the one it opened with — so arriving, looking, and
 * leaving does not count as artwork.
 */
function DesignStep({
  oz,
  docRef,
  onDesigned,
  onCarried,
}: {
  oz: CupSize;
  docRef: React.RefObject<SleeveDoc | null>;
  onDesigned: () => void;
  onCarried: () => void;
}) {
  const initial = useRef<string | null>(null);
  const [seed, setSeed] = useState<SleeveDoc | null>(null);
  /* The editor reads its seed once, on mount, so it must not mount before we have looked. */
  const [looked, setLooked] = useState(false);
  const took = useRef(false);

  useEffect(() => {
    if (took.current) return;
    took.current = true;
    const already = docRef.current;
    if (already) {
      setSeed(resize(already, oz));
    } else {
      const carried = takeSleeve(oz);
      if (carried) {
        setSeed(carried);
        onCarried();
      }
    }
    setLooked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <p className="text-sm text-espresso/55 max-w-2xl">
        You can skip this. Order with a plain sleeve and we will email you for artwork before
        anything goes to press — or come back to this step from the review screen.
      </p>
      {looked ? (
        <SleeveEditor initialSize={oz} initialDoc={seed} lockSize onChange={onChange} />
      ) : (
        <div className="h-96 rounded-3xl bg-espresso/5 animate-pulse" />
      )}
    </div>
  );
}
