"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const BRAND = "Bali Tech";

export default function CapsulePreloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!sessionStorage.getItem("balitech-capsule-preloader")) {
      setShow(true);
    }
  }, []);

  useGSAP(
    () => {
      if (!show || !rootRef.current) return;

      const chars = gsap.utils.toArray<HTMLElement>(".capsule-preloader-char");
      const lines = gsap.utils.toArray<HTMLElement>(".capsule-preloader-line");

      gsap.set(chars, { xPercent: 100 });
      gsap.set(lines, { yPercent: 100 });
      gsap.set(".capsule-preloader-bar", { scaleX: 0 });

      const progress = () => {
        const tl = gsap.timeline();
        const steps = 3;
        let current = 0;

        for (let i = 0; i < steps; i++) {
          const target =
            i === steps - 1 ? 1 : Math.min(current + Math.random() * 0.3 + 0.1, 0.9);
          current = target;
          tl.to(".capsule-preloader-bar", {
            scaleX: target,
            duration: 1.1,
            ease: "power3.out",
          });
        }

        return tl;
      };

      const tl = gsap.timeline({
        delay: 0.35,
        onComplete: () => {
          sessionStorage.setItem("balitech-capsule-preloader", "1");
          setShow(false);
        },
      });

      tl.to(chars, {
        xPercent: 0,
        stagger: 0.05,
        duration: 0.9,
        ease: "power4.inOut",
      })
        .to(
          lines,
          {
            yPercent: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power4.inOut",
          },
          0.2
        )
        .add(progress(), "<")
        .to(chars, {
          xPercent: -100,
          stagger: 0.05,
          duration: 0.9,
          ease: "power4.inOut",
        })
        .to(
          lines,
          {
            yPercent: -100,
            stagger: 0.08,
            duration: 0.45,
            ease: "power4.inOut",
          },
          "-=0.15"
        )
        .to(
          ".capsule-preloader-progress",
          { opacity: 0, duration: 0.6, ease: "power3.out" },
          "-=0.1"
        )
        .to(
          ".capsule-preloader-mask",
          { scale: 6, duration: 3.2, ease: "power3.out" },
          "<"
        )
        .to(
          ".capsule-preloader-mask",
          { opacity: 0, duration: 0.5 },
          "-=0.4"
        );
    },
    { scope: rootRef, dependencies: [show] }
  );

  if (!mounted || !show) return null;

  return (
    <div
      ref={rootRef}
      className="capsule-preloader pointer-events-none fixed inset-0 z-[45]"
      aria-hidden
    >
      <div className="capsule-preloader-progress">
        <div className="capsule-preloader-bar" />
        <div className="capsule-preloader-logo">
          <h1>
            {BRAND.split("").map((char, i) => (
              <span key={i} className="capsule-preloader-char inline-block">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1>
        </div>
      </div>

      <div className="capsule-preloader-mask" />

      <div className="capsule-preloader-content">
        <div className="capsule-preloader-footer">
          <p>
            <span className="capsule-preloader-line block">
              Bali Tech Pvt. Ltd — Outsourcing &amp; telemarketing
            </span>
            <span className="capsule-preloader-line block">
              technology solutions from Rawalpindi.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
