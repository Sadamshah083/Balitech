"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { companyContent } from "@/lib/content";
import { gsap, registerGsap } from "@/lib/gsap-register";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import { cn } from "@/lib/cn";

const { achievements } = companyContent;

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

  return {
    isNumeric: false,
    target: 0,
    suffix: "",
    text: value,
  };
}

function initialDisplay(parsed: ParsedMetric) {
  if (!parsed.isNumeric) return parsed.text;
  return `0${parsed.suffix}`;
}

function MetricValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const parsed = useMemo(() => parseMetricValue(value), [value]);
  const [display, setDisplay] = useState(() => initialDisplay(parsed));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const runAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      registerGsap();

      if (!parsed.isNumeric) {
        gsap.fromTo(el, { opacity: 0.35 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDisplay(parsed.text);
        return;
      }

      setDisplay(initialDisplay(parsed));

      const counter = { val: 0 };
      gsap.to(counter, {
        val: parsed.target,
        duration: 2.1,
        ease: "power2.out",
        onUpdate: () => {
          setDisplay(`${Math.round(counter.val)}${parsed.suffix}`);
        },
      });
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
    return () => observer.disconnect();
  }, [parsed]);

  return (
    <span ref={ref} className="metrics-showcase__card-value">
      {display}
    </span>
  );
}

export default function Metrics() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      gsap.from(".metrics-showcase__card", {
        y: 20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.from(".metrics-showcase__underline span", {
        scaleX: 0,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".metrics-showcase__track-wrap",
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="metrics-showcase section-with-net"
      aria-labelledby="metrics-showcase-title"
    >
      <SectionAnimatedNet />

      <div className="metrics-showcase__inner">
        <header className="metrics-showcase__header">
          <span className="metrics-showcase__watermark" aria-hidden>
            {achievements.watermark}
          </span>
          <h2 id="metrics-showcase-title" className="metrics-showcase__title">
            <HeadingLastWord text={achievements.title} />
          </h2>
        </header>

        <div className="metrics-showcase__track-wrap">
          <div className="metrics-showcase__track">
            {achievements.stats.map((stat, index) => (
              <article
                key={stat.label}
                className={cn(
                  "metrics-showcase__card",
                  `metrics-showcase__card--step-${index}`
                )}
              >
                <span className="metrics-showcase__card-label">{stat.label}</span>
                <MetricValue value={stat.value} />
              </article>
            ))}
          </div>
          <div className="metrics-showcase__underlines metrics-showcase__underline" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
