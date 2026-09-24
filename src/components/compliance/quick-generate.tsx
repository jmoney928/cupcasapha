"use client";

import { useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { municipalities } from "@/lib/compliance/municipalities";

const field = "w-full rounded-xl border border-espresso/15 bg-white px-3 py-2.5 text-base outline-none focus:border-espresso";

/** The short form behind the claims kit, bin signage and health self-audit. */
export function QuickGenerate({ kind, cta, needsMunicipality = false }: { kind: "claims" | "signage" | "audit"; cta: string; needsMunicipality?: boolean }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("working");
    setError("");
    try {
      const res = await fetch(`/api/compliance/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          cafe: form.get("cafe"),
          email: form.get("email"),
          ...(needsMunicipality ? { municipalityId: form.get("municipalityId") } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${String(form.get("cafe") ?? "cafe").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-2.5">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input name="cafe" required placeholder="Café name" autoComplete="organization" className={field} aria-label="Café name" />
        <input name="name" required placeholder="Your name" autoComplete="name" className={field} aria-label="Your name" />
      </div>
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className={field} aria-label="Email" />
      {needsMunicipality && (
        <select name="municipalityId" required defaultValue="victoria" className={field} aria-label="Municipality">
          {municipalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      {state === "error" && <p className="text-sm font-semibold text-coral-deep">{error}</p>}
      {state === "done" && (
        <p className="flex items-start gap-2 text-sm font-semibold text-leaf">
          <Check className="mt-0.5 h-4 w-4 shrink-0" /> Downloaded, and a copy is in your inbox.
        </p>
      )}
      <button type="submit" disabled={state === "working"} className="btn-pill w-full bg-espresso px-5 py-2.5 text-sm text-cream hover:bg-espresso-soft disabled:opacity-60">
        {state === "working" ? <><Loader2 className="h-4 w-4 animate-spin" /> Building…</> : <><Download className="h-4 w-4" /> {cta}</>}
      </button>
    </form>
  );
}
