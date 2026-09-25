"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient light that drifts across the page as you scroll — a bright ribbon
 * plus two soft blooms, spanning hero to footer.
 *
 * It is deliberately inert: `pointer-events: none` and `aria-hidden` mean it
 * can never intercept a click or reach a screen reader, and the scroll handler
 * only ever writes one custom property, so nothing here can shift layout.
 *
 * The property holds scroll progress (0 at the top of the document, 1 at the
 * bottom) and CSS interpolates every transform from it. Keeping the maths in
 * CSS means the handler stays a single style write per frame.
 */
export default function ScrollAtmosphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const sync = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      node.style.setProperty("--atmo-progress", `${Math.min(Math.max(progress, 0), 1)}`);
    };

    /* Coalesce to one write per frame: scroll fires far more often than the
       compositor can paint, and every extra write is a wasted recalc. */
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="atmo" aria-hidden>
      <span className="atmo__bloom atmo__bloom--warm" />
      <span className="atmo__bloom atmo__bloom--cool" />
      <span className="atmo__beam" />
      <span className="atmo__beam atmo__beam--trail" />
    </div>
  );
}
