"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ShowcaseItem = {
  id: string;
  title: string;
  image: string;
  alt?: string | null;
  featured?: boolean;
};

type ShowcaseSlide = {
  key: string;
  items: ShowcaseItem[];
};

type MediaShowcaseProps = {
  items: ShowcaseItem[];
  tone?: "events" | "awards";
  autoplayMs?: number;
  slideLabel?: string;
};

/** Past this much horizontal travel a pointer gesture counts as a swipe. */
const SWIPE_THRESHOLD_PX = 50;

/**
 * Source photos range from 0.56 (portrait) to 2.47 (panorama), so a single
 * object-cover frame would crop most of them beyond recognition. Each photo is
 * letterboxed over a blurred copy of itself: the frame stays a fixed size while
 * the subject is never cut off.
 */
function ShowcaseFrame({
  item,
  size,
  priority = false,
}: {
  item: ShowcaseItem;
  size: "lead" | "support";
  priority?: boolean;
}) {
  const isRemote = item.image.startsWith("http");
  const sizes =
    size === "lead"
      ? "(max-width: 768px) 100vw, 92vw"
      : "(max-width: 768px) 50vw, 46vw";

  return (
    <figure className={`showcase-frame showcase-frame--${size}`}>
      <Image
        src={item.image}
        alt=""
        aria-hidden
        fill
        sizes="16vw"
        unoptimized={isRemote}
        className="showcase-frame__backdrop"
      />
      <Image
        src={item.image}
        alt={item.alt ?? item.title}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized={isRemote}
        className="showcase-frame__media"
      />
      <figcaption className="showcase-frame__caption">
        <span className="showcase-frame__title">{item.title}</span>
      </figcaption>
    </figure>
  );
}

/** Non-overlapping pairs — an image is never shown on two slides. */
function buildSlides(items: ShowcaseItem[]): ShowcaseSlide[] {
  const slides: ShowcaseSlide[] = [];

  for (let index = 0; index < items.length; index += 2) {
    const group = items.slice(index, index + 2);
    slides.push({ key: group.map((item) => item.id).join("+"), items: group });
  }

  return slides;
}

export default function MediaShowcase({
  items,
  tone = "events",
  autoplayMs = 6000,
  slideLabel = "slide",
}: MediaShowcaseProps) {
  const { lead, slides } = useMemo(() => {
    const unique: ShowcaseItem[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      if (!item.image?.trim() || seen.has(item.image)) continue;
      seen.add(item.image);
      unique.push(item);
    }

    const featured = unique.find((item) => item.featured) ?? unique[0] ?? null;
    const rest = featured
      ? unique.filter((item) => item.id !== featured.id)
      : [];

    return { lead: featured, slides: buildSlides(rest) };
  }, [items]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<number | null>(null);

  const slideCount = slides.length;

  const goTo = useCallback(
    (next: number) => {
      if (slideCount === 0) return;
      setIndex(((next % slideCount) + slideCount) % slideCount);
    },
    [slideCount]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (slideCount < 2 || paused) return;
    const timer = window.setInterval(goNext, autoplayMs);
    return () => window.clearInterval(timer);
  }, [slideCount, paused, goNext, autoplayMs]);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    []
  );

  const pauseThenResume = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), 6000);
  }, []);

  /**
   * Swipe handling on raw pointer events. framer-motion's drag gesture was the
   * only reason this page loaded the library at all.
   */
  const dragStartX = useRef<number | null>(null);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (slideCount < 2 || event.pointerType === "mouse") return;
      dragStartX.current = event.clientX;
      pauseThenResume();
    },
    [pauseThenResume, slideCount]
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const start = dragStartX.current;
      dragStartX.current = null;
      if (start === null) return;

      const travel = event.clientX - start;
      if (travel <= -SWIPE_THRESHOLD_PX) goNext();
      else if (travel >= SWIPE_THRESHOLD_PX) goPrev();
    },
    [goNext, goPrev]
  );

  if (!lead) return null;

  return (
    <div className={`showcase showcase--${tone}`}>
      <div className="showcase__lead">
        <ShowcaseFrame item={lead} size="lead" priority />
      </div>

      {slideCount > 0 && (
        <div
          className="showcase__viewport"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="showcase__track"
            style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            {slides.map((slide, slideIndex) => (
              <div
                key={slide.key}
                className={`showcase__slide${
                  slide.items.length === 1 ? " showcase__slide--single" : ""
                }`}
                aria-hidden={slideIndex !== index}
              >
                {slide.items.map((item) => (
                  <ShowcaseFrame key={item.id} item={item} size="support" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {slideCount > 1 && (
        <div className="showcase__dots">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.key}
              type="button"
              aria-label={`Show ${slideLabel} ${dotIndex + 1} of ${slideCount}`}
              aria-current={dotIndex === index}
              className={`showcase__dot${
                dotIndex === index ? " is-active" : ""
              }`}
              onClick={() => {
                goTo(dotIndex);
                pauseThenResume();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
