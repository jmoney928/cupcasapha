"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type HeroSlide = { src: string; alt: string };

const INTERVAL_MS = 6000;

/** Matches the reduced-motion handling in globals.css, but for JS-driven advancing. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * The full-bleed hero background: crossfading photos, a scrim that keeps the headline readable,
 * and the dots. Fills its nearest positioned ancestor, so the hero section owns the height and
 * this owns everything behind the text.
 *
 * Auto-advance stops on hover and on keyboard focus so the dots stay clickable, and never starts
 * under prefers-reduced-motion — the first photo sits there and the dots still work.
 */
export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || reduced || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, reduced, slides.length]);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Cup Casa cups"
      className="absolute inset-0 -z-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="100vw"
          /*
           * Full width on a wide screen crops the 16:9 photo vertically, so x doesn't matter there.
           * A phone crops it hard horizontally instead, and the cups sit right of centre in all
           * three frames — centring would cut every one of them off.
           */
          className="object-cover object-[75%_center] sm:object-center"
          style={{
            opacity: i === index ? 1 : 0,
            transition: reduced ? "none" : "opacity 900ms ease-in-out",
          }}
          aria-hidden={i !== index}
        />
      ))}

      {/*
       * On a wide screen the copy sits left of the cups, so a left-to-right gradient is enough.
       * On a phone the copy covers the whole photo, so the photo has to drop back to texture or
       * the headline sits on bare wood — hence the flat darkening underneath.
       */}
      <div className="absolute inset-0 bg-espresso/60 sm:hidden" />
      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-espresso/85 via-espresso/30 to-transparent" />

      {slides.length > 1 && (
        <div className="absolute bottom-3 right-2 sm:bottom-6 sm:right-6 flex">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              /* Padding gives a 40px tap target around a 10px dot. */
              className="p-[0.9rem] group cursor-pointer"
            >
              <span
                className="block h-2.5 rounded-full bg-cream shadow-[0_1px_3px_rgba(26,26,26,0.5)] transition-all duration-300 group-hover:opacity-100"
                style={{ width: i === index ? "1.75rem" : "0.625rem", opacity: i === index ? 1 : 0.55 }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
