"use client";

import type { ReactNode } from "react";

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-espresso/55 shrink-0">{label}</span>
      {children}
    </label>
  );
}

export function Num({
  value, onChange, min, max, step = 1, suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <input
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 10) / 10 : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="w-20 rounded-xl border-2 border-espresso/12 bg-white/80 px-2.5 py-1.5 text-sm text-right focus:border-coral focus:outline-none"
      />
      {suffix && <span className="text-xs text-espresso/40 w-6">{suffix}</span>}
    </span>
  );
}

export function Slide({
  value, onChange, min, max, step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-32 accent-[#e8735a]"
    />
  );
}

export function Swatches({
  value, onChange, allowNone = false, noneLabel = "None",
}: {
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const colours = ["#1a1a1a", "#ede9de", "#ffffff", "#e8735a", "#2e4a38", "#e7c9a3", "#8fb3a3", "#9b9b94"];
  return (
    <span className="flex items-center gap-1.5 flex-wrap justify-end">
      {allowNone && (
        <button
          type="button"
          onClick={() => onChange("none")}
          aria-label={noneLabel}
          title={noneLabel}
          aria-pressed={value === "none"}
          className={`w-6 h-6 rounded-full border-2 bg-white relative overflow-hidden ${
            value === "none" ? "border-coral" : "border-espresso/20"
          }`}
        >
          <span className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,#e8735a_45%,#e8735a_55%,transparent_55%)]" />
        </button>
      )}
      {colours.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={c}
          title={c}
          aria-pressed={value.toLowerCase() === c}
          className={`w-6 h-6 rounded-full border-2 ${
            value.toLowerCase() === c ? "border-coral scale-110" : "border-espresso/20"
          }`}
          style={{ background: c }}
        />
      ))}
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Custom colour"
        className="w-6 h-6 rounded-full border-2 border-espresso/20 bg-transparent p-0 cursor-pointer"
      />
    </span>
  );
}

export function Seg<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <span className="inline-flex rounded-xl border-2 border-espresso/12 overflow-hidden bg-white/80">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1.5 text-sm font-semibold ${
            value === o.value ? "bg-coral text-white" : "hover:bg-cream-deep"
          }`}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}
