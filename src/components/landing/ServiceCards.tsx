"use client";

import Link from "next/link";
import { ArrowRight, Clock, Headphones, Users } from "lucide-react";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import { companyContent } from "@/lib/content";

const { services } = companyContent;
const serviceIcons = [Clock, Headphones, Users];

export default function ServiceCards() {
  return (
    <section
      id="services"
      className="services-showcase section-with-net"
      aria-labelledby="services-showcase-title"
    >
      <SectionAnimatedNet />

      <div className="services-showcase__inner">
        <header className="services-showcase__header">
          <p className="services-showcase__eyebrow brand-label">
            {services.label}
          </p>
          <span className="services-showcase__watermark" aria-hidden>
            Services
          </span>
          <h2 id="services-showcase-title" className="services-showcase__title">
            {services.title.replace(" Solutions", "")}{" "}
            <span className="services-showcase__highlight heading-last-word">
              Solutions
              <HeadingBrush />
            </span>
          </h2>
        </header>

        <div className="services-showcase__cards">
          {services.cards.map((service, index) => {
            const Icon = serviceIcons[index];

            return (
              <article key={service.title} className="services-showcase__card">
                <div className="services-showcase__card-top">
                  <span className="services-showcase__card-num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="services-showcase__card-icon" aria-hidden>
                    <Icon size={20} strokeWidth={1.65} />
                  </span>
                </div>

                <div className="services-showcase__card-divider" aria-hidden />

                <h3 className="services-showcase__card-title">
                  {service.title}
                </h3>
                <p className="services-showcase__card-text">
                  {service.description}
                </p>

                <div className="services-showcase__card-footer">
                  <Link
                    href="/services"
                    className="services-showcase__card-link"
                  >
                    Read More
                    <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
