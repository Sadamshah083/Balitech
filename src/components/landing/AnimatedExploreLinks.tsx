"use client";

import IntentLink from "@/components/navigation/IntentLink";
import { useRef } from "react";
import { useLazyGsap } from "@/lib/use-lazy-gsap";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";

const links = [
  { href: "/our-team", label: "Our Growth" },
  { href: "/gallery", label: "Gallery" },
  { href: "/our-offices", label: "Our Offices" },
];

export default function AnimatedExploreLinks() {
  const sectionRef = useRef<HTMLElement>(null);

  useLazyGsap(
    ({ gsap }) => {
      gsap.from(".explore-link-item", {
        y: 32,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.fromTo(
        ".explore-links-section__rule",
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    sectionRef
  );

  return (
    <section ref={sectionRef} className="explore-links-section section-with-net">
      <SectionAnimatedNet />

      <div className="explore-links-section__rule explore-links-section__rule--top" aria-hidden />

      <div className="explore-links-section__inner">
        {links.map((item) => (
          <div key={item.href} className="explore-link-item">
            <IntentLink href={item.href} className="explore-link">
              <span className="explore-link__text">
                Explore {item.label} <span aria-hidden>→</span>
              </span>
              <HeadingBrush className="explore-link__brush" />
            </IntentLink>
          </div>
        ))}
      </div>

      <div className="explore-links-section__rule explore-links-section__rule--bottom" aria-hidden />
    </section>
  );
}
