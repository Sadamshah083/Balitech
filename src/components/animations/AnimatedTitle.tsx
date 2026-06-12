"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import { cn } from "@/lib/cn";
import { gsap, registerGsap } from "@/lib/gsap-register";

type AnimatedTitleProps = {
  containerClass?: string;
};

export default function AnimatedTitle({
  children,
  containerClass,
}: PropsWithChildren<AnimatedTitleProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "100 bottom",
          end: "center bottom",
          toggleActions: "play none none reverse",
        },
      }).to(".animated-word", {
        opacity: 1,
        transform: "translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)",
        ease: "power2.inOut",
        stagger: 0.02,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const text = children?.toString() ?? "";

  return (
    <div ref={containerRef} className={cn("animated-title", containerClass)}>
      {text.split("<br />").map((line) => {
        const words = line.trim().split(/\s+/).filter(Boolean);

        return (
          <h2
            key={line}
            className="flex flex-wrap items-end justify-center gap-x-2 gap-y-1 px-4 md:gap-x-3"
          >
            {words.map((word, index) => {
              const isLast = index === words.length - 1;

              return (
                <span key={`${line}-${word}`} className="animated-word">
                  {isLast ? (
                    <span className="heading-last-word">
                      {word}
                      <HeadingBrush />
                    </span>
                  ) : (
                    word
                  )}
                </span>
              );
            })}
          </h2>
        );
      })}
    </div>
  );
}
