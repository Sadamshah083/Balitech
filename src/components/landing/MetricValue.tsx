"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Matches the previous GSAP tween duration. */
const COUNT_UP_MS = 1800;

type ParsedMetric = {
  isNumeric: boolean;
  target: number;
  suffix: string;
  text: string;
};

function parseMetricValue(value: string): ParsedMetric {
  const plusMatch = value.match(/^(\d+)\+$/);
  if (plusMatch) {
    return {
      isNumeric: true,
      target: Number(plusMatch[1]),
      suffix: "+",
      text: value,
    };
  }

  const slashMatch = value.match(/^(\d+)(\/\d+)$/);
  if (slashMatch) {
    return {
      isNumeric: true,
      target: Number(slashMatch[1]),
      suffix: slashMatch[2],
      text: value,
    };
  }

  return { isNumeric: false, target: 0, suffix: "", text: value };
}

/** Count-up island — keeps lucide + content.ts off this client chunk. */
export default function MetricValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const frame = useRef(0);
  const parsed = useMemo(() => parseMetricValue(value), [value]);
  const [display, setDisplay] = useState(parsed.text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const runAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      if (!parsed.isNumeric) {
        el.animate([{ opacity: 0.35 }, { opacity: 1 }], {
          duration: 600,
          easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        });
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDisplay(parsed.text);
        return;
      }

      setDisplay(`0${parsed.suffix}`);

      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / COUNT_UP_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(`${Math.round(parsed.target * eased)}${parsed.suffix}`);
        if (t < 1) frame.current = requestAnimationFrame(step);
      };

      frame.current = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [parsed]);

  return (
    <span ref={ref} className="trust-strip__value">
      {display}
    </span>
  );
}
