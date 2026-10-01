"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Circle, Download, ImageDown, ImageUp, Minus, Redo2, Square, Trash2, Type, Undo2 } from "lucide-react";
import { SLEEVE_SIZES, sleeveDieline, type CupSize } from "@/lib/sleeve/dielines";
import {
  add, byId, duplicate, emptyDoc, newImage, newShape, newText, remove, reorder, resize, update,
  type SleeveDoc, type SleeveElement,
} from "@/lib/sleeve/doc";
import { insideSafeArea, renderDoc, sleeveFileName } from "@/lib/sleeve/render-doc";
import { SleeveCanvas } from "./canvas";
import { CupPreview } from "./cup-preview";
import { Panel } from "./panel";
import { Row, Swatches } from "./controls";
import { PATTERNS, SLEEVE_STOCKS } from "@/lib/sleeve/safe";
import { MAX_UPLOAD_BYTES, fitForPrint } from "@/lib/sleeve/downscale";
import { useMeasure } from "./use-measure";

const MAX_HISTORY = 60;

/**
 * The sleeve editor. Everything runs here in the browser: nothing is uploaded, and the download is
 * produced by the same function that draws the canvas, so what is on screen is what goes to press.
 *
 * Standalone on /sleeve it takes no props. Inside the bundle builder the size has already been
 * chosen, so it is seeded and the size switcher is hidden rather than left there to contradict
 * the step before it, and every change is reported up so the flow knows there is artwork.
 *
 * `onCarry` is what lets the standalone designer hand its work to the builder: given it, the
 * toolbar grows a button that passes the live document out rather than downloading it.
 */
