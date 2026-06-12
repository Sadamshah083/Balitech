"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap-register";

export default function SectionUnderline() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const line = ref.current?.querySelector(".section-underline-line");
      if (!line || !ref.current) return;

      gsap.fromTo(
        line,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1.1,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 92%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="section-underline-wrap relative">
      <div className="section-underline-line mx-auto h-px w-full max-w-5xl origin-center" />
      <div className="section-underline-dot absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_10px_color-mix(in_srgb,var(--line-accent)_60%,transparent)]" />
    </div>
  );
}
