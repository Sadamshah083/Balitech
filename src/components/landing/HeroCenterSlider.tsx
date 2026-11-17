"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type CenterSlide = {
  src: string;
  alt: string;
  /** Short bold lead of the caption, then the line under it. */
  lead: string;
  text: string;
  /** How dark the book goes while this photo is on show (0 none, ~0.4 heavy). */
  dark: number;
  /** A whole award card (4:5 portrait): shown complete, sized to sit inside the circle. */
  card?: boolean;
};

const AUTOPLAY_MS = 4200;
const SWIPE_PX = 48;

/**
 * The hero book's centre circle: gallery photos that hide and show one at a
 * time, each filling the circle, with its own caption in the pill underneath.
 * The next photo fades in over the one on show, which then hides; after the
 * last one it goes straight back to the first (it never runs back through the
 * others), and no background shows behind a photo while they change. Swipe sideways, use the arrow keys, or leave it: it advances on its
 * own and pauses while the pointer is over it, while it is being dragged, when
 * the tab is hidden, and for people who ask for reduced motion.
 */
export default function HeroCenterSlider({ slides }: { slides: CenterSlide[] }) {
  /* `prev` is the photo that was on show: it stays fully visible underneath
     until the new one has faded in over it, so the circle's own colour is
     never seen between two photos. */
  const [{ index, prev }, setPos] = useState<{ index: number; prev: number | null }>({
    index: 0,
    prev: null,
  });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const startX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) =>
      setPos((s) => {
        const target = ((next % count) + count) % count;
        return target === s.index ? s : { index: target, prev: s.index };
      }),
    [count]
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* The book dims and brightens with the photo on show: night shots darken it
     more, daylight shots less. The overlay's own CSS eases the change. */
  useEffect(() => {
    const dim = rootRef.current
      ?.closest(".hero-shell")
      ?.querySelector<HTMLElement>(".hero-dim");
    if (dim) dim.style.opacity = String(slides[index].dark);
  }, [index, slides]);

  useEffect(() => {
    if (reduced || hovered || dragging || count < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") go(index + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [reduced, hovered, dragging, count, index, go]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const dx = event.clientX - startX.current;
    startX.current = null;
    setDragging(false);
    if (Math.abs(dx) > SWIPE_PX) go(index + (dx < 0 ? 1 : -1));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  }

  const current = slides[index];

  return (
    <>
      <div
        ref={rootRef}
        className="hero-center"
        role="group"
        aria-roledescription="carousel"
        aria-label="BALITECH life, office and events"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="hero-center__track">
          {slides.map((slide, i) => (
            <div
              key={slide.src}
              className={`hero-center__slide${
                i === index ? " is-active" : i === prev ? " is-leaving" : ""
              }${slide.card ? " is-card" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
            >
              {slide.card ? (
                /* The card's own picture, enlarged and blurred, as the circle's
                   background, so the colours match the card exactly. */
                <span
                  className="hero-center__ambient"
                  aria-hidden
                  style={{ backgroundImage: `url(${slide.src})` }}
                />
              ) : null}
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(min-width: 1024px) 34vw, 90vw"
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                /* Already compact webp; the optimizer's first encode per size is
                   slow and would delay the photo. */
                unoptimized
                draggable={false}
                className="hero-center__img"
              />
            </div>
          ))}
        </div>
      </div>

      <p className="hero-center-caption" aria-live="polite">
        <span key={index} className="hero-center-caption__swap">
          <strong>{current.lead}</strong>
          {current.text}
        </span>
      </p>
    </>
  );
}
