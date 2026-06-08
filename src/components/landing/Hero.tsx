"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { gsap, registerGsap } from "@/lib/gsap-register";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const HERO_HEIGHT = "100dvh";

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
      gsap.from(".hero-logo", {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".hero-center-item", {
        y: 30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isLoading]);

  const handleImageReady = () => {
    setIsLoading(false);
  };

  const logoSrc = theme === "light" ? siteImages.logoLight : siteImages.logo;

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

      <div
        id="hero-frame"
        className="hero-frame-no-scroll relative z-10 w-full overflow-hidden"
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

        <div className="absolute left-5 top-24 z-40 sm:left-10 sm:top-28">
          <Image
            src={logoSrc}
            alt="Bali Tech"
            width={220}
            height={50}
            priority
            className="hero-logo h-auto w-36 sm:w-52 md:w-56"
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6 text-center">
          <p className="hero-center-item brand-label mb-4">{companyContent.hero.label}</p>
          <h1 className="hero-center-item hero-title-theme text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {companyContent.hero.titleLine1}
            <br />
            {companyContent.hero.titleLine2}
          </h1>

          <p className="hero-center-item hero-subtitle-theme mx-auto mt-5 max-w-2xl text-sm leading-relaxed sm:text-base md:text-lg">
            {companyContent.hero.subtitle}
          </p>

          <p className="hero-center-item mt-4 text-sm font-semibold italic text-orange sm:text-base">
            &ldquo;{companyContent.hero.tagline}&rdquo;
          </p>

          <Link
            href="#contact"
            className="hero-center-item btn-primary mt-8 inline-flex items-center gap-2 rounded-full px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] sm:text-base"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
