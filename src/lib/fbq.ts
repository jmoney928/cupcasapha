// Lightweight, SSR-safe wrapper around the Meta Pixel global (window.fbq).
// window.fbq is typed in components/meta-pixel.tsx.

export function fbqTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}
