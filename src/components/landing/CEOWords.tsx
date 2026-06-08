"use client";

import Image from "next/image";
import { Quote } from "lucide-react";
import BentoTilt from "@/components/animations/BentoTilt";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import { companyContent } from "@/lib/content";

const { ceo } = companyContent;
const featuredQuote = ceo.quotes[0];
const otherQuotes = ceo.quotes.slice(1);

export default function CEOWords() {
  return (
    <section id="ceo" className="section-gradient py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="brand-label mb-4">{ceo.label}</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            {ceo.sectionTitle}
          </AnimatedTitle>
        </div>

        <BentoTilt className="mb-6">
          <div className="glow-border overflow-hidden rounded-2xl">
            <div className="grid md:grid-cols-2">
              <div className="relative h-72 md:h-auto md:min-h-[380px]">
                <Image
                  src={ceo.image}
                  alt={`${ceo.name}, ${ceo.title} of ${ceo.company}`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-6 pb-6 pt-16">
                  <p className="text-xl font-bold text-foreground md:text-2xl">
                    {ceo.name}
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wider text-orange">
                    {ceo.shortTitle} — {ceo.title}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted">
                    {ceo.company}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center bg-card p-8 md:p-12">
                <Quote
                  size={32}
                  className="mb-4 text-orange/60"
                  aria-hidden
                />
                <blockquote className="text-lg font-medium leading-relaxed text-foreground/90 md:text-xl">
                  &ldquo;{featuredQuote.text}&rdquo;
                </blockquote>
                {featuredQuote.attribution && (
                  <p className="mt-6 text-sm font-bold uppercase tracking-wider text-orange">
                    — {ceo.shortTitle} {ceo.name}, {ceo.title}
                  </p>
                )}
              </div>
            </div>
          </div>
        </BentoTilt>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {otherQuotes.map((quote) => (
            <BentoTilt key={quote.text}>
              <div className="glow-border flex h-full flex-col rounded-2xl bg-card p-6">
                <Quote
                  size={20}
                  className="mb-3 text-orange/50"
                  aria-hidden
                />
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/85">
                  &ldquo;{quote.text}&rdquo;
                </blockquote>
                {quote.attribution && (
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-orange">
                    — {ceo.shortTitle} {ceo.name}
                  </p>
                )}
              </div>
            </BentoTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
