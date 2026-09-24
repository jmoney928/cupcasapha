"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Download, Loader2, ShieldCheck } from "lucide-react";
import { CATEGORY_LABELS, sdsProducts, type SdsCategory } from "@/lib/compliance/sds";

const field = "w-full rounded-xl border border-espresso/15 bg-white px-3 py-2.5 text-base outline-none focus:border-espresso";

/** Ticked by default: what almost every espresso bar actually keeps on site. */
const DEFAULT_PICKED = new Set(["urnex-cafiza", "urnex-rinza", "urnex-dezcal", "quat-sanitizer", "chlorine-bleach", "dish-detergent"]);

const ORDER: SdsCategory[] = ["machine_cleaner", "milk_line", "descaler", "sanitizer", "bleach", "dish_detergent", "degreaser", "drain_cleaner", "gas"];

export function BinderBuilder() {
  const [picked, setPicked] = useState<Set<string>>(new Set(DEFAULT_PICKED));
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const grouped = useMemo(() => {
    const by = new Map<SdsCategory, typeof sdsProducts>();
    for (const p of sdsProducts) by.set(p.category, [...(by.get(p.category) ?? []), p]);
    return ORDER.filter((c) => by.has(c)).map((c) => ({ category: c, products: by.get(c)! }));
  }, []);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (picked.size === 0) { setError("Tick at least one product you keep on site."); setState("error"); return; }
    const form = new FormData(e.currentTarget);
    setState("working");
    setError("");
    try {
      const res = await fetch("/api/compliance/binder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          cafe: form.get("cafe"),
          email: form.get("email"),
          address: form.get("address") || undefined,
          selections: [...picked].map((productId) => ({ productId, location: locations[productId] || undefined })),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whmis-binder-${String(form.get("cafe") ?? "cafe").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-start">
      {/* products */}
      <div className="rounded-3xl border border-espresso/10 bg-white/70 p-5">
        <h2 className="font-display text-xl font-extrabold">What do you keep on site?</h2>
        <p className="mt-1 text-sm text-espresso/60">
          Tick everything your staff handle. We&apos;ve pre-ticked what most espresso bars have. Where it&apos;s kept is
          optional, and goes on the inventory page.
        </p>
        <div className="mt-5 space-y-5">
          {grouped.map(({ category, products }) => (
            <fieldset key={category}>
              <legend className="label-caps text-caramel mb-2">{CATEGORY_LABELS[category]}</legend>
              <div className="space-y-2">
                {products.map((p) => {
                  const on = picked.has(p.id);
                  return (
                    <div key={p.id} className={`rounded-2xl border p-3 transition ${on ? "border-espresso/30 bg-cream/60" : "border-espresso/10"}`}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="mt-1 h-4 w-4 shrink-0 accent-leaf" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{p.name}</span>
                          <span className="block text-xs text-espresso/55">{p.manufacturer}</span>
                          <span className="mt-1 block text-xs text-espresso/70">{p.hazardSummary}</span>
                          {!p.manufacturerSdsUrl && !p.directSdsUrl && (
                            <span className="mt-1 block text-xs font-semibold text-coral-deep">
                              Sheet comes from your supplier — we&apos;ll list it and tell you who to ask.
                            </span>
                          )}
                        </span>
                      </label>
                      {on && (
                        <input
                          value={locations[p.id] ?? ""}
                          onChange={(e) => setLocations((l) => ({ ...l, [p.id]: e.target.value }))}
                          placeholder={`Where it's kept — e.g. ${p.typicalLocation}`}
                          className="mt-2 w-full rounded-lg border border-espresso/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-espresso"
                          aria-label={`Where ${p.name} is kept`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      {/* details + generate */}
      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-3xl border border-espresso/10 bg-white/70 p-5">
          <h2 className="font-display text-xl font-extrabold">Your café</h2>
          <div className="mt-4 space-y-3">
            <input name="cafe" required placeholder="Café name" autoComplete="organization" className={field} aria-label="Café name" />
            <input name="name" required placeholder="Your name" autoComplete="name" className={field} aria-label="Your name" />
            <input name="email" type="email" required placeholder="Email" autoComplete="email" className={field} aria-label="Email" />
            <input name="address" placeholder="Address (optional)" autoComplete="street-address" className={field} aria-label="Address" />
          </div>

          <div className="mt-4 rounded-2xl bg-cream p-3 text-sm">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
              <span>
                <b>{picked.size}</b> product{picked.size === 1 ? "" : "s"} selected. Your binder downloads immediately and
                we email a copy.
              </span>
            </p>
          </div>

          {state === "error" && <p className="mt-3 text-sm font-semibold text-coral-deep">{error}</p>}
          {state === "done" && (
            <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-leaf">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> Downloaded, and a copy is in your inbox.
            </p>
          )}

          <button type="submit" disabled={state === "working"} className="btn-pill mt-4 w-full bg-coral px-6 py-3 text-sm text-white hover:bg-coral-deep disabled:opacity-60">
            {state === "working" ? <><Loader2 className="h-4 w-4 animate-spin" /> Building…</> : <><Download className="h-4 w-4" /> Get my binder</>}
          </button>
          <p className="mt-3 text-xs text-espresso/50">
            Free, no obligation, and we don&apos;t add you to a newsletter. We make compostable cups; this is how we
            introduce ourselves.
          </p>
        </div>

        <div className="rounded-3xl bg-espresso p-5 text-cream">
          <p className="font-display text-base font-extrabold">While you&apos;re here</p>
          <p className="mt-1 text-sm text-cream/65">
            See what switching to a certified home-compostable cup is worth to your café.
          </p>
          <a href="/calculator" className="btn-pill mt-4 inline-flex bg-coral px-4 py-2 text-sm text-white hover:bg-coral-deep">
            Run the numbers <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </form>
  );
}
