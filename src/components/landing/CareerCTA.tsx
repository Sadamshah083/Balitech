"use client";

import AnimatedTitle from "@/components/animations/AnimatedTitle";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const { career } = companyContent;

export default function CareerCTA() {
  return (
    <section id="join-us" className="relative py-32">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${siteImages.career}')` }}
      />
      <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px]" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <AnimatedTitle containerClass="mx-auto max-w-3xl !text-foreground">
          {career.title}
        </AnimatedTitle>
        <p className="mb-8 mt-6 text-muted">
          {career.description}
        </p>
        <p className="mb-8 text-sm font-semibold text-orange sm:text-base">
          {career.salary}
        </p>
        <a
          href="/join-us#contact"
          className="btn-primary inline-block rounded-full px-10 py-4 text-base font-bold uppercase tracking-wider text-on-primary"
        >
          Join Us
        </a>
      </div>
    </section>
  );
}
