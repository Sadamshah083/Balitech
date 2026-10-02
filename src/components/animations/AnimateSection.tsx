"use client";

import { useEffect, useRef } from "react";

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
 *
 * Class toggles go straight on the DOM node so eight wrappers do not each force
 * a React re-render during the load window.
 */
export default function AnimateSection({
  children,
  delay = 0,
  className = "",
}: AnimateSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.classList.add("is-visible");
          el.classList.remove("is-armed");
          observer.disconnect();
          return;
        }

        /* Off screen on the first callback, so it is safe to hide it and fade
           it in when it is scrolled to — nobody can see it become hidden.
           Sections already on screen skip this entirely and stay painted, which
           is what keeps the first screen visible from the very first frame.

           The decision comes from the observer rather than a getBoundingClientRect
           on mount so that arming a dozen sections costs no forced layout. */
        el.classList.add("is-armed");
      },
      { rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-up${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
