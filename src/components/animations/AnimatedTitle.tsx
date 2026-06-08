"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
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
      {text.split("<br />").map((line) => (
        <h2
          key={line}
          className="flex flex-wrap items-center justify-center gap-2 px-4 md:gap-3"
        >
          {line.split(" ").map((word) => (
            <span key={`${line}-${word}`} className="animated-word">
              {word}
            </span>
          ))}
        </h2>
      ))}
    </div>
  );
}
