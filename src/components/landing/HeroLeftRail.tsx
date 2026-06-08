"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap-register";

const RAIL_STATS = [
  { value: "400+", label: "Employees" },
  { value: "24/5", label: "Operations" },
  { value: "2022", label: "Established" },
] as const;

export default function HeroLeftRail() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    registerGsap();
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero-left-rail__item", {
        x: -20,
        opacity: 0,
        duration: 0.75,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.45,
      });
      gsap.from(".hero-left-rail__line", {
        scaleY: 0,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.35,
        transformOrigin: "top center",
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <aside ref={ref} className="hero-left-rail" aria-label="BALITECH highlights">
      <div className="hero-left-rail__glow" aria-hidden />
      <div className="hero-left-rail__line" aria-hidden />
      <div className="hero-left-rail__content">
        <p className="hero-left-rail__brand">BALI·TECH</p>
        {RAIL_STATS.map((item) => (
          <div key={item.label} className="hero-left-rail__item">
            <span className="hero-left-rail__value">{item.value}</span>
            <span className="hero-left-rail__label">{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
