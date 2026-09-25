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
 * Crossfading hero photos. Auto-advance stops on hover and on keyboard focus so the dots stay
 * clickable, and never starts at all under prefers-reduced-motion — the first photo just sits
 * there and the dots still work.
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
      className="relative rounded-[2rem] overflow-hidden aspect-[3/2] shadow-[0_30px_60px_rgba(26,26,26,0.15)]"
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
          sizes="(max-width:1024px) 100vw, 50vw"
          /* The cups sit right of centre in all three frames; centring the crop would cut one off. */
          className="object-cover object-[70%_center]"
          style={{
            opacity: i === index ? 1 : 0,
            transition: reduced ? "none" : "opacity 900ms ease-in-out",
          }}
          aria-hidden={i !== index}
        />
      ))}

      {slides.length > 1 && (
        <>
          {/* Keeps the dots legible over a pale sky or a wooden counter. */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-espresso/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex">
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
                  className="block h-2.5 rounded-full bg-cream transition-all duration-300 group-hover:opacity-100"
                  style={{ width: i === index ? "1.75rem" : "0.625rem", opacity: i === index ? 1 : 0.55 }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
