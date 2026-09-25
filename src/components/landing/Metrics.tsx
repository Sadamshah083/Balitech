"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  Globe2,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { companyContent } from "@/lib/content";

const { achievements } = companyContent;

/** Matches the previous GSAP tween duration. */
const COUNT_UP_MS = 1800;

/** One icon per stat, in the order the stats are declared. */
const statIcons: LucideIcon[] = [Users, Clock, TrendingUp, Globe2];

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

function MetricValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const frame = useRef(0);
  const parsed = useMemo(() => parseMetricValue(value), [value]);
  // Starts at the real figure so server-rendered HTML (and crawlers) read
  // "750+" rather than "0+". The count-up resets it once JS takes over.
  const [display, setDisplay] = useState(parsed.text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // A hand-rolled tween: this used to pull the whole of GSAP onto the
    // critical path of the home page purely to count four numbers upward.
    const runAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      if (!parsed.isNumeric) {
        el.animate(
          [{ opacity: 0.35 }, { opacity: 1 }],
          { duration: 600, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }
        );
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

/**
 * Home page only: the proof bar directly under the hero. Deliberately quiet —
 * it is a credibility check on the way to the solutions grid, not a feature.
 */
export default function Metrics() {
  return (
    <section className="trust-strip" aria-label={achievements.label}>
      <div className="ent-shell">
        <ul className="trust-strip__row">
          {achievements.stats.map((stat, index) => {
            const Icon = statIcons[index] ?? Users;

            return (
              <li key={stat.label} className="trust-strip__item">
                <span className="trust-strip__icon" aria-hidden>
                  <Icon size={19} strokeWidth={1.7} />
                </span>
                <div className="trust-strip__text">
                  <p className="trust-strip__value-wrap">
                    <MetricValue value={stat.value} />
                  </p>
                  <p className="trust-strip__label">{stat.label}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
