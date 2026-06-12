"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { companyContent } from "@/lib/content";
import { joinUsHref } from "@/lib/navigation";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { siteImages } from "@/lib/images";

const { career } = companyContent;

export default function CareerCTA() {
  return (
    <section id="join-us" className="career-cta-section section-with-net" aria-labelledby="career-cta-title">
      <SectionAnimatedNet />
      <div className="career-cta-section__wrap">
        <article className="career-cta-card">
          <div
            className="career-cta-card__media"
            style={{ backgroundImage: `url('${siteImages.career}')` }}
            aria-hidden
          />

          <div className="career-cta-card__ring" aria-hidden />
          <div className="career-cta-card__ring career-cta-card__ring--inner" aria-hidden />

          <div className="career-cta-card__content">
            <h2 id="career-cta-title" className="career-cta-card__title">
              {career.titleLine}{" "}
              <span className="career-cta-card__highlight">
                {career.titleHighlight}
                <span className="career-cta-card__brush" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            </h2>

            <p className="career-cta-card__text">{career.description}</p>

            <Link href={`${joinUsHref}#apply`} className="career-cta-card__btn">
              {career.cta}
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
