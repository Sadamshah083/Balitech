"use client";

import BentoTilt from "@/components/animations/BentoTilt";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import { companyContent } from "@/lib/content";

const { achievements } = companyContent;

export default function Metrics() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="brand-label mb-4">{achievements.label}</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            {achievements.title}
          </AnimatedTitle>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.stats.map((stat) => (
            <BentoTilt key={stat.label}>
              <div className="glow-border rounded-2xl bg-card p-8 text-center">
                <p className="text-4xl font-bold text-orange md:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm uppercase tracking-wider text-muted">
                  {stat.label}
                </p>
              </div>
            </BentoTilt>
          ))}
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2">
          {achievements.highlights.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-muted"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
              {item}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm font-semibold text-orange sm:text-base">
          {companyContent.career.salary}
        </p>
      </div>
    </section>
  );
}
