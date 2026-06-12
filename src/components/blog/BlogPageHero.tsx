"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import { companyContent } from "@/lib/content";
import { gsap, registerGsap } from "@/lib/gsap-register";

const { ceo } = companyContent;

export default function BlogPageHero() {
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();

      gsap.from(".blog-page-hero__glow", {
        scale: 0.6,
        opacity: 0,
        duration: 1.4,
        stagger: 0.2,
        ease: "power2.out",
      });

      gsap.from(".blog-page-hero__content > *", {
        y: 40,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.15,
      });

      gsap.from(".blog-page-hero__portrait-wrap", {
        x: 48,
        opacity: 0,
        scale: 0.94,
        duration: 1,
        ease: "power3.out",
        delay: 0.25,
      });
    },
    { scope: heroRef }
  );

  return (
    <header ref={heroRef} className="blog-page-hero" aria-labelledby="blog-page-hero-title">
      <div className="blog-page-hero__glow blog-page-hero__glow--left" aria-hidden />
      <div className="blog-page-hero__glow blog-page-hero__glow--right" aria-hidden />

      <div className="blog-page__container blog-page-hero__inner">
        <div className="blog-page-hero__content">
          <p className="blog-page-hero__eyebrow brand-label">{ceo.label}</p>

          <h1 id="blog-page-hero-title" className="blog-page-hero__title">
            <span className="blog-page-hero__title-line">Leadership That</span>
            <span className="blog-page-hero__title-line">
              Builds{" "}
              <span className="blog-page-hero__title-highlight heading-last-word">
                People
                <HeadingBrush />
              </span>
            </span>
          </h1>

          <p className="blog-page-hero__subtitle">
            Vision, leadership, and culture from {ceo.name}, {ceo.title} of{" "}
            {ceo.company}.
          </p>
        </div>

        <div className="blog-page-hero__portrait-wrap">
          <div className="blog-page-hero__portrait-ring" aria-hidden />
          <div className="blog-page-hero__portrait-frame">
            <Image
              src={ceo.image}
              alt={`${ceo.name}, ${ceo.title} of ${ceo.company}`}
              fill
              className="object-cover object-[center_18%]"
              sizes="(max-width: 900px) 88vw, 320px"
              priority
              loading="eager"
            />
            <div className="blog-page-hero__portrait-overlay" aria-hidden />
          </div>
        </div>
      </div>

      <div className="blog-page-hero__fade" aria-hidden />
    </header>
  );
}
