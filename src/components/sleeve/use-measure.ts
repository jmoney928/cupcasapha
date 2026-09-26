"use client";

import { useCallback, useMemo, useRef } from "react";
import type { TextElement } from "@/lib/sleeve/doc";
import type { Measurer } from "@/lib/sleeve/render-doc";
import { fontStack } from "@/lib/sleeve/safe";

/**
 * Measures text with the browser rather than guessing at it, so a selection box hugs the letters
 * and curved text bends by the right amount. Font size is in millimetres and the canvas is asked
 * for the same number in pixels — text scales linearly, so the ratio carries straight over.
 */
export function useMeasure(): Measurer {
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const cache = useRef(new Map<string, number>());

  const get = useCallback(() => {
    if (!ctx.current && typeof document !== "undefined") {
      ctx.current = document.createElement("canvas").getContext("2d");
    }
    return ctx.current;
  }, []);

  return useMemo<Measurer>(
    () => (text: string, el: TextElement) => {
      const font = `${el.italic ? "italic " : ""}${el.bold ? 700 : 400} ${el.fontSize}px ${fontStack(el.font)}`;
      const key = `${font}|${el.letterSpacing}|${text}`;
      const hit = cache.current.get(key);
      if (hit !== undefined) return hit;

      const c = get();
      /* Falls back to the shared estimate on the server or if a canvas is unavailable. */
      const base = c
        ? ((c.font = font), c.measureText(text).width)
        : text.length * el.fontSize * (el.bold ? 0.58 : 0.54);
      const width = base + Math.max(0, text.length - 1) * el.letterSpacing;

      if (cache.current.size > 2000) cache.current.clear();
      cache.current.set(key, width);
      return width;
    },
    [get]
  );
}
