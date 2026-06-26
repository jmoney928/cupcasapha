"use client";

import { useEffect } from "react";
import { fbqTrack } from "@/lib/fbq";

/**
 * Fires a Meta Pixel Purchase event (with real order value) once per
 * checkout session, looked up from Stripe via /api/checkout/session.
 */
export function PurchaseTracker({ sessionId }: { sessionId?: string }) {
  useEffect(() => {
    if (!sessionId) return;
    const key = `fbq_purchase_${sessionId}`;
    try {
      if (localStorage.getItem(key)) return; // already tracked (e.g. on refresh)
    } catch {}

    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.paid && typeof d.value === "number") {
          fbqTrack("Purchase", { value: d.value, currency: d.currency || "CAD" });
          try {
            localStorage.setItem(key, "1");
          } catch {}
        }
      })
      .catch(() => {});
  }, [sessionId]);

  return null;
}
