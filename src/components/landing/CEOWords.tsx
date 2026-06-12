"use client";

import Image from "next/image";
import { Quote } from "lucide-react";
import BentoTilt from "@/components/animations/BentoTilt";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { companyContent } from "@/lib/content";

const { ceo } = companyContent;
const [featuredGroup, ...otherGroups] = ceo.quoteGroups;

export default function CEOWords() {
  return (
    <section id="ceo" className="section-gradient section-with-net pt-14 pb-8">
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="brand-label mb-4">{ceo.label}</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            {ceo.sectionTitle}
          </AnimatedTitle>
        </div>

        <BentoTilt className="mb-6">
          <div className="glow-border overflow-hidden rounded-2xl">
            <div className="grid md:grid-cols-2">
              <div className="relative h-80 md:h-auto md:min-h-[420px]">
                <Image
                  src={ceo.image}
                  alt={`${ceo.name}, ${ceo.title} of ${ceo.company}`}
                  fill
                  className="object-cover object-[center_20%]"
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
                <Quote size={32} className="mb-4 text-orange/60" aria-hidden />
                <div className="space-y-4">
                  {featuredGroup.lines.map((line) => (
                    <blockquote
                      key={line}
                      className="text-lg font-medium leading-relaxed text-foreground/90 md:text-xl"
                    >
                      &ldquo;{line}&rdquo;
                    </blockquote>
                  ))}
                </div>
                <p className="mt-6 text-sm font-bold uppercase tracking-wider text-orange">
                  — {ceo.shortTitle} {ceo.name}
                </p>
              </div>
            </div>
          </div>
        </BentoTilt>

        <div className="grid gap-6 lg:grid-cols-2">
          {otherGroups.map((group) => (
            <BentoTilt key={group.lines[0]}>
              <div className="glow-border flex h-full flex-col rounded-2xl bg-card p-6 md:p-8">
                <Quote size={20} className="mb-4 text-orange/50" aria-hidden />
                <div className="flex flex-1 flex-col gap-4">
                  {group.lines.map((line) => (
                    <blockquote
                      key={line}
                      className="text-sm leading-relaxed text-foreground/85 md:text-base"
                    >
                      &ldquo;{line}&rdquo;
                    </blockquote>
                  ))}
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-wider text-orange">
                  — {ceo.shortTitle} {ceo.name}
                </p>
              </div>
            </BentoTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