export function SleeveEditor({
  initialSize = 12,
  initialDoc,
  lockSize = false,
  onChange,
  onCarry,
  carryLabel = "Order this",
}: {
  initialSize?: CupSize;
  /** A design carried in from elsewhere, already sized for this sleeve. */
  initialDoc?: SleeveDoc | null;
  lockSize?: boolean;
  onChange?: (doc: SleeveDoc) => void;
  onCarry?: (doc: SleeveDoc) => void;
  carryLabel?: string;
} = {}) {
  const [doc, setDoc] = useState<SleeveDoc>(() => initialDoc ?? emptyDoc(initialSize));
  const [past, setPast] = useState<SleeveDoc[]>([]);
  const [future, setFuture] = useState<SleeveDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** A quiet line about what we did to a picture on the way in, not a problem to fix. */
  const [note, setNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);
  const measure = useMeasure();

  /** Snapshot before a change, so undo has something to go back to. */
  const commit = useCallback((next: SleeveDoc | ((d: SleeveDoc) => SleeveDoc)) => {
    setDoc((current) => {
      const value = typeof next === "function" ? next(current) : next;
      if (value === current) return current;
      setPast((p) => [...p, current].slice(-MAX_HISTORY));
      setFuture([]);
      return value;
    });
  }, []);

  /** During a drag: the document moves, history does not. */
  const live = useCallback((next: SleeveDoc) => setDoc(next), []);
  const dragStart = useRef<SleeveDoc | null>(null);

  const beginGesture = useCallback(() => {
    dragStart.current = doc;
  }, [doc]);

  const endGesture = useCallback(() => {
    const before = dragStart.current;
    dragStart.current = null;
    if (before && before !== doc) {
      setPast((p) => [...p, before].slice(-MAX_HISTORY));
      setFuture([]);
    }
  }, [doc]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      setDoc((current) => {
        setFuture((f) => [current, ...f].slice(0, MAX_HISTORY));
        return p[p.length - 1];
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      setDoc((current) => {
        setPast((p) => [...p, current].slice(-MAX_HISTORY));
        return f[0];
      });
      return f.slice(1);
    });
  }, []);

  const selected = selectedId ? byId(doc, selectedId) ?? null : null;

  /* Anything outside the safe area still prints — it just prints cut off, so say so up front. */
  const overflowing = doc.elements.filter((el) => !insideSafeArea(doc, el, measure));

  const patch = (p: Partial<SleeveElement>) => selectedId && commit((d) => update(d, selectedId, p));

  function addText() {
    const el = newText(doc.size);
    commit((d) => add(d, el));
    setSelectedId(el.id);
  }

  function addShape(shape: "rect" | "ellipse" | "line") {
    const el = newShape(doc.size, shape);
    commit((d) => add(d, el));
    setSelectedId(el.id);
  }

  /**
   * Reads a picked image, sized for the press on the way in. A phone photo is thousands of
   * pixels wider than a sleeve can print, and every one of them would otherwise be carried
   * through the editor and out the other side as base64.
   */
  async function readImage(file: File): Promise<{ dataUrl: string; aspect: number } | null> {
    setError(null);
    setNote(null);
    if (!/^image\/(png|jpeg|svg\+xml|webp|gif)$/.test(file.type)) {
      setError("PNG, JPG, SVG, WebP or GIF, please.");
      return null;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That file is over 12MB. Anything smaller will print just as well.");
      return null;
    }
    try {
      const fitted = await fitForPrint(file);
      if (fitted.note) setNote(fitted.note);
      return { dataUrl: fitted.dataUrl, aspect: fitted.aspect };
    } catch {
      setError("That file couldn't be read. Try another.");
      return null;
    }
  }

  async function onLogoFile(file: File) {
    const read = await readImage(file);
    if (!read) return;
    const el = newImage(doc.size, read.dataUrl, read.aspect);
    commit((d) => add(d, el));
    setSelectedId(el.id);
  }

  async function onBackgroundFile(file: File) {
    const read = await readImage(file);
    if (!read) return;
    /* A picture behind the type usually needs taking down a notch; start it there. */
    commit((cur) => ({ ...cur, backgroundImage: read.dataUrl, backgroundImageOpacity: 0.8 }));
  }

  function download() {
    /* Guides are for the screen; the press gets artwork and crop marks only. */
    const svg = renderDoc(doc, { guides: false, measure, idPrefix: "p" });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = sleeveFileName(doc);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* Shortcuts, but never while someone is typing into a field. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        commit((d) => remove(d, selectedId));
        setSelectedId(null);
        return;
      }
      const step = e.shiftKey ? 5 : 1;
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      const move = nudge[e.key];
      if (move) {
        e.preventDefault();
        const el = byId(doc, selectedId);
        if (el) commit((d) => update(d, selectedId, { x: el.x + move[0], y: el.y + move[1] }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit, doc, redo, selectedId, undo]);

  const d = sleeveDieline(doc.size);

  const report = useRef(onChange);
  report.current = onChange;
  useEffect(() => {
    report.current?.(doc);
  }, [doc]);

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-cream-deep/50 border border-espresso/8 p-3">
        {!lockSize && <div className="flex gap-1.5">
          {SLEEVE_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => commit((cur) => resize(cur, size as CupSize))}
              aria-pressed={doc.size === size}
              className={`btn-pill px-4 py-2 text-sm border-2 ${
                doc.size === size ? "border-coral bg-coral text-white" : "border-espresso/12 hover:border-espresso/35"
              }`}
            >
              {size}oz
            </button>
          ))}
        </div>}

        {!lockSize && <span className="w-px h-7 bg-espresso/10 mx-1" />}

        <button type="button" onClick={addText} className="btn-pill px-4 py-2 text-sm border-2 border-espresso/12 hover:border-coral">
          <Type className="w-4 h-4" /> Text
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className="btn-pill px-4 py-2 text-sm border-2 border-espresso/12 hover:border-coral">
          <ImageUp className="w-4 h-4" /> Image
        </button>
        <button type="button" onClick={() => addShape("rect")} title="Rectangle" className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral">
          <Square className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => addShape("ellipse")} title="Ellipse" className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral">
          <Circle className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => addShape("line")} title="Line" className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral">
          <Minus className="w-4 h-4" />
        </button>

        <span className="w-px h-7 bg-espresso/10 mx-1" />

        <button type="button" onClick={undo} disabled={!past.length} title="Undo"
          className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral disabled:opacity-35">
          <Undo2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={redo} disabled={!future.length} title="Redo"
          className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral disabled:opacity-35">
          <Redo2 className="w-4 h-4" />
        </button>

        <label className="flex items-center gap-2 text-sm font-semibold text-espresso/70 ml-auto">
          <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} className="w-4 h-4 accent-[#e8735a]" />
          Guides
        </label>
        <button
          type="button"
          onClick={download}
          className={`btn-pill px-5 py-2.5 text-sm ${
            onCarry
              ? "border-2 border-espresso/15 hover:border-espresso/40"
              : "bg-coral text-white hover:bg-coral-deep"
          }`}
        >
          <Download className="w-4 h-4" /> Download
        </button>
        {onCarry && (
          <button
            type="button"
            onClick={() => onCarry(doc)}
            className="btn-pill px-5 py-2.5 text-sm bg-coral text-white hover:bg-coral-deep"
          >
            {carryLabel} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInput}
        aria-label="Upload a logo or picture for the sleeve"
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onLogoFile(f);
          e.target.value = "";
        }}
      />

      <input
        ref={bgInput}
        aria-label="Upload a background picture for the sleeve"
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onBackgroundFile(f);
          e.target.value = "";
        }}
      />

      {error && <p className="text-sm text-coral font-semibold">{error}</p>}

      {note && (
        <p className="text-sm text-espresso/70 bg-leaf/8 border border-leaf/25 rounded-2xl px-4 py-3 flex items-start gap-2">
          <ImageDown className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
          <span>{note}</span>
        </p>
      )}

      {overflowing.length > 0 && (
        <p className="text-sm font-semibold text-espresso/80 bg-butter/40 border border-caramel/30 rounded-2xl px-4 py-3">
          {overflowing.length === 1 ? "One piece runs" : `${overflowing.length} pieces run`} past the blue safe
          line. Anything out there gets trimmed off — make it smaller, or widen its box so it wraps shorter.
        </p>
      )}

      <div className="grid lg:grid-cols-[1fr_20rem] gap-4 items-start">
        <div className="space-y-4">
        <div className="rounded-3xl bg-cream-deep/40 border border-espresso/8 p-4" onPointerDownCapture={beginGesture}>
          <SleeveCanvas
            doc={doc}
            selectedId={selectedId}
            measure={measure}
            showGuides={showGuides}
            onSelect={setSelectedId}
            onChange={live}
            onCommit={endGesture}
          />
        </div>

          {/* The sleeve itself, under the sheet it is printed on. */}
          <div className="rounded-3xl bg-white/60 border border-caramel/20 p-4 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <p className="label-caps text-espresso/50 mb-2">Sleeve stock</p>
              <div className="flex gap-2">
                {SLEEVE_STOCKS.map((stock) => (
                  <button
                    key={stock.id}
                    type="button"
                    onClick={() =>
                      commit((cur) => ({
                        ...cur,
                        background: stock.colour,
                        patternInk: stock.ink,
                        /* Ink that was the old stock's default follows the stock across. */
                        elements: cur.elements.map((el) =>
                          el.kind === "text" && SLEEVE_STOCKS.some((s2) => s2.ink === el.fill)
                            ? { ...el, fill: stock.ink }
                            : el
                        ),
                      }))
                    }
                    aria-pressed={doc.background === stock.colour}
                    className={`btn-pill pl-2 pr-4 py-1.5 text-sm border-2 gap-2 ${
                      doc.background === stock.colour ? "border-coral" : "border-espresso/12 hover:border-espresso/35"
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-espresso/15"
                      style={{ background: stock.colour }}
                    />
                    {stock.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label-caps text-espresso/50 mb-2">Background picture</p>
              {doc.backgroundImage ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.backgroundImage}
                    alt="Your background"
                    className="h-10 w-16 object-cover rounded-lg border border-espresso/12"
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold text-espresso/55">
                    Show
                    <input
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={doc.backgroundImageOpacity}
                      onChange={(e) =>
                        commit((cur) => ({ ...cur, backgroundImageOpacity: Number(e.target.value) }))
                      }
                      className="w-24 accent-[#e8735a]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => commit((cur) => ({ ...cur, backgroundImage: null }))}
                    className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral"
                    title="Remove background"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bgInput.current?.click()}
                  className="btn-pill px-4 py-2 text-sm border-2 border-dashed border-espresso/25 hover:border-coral"
                >
                  <ImageUp className="w-4 h-4" /> Upload a picture
                </button>
              )}
            </div>

            <div>
              <p className="label-caps text-espresso/50 mb-2">Background design</p>
              <div className="flex flex-wrap gap-1.5">
                {PATTERNS.map((pat) => (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => commit((cur) => ({ ...cur, pattern: pat.id }))}
                    aria-pressed={doc.pattern === pat.id}
                    className={`btn-pill px-4 py-1.5 text-sm border-2 ${
                      doc.pattern === pat.id ? "border-coral bg-coral text-white" : "border-espresso/12 hover:border-espresso/35"
                    }`}
                  >
                    {pat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-3xl bg-white/60 border border-caramel/20 p-4 space-y-4">
          <Panel
            el={selected}
            onPatch={patch}
            onDuplicate={() => {
              if (!selectedId) return;
              const { doc: next, id } = duplicate(doc, selectedId);
              commit(next);
              setSelectedId(id);
            }}
            onDelete={() => {
              if (!selectedId) return;
              commit((cur) => remove(cur, selectedId));
              setSelectedId(null);
            }}
            onReorder={(to) => selectedId && commit((cur) => reorder(cur, selectedId, to))}
          />
          </div>
          <CupPreview doc={doc} measure={measure} />
        </div>
      </div>

      <p className="text-xs text-espresso/55">
        {d.label} · print area {Math.round(d.arcBottom)} × {d.bandHeight} mm · {d.bleed} mm bleed · {d.glueLap.width} mm
        glue lap. Drag to move, corners to resize, the dot above to rotate. Arrow keys nudge, ⌘Z undoes.
      </p>
    </div>
  );
}
