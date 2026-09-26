"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImageUp, Trash2 } from "lucide-react";
import { SLEEVE_SIZES, sleeveDieline, type CupSize } from "@/lib/sleeve/dielines";
import { DEFAULT_DESIGN, renderSleeveSvg, sleeveFileName, type SleeveDesign } from "@/lib/sleeve/svg";

const SWATCHES = [
  { name: "Espresso", bg: "#1a1a1a", ink: "#ede9de" },
  { name: "Cream", bg: "#ede9de", ink: "#1a1a1a" },
  { name: "Coral", bg: "#e8735a", ink: "#ffffff" },
  { name: "Leaf", bg: "#2e4a38", ink: "#ede9de" },
  { name: "Butter", bg: "#e7c9a3", ink: "#1a1a1a" },
  { name: "Sky", bg: "#8fb3a3", ink: "#1a1a1a" },
];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * Everything here happens in the browser: the artwork is built from the dieline on the fly and the
 * download is made from the same string the preview shows. No upload, so a café's logo never
 * leaves their machine and there is nothing to wait for.
 */
export function SleeveDesigner() {
  const [design, setDesign] = useState<SleeveDesign>({ ...DEFAULT_DESIGN, businessName: "" });
  const [showGuides, setShowGuides] = useState(true);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof SleeveDesign>(key: K, value: SleeveDesign[K]) =>
    setDesign((d) => ({ ...d, [key]: value }));

  const previewDesign = useMemo(
    () => ({ ...design, businessName: design.businessName.trim() || "Your café" }),
    [design]
  );

  const preview = useMemo(
    () => renderSleeveSvg(previewDesign, { guides: showGuides }),
    [previewDesign, showGuides]
  );

  const dieline = sleeveDieline(design.size);

  async function onLogo(file: File) {
    setLogoError(null);
    if (!/^image\/(png|jpeg|svg\+xml|webp|gif)$/.test(file.type)) {
      setLogoError("PNG, JPG, SVG, WebP or GIF, please.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("That file is over 2MB — a smaller one will print just as well.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }).catch(() => null);
    if (!dataUrl) {
      setLogoError("That file couldn't be read. Try another.");
      return;
    }
    /* Measure it so the sleeve never stretches a logo to fit. */
    const aspect = await new Promise<number>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
      img.onerror = () => resolve(1);
      img.src = dataUrl;
    });
    setDesign((d) => ({ ...d, logo: dataUrl, logoAspect: aspect }));
  }

  function download() {
    /* The file that goes to the press has no guides on it — only the crop marks. */
    const svg = renderSleeveSvg(previewDesign, { guides: false });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = sleeveFileName(previewDesign);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 items-start">
      {/* controls */}
      <div className="space-y-6">
        <Field label="Cup size">
          <div className="flex gap-2">
            {SLEEVE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => set("size", size as CupSize)}
                aria-pressed={design.size === size}
                className={`btn-pill px-5 py-2.5 text-sm border-2 ${
                  design.size === size
                    ? "border-coral bg-coral text-white"
                    : "border-espresso/15 hover:border-espresso/35"
                }`}
              >
                {size}oz
              </button>
            ))}
          </div>
        </Field>

        <Field label="Your name" hint="Left blank, the preview shows a placeholder.">
          <input
            value={design.businessName}
            onChange={(e) => set("businessName", e.target.value.slice(0, 40))}
            placeholder="Inner Harbour Coffee"
            className="w-full rounded-2xl border-2 border-espresso/12 bg-white/70 px-4 py-3 focus:border-coral focus:outline-none"
          />
        </Field>

        <Field label="Second line" hint="Optional — a town, a year, a line you like.">
          <input
            value={design.tagline}
            onChange={(e) => set("tagline", e.target.value.slice(0, 48))}
            placeholder="Victoria, BC · since 2019"
            className="w-full rounded-2xl border-2 border-espresso/12 bg-white/70 px-4 py-3 focus:border-coral focus:outline-none"
          />
        </Field>

        <Field label="Colour">
          <div className="flex flex-wrap gap-2">
            {SWATCHES.map((s) => {
              const active = design.background === s.bg && design.ink === s.ink;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setDesign((d) => ({ ...d, background: s.bg, ink: s.ink }))}
                  aria-pressed={active}
                  aria-label={s.name}
                  title={s.name}
                  className={`w-11 h-11 rounded-full border-2 transition-transform ${
                    active ? "border-coral scale-110" : "border-espresso/15 hover:scale-105"
                  }`}
                  style={{ background: s.bg }}
                />
              );
            })}
          </div>
        </Field>

        <Field label="Your logo" hint="Optional. It replaces the name on the sleeve.">
          {design.logo ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={design.logo}
                alt="Your uploaded logo"
                className="h-12 w-auto max-w-[8rem] object-contain rounded-lg bg-white/70 border border-espresso/10 p-1"
              />
              <button
                type="button"
                onClick={() => {
                  setDesign((d) => ({ ...d, logo: null, logoAspect: 1 }));
                  if (fileInput.current) fileInput.current.value = "";
                }}
                className="btn-pill px-4 py-2 text-sm border-2 border-espresso/15 hover:border-coral"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="btn-pill px-5 py-3 text-sm border-2 border-dashed border-espresso/25 hover:border-coral w-full justify-center"
            >
              <ImageUp className="w-4 h-4" /> Choose a file
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onLogo(file);
            }}
          />
          {logoError && <p className="text-sm text-coral font-semibold mt-2">{logoError}</p>}
        </Field>

        <div className="flex flex-col gap-3 pt-2">
          <label className="flex items-center gap-3 font-semibold text-espresso/80">
            <input
              type="checkbox"
              checked={design.showCert}
              onChange={(e) => set("showCert", e.target.checked)}
              className="w-5 h-5 accent-[#e8735a]"
            />
            Print the compostable line
          </label>
          <label className="flex items-center gap-3 font-semibold text-espresso/80">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
              className="w-5 h-5 accent-[#e8735a]"
            />
            Show cut, fold and safe lines
          </label>
        </div>

        <button onClick={download} className="btn-pill w-full bg-coral text-white py-4 text-lg hover:bg-coral-deep">
          <Download className="w-5 h-5" /> Download print file
        </button>
        <p className="text-xs text-espresso/60">
          Vector SVG at true size — {Math.round(dieline.sheet.width)} × {Math.round(dieline.sheet.height)} mm, with{" "}
          {dieline.bleed} mm bleed and crop marks. The downloaded file has no guide lines on it.
        </p>
      </div>

      {/* preview */}
      <div className="lg:sticky lg:top-24">
        <div className="rounded-[2rem] bg-cream-deep/40 border border-espresso/8 p-5">
          <div
            className="[&>svg]:w-full [&>svg]:h-auto"
            /* Built here from the dieline; user text is escaped and colours validated in svg.ts. */
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
          <Spec label="Print area" value={`${Math.round(dieline.arcBottom)} × ${dieline.bandHeight} mm`} />
          <Spec label="Bleed" value={`${dieline.bleed} mm`} />
          <Spec label="Glue lap" value={`${dieline.glueLap.width} mm`} />
          <Spec label="Sits" value={`${dieline.bandOnCup.from}–${dieline.bandOnCup.to} mm up`} />
        </dl>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-caps text-espresso/50 mb-2">{label}</p>
      {children}
      {hint && <p className="text-xs text-espresso/50 mt-2">{hint}</p>}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/60 border border-caramel/20 px-4 py-3">
      <dt className="text-xs text-espresso/50">{label}</dt>
      <dd className="font-display font-bold">{value}</dd>
    </div>
  );
}
