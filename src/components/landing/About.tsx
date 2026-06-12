"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import AboutEventCollage from "@/components/landing/AboutEventCollage";
import GoalsHierarchy from "@/components/landing/GoalsHierarchy";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { gsap, registerGsap } from "@/lib/gsap-register";
import { companyContent } from "@/lib/content";

const { about } = companyContent;

export default function About() {
  const featuresRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      gsap.from(".goals-showcase__root", {
        y: 24,
        opacity: 0,
        scale: 0.96,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.from(".goals-showcase__pillar", {
        y: 36,
        opacity: 0,
        duration: 0.7,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: featuresRef }
  );

  return (
    <section id="about" className="section-with-net w-full overflow-hidden">
      <SectionAnimatedNet />
      <div className="about-collage-wrap section-gradient py-6 lg:py-8">
        <AboutEventCollage />
      </div>

      <div
        ref={featuresRef}
        className="goals-section-wrap section-gradient px-3 pt-10 pb-16 sm:px-4 lg:px-6 lg:pt-14 lg:pb-20 xl:px-10"
      >
        <p className="goals-section-label brand-label mx-auto mb-12 text-center">
          {about.goalsLabel}
        </p>

        <div className="goals-section-inner">
          <GoalsHierarchy />
        </div>
      </div>
    </section>
  );
}
