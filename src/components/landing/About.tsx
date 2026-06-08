"use client";

import Image from "next/image";
import { useRef } from "react";
import { CheckCircle } from "lucide-react";
import { useGSAP } from "@gsap/react";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import BentoTilt from "@/components/animations/BentoTilt";
import { gsap, registerGsap } from "@/lib/gsap-register";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const { about, goals } = companyContent;
const features = goals;

const scrollImages = siteImages.aboutScroll;

const FRAME_START = {
  width: "min(22rem, 88vw)",
  height: "52vh",
  borderRadius: "1.75rem",
};

export default function About() {
  const featuresRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      gsap.from(".about-feature-card", {
        y: 32,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: featuresRef }
  );

  useGSAP(() => {
    registerGsap();

    gsap.set(".about-scroll-frame", {
      ...FRAME_START,
      scale: 1,
      transformOrigin: "center center",
    });

    gsap.set(".about-scroll-img-1", { opacity: 1, zIndex: 3 });
    gsap.set(".about-scroll-img-2", { opacity: 0, zIndex: 2 });
    gsap.set(".about-scroll-img-3", { opacity: 0, zIndex: 1 });

    gsap.set(".about-img-zoom-1", { scale: 1.5 });
    gsap.set(".about-img-zoom-2", { scale: 1.5 });
    gsap.set(".about-img-zoom-3", { scale: 1.5 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#about-clip",
        start: "top top",
        end: "+=360%",
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      },
    });

    // Phase 1 — image 1 zoom, frame grows
    tl.to(
      ".about-scroll-frame",
      {
        width: "min(36rem, 90vw)",
        height: "62vh",
        borderRadius: "1.5rem",
        duration: 1,
        ease: "power2.inOut",
      },
      0
    )
      .to(
        ".about-img-zoom-1",
        { scale: 1, duration: 1, ease: "power2.out" },
        0
      )
      .to(".about-scroll-img-1", { opacity: 0, duration: 0.45 }, 0.82)
      .to(".about-scroll-img-2", { opacity: 1, duration: 0.45 }, 0.82)

      // Phase 2 — image 2 zoom, frame grows larger
      .to(
        ".about-scroll-frame",
        {
          width: "min(56rem, 94vw)",
          height: "72vh",
          borderRadius: "1rem",
          duration: 1,
          ease: "power2.inOut",
        },
        1
      )
      .to(
        ".about-img-zoom-2",
        { scale: 1, duration: 1, ease: "power2.out" },
        1
      )
      .to(".about-scroll-img-2", { opacity: 0, duration: 0.45 }, 1.82)
      .to(".about-scroll-img-3", { opacity: 1, duration: 0.45 }, 1.82)

      // Phase 3 — image 3 zoom, frame goes FULL SCREEN
      .to(
        ".about-scroll-frame",
        {
          width: "100vw",
          height: "100dvh",
          borderRadius: 0,
          duration: 1.2,
          ease: "power3.inOut",
        },
        2
      )
      .to(
        ".about-img-zoom-3",
        { scale: 1, duration: 1.2, ease: "power3.out" },
        2
      )
      .to(
        ".about-scroll-frame",
        {
          boxShadow: "0 0 80px rgba(242, 140, 40, 0.4)",
          borderColor: "rgba(242, 140, 40, 0.6)",
          duration: 0.5,
        },
        2.5
      );
  });

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
      </div>

      <div
        id="about-clip"
        className="relative flex w-full items-center justify-center overflow-hidden bg-background"
        style={{ height: "100dvh", minHeight: "100dvh" }}
      >
        <div
          className="about-scroll-frame relative overflow-hidden rounded-3xl glow-border will-change-transform"
          style={{
            width: FRAME_START.width,
            height: FRAME_START.height,
            minHeight: FRAME_START.height,
          }}
        >
          {scrollImages.map((src, index) => (
            <div
              key={src}
              className={`about-scroll-img about-scroll-img-${index + 1} absolute inset-0 overflow-hidden`}
            >
              <div
                className={`about-img-zoom about-img-zoom-${index + 1} relative h-full w-full will-change-transform`}
              >
                <Image
                  src={src}
                  alt={`Bali Tech team highlight ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={featuresRef}
        className="section-gradient px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="brand-label mb-4">Our History</p>
          {about.history.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="mt-4 text-sm leading-relaxed text-muted sm:text-base"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <p className="brand-label mx-auto mb-8 max-w-7xl text-center">Our Goals</p>

        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <BentoTilt key={feature}>
              <div className="about-feature-card glow-border flex h-full items-start gap-4 rounded-2xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-orange/60 bg-orange/10">
                  <CheckCircle
                    size={18}
                    className="text-orange"
                    aria-hidden
                  />
                </span>
                <span className="text-sm font-medium leading-relaxed text-foreground/90 sm:text-base">
                  {feature}
                </span>
              </div>
            </BentoTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
