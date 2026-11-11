"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type HeroSlide = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** A plain rectangular photo on white: shown whole, centred inside the circle. */
  framed?: boolean;
};

const AUTOPLAY_MS = 4500;
const SWIPE_PX = 48;

/**
 * Team photos that swipe one by one inside the hero's round shape. Drag or
 * swipe sideways, use the dots, or leave it: it advances on its own, and
 * pauses while the pointer is over it, while it is being dragged, when the
 * tab is hidden, and for people who ask for reduced motion.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const startX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
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
    if (reduced || hovered || dragging || count < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [reduced, hovered, dragging, count, index]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    setDrag(event.clientX - startX.current);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const dx = event.clientX - startX.current;
    startX.current = null;
    setDragging(false);
    setDrag(0);
    if (Math.abs(dx) > SWIPE_PX) go(index + (dx < 0 ? 1 : -1));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  }

  return (
    <>
      <div
        className="hero-carousel"
        role="group"
        aria-roledescription="carousel"
        aria-label="Life at BALITECH photos"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="hero-carousel__track"
          style={{
            transform: `translateX(calc(${-index * 100}% + ${drag}px))`,
            transition: dragging ? "none" : undefined,
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.src}
              className="hero-carousel__slide"
              aria-hidden={i !== index}
              aria-label={`${i + 1} of ${count}`}
              role="group"
              aria-roledescription="slide"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                priority={i === 0}
                /* Already compact webp with transparency; the optimizer's first
                   AVIF encode per size is slow and would delay the photo. */
                unoptimized
                draggable={false}
                className={`hero-carousel__img${
                  slide.framed
                    ? " is-framed"
                    : slide.width / slide.height > 2
                      ? " is-wide is-panorama"
                      : slide.width / slide.height > 1.4
                        ? " is-wide"
                        : ""
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hero-carousel__dots" role="tablist" aria-label="Choose photo">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show photo ${i + 1}`}
            className={`hero-carousel__dot${i === index ? " is-active" : ""}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </>
  );
}
