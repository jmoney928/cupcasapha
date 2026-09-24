"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Check, Download, ImageUp, Loader2 } from "lucide-react";
import { TEMPLATES, type TemplateKey } from "@/lib/brand/templates";

type Analysis = {
  width: number; height: number; format: string;
  print: { ok: boolean; level: "good" | "marginal" | "poor"; message: string };
  palette: string[]; monochrome: boolean;
  normalizedPng: string; monoPng: string;
};

const CUPCASA_PALETTE = ["#2e4a38", "#e8735c", "#1a1a1a", "#a8753f", "#8fb3a3"];
const field = "w-full rounded-xl border border-espresso/15 bg-white px-3 py-2.5 text-base outline-none focus:border-espresso";

const readable = (hex: string) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2) || "0", 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1a1a1a" : "#ffffff";
};

export function BrandKit() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cafeName, setCafeName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primary, setPrimary] = useState("#2e4a38");
  const [secondary, setSecondary] = useState("#e8735c");
  const [template, setTemplate] = useState<TemplateKey>("logo-centred");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const swatches = analysis && analysis.palette.length > 0 ? analysis.palette : CUPCASA_PALETTE;

  async function upload(file: File) {
    setUploading(true); setError("");
    try {
      const form = new FormData();
      form.append("logo", file);
      const res = await fetch("/api/brand/analyze", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "We couldn't read that file.");
      setAnalysis(json);
      if (json.palette?.length) setPrimary(json.palette[0]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function build() {
    if (!cafeName.trim()) { setError("Add your café name first."); return; }
    setBuilding(true); setError(""); setDone(false);
    try {
      const res = await fetch("/api/brand/kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeName, tagline: tagline || undefined, primary, secondary, template,
          logoPng: analysis?.normalizedPng ?? null, monoPng: analysis?.monoPng ?? null,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brand-kit-${cafeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBuilding(false);
    }
  }

  const fg = readable(primary);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
      {/* controls */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-espresso/10 bg-white/70 p-5">
          <h2 className="font-display text-lg font-extrabold">1. Your logo</h2>
          <input
            ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp,application/pdf"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
            className="sr-only" id="logo-input"
          />
          <label htmlFor="logo-input" className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-espresso/20 px-4 py-6 text-sm font-bold hover:bg-cream/60">
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading…</> : <><ImageUp className="h-5 w-5 text-coral" /> {analysis ? "Choose a different file" : "Upload PNG, JPG, SVG or PDF"}</>}
          </label>
          {analysis && (
            <div className="mt-3 space-y-2 text-sm">
              <div className={`flex items-start gap-2 rounded-xl p-3 ${analysis.print.level === "poor" ? "bg-coral/10 text-coral-deep" : analysis.print.level === "marginal" ? "bg-butter/40" : "bg-leaf/10 text-leaf"}`}>
                {analysis.print.level === "good" ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{analysis.print.message}</span>
              </div>
              {analysis.monochrome && (
                <p className="text-xs text-espresso/60">
                  Your logo is a single colour, so there&apos;s no palette to pull from it. Pick a colour below.
                </p>
              )}
              <p className="text-xs text-espresso/50">We keep your original untouched and only ever generate from a copy.</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-espresso/10 bg-white/70 p-5">
          <h2 className="font-display text-lg font-extrabold">2. Your details</h2>
          <div className="mt-3 space-y-3">
            <input value={cafeName} onChange={(e) => setCafeName(e.target.value)} placeholder="Café name" className={field} aria-label="Café name" />
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tagline (optional)" className={field} aria-label="Tagline" />
          </div>

          <p className="mt-4 mb-2 font-bold text-sm">Colour</p>
          <div className="flex flex-wrap items-center gap-2">
            {swatches.map((c) => (
              <button key={c} type="button" onClick={() => setPrimary(c)}
                className={`h-9 w-9 rounded-full border-2 transition ${primary === c ? "border-espresso scale-110" : "border-espresso/15"}`}
                style={{ background: c }} aria-label={`Use ${c}`} title={c} />
            ))}
            <label className="ml-1 inline-flex items-center gap-2 text-xs font-bold">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-9 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Custom colour" />
              Custom
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="font-bold">Accent</span>
            <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Accent colour" />
            <span className="text-espresso/50">{secondary}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-espresso/10 bg-white/70 p-5">
          <h2 className="font-display text-lg font-extrabold">3. Template</h2>
          <p className="mt-1 text-xs text-espresso/55">Six, on purpose. Constraint is why these come out looking good.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button key={t.key} type="button" onClick={() => setTemplate(t.key)}
                className={`rounded-2xl border p-3 text-left transition ${template === t.key ? "border-espresso bg-cream/70" : "border-espresso/10 hover:bg-cream/40"}`}>
                <span className="block text-sm font-bold">{t.label}</span>
                <span className="block text-xs text-espresso/55">{t.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* preview + download */}
      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-3xl border border-espresso/10">
          <div className="aspect-square w-full p-10 flex flex-col justify-between" style={{ background: primary, color: fg }}>
            <div className="flex flex-1 flex-col justify-center">
              {analysis && template !== "wordmark-band" && (
                <Image
                  src={template === "minimal-stamp" ? analysis.monoPng : analysis.normalizedPng}
                  alt="" width={110} height={110} unoptimized
                  className="mb-6 h-16 w-auto object-contain"
                  style={template === "minimal-stamp" ? { filter: fg === "#ffffff" ? "invert(1)" : "none" } : undefined}
                />
              )}
              <p className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl">
                We&apos;ve switched to a cup that composts at home.
              </p>
              {template === "logo-tagline" && tagline && <p className="mt-4 text-sm opacity-85">{tagline}</p>}
            </div>
            <div className="flex items-end justify-between gap-3">
              <span className="font-display text-base font-extrabold">{cafeName || "Your café"}</span>
              <span className="text-[10px] opacity-80">No PE · No PLA · No microplastics</span>
            </div>
          </div>
          <p className="bg-white/70 px-4 py-2 text-xs text-espresso/55">
            Preview of one of seven pieces. The kit also has a certification post, a story, a menu chip, a window
            decal, a till card and an A-frame poster.
          </p>
        </div>

        <div className="rounded-3xl border border-espresso/10 bg-white/70 p-5">
          {error && <p className="mb-3 text-sm font-semibold text-coral-deep">{error}</p>}
          {done && (
            <p className="mb-3 flex items-start gap-2 text-sm font-semibold text-leaf">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> Downloaded. Everything is print-ready at trim with bleed and crop marks.
            </p>
          )}
          <button type="button" onClick={build} disabled={building} className="btn-pill w-full bg-coral px-6 py-3 text-sm text-white hover:bg-coral-deep disabled:opacity-60">
            {building ? <><Loader2 className="h-4 w-4 animate-spin" /> Building your kit…</> : <><Download className="h-4 w-4" /> Download the kit</>}
          </button>
          <p className="mt-3 text-xs text-espresso/50">
            Free. No account. Cup sleeves aren&apos;t in the kit yet — a sleeve has its own trim, seam allowance and
            cone warp, and we won&apos;t generate artwork against a guessed dieline.
          </p>
        </div>
      </div>
    </div>
  );
}
