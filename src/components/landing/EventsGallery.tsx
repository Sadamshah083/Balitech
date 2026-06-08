"use client";

import Link from "next/link";
import Image from "next/image";
import BentoTilt from "@/components/animations/BentoTilt";
import TiltImage from "@/components/animations/TiltImage";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import RoundedCorners from "@/components/animations/RoundedCorners";
import { siteImages } from "@/lib/images";

const events = [
  {
    title: "Annual Dinner",
    image: siteImages.gallery.main,
    large: true,
  },
  {
    title: "Award Ceremony",
    image: siteImages.gallery.events[0],
  },
  {
    title: "Team Building",
    image: siteImages.gallery.events[1],
  },
  {
    title: "Training Day",
    image: siteImages.gallery.events[2],
  },
];

export default function EventsGallery() {
  return (
    <section id="gallery" className="section-gradient py-20">
      <RoundedCorners />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <AnimatedTitle containerClass="!text-left sm:max-w-xl">
            Honoring Employee Excellence And Performance
          </AnimatedTitle>
          <Link
            href="/gallery"
            className="shrink-0 rounded-full border border-orange px-6 py-2 text-sm font-semibold uppercase tracking-wider text-orange transition hover:bg-orange hover:text-on-primary"
          >
            View More
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <BentoTilt className="md:row-span-2">
            <div className="story-img-container relative h-[300px] md:h-[500px]">
              <div className="story-img-mask glow-border h-full overflow-hidden rounded-2xl">
                <div className="story-img-content relative h-[300px] w-full md:h-[500px]">
                  <TiltImage
                    src={events[0].image}
                    alt={events[0].title}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="h-full w-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                    <p className="text-lg font-bold uppercase tracking-wider text-white">
                      {events[0].title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BentoTilt>

          {events.slice(1).map((event) => (
            <BentoTilt key={event.title}>
              <div className="relative overflow-hidden rounded-2xl glow-border">
                <Image
                  src={event.image}
                  alt={event.title}
                  width={600}
                  height={400}
                  className="h-48 w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
                  <p className="font-semibold text-white">{event.title}</p>
                </div>
              </div>
            </BentoTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
