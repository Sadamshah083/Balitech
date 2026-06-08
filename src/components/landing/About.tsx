"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import GoalsHierarchy from "@/components/landing/GoalsHierarchy";
import { gsap, registerGsap } from "@/lib/gsap-register";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const { about, vision, mission } = companyContent;
const scrollImages = siteImages.aboutScroll;
const showcaseChapters = about.showcase;

export default function About() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      gsap.from(".goals-tree-branch", {
        y: 28,
        opacity: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: featuresRef }
  );

  useGSAP(
    () => {
      registerGsap();
      const root = showcaseRef.current;
      if (!root) return;

      gsap.set(".about-showcase-panel", { autoAlpha: 0, y: 24 });
      gsap.set(".about-showcase-panel-1", { autoAlpha: 1, y: 0 });

      gsap.set(".about-showcase-slide", {
        clipPath: "inset(0 100% 0 0)",
        autoAlpha: 1,
      });
      gsap.set(".about-showcase-slide-1", { clipPath: "inset(0 0% 0 0)" });

      gsap.set(".about-showcase-progress-fill", { scaleX: 0.34 });
      gsap.set(".about-showcase-counter-num", { autoAlpha: 0 });
      gsap.set(".about-showcase-counter-num-1", { autoAlpha: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=240%",
          scrub: 0.85,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        },
      });

      tl.to(".about-showcase-progress-fill", {
        scaleX: 0.67,
        duration: 1,
        ease: "none",
      })
        .to(
          ".about-showcase-panel-1",
          { autoAlpha: 0, y: -18, duration: 0.35, ease: "power2.in" },
          0.72
        )
        .to(
          ".about-showcase-panel-2",
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
          0.82
        )
        .to(
          ".about-showcase-slide-1",
          { clipPath: "inset(0 0 0 100%)", duration: 0.9, ease: "power3.inOut" },
          0.78
        )
        .to(
          ".about-showcase-slide-2",
          { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power3.inOut" },
          0.78
        )
        .to(".about-showcase-counter-num-1", { autoAlpha: 0, duration: 0.2 }, 0.88)
        .to(".about-showcase-counter-num-2", { autoAlpha: 1, duration: 0.2 }, 0.88)
        .to(".about-showcase-img-inner-1", { x: "-2%", duration: 1, ease: "none" }, 0)
        .to(".about-showcase-img-inner-2", { x: "-2%", duration: 1, ease: "none" }, 1)

        .to(".about-showcase-progress-fill", {
          scaleX: 1,
          duration: 1,
          ease: "none",
        })
        .to(
          ".about-showcase-panel-2",
          { autoAlpha: 0, y: -18, duration: 0.35, ease: "power2.in" },
          1.72
        )
        .to(
          ".about-showcase-panel-3",
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
          1.82
        )
        .to(
          ".about-showcase-slide-2",
          { clipPath: "inset(0 0 0 100%)", duration: 0.9, ease: "power3.inOut" },
          1.78
        )
        .to(
          ".about-showcase-slide-3",
          { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power3.inOut" },
          1.78
        )
        .to(".about-showcase-counter-num-2", { autoAlpha: 0, duration: 0.2 }, 1.88)
        .to(".about-showcase-counter-num-3", { autoAlpha: 1, duration: 0.2 }, 1.88)
        .to(".about-showcase-img-inner-3", { x: "-2%", duration: 1, ease: "none" }, 2);
    },
    { scope: showcaseRef }
  );

  return (
    <section id="about" className="w-full overflow-hidden">
      <div className="section-gradient px-4 py-20 text-center sm:px-6">
        <p className="brand-label mb-4">{about.label}</p>
        <AnimatedTitle containerClass="mx-auto max-w-5xl">
          {about.title}
        </AnimatedTitle>
        <p className="mx-auto mt-8 max-w-2xl text-muted">
          {about.description}
        </p>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 text-left sm:grid-cols-2">
          <div className="glow-border rounded-2xl bg-card/60 p-6 text-left">
            <p className="brand-label mb-3">{vision.label}</p>
            <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
              {vision.text}
            </p>
          </div>
          <div className="glow-border rounded-2xl bg-card/60 p-6 text-left">
            <p className="brand-label mb-3">{mission.label}</p>
            <p className="mb-3 text-sm font-semibold text-orange">
              {mission.tagline}
            </p>
            <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
              {mission.text}
            </p>
          </div>
        </div>
      </div>

      <div
        id="about-clip"
        ref={showcaseRef}
        className="about-showcase relative w-full overflow-hidden bg-background"
      >
        <div className="about-showcase-grid" aria-hidden />

        <div className="about-showcase-inner mx-auto flex h-[100dvh] max-w-7xl flex-col px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:gap-14 lg:px-8 lg:py-0">
          <div className="about-showcase-copy flex flex-1 flex-col justify-center lg:max-w-[22rem] xl:max-w-md">
            <p className="about-showcase-eyebrow brand-label mb-6">
              {about.showcaseLabel}
            </p>

            <div className="about-showcase-panels relative min-h-[11rem] sm:min-h-[9.5rem]">
              {showcaseChapters.map((chapter, index) => (
                <div
                  key={chapter.title}
                  className={`about-showcase-panel about-showcase-panel-${index + 1} absolute inset-0`}
                >
                  <span className="about-showcase-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="about-showcase-heading">{chapter.title}</h3>
                  <p className="about-showcase-text">{chapter.text}</p>
                </div>
              ))}
            </div>

            <div className="about-showcase-progress mt-8">
              <div className="about-showcase-progress-track">
                <div className="about-showcase-progress-fill" />
              </div>
              <p className="about-showcase-counter">
                <span className="about-showcase-counter-slot">
                  <span className="about-showcase-counter-num about-showcase-counter-num-1">
                    01
                  </span>
                  <span className="about-showcase-counter-num about-showcase-counter-num-2">
                    02
                  </span>
                  <span className="about-showcase-counter-num about-showcase-counter-num-3">
                    03
                  </span>
                </span>
                <span className="about-showcase-counter-sep"> / </span>
                <span>03</span>
              </p>
            </div>
          </div>

          <div className="about-showcase-media relative mt-8 flex flex-1 items-center justify-center lg:mt-0">
            <span className="about-showcase-corner about-showcase-corner--tl" aria-hidden />
            <span className="about-showcase-corner about-showcase-corner--tr" aria-hidden />
            <span className="about-showcase-corner about-showcase-corner--bl" aria-hidden />
            <span className="about-showcase-corner about-showcase-corner--br" aria-hidden />

            <div className="about-showcase-viewport">
              {scrollImages.map((src, index) => (
                <div
                  key={src}
                  className={`about-showcase-slide about-showcase-slide-${index + 1} absolute inset-0 overflow-hidden`}
                >
                  <div
                    className={`about-showcase-img-inner about-showcase-img-inner-${index + 1} relative h-full w-[104%] max-w-none`}
                  >
                    <Image
                      src={src}
                      alt={`BALITECH — ${showcaseChapters[index].title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      priority={index === 0}
                    />
                  </div>
                  <div className="about-showcase-overlay" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={featuresRef}
        className="section-gradient px-4 py-20 sm:px-6 lg:px-8"
      >
        <p className="brand-label mx-auto mb-10 max-w-7xl text-center">
          {about.goalsLabel}
        </p>

        <GoalsHierarchy />
      </div>
    </section>
  );
}
