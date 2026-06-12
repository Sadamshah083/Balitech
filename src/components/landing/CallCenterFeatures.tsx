"use client";

import { useEffect, useRef } from "react";
import { Globe, Headphones, Shield, Target, Users, Zap } from "lucide-react";
import BentoTilt from "@/components/animations/BentoTilt";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import { companyContent } from "@/lib/content";
import { gsap, registerGsap } from "@/lib/gsap-register";

const { excellence, vision, mission, name } = companyContent;
const featureIcons = [Headphones, Users, Shield, Target, Globe, Zap];

export default function CallCenterFeatures() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from(".excellence-showcase__card", {
        opacity: 0,
        y: 48,
        duration: 0.75,
        stagger: 0.09,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".excellence-showcase__cards",
          start: "top 86%",
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="excellence-showcase section-with-net"
      aria-labelledby="excellence-showcase-title"
    >
      <SectionAnimatedNet />
      <div className="excellence-showcase__grid-bg" aria-hidden />
      <div className="excellence-showcase__atmosphere" aria-hidden>
        <span className="excellence-showcase__orb excellence-showcase__orb--left" />
        <span className="excellence-showcase__orb excellence-showcase__orb--right" />
      </div>

      <div className="excellence-showcase__inner">
        <header className="excellence-showcase__header">
          <p className="excellence-showcase__eyebrow brand-label">
            {excellence.label}
          </p>
          <span className="excellence-showcase__watermark" aria-hidden>
            {excellence.label}
          </span>
          <h2 id="excellence-showcase-title" className="excellence-showcase__title">
            {excellence.title}{" "}
            <span className="excellence-showcase__highlight heading-last-word">
              {excellence.highlight}
              <HeadingBrush />
            </span>
          </h2>
          <p className="excellence-showcase__subtitle">
            {vision.text} {mission.tagline}
          </p>
        </header>

        <div className="excellence-showcase__brand">
          <div className="excellence-showcase__brand-rule" aria-hidden />
          <div className="excellence-showcase__brand-center">
            <p className="excellence-showcase__brand-label">{name}</p>
            <h3 className="excellence-showcase__brand-name">
              <span className="excellence-showcase__brand-bali">Bali</span>
              <span className="excellence-showcase__brand-dot" aria-hidden>
                •
              </span>
              <span className="excellence-showcase__brand-tech">Tech</span>
            </h3>
          </div>
          <div className="excellence-showcase__brand-rule" aria-hidden />
        </div>

        <div className="excellence-showcase__cards">
          {excellence.features.map((feature, index) => {
            const Icon = featureIcons[index];

            return (
              <BentoTilt key={feature.num} className="excellence-showcase__card-tilt">
                <article className="excellence-showcase__card">
                  <span className="excellence-showcase__card-glow" aria-hidden />
                  <span className="excellence-showcase__card-edge" aria-hidden />

                  <div className="excellence-showcase__card-top">
                    <span className="excellence-showcase__card-num">
                      {feature.num}
                    </span>
                    <span className="excellence-showcase__card-icon" aria-hidden>
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                  </div>

                  <div className="excellence-showcase__card-divider" aria-hidden />

                  <h3 className="excellence-showcase__card-title">
                    {feature.title}
                  </h3>
                  <p className="excellence-showcase__card-text">
                    {feature.description}
                  </p>
                </article>
              </BentoTilt>
            );
          })}
        </div>
      </div>
    </section>
  );
}
