"use client";

import Image from "next/image";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

const topPerformanceImage = (filename: string) =>
  `/awards/Top performance/${filename}`;

const topPerformers = [
  "Max Marshall",
  "Steve Henely",
  "Mark Edward",
  "James Wilson",
  "Bryan Morries",
  "Kevin Brown",
  "Sarah Smith",
  "John Harris",
  "Michael Davis",
  "David Brown",
  "Anna Methew",
  "Bryan Morries 1",
  "Kevin Smith",
] as const;

const performers = topPerformers.map((name) => ({
  id: name,
  name,
  image: topPerformanceImage(`${name}.webp`),
}));

export default function TopPerformers() {
  return (
    <section id="team" className="top-performers-growth section-gradient section-with-net py-20">
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="brand-label mb-4">Our Growth</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            Celebrating Our Top Performers In 2025
          </AnimatedTitle>
        </div>

        <div className="top-performers-growth__grid">
          {performers.map((performer) => (
            <article key={performer.id} className="top-performer-card">
              <div className="top-performer-card__image-wrap">
                <Image
                  src={performer.image}
                  alt={performer.name}
                  width={1440}
                  height={1800}
                  className="top-performer-card__image"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <p className="top-performer-card__name">{performer.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
