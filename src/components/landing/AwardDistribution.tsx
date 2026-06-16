"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import AnimatedTitle from "@/components/animations/AnimatedTitle";

export type AwardItem = {
  id: string;
  title: string;
  image: string;
  alt?: string | null;
  featured?: boolean;
};

type AwardDistributionProps = {
  items: AwardItem[];
  mobileHighlights?: AwardItem[];
};

type ImagePair = {
  key: string;
  left: AwardItem;
  right: AwardItem;
};

function AwardImageCard({
  title,
  image,
  alt,
  variant,
  priority = false,
}: {
  title: string;
  image: string;
  alt?: string | null;
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
        alt={alt ?? title}
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

function BonusAchieverCard({
  item,
  centered = false,
}: {
  item: AwardItem;
  centered?: boolean;
}) {
  const isRemote = item.image.startsWith("http");

  return (
    <article
      className={`bonus-instagram-card bonus-instagram-card--cflow gallery-device gallery-device--phone gallery-phone-card${
        centered ? " bonus-instagram-card--center" : ""
      }`}
    >
      <div className="gallery-device__shell gallery-phone bonus-instagram-card__shell">
        <div
          className="gallery-device__screen gallery-phone__screen bonus-instagram-card__screen"
          style={{ "--video-aspect": 9 / 16 } as React.CSSProperties}
        >
          <Image
            src={item.image}
            alt={item.alt ?? item.title}
            fill
            unoptimized={isRemote}
            sizes="280px"
            className="bonus-instagram-card__image object-contain"
          />
        </div>
      </div>
      <p className="gallery-device__title bonus-instagram-card__name">{item.title}</p>
    </article>
  );
}

function getCoverflowSlotMotion(offset: number, stepPx: number) {
  const absOffset = Math.abs(offset);

  if (absOffset > 3) {
    return {
      left: `calc(50% + ${offset * stepPx}px)`,
      x: "-50%",
      y: "-50%",
      rotateY: 0,
      scale: 0.55,
      z: -140,
      opacity: 0,
    };
  }

  const x = offset * stepPx;
  let rotateY = 0;
  let scale = 1;
  let z = 72;
  let opacity = 1;
  let filter = "none";

  if (offset === 0) {
    rotateY = 0;
    scale = 1;
    z = 72;
    opacity = 1;
  } else if (absOffset === 1) {
    rotateY = offset < 0 ? 42 : -42;
    scale = 0.9;
    z = 24;
    opacity = 0.94;
    filter = "brightness(0.92) saturate(0.96)";
  } else if (absOffset === 2) {
    rotateY = offset < 0 ? 54 : -54;
    scale = 0.82;
    z = -18;
    opacity = 0.82;
    filter = "brightness(0.86) saturate(0.9)";
  } else {
    rotateY = offset < 0 ? 64 : -64;
    scale = 0.74;
    z = -64;
    opacity = 0.68;
    filter = "brightness(0.78) saturate(0.85)";
  }

  return {
    left: `calc(50% + ${x}px)`,
    x: "-50%",
    y: "-50%",
    rotateY,
    scale,
    z,
    opacity,
    filter,
    zIndex: 20 - absOffset * 4,
  };
}

function InstagramMobileRow({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: AwardItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(2, Math.max(0, items.length - 1))
  );
  const [paused, setPaused] = useState(false);
  const [stepPx, setStepPx] = useState(132);
  const viewportRef = useRef<HTMLDivElement>(null);

  const count = items.length;

  const updateStep = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const vw = viewport.clientWidth;
    setStepPx(Math.max(96, Math.min(vw * 0.168, 248)));
  }, []);

  useLayoutEffect(() => {
    updateStep();
  }, [updateStep, items, activeIndex]);

  useEffect(() => {
    window.addEventListener("resize", updateStep);
    return () => window.removeEventListener("resize", updateStep);
  }, [updateStep]);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) => (current - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(goNext, 4500);
    return () => window.clearInterval(timer);
  }, [count, paused, goNext]);

  if (count === 0) return null;

  return (
    <div className="bonus-achievers-block bonus-achievers-block--fullbleed">
      <div className="bonus-achievers-block__header">
        <h3 className="bonus-achievers-block__title">{title}</h3>
        <p className="bonus-achievers-block__subtitle">{subtitle}</p>
      </div>

      <div
        className="bonus-instagram-row bonus-instagram-row--coverflow"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <motion.div
          ref={viewportRef}
          className="bonus-instagram-row__viewport"
          drag={count > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.x < -40 || info.velocity.x < -350) goNext();
            else if (info.offset.x > 40 || info.velocity.x > 350) goPrev();
          }}
        >
          <div
            className="bonus-instagram-row__track"
            style={{ "--cflow-step": `${stepPx}px` } as React.CSSProperties}
          >
            {items.map((item, index) => {
              const offset = index - activeIndex;
              const absOffset = Math.abs(offset);
              const motionProps = getCoverflowSlotMotion(offset, stepPx);

              return (
                <motion.div
                  key={item.id}
                  className={`bonus-instagram-row__slot${
                    absOffset > 3 ? " is-offscreen" : ""
                  }`}
                  data-offset={offset}
                  aria-hidden={absOffset > 3}
                  animate={motionProps}
                  transition={smoothSwipe}
                  style={{
                    transformOrigin:
                      offset < 0 ? "100% 50%" : offset > 0 ? "0% 50%" : "50% 50%",
                  }}
                >
                  <BonusAchieverCard item={item} centered={offset === 0} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {count > 1 && (
          <div className="bonus-instagram-row__dots" aria-hidden>
            {items.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show ${item.title}`}
                className={`events-gallery-showcase__dot ${
                  dotIndex === activeIndex
                    ? "events-gallery-showcase__dot--active"
                    : ""
                }`}
                onClick={() => setActiveIndex(dotIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AwardDistribution({
  items,
  mobileHighlights = [],
}: AwardDistributionProps) {
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
      id="awards"
      className="award-distribution-section section-gradient py-14 lg:py-16"
      aria-labelledby="awards-gallery-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center md:mb-12">
          <p className="brand-label mb-3">Recognition</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            Award Distribution
          </AnimatedTitle>
          <p
            id="awards-gallery-title"
            className="mx-auto mt-4 max-w-2xl text-muted"
          >
            Celebrating top performers with certificates, prizes, and recognition
            ceremonies across BALITECH.
          </p>
        </header>
      </div>

      <div className="events-gallery-showcase-wrap">
        <div className="events-gallery-showcase">
          <div className="events-gallery-showcase__parent events-gallery-showcase__parent--static">
            <AwardImageCard
              title={featured.title}
              image={featured.image}
              alt={featured.alt}
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
                      <AwardImageCard
                        title={pair.left.title}
                        image={pair.left.image}
                        alt={pair.left.alt}
                        variant="child"
                      />
                    </div>
                    <div className="events-gallery-showcase__child">
                      <AwardImageCard
                        title={pair.right.title}
                        image={pair.right.image}
                        alt={pair.right.alt}
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
                  aria-label={`Show award slide ${dotIndex + 1}`}
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

      {mobileHighlights.length > 0 && (
        <InstagramMobileRow
          title="Top Performers & Promotions"
          subtitle="Bonus achievers and career milestones at BALITECH"
          items={mobileHighlights}
        />
      )}
    </section>
  );
}
