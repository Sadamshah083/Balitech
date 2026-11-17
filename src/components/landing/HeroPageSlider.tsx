"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export type PageSlide = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  /** A cut-out (no background of its own): stands on the frame's colour. */
  cutout?: boolean;
  /** Which part of a full photo stays in view when it fills the frame (CSS object-position). */
  focus?: string;
};

/**
 * A photo frame on one of the hero book's pages that changes photo by itself.
 * Every photo is shown whole (never cropped) on the frame's own colour, and
 * the caption underneath changes with it. The next photo fades in over the one
 * on show, which then hides, so the frame's colour is never seen between two
 * photos; after the last it goes straight back to the first. Each frame has
 * its own timing so the page never changes everywhere at once. It pauses when
 * the tab is hidden and does not run for people who ask for reduced motion.
 */
export default function HeroPageSlider({
  slides,
  tone,
  intervalMs,
}: {
  slides: PageSlide[];
  tone: "orange" | "blue" | "sun";
  intervalMs: number;
}) {
  const [{ index, prev }, setPos] = useState<{ index: number; prev: number | null }>({
    index: 0,
    prev: null,
  });
  const [reduced, setReduced] = useState(false);
  const count = slides.length;

  const next = useCallback(
    () => setPos((s) => ({ index: (s.index + 1) % count, prev: s.index })),
    [count]
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* Once the new photo has finished fading in, let go of the old one. Photos
     here are shown whole, so their frame colour shows at the sides, and an old
     photo left underneath would show through there. */
  useEffect(() => {
    if (prev === null) return;
    const done = window.setTimeout(
      () => setPos((s) => (s.prev === null ? s : { index: s.index, prev: null })),
      900
    );
    return () => window.clearTimeout(done);
  }, [index, prev]);

  useEffect(() => {
    if (reduced || count < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") next();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [reduced, count, intervalMs, next]);

  /* A cut-out has no background of its own, so it must never be on top of (or
     under) another photo: when either the old or the new photo is a cut-out the
     old one fades away first and the new one fades in after it. */
  const sequenced =
    prev !== null && Boolean(slides[index].cutout || slides[prev].cutout);

  return (
    <figure className="hero-art__card">
      <div className={`hero-art__frame hero-art__frame--${tone} hero-pslider`}>
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={`hero-pslider__slide${
              i === index
                ? ` is-active${sequenced ? " is-after" : ""}`
                : i === prev
                  ? ` is-leaving${sequenced ? " is-out" : ""}`
                  : ""
            }${slide.cutout ? " is-cutout" : " is-fill"}`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              width={slide.width}
              height={slide.height}
              sizes="(min-width: 1024px) 24vw, 0px"
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              unoptimized
              className="hero-pslider__img"
              style={slide.focus ? { objectPosition: slide.focus } : undefined}
            />
          </div>
        ))}
      </div>
      <figcaption className="hero-art__caption" aria-live="polite">
        <span key={index} className="hero-pslider__cap">
          {slides[index].caption}
        </span>
      </figcaption>
    </figure>
  );
}
