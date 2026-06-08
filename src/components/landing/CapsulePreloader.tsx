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
      gsap.set(".capsule-preloader-lamp-cone", { scaleY: 0, opacity: 0 });
      gsap.set(".capsule-preloader-lamp-pool", { scale: 0.3, opacity: 0 });
      gsap.set(".capsule-preloader-lamp-shade-glow", { opacity: 0.1 });
      gsap.set(".capsule-preloader-lamp-bulb", { opacity: 0.15, scale: 0.85 });

      const progress = () => {
        const tl = gsap.timeline();
        const steps = 3;
        let current = 0;

        for (let i = 0; i < steps; i++) {
          const target =
            i === steps - 1 ? 1 : Math.min(current + Math.random() * 0.3 + 0.1, 0.9);
          current = target;

          tl.to(
            ".capsule-preloader-lamp-cone",
            {
              scaleY: target,
              opacity: 0.2 + target * 0.75,
              duration: 1.1,
              ease: "power3.out",
            },
            "<"
          )
            .to(
              ".capsule-preloader-lamp-pool",
              {
                scale: 0.3 + target * 0.95,
                opacity: 0.2 + target * 0.8,
                duration: 1.1,
                ease: "power3.out",
              },
              "<"
            )
            .to(
              ".capsule-preloader-lamp-shade-glow",
              { opacity: 0.1 + target * 0.9, duration: 1.1, ease: "power2.out" },
              "<"
            )
            .to(
              ".capsule-preloader-lamp-bulb",
              {
                opacity: 0.15 + target * 0.85,
                scale: 0.85 + target * 0.15,
                duration: 1.1,
                ease: "power2.out",
              },
              "<"
            );
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
          ".capsule-preloader-lamp",
          { opacity: 0, duration: 0.6, ease: "power3.out" },
          "-=0.1"
        )
        .to(
          ".capsule-preloader-mask",
          { scale: 6, duration: 3.2, ease: "power3.out" },
          "<"
        )
        .to(".capsule-preloader-mask", { opacity: 0, duration: 0.5 }, "-=0.4");
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
        <div className="capsule-preloader-lamp" aria-hidden>
          <div className="capsule-preloader-lamp-cone" />

          <div className="capsule-preloader-lamp-body">
            <div className="capsule-preloader-lamp-shade">
              <div className="capsule-preloader-lamp-shade-outer" />
              <div className="capsule-preloader-lamp-shade-inner" />
              <div className="capsule-preloader-lamp-shade-rim" />
              <div className="capsule-preloader-lamp-shade-glow" />
              <div className="capsule-preloader-lamp-bulb" />
            </div>

            <div className="capsule-preloader-lamp-harp" />

            <div className="capsule-preloader-lamp-pole">
              <div className="capsule-preloader-lamp-pole-shine" />
            </div>

            <div className="capsule-preloader-lamp-base">
              <div className="capsule-preloader-lamp-base-top" />
              <div className="capsule-preloader-lamp-base-foot" />
            </div>
          </div>

          <div className="capsule-preloader-lamp-pool" />
        </div>

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
