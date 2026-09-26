"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TextElement } from "@/lib/sleeve/doc";
import { estimateWidth, type Measurer } from "@/lib/sleeve/render-doc";
import { fontStack } from "@/lib/sleeve/safe";

/**
 * Measures text with the browser rather than guessing at it, so a selection box hugs the letters
 * and curved text bends by the right amount. Font size is in millimetres and the canvas is asked
 * for the same number in pixels — text scales linearly, so the ratio carries straight over.
 */
export function useMeasure(): Measurer {
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const cache = useRef(new Map<string, number>());
  /*
   * There is no canvas on the server, so the first client render has to agree with the HTML the
   * server sent or hydration mismatches on every glyph. Both start from the shared estimate;
   * measuring properly begins once mounted, which re-renders with the real widths.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const get = useCallback(() => {
    if (!ctx.current && typeof document !== "undefined") {
      ctx.current = document.createElement("canvas").getContext("2d");
    }
    return ctx.current;
  }, []);

  return useMemo<Measurer>(
    () => (text: string, el: TextElement) => {
      if (!mounted) return estimateWidth(text, el);
      const font = `${el.italic ? "italic " : ""}${el.bold ? 700 : 400} ${el.fontSize}px ${fontStack(el.font)}`;
      const key = `${font}|${el.letterSpacing}|${text}`;
      const hit = cache.current.get(key);
      if (hit !== undefined) return hit;

      const c = get();
      /* No canvas available at all — fall back rather than render nothing. */
      if (!c) return estimateWidth(text, el);
      c.font = font;
      const width = c.measureText(text).width + Math.max(0, text.length - 1) * el.letterSpacing;

      if (cache.current.size > 2000) cache.current.clear();
      cache.current.set(key, width);
      return width;
    },
    [get, mounted]
  );
}
