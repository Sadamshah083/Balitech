"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap-register";

const links = [
  { href: "/our-team", label: "Our Team" },
  { href: "/gallery", label: "Gallery" },
  { href: "/press-release", label: "Press Release" },
  { href: "/our-offices", label: "Our Offices" },
];

export default function AnimatedExploreLinks() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();

      gsap.from(".explore-link-item", {
        y: 32,
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="py-12">
      <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4 px-4 sm:px-6 lg:px-8">
        {links.map((item) => (
          <div key={item.href} className="explore-link-item">
            <Link
              href={item.href}
              className="inline-block rounded-full border border-orange/50 px-6 py-3 text-sm font-bold text-orange transition hover:scale-105 hover:bg-orange hover:text-on-primary hover:shadow-[0_0_24px_var(--orange-glow)]"
            >
              Explore {item.label} →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
