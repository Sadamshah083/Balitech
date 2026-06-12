"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap-register";

export default function HeroCutRounds() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero-cut-glow__wash", {
        opacity: 0,
        scaleY: 0.65,
        transformOrigin: "bottom center",
        duration: 1.1,
        ease: "power2.out",
        delay: 0.75,
      });
      gsap.from(".hero-cut-glow__band", {
        opacity: 0,
        y: 18,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.85,
      });
      gsap.from(".hero-cut-rounds__line", {
        scaleX: 0,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        delay: 0.65,
        transformOrigin: "left center",
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="hero-cut-zone" aria-hidden>
      <div className="hero-cut-glow">
        <span className="hero-cut-glow__wash" />
        <span className="hero-cut-glow__band" />
        <span className="hero-cut-rounds__line" />
      </div>
    </div>
  );
}
