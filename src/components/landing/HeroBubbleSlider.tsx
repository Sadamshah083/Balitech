"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export type BubbleSlide = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** A cut-out (no background of its own): stands on the bubble's colour. */
  cutout?: boolean;
  /** Which part of a full photo stays in view when it fills the circle. */
  focus?: string;
  /** What this photo shows; the name under the bubble follows the photo. */
  caption: string;
};

/**
 * A small round photo on the hero book's right page that changes photo by
 * itself. Cut-outs stand on the bubble's own colour; full photos fill the
 * circle. The next photo fades in over the one on show, which is then let go,
 * so the colour never flashes between two photos; after the last it goes
 * straight back to the first. Every bubble has its own timing so they never
 * all change together. Pauses when the tab is hidden; does not run for people
 * who ask for reduced motion.
 */
export default function HeroBubbleSlider({
  slides,
  tone,
  size,
  intervalMs,
}: {
  slides: BubbleSlide[];
  tone: "orange" | "blue" | "sun";
  size: "lg" | "md" | "sm";
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

  /* Cut-outs are transparent: never show one over or under another photo. When
     the old or the new photo is a cut-out, the old one fades away first and
     the new one fades in after it. */
  const sequenced =
    prev !== null && Boolean(slides[index].cutout || slides[prev].cutout);

  return (
    <li className={`hero-bubble hero-bubble--${tone} hero-bubble--${size}`}>
      <div className="hero-bubble__disc">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={`hero-bslide${
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
              sizes="(min-width: 1024px) 8vw, 0px"
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              unoptimized
              style={slide.focus ? { objectPosition: slide.focus } : undefined}
            />
          </div>
        ))}
      </div>
      <span className="hero-bubble__caption" aria-live="polite">
        <span key={index} className="hero-bcap">
          {slides[index].caption}
        </span>
      </span>
    </li>
  );
}
