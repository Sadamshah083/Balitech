"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { siteImages } from "@/lib/images";

const SLIDE_INTERVAL_MS = 5000;
const SLIDE_TRANSITION_MS = 900;

type HeroBackgroundSliderProps = {
  onFirstImageReady?: () => void;
  onActiveDotChange?: (index: number) => void;
};

export default function HeroBackgroundSlider({
  onFirstImageReady,
  onActiveDotChange,
}: HeroBackgroundSliderProps) {
  const slides = siteImages.heroSlides;
  const trackSlides = [...slides, slides[0]];
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const activeDot = activeIndex % slides.length;

  useEffect(() => {
    onActiveDotChange?.(activeDot);
  }, [activeDot, onActiveDotChange]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => current + 1);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    if (activeIndex !== slides.length) return;

    const resetTimer = window.setTimeout(() => {
      setTransitionEnabled(false);
      setActiveIndex(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionEnabled(true));
      });
    }, SLIDE_TRANSITION_MS);

    return () => window.clearTimeout(resetTimer);
  }, [activeIndex, slides.length]);

  return (
    <div
      className="hero-bg-slider"
      style={
        {
          "--hero-slide-total": trackSlides.length,
          "--hero-slide-index": activeIndex,
          "--hero-slide-transition": transitionEnabled
            ? `${SLIDE_TRANSITION_MS}ms`
            : "0ms",
        } as React.CSSProperties
      }
      aria-hidden
    >
      <div className="hero-bg-track">
        {trackSlides.map((slide, index) => (
          <div key={`${slide.src}-${index}`} className="hero-bg-slide-wrap">
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="100vw"
              className="hero-bg-image object-cover"
              style={{
                objectPosition: slide.objectPosition ?? "center center",
              }}
              onLoad={index === 0 ? onFirstImageReady : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSlideDots({ activeDot }: { activeDot: number }) {
  const slides = siteImages.heroSlides;

  return (
    <div
      className="hero-bg-dots"
      role="tablist"
      aria-label="Hero background slides"
    >
      {slides.map((slide, index) => (
        <span
          key={slide.src}
          role="tab"
          aria-selected={index === activeDot}
          aria-label={`Slide ${index + 1}`}
          className={`hero-bg-dot${
            index === activeDot ? " hero-bg-dot--active" : ""
          }`}
        />
      ))}
    </div>
  );
}
