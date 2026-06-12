"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";

export type EventGalleryItem = {
  id: string;
  title: string;
  image: string;
  featured?: boolean;
};

type EventsGalleryProps = {
  items: EventGalleryItem[];
};

type ImagePair = {
  key: string;
  left: EventGalleryItem;
  right: EventGalleryItem;
};

function EventImageCard({
  title,
  image,
  variant,
  priority = false,
}: {
  title: string;
  image: string;
  variant: "parent" | "child";
  priority?: boolean;
}) {
  const isRemote = image.startsWith("http");

  return (
    <div
      className={`events-gallery-card group overflow-hidden rounded-2xl border border-orange/30 bg-background-light transition-all duration-300 hover:border-orange hover:shadow-[0_0_35px_rgba(237,145,41,0.4)] ${
        variant === "parent"
          ? "events-gallery-card--parent"
          : "events-gallery-card--child"
      }`}
    >
      <Image
        src={image}
        alt={title}
        fill
        priority={priority}
        unoptimized={isRemote}
        sizes={variant === "parent" ? "100vw" : "50vw"}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-orange/10 via-transparent to-blue-light/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/55 to-transparent p-4 md:p-6">
        <p
          className={`font-bold uppercase tracking-wider text-white transition-colors duration-300 group-hover:text-orange ${
            variant === "parent" ? "text-base md:text-xl" : "text-xs md:text-base"
          }`}
        >
          {title}
        </p>
      </div>
    </div>
  );
}

const smoothSwipe = {
  type: "tween" as const,
  duration: 0.85,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export default function EventsGallery({ items }: EventsGalleryProps) {
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (Boolean(a.featured) === Boolean(b.featured)) return 0;
        return a.featured ? -1 : 1;
      }),
    [items]
  );

  const featured = sorted.find((item) => item.featured) ?? sorted[0];
  const rest = useMemo(
    () => sorted.filter((item) => item.id !== featured?.id),
    [sorted, featured]
  );

  const pairs = useMemo<ImagePair[]>(() => {
    if (rest.length === 0) return [];
    if (rest.length === 1) {
      return [{ key: rest[0].id, left: rest[0], right: rest[0] }];
    }
    return rest.map((item, i) => ({
      key: `${item.id}-${rest[(i + 1) % rest.length].id}`,
      left: item,
      right: rest[(i + 1) % rest.length],
    }));
  }, [rest]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const pairCount = pairs.length;

  const goTo = useCallback(
    (next: number) => {
      if (pairCount === 0) return;
      setIndex(((next % pairCount) + pairCount) % pairCount);
    },
    [pairCount]
  );

  const goNext = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const goPrev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);

  useEffect(() => {
    if (pairCount < 2 || paused) return;

    const timer = window.setInterval(goNext, 5500);
    return () => window.clearInterval(timer);
  }, [pairCount, paused, goNext]);

  if (!featured) return null;

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
    touchDeltaX.current = 0;
    setPaused(true);
  }

  function onTouchMove(event: React.TouchEvent) {
    touchDeltaX.current = event.touches[0].clientX - touchStartX.current;
  }

  function onTouchEnd() {
    const delta = touchDeltaX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) goNext();
      else goPrev();
    }
    window.setTimeout(() => setPaused(false), 4000);
  }

  return (
    <section
      id="events"
      className="events-gallery section-with-net py-14 lg:py-16"
      aria-labelledby="events-gallery-title"
    >
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center md:mb-12">
          <p className="brand-label mb-3">Events & Culture</p>
          <h2
            id="events-gallery-title"
            className="brand-heading text-3xl sm:text-4xl md:text-5xl"
          >
            <HeadingBrush text="Moments That Define Us" />
          </h2>
        </header>
      </div>

      <div className="events-gallery-showcase-wrap">
        <div className="events-gallery-showcase">
          <div className="events-gallery-showcase__parent events-gallery-showcase__parent--static">
            <EventImageCard
              title={featured.title}
              image={featured.image}
              variant="parent"
              priority
            />
          </div>

          {pairCount > 0 && (
            <div
              className="events-gallery-showcase__children-track"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <motion.div
                className="events-gallery-showcase__slider"
                animate={{ x: `-${index * 100}%` }}
                transition={smoothSwipe}
                drag={pairCount > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.06}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40 || info.velocity.x < -350) goNext();
                  else if (info.offset.x > 40 || info.velocity.x > 350) goPrev();
                }}
              >
                {pairs.map((pair) => (
                  <div
                    key={pair.key}
                    className="events-gallery-showcase__slide"
                    aria-hidden={pair.key !== pairs[index]?.key}
                  >
                    <div className="events-gallery-showcase__child">
                      <EventImageCard
                        title={pair.left.title}
                        image={pair.left.image}
                        variant="child"
                      />
                    </div>
                    <div className="events-gallery-showcase__child">
                      <EventImageCard
                        title={pair.right.title}
                        image={pair.right.image}
                        variant="child"
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          )}

          {pairCount > 1 && (
            <div className="events-gallery-showcase__dots" aria-hidden>
              {pairs.map((pair, dotIndex) => (
                <button
                  key={pair.key}
                  type="button"
                  aria-label={`Show slide ${dotIndex + 1}`}
                  className={`events-gallery-showcase__dot ${
                    dotIndex === index ? "events-gallery-showcase__dot--active" : ""
                  }`}
                  onClick={() => goTo(dotIndex)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <Link
          href="/gallery"
          className="btn-primary inline-flex rounded-full px-8 py-3 text-sm font-bold uppercase tracking-wider"
        >
          View Full Gallery
        </Link>
      </div>
    </section>
  );
}
