"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap-register";
import HeroBackgroundSlider, {
  HeroSlideDots,
} from "@/components/landing/HeroBackgroundSlider";
import HeroLeftRail from "@/components/landing/HeroLeftRail";
import { companyContent } from "@/lib/content";

const HERO_HEIGHT = "100dvh";

const JAGGED_EDGE_PATH =
  "M0,0.907 C0.055,0.900 0.105,0.922 0.155,0.915 C0.205,0.907 0.255,0.937 0.305,0.929 C0.355,0.922 0.405,0.948 0.455,0.940 C0.505,0.933 0.555,0.963 0.605,0.955 C0.655,0.948 0.705,0.976 0.755,0.968 C0.805,0.959 0.855,0.974 0.895,0.966 C0.935,0.957 0.975,0.970 1,0.963";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaderActive, setIsLoaderActive] = useState(true);
  const [isLoaderFadingOut, setIsLoaderFadingOut] = useState(false);
  const [visibleCharCount, setVisibleCharCount] = useState(0);
  const [activeHeroDot, setActiveHeroDot] = useState(0);

  useEffect(() => {
    const charInterval = setInterval(() => {
      setVisibleCharCount((prev) => {
        if (prev < 20) {
          return prev + 1;
        } else {
          clearInterval(charInterval);
          return prev;
        }
      });
    }, 90);

    const fadeTimeout = setTimeout(() => {
      setIsLoaderFadingOut(true);
      setIsLoading(false);
    }, 3100);

    const removeTimeout = setTimeout(() => {
      setIsLoaderActive(false);
    }, 3700);

    return () => {
      clearInterval(charInterval);
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    registerGsap();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Background image zoom and accents entry
      tl.fromTo(
        ".hero-bg-slider",
        { scale: 1.12, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 1.4, ease: "power2.out" }
      );

      // 2. Stats rail slides in and elements stagger
      tl.fromTo(
        ".hero-left-rail",
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, ease: "power4.out" },
        "-=0.7"
      );
      tl.fromTo(
        ".hero-left-rail__line",
        { scaleX: 0, transformOrigin: "right center" },
        { scaleX: 1, duration: 0.8, ease: "power3.out" },
        "-=0.5"
      );
      tl.fromTo(
        ".hero-left-rail__item",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: "power3.out" },
        "-=0.5"
      );

      // 3. Giant BALITECH cut label letters tracking slide & fade
      tl.fromTo(
        ".hero-cut-label",
        { y: 25, opacity: 0, letterSpacing: "0.45em" },
        { y: 0, opacity: 1, letterSpacing: "0.28em", duration: 1.2, ease: "power3.out" },
        "-=0.7"
      );

      // 4. Jagged edge stroke entry
      tl.fromTo(
        ".hero-jagged-edge",
        { scaleX: 0, opacity: 0, transformOrigin: "left center" },
        { scaleX: 1, opacity: 1, duration: 1.1, ease: "power2.inOut" },
        "-=1.1"
      );

      // 5. Logo highlight animation at the very end
      const logoLink = document.querySelector(".brand-logo-link");
      if (logoLink) {
        tl.fromTo(
          logoLink,
          { scale: 1, filter: "brightness(1) drop-shadow(0 0 0px var(--orange-glow))" },
          {
            scale: 1.15,
            filter: "brightness(1.55) drop-shadow(0 0 16px var(--orange-glow))",
            duration: 0.5,
            yoyo: true,
            repeat: 1,
            ease: "power2.out"
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [isLoading]);

  const handleImageReady = () => {};

  return (
    <section
      ref={sectionRef}
      id="home"
      className="hero-section relative overflow-hidden"
      style={{ height: HERO_HEIGHT, minHeight: HERO_HEIGHT }}
    >
      {isLoaderActive && (
        <div
          className={`hero-loader absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[color:var(--background)] gap-12 transition-opacity duration-700 ease-in-out ${
            isLoaderFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ height: HERO_HEIGHT, minHeight: HERO_HEIGHT }}
        >
          <div className="hero-loader__content flex flex-col items-center gap-10 w-full max-w-4xl px-6 relative z-10">
            <div className="hero-loader__title w-full flex flex-row flex-wrap justify-center items-center font-calligraphy text-7xl md:text-9xl font-normal text-white text-center select-none">
              {"Welcome to Bali Tech".split("").map((char, index) => (
                <span
                  key={index}
                  className={`hero-loader__char transition-all duration-500 ease-out inline-block transform origin-bottom ${
                    visibleCharCount > index
                      ? "opacity-100 scale-100 rotate-0 translate-y-0"
                      : "opacity-0 scale-0 -rotate-12 translate-y-6"
                  }`}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>

            <div className="hero-loader__progress flex flex-col items-center gap-4 w-72 md:w-96 transition-all duration-500">
              <div className="hero-loader__progress-track w-full h-[3px] rounded-full overflow-hidden relative">
                <div
                  className="hero-loader__progress-fill absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.round((visibleCharCount / 20) * 100))}%` }}
                />
                <div className="hero-loader__progress-spark absolute top-0 h-full w-8 pointer-events-none" aria-hidden />
              </div>
              <div className="w-full flex justify-between items-center text-[10px] md:text-xs font-mono tracking-[0.25em] text-white/40 px-1 select-none">
                <span className="hero-loader__status animate-pulse">INITIALIZING NODE</span>
                <span className="hero-loader__percent text-white font-bold tracking-normal">
                  {String(Math.min(100, Math.round((visibleCharCount / 20) * 100))).padStart(3, "0")}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <svg className="hero-clip-defs" aria-hidden width="0" height="0">
        <defs>
          <clipPath id="hero-bottom-jagged-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0 H1 V0.963 C0.975,0.970 0.935,0.957 0.895,0.966 C0.855,0.974 0.805,0.959 0.755,0.968 C0.705,0.976 0.655,0.948 0.605,0.955 C0.555,0.963 0.505,0.933 0.455,0.940 C0.405,0.948 0.355,0.922 0.305,0.929 C0.255,0.937 0.205,0.907 0.155,0.915 C0.105,0.922 0.055,0.900 0,0.907 Z" />
          </clipPath>
          <clipPath id="hero-bottom-cut-zone-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.907 C0.055,0.900 0.105,0.922 0.155,0.915 C0.205,0.907 0.255,0.937 0.305,0.929 C0.355,0.922 0.405,0.948 0.455,0.940 C0.505,0.933 0.555,0.963 0.605,0.955 C0.655,0.948 0.705,0.976 0.755,0.968 C0.805,0.959 0.855,0.974 0.895,0.966 C0.935,0.957 0.975,0.970 1,0.963 L1,1 L0,1 Z" />
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
          <HeroBackgroundSlider
            onFirstImageReady={handleImageReady}
            onActiveDotChange={setActiveHeroDot}
          />
        </div>

        <div className="hero-overlay pointer-events-none absolute inset-0 z-[1]" aria-hidden />
        <div className="hero-left-shade pointer-events-none absolute inset-y-0 left-0 w-full z-[2]" aria-hidden />

        <HeroSlideDots activeDot={activeHeroDot} />

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
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="0.005"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <HeroLeftRail />
      <p className="hero-cut-label">{companyContent.name}</p>
    </section>
  );
}
