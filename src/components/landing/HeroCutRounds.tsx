"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap-register";
import { cn } from "@/lib/cn";

/* Placed along jagged cut valleys — x aligns with wave dips */
const CUT_ROUNDS = [
  { left: "2%", bottom: "14%", size: "md" },
  { left: "6%", bottom: "20%", size: "lg" },
  { left: "10%", bottom: "9%", size: "sm" },
  { left: "16%", bottom: "13%", size: "sm" },
  { left: "22%", bottom: "17%", size: "md" },
  { left: "28%", bottom: "22%", size: "xl" },
  { left: "34%", bottom: "30%", size: "sm" },
  { left: "40%", bottom: "34%", size: "md" },
  { left: "46%", bottom: "21%", size: "lg" },
  { left: "52%", bottom: "25%", size: "lg" },
  { left: "58%", bottom: "31%", size: "sm" },
  { left: "64%", bottom: "37%", size: "sm" },
  { left: "70%", bottom: "33%", size: "md" },
  { left: "76%", bottom: "41%", size: "md" },
  { left: "82%", bottom: "39%", size: "sm" },
  { left: "88%", bottom: "45%", size: "lg" },
  { left: "94%", bottom: "47%", size: "md" },
] as const;

type RoundSize = (typeof CUT_ROUNDS)[number]["size"];

const sizeClass: Record<RoundSize, string> = {
  sm: "hero-cut-round--sm",
  md: "hero-cut-round--md",
  lg: "hero-cut-round--lg",
  xl: "hero-cut-round--xl",
};

export default function HeroCutRounds() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero-cut-round", {
        scale: 0.6,
        opacity: 0,
        duration: 0.9,
        stagger: 0.06,
        ease: "power2.out",
        delay: 0.8,
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
      <div className="hero-cut-rounds">
        <span className="hero-cut-rounds__line" />
        {CUT_ROUNDS.map((round, index) => (
          <span
            key={index}
            className={cn("hero-cut-round", sizeClass[round.size])}
            style={{ left: round.left, bottom: round.bottom }}
          />
        ))}
      </div>
    </div>
  );
}
