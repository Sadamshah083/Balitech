"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap-register";

type ParallelPageLinesProps = {
  children: React.ReactNode;
};

export default function ParallelPageLines({ children }: ParallelPageLinesProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!wrapRef.current) return;

      gsap.fromTo(
        ".parallel-rail-left",
        { scaleY: 0, opacity: 0 },
        {
          scaleY: 1,
          opacity: 1,
          duration: 1.6,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: wrapRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        ".parallel-rail-right",
        { scaleY: 0, opacity: 0 },
        {
          scaleY: 1,
          opacity: 1,
          duration: 1.6,
          ease: "power3.inOut",
          delay: 0.12,
          scrollTrigger: {
            trigger: wrapRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        ".pre-footer-line-left",
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1.4,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: ".pre-footer-lines-block",
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        ".pre-footer-line-right",
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1.4,
          ease: "power3.inOut",
          delay: 0.15,
          scrollTrigger: {
            trigger: ".pre-footer-lines-block",
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: wrapRef }
  );

  return (
    <div ref={wrapRef} className="parallel-page-wrap relative w-full">
      <div className="parallel-rails pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        <div className="parallel-rail parallel-rail-left" />
        <div className="parallel-rail parallel-rail-right" />
      </div>

      <div className="relative z-[2]">{children}</div>

      <div
        className="pre-footer-lines-block pre-footer-lines relative z-[2]"
        aria-hidden
      >
        <div className="pre-footer-line pre-footer-line-left" />
        <div className="pre-footer-line pre-footer-line-right" />
      </div>
    </div>
  );
}
