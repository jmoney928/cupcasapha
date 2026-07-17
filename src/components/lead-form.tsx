"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  full?: boolean;
};

export function LeadForm({
  type,
  fields,
  submitLabel = "Send",
  successTitle = "Thanks — we'll be in touch!",
  successText = "We've received your message and will reply within one business day.",
}: {
  type: string;
  fields: Field[];
  submitLabel?: string;
  successTitle?: string;
  successText?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string> = { type };
    form.forEach((v, k) => (payload[k] = String(v)));

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) setStatus("done");
      else {
        setError(json.error || "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-3xl bg-leaf/10 border border-leaf/30 p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-leaf flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9 text-cream" />
        </div>
        <h3 className="font-display text-2xl font-bold">{successTitle}</h3>
        <p className="text-espresso/70 mt-2">{successText}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white/70 border border-caramel/20 p-6 sm:p-8 grid sm:grid-cols-2 gap-4"
    >
      {fields.map((f) => (
        <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
          <label className="block text-sm font-bold mb-1.5 text-espresso/80">
            {f.label}
            {f.required && <span className="text-coral"> *</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea
              name={f.name}
              required={f.required}
              rows={4}
              className="w-full rounded-2xl border border-caramel/30 bg-cream px-4 py-3 focus:outline-none focus:ring-2 focus:ring-leaf resize-none"
            />
          ) : f.type === "select" ? (
            <select
              name={f.name}
              required={f.required}
              defaultValue=""
              className="w-full rounded-2xl border border-caramel/30 bg-cream px-4 py-3 focus:outline-none focus:ring-2 focus:ring-leaf"
            >
              <option value="" disabled>
                Select…
              </option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={f.name}
              type={f.type ?? "text"}
              required={f.required}
              className="w-full rounded-2xl border border-caramel/30 bg-cream px-4 py-3 focus:outline-none focus:ring-2 focus:ring-leaf"
            />
          )}
        </div>
      ))}

      {error && (
        <p className="sm:col-span-2 text-coral font-semibold bg-coral/10 rounded-xl p-3 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-pill sm:col-span-2 bg-coral text-white py-4 text-lg hover:bg-coral-deep disabled:opacity-70"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="w-5 h-5" /> {submitLabel}
          </>
        )}
      </button>
    </form>
  );
}
