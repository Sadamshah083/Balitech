"use client";

import { useEffect, useRef, useState } from "react";

type AnimateSectionProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

/**
 * Scroll-reveal wrapper. Deliberately hand-rolled: this sits around most
 * sections on most pages, and pulling framer-motion in for a fade-up cost more
 * JavaScript than the rest of the page combined. An IntersectionObserver plus a
 * CSS transition is a few hundred bytes and animates on the compositor.
 */
export default function AnimateSection({
  children,
  delay = 0,
  className = "",
}: AnimateSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isArmed, setIsArmed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
          return;
        }

        /* Off screen on the first callback, so it is safe to hide it and fade
           it in when it is scrolled to — nobody can see it become hidden.
           Sections already on screen skip this entirely and stay painted, which
           is what keeps the first screen visible from the very first frame.

           The decision comes from the observer rather than a getBoundingClientRect
           on mount so that arming a dozen sections costs no forced layout. */
        setIsArmed(true);
      },
      { rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-up${isArmed ? " is-armed" : ""}${
        isVisible ? " is-visible" : ""
      }${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
