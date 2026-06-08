"use client";

import Link from "next/link";
import { Clock, Headphones, Users } from "lucide-react";
import BentoTilt from "@/components/animations/BentoTilt";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import { companyContent } from "@/lib/content";

const { services } = companyContent;
const serviceIcons = [Clock, Headphones, Users];

export default function ServiceCards() {
  return (
    <section id="services" className="section-gradient py-20">
      <div className="mx-auto mb-14 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="brand-label mb-4">{services.label}</p>
        <AnimatedTitle containerClass="mx-auto max-w-4xl">
          {services.title}
        </AnimatedTitle>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6 lg:px-8">
        {services.cards.map((service, index) => (
          <BentoTilt key={service.title}>
            <article className="glow-border group flex h-full flex-col rounded-2xl bg-card p-8 transition-colors duration-300">
              <div className="brand-icon-wrap mb-6 inline-flex rounded-xl p-4">
                {(() => {
                  const Icon = serviceIcons[index];
                  return <Icon size={32} />;
                })()}
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">
                {service.title}
              </h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-muted">
                {service.description}
              </p>
              <Link
                href="/services"
                className="text-sm font-semibold uppercase tracking-wider text-orange transition hover:text-orange-light"
              >
                Read More →
              </Link>
            </article>
          </BentoTilt>
        ))}
      </div>
    </section>
  );
}
