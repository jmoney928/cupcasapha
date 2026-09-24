"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { liveGrants, PURPOSE_LABELS, type Grant } from "@/lib/compliance/grants";

const grants = liveGrants();
const purposes = [...new Set(grants.map((g) => g.purpose))];

export function GrantsList() {
  const [filter, setFilter] = useState<Grant["purpose"] | "all">("all");
  const shown = filter === "all" ? grants : grants.filter((g) => g.purpose === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["all", ...purposes] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilter(p)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${filter === p ? "bg-espresso text-cream" : "border border-espresso/15 bg-white hover:bg-cream-deep"}`}
          >
            {p === "all" ? "All" : PURPOSE_LABELS[p]}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {shown.map((g) => (
          <li key={g.id} className="rounded-3xl border border-espresso/10 bg-white/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-extrabold">{g.name}</h3>
                <p className="text-sm text-espresso/60">{g.funder}</p>
              </div>
              <span className="shrink-0 rounded-full bg-cream-deep px-3 py-1 text-xs font-bold">
                {g.deadlineKind === "rolling" ? "Rolling" : g.deadlineKind === "annual" ? "Annual deadline" : "Closed"}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold">{g.amountRange}</p>
            <ul className="mt-2 space-y-1 text-sm text-espresso/70">
              {g.eligibility.map((e) => <li key={e}>· {e}</li>)}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <a href={g.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold underline">
                Funder&apos;s own page <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-espresso/45">Checked {g.verifiedAt}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-espresso/50">
        We re-check these quarterly and hide anything we haven&apos;t verified in six months rather than show it stale.
        Always confirm eligibility and deadlines on the funder&apos;s own page — programmes change.
      </p>
    </div>
  );
}
