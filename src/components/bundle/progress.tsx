"use client";

import { Check } from "lucide-react";
import type { Step, StepId } from "@/lib/bundle";

/**
 * The rail across the top. A finished step is a link back; the one ahead is not, because the
 * flow refuses to skip and a dead-looking button is kinder than one that bounces you.
 */
export function Progress({
  steps,
  current,
  reached,
  onGo,
}: {
  steps: Step[];
  current: StepId;
  /** Steps the bundle has earned — anything at or before the first unanswered one. */
  reached: Set<StepId>;
  onGo: (id: StepId) => void;
}) {
  const currentAt = steps.findIndex((s) => s.id === current);

  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Progress">
      {steps.map((step, i) => {
        const done = i < currentAt;
        const active = step.id === current;
        const canGo = reached.has(step.id) && !active;

        return (
          <li key={step.id} className="flex items-center gap-1 sm:gap-2 min-w-0">
            {i > 0 && (
              <span
                aria-hidden
                className={`h-px w-3 sm:w-8 shrink-0 ${done || active ? "bg-coral" : "bg-espresso/15"}`}
              />
            )}
            <button
              type="button"
              disabled={!canGo}
              onClick={() => canGo && onGo(step.id)}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full pl-1.5 pr-2 sm:pr-3.5 py-1.5 text-sm font-bold transition-colors ${
                active
                  ? "bg-espresso text-cream"
                  : done
                    ? "text-espresso hover:bg-espresso/8"
                    : "text-espresso/35"
              } ${canGo ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`w-6 h-6 rounded-full grid place-items-center text-xs shrink-0 ${
                  active
                    ? "bg-coral text-white"
                    : done
                      ? "bg-leaf text-cream"
                      : "bg-espresso/10 text-espresso/40"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline whitespace-nowrap">{step.short}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
