"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { gsap, registerGsap } from "@/lib/gsap-register";
import HeroBrushStroke from "@/components/landing/HeroBrushStroke";
import HeroCutRounds from "@/components/landing/HeroCutRounds";
import HeroLeftRail from "@/components/landing/HeroLeftRail";
import HeroLocalTime from "@/components/landing/HeroLocalTime";
import HeroMissionScroll from "@/components/landing/HeroMissionScroll";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const HERO_HEIGHT = "100dvh";

const JAGGED_EDGE_PATH =
  "M0,0.78 C0.055,0.76 0.105,0.82 0.155,0.8 C0.205,0.78 0.255,0.86 0.305,0.84 C0.355,0.82 0.405,0.89 0.455,0.87 C0.505,0.85 0.555,0.93 0.605,0.91 C0.655,0.89 0.705,0.965 0.755,0.945 C0.805,0.92 0.855,0.96 0.895,0.94 C0.935,0.915 0.975,0.95 1,0.93";

export default function Hero() {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fallback = setTimeout(() => setIsLoading(false), 4000);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    registerGsap();

    const ctx = gsap.context(() => {
      gsap.from(".hero-center-item", {
        y: 30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15,
      });

      gsap.from(".hero-brush-stroke", {
        scaleX: 0,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.55,
        transformOrigin: "left center",
      });

      gsap.from(".hero-cut-label", {
        x: -12,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.65,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isLoading, theme]);

  const handleImageReady = () => {
    setIsLoading(false);
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="hero-section relative overflow-hidden"
      style={{ height: HERO_HEIGHT, minHeight: HERO_HEIGHT }}
    >
      {isLoading && (
        <div
          className="hero-loader absolute inset-0 z-[100] flex items-center justify-center bg-background"
          style={{ height: HERO_HEIGHT, minHeight: HERO_HEIGHT }}
        >
          <div className="three-body">
            <div className="three-body__dot" />
            <div className="three-body__dot" />
            <div className="three-body__dot" />
          </div>
        </div>
      )}

      <svg className="hero-clip-defs" aria-hidden width="0" height="0">
        <defs>
          <clipPath id="hero-bottom-jagged-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0 H1 V0.93 C0.975,0.95 0.935,0.915 0.895,0.94 C0.855,0.96 0.805,0.92 0.755,0.945 C0.705,0.965 0.655,0.89 0.605,0.91 C0.555,0.93 0.505,0.85 0.455,0.87 C0.405,0.89 0.355,0.82 0.305,0.84 C0.255,0.86 0.205,0.78 0.155,0.8 C0.105,0.82 0.055,0.76 0,0.78 Z" />
          </clipPath>
          <clipPath id="hero-bottom-cut-zone-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.78 C0.055,0.76 0.105,0.82 0.155,0.8 C0.205,0.78 0.255,0.86 0.305,0.84 C0.355,0.82 0.405,0.89 0.455,0.87 C0.505,0.85 0.555,0.93 0.605,0.91 C0.655,0.89 0.705,0.965 0.755,0.945 C0.805,0.92 0.855,0.96 0.895,0.94 C0.935,0.915 0.975,0.95 1,0.93 L1,1 L0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        id="hero-frame"
        className="hero-frame-no-scroll hero-frame-cut relative z-10 w-full overflow-hidden"
        style={{ height: HERO_HEIGHT, minHeight: HERO_HEIGHT }}
      >
        <div
          className="relative w-full"
          style={{ height: HERO_HEIGHT, minHeight: HERO_HEIGHT }}
        >
          <Image
            src={siteImages.hero}
            alt="Bali Tech professional call center team"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
            onLoad={handleImageReady}
          />
        </div>

        <div className="hero-text-scrim pointer-events-none absolute inset-0 z-[1]" />

        <HeroLeftRail />

        <div className="hero-content absolute inset-0 z-30 flex items-center justify-center px-4 sm:px-6">
          <div className="hero-copy">
            <p className="hero-center-item brand-label mb-3 sm:mb-4">
              {companyContent.hero.label}
            </p>
            <h1 className="hero-center-item hero-title-theme text-2xl font-black uppercase leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              {companyContent.hero.titleLine1}
              <br />
              <span className="hero-title-line2">
                {companyContent.hero.titleLine2}
                <HeroBrushStroke variant="title" />
              </span>
            </h1>

            <div className="hero-center-item hero-tagline-wrap mt-3 sm:mt-4">
              <p className="hero-tagline-text text-sm font-semibold italic text-[var(--orange)] sm:text-base">
                &ldquo;{companyContent.hero.tagline}&rdquo;
              </p>
              <HeroBrushStroke variant="tagline-top" />
              <HeroBrushStroke variant="tagline-bottom" />
            </div>

          </div>
        </div>

      </div>

      <svg
        className="hero-jagged-edge"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={JAGGED_EDGE_PATH}
          fill="none"
          stroke="var(--orange)"
          strokeWidth="0.005"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <HeroCutRounds />
      <HeroMissionScroll text={companyContent.hero.subtitle} />
      <HeroLocalTime />
      <p className="hero-cut-label">Professional way</p>
    </section>
  );
}
