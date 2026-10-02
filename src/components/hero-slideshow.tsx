"use client";

import { getImageProps } from "next/image";
import { useEffect, useState } from "react";

export type HeroSlide = {
  src: string;
  alt: string;
  /** A portrait recomposition for phones. Without one, the landscape is cropped as before. */
  mobileSrc?: string;
};

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
        <Slide key={slide.src} slide={slide} shown={i === index} first={i === 0} reduced={reduced} />
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

/**
 * One photo, art-directed: phones get the portrait shot where one exists, everything wider gets
 * the landscape. <Image> cannot serve two different pictures from one slot, so this drops down
 * to getImageProps and a <picture> — the browser downloads only whichever source matches, which
 * matters on exactly the connections the mobile shots exist for.
 */
function Slide({
  slide,
  shown,
  first,
  reduced,
}: {
  slide: HeroSlide;
  shown: boolean;
  first: boolean;
  reduced: boolean;
}) {
  const common = { alt: slide.alt, fill: true as const, sizes: "100vw", priority: first };
  const desktop = getImageProps({ ...common, src: slide.src });
  const mobile = slide.mobileSrc ? getImageProps({ ...common, src: slide.mobileSrc }) : null;
  const { alt, ...img } = desktop.props;

  return (
    <picture>
      {/* 639px: everything below Tailwind's sm, matching the layout's own breakpoint. */}
      {mobile && <source media="(max-width: 639px)" srcSet={mobile.props.srcSet} sizes="100vw" />}
      <img
        {...img}
        alt={alt}
        /*
         * Full width on a wide screen crops the 16:9 photo vertically, so x doesn't matter there.
         * A phone crops a landscape hard horizontally, and the cups sit right of centre in those
         * frames — but a slide with its own portrait shot is composed for the middle.
         */
        className={`object-cover sm:object-center ${
          slide.mobileSrc ? "object-center" : "object-[75%_center]"
        }`}
        style={{
          ...img.style,
          opacity: shown ? 1 : 0,
          transition: reduced ? "none" : "opacity 900ms ease-in-out",
        }}
        aria-hidden={!shown}
      />
    </picture>
  );
}
