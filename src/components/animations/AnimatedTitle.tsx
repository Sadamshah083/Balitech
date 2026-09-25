"use client";

import { Fragment, PropsWithChildren, useRef } from "react";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import { cn } from "@/lib/cn";
import { useLazyGsap } from "@/lib/use-lazy-gsap";

type AnimatedTitleProps = {
  containerClass?: string;
};

export default function AnimatedTitle({
  children,
  containerClass,
}: PropsWithChildren<AnimatedTitleProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLazyGsap(({ gsap }) => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "100 bottom",
          end: "center bottom",
          toggleActions: "play none none reverse",
        },
      })
      .to(".animated-word", {
        opacity: 1,
        transform: "translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)",
        ease: "power2.inOut",
        stagger: 0.02,
      });
  }, containerRef);

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

              /* The flex gap does the visual spacing; the text space keeps the
                 heading reading as words for crawlers and screen readers. */
              return (
                <Fragment key={`${line}-${word}-${index}`}>
                  {index > 0 && " "}
                  <span className="animated-word">
                    {isLast ? (
                      <span className="heading-last-word">
                        {word}
                        <HeadingBrush />
                      </span>
                    ) : (
                      word
                    )}
                  </span>
                </Fragment>
              );
            })}
          </h2>
        );
      })}
    </div>
  );
}
