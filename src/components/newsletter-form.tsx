"use client";

import { useState } from "react";
import { Loader2, Check, ArrowRight } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        setEmail("");
      } else {
        setError(data.error || "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="flex items-center gap-3 bg-leaf/15 text-cream rounded-full px-5 py-3.5 font-semibold">
        <span className="w-7 h-7 rounded-full bg-leaf flex items-center justify-center shrink-0">
          <Check className="w-4 h-4" />
        </span>
        You&apos;re in! Keep an eye on your inbox. 🌱
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourcafe.com"
          aria-label="Email address"
          className="flex-1 rounded-full px-5 py-3.5 bg-cream text-espresso placeholder:text-espresso/40 focus:outline-none focus:ring-2 focus:ring-leaf"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-pill bg-coral text-white px-6 py-3.5 hover:bg-coral-deep disabled:opacity-70 shrink-0"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Joining…
            </>
          ) : (
            <>
              Subscribe <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      {error && <p className="text-coral-soft text-sm font-semibold mt-2">{error}</p>}
    </form>
  );
}
