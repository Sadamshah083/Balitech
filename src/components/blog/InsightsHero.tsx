"use client";

import { useRef } from "react";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import { useLazyGsap } from "@/lib/use-lazy-gsap";

export default function InsightsHero() {
  const heroRef = useRef<HTMLElement>(null);

  useLazyGsap(
    ({ gsap }) => {
      gsap.from(".insights-hero__glow", {
        scale: 0.7,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: "power2.out",
      });
      gsap.from(".insights-hero__content > *", {
        y: 36,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.1,
      });
    },
    heroRef
  );

  return (
    <header ref={heroRef} className="insights-hero" aria-labelledby="insights-hero-title">
      <div className="insights-hero__glow insights-hero__glow--left" aria-hidden />
      <div className="insights-hero__glow insights-hero__glow--right" aria-hidden />
      <div className="blog-page__container insights-hero__inner">
        <div className="insights-hero__content">
          <p className="insights-hero__eyebrow brand-label">BALITECH Blogs</p>
          <h1 id="insights-hero-title" className="insights-hero__title">
            <span className="insights-hero__title-line">Stories From</span>{" "}
            <span className="insights-hero__title-line">
              Our{" "}
              <span className="insights-hero__title-highlight heading-last-word">
                Floor
                <HeadingBrush />
              </span>
            </span>
          </h1>
          <p className="insights-hero__subtitle">
            Operations, culture, and growth notes from the teams building BALITECH every day.
          </p>
        </div>
      </div>
    </header>
  );
}
