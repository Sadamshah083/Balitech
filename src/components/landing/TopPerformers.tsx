"use client";

import Image from "next/image";
import BentoTilt from "@/components/animations/BentoTilt";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { siteImages } from "@/lib/images";

const performers = [
  {
    name: "Sarah Ahmed",
    metric: "960,500",
    label: "Calls Handled",
    image: siteImages.performers.featured,
    featured: true,
  },
  {
    name: "Ali Khan",
    metric: "768,000",
    label: "Sales Generated",
    image: siteImages.performers.team[0],
  },
  {
    name: "Fatima Noor",
    metric: "542,300",
    label: "Leads Converted",
    image: siteImages.performers.team[1],
  },
  {
    name: "Hassan Raza",
    metric: "489,100",
    label: "Support Tickets",
    image: siteImages.performers.team[2],
  },
];

export default function TopPerformers() {
  const featured = performers.find((p) => p.featured)!;
  const others = performers.filter((p) => !p.featured);

  return (
    <section id="team" className="section-gradient section-with-net py-20">
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="brand-label mb-4">Our Team</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            Celebrating Our Top Performers In 2025
          </AnimatedTitle>
        </div>

        <BentoTilt className="mb-6">
          <div className="glow-border overflow-hidden rounded-2xl">
            <div className="grid md:grid-cols-2">
              <div className="relative h-64 md:h-auto md:min-h-[320px]">
                <Image
                  src={featured.image}
                  alt={featured.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-col justify-center bg-card p-8 md:p-12">
                <p className="text-5xl font-bold text-orange md:text-6xl">
                  {featured.metric}
                </p>
                <p className="mt-2 text-sm uppercase tracking-wider text-muted">
                  {featured.label}
                </p>
                <p className="mt-4 text-2xl font-bold text-foreground">
                  {featured.name}
                </p>
              </div>
            </div>
          </div>
        </BentoTilt>

        <div className="grid gap-6 sm:grid-cols-3">
          {others.map((performer) => (
            <BentoTilt key={performer.name}>
              <div className="glow-border h-full overflow-hidden rounded-2xl bg-card">
                <div className="relative h-48">
                  <Image
                    src={performer.image}
                    alt={performer.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <p className="text-3xl font-bold text-orange">
                    {performer.metric}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-muted">
                    {performer.label}
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {performer.name}
                  </p>
                </div>
              </div>
            </BentoTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
