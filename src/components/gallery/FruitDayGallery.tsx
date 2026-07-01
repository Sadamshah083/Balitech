"use client";

import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const { about } = companyContent;
const { videos } = siteImages.aboutCollage;

export default function FruitDayGallery() {
  return (
    <section
      className="fruit-day-gallery section-with-net py-14 lg:py-16"
      aria-labelledby="fruit-day-gallery-title"
    >
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="fruit-day-gallery__header">
          <p className="brand-label mb-3">{about.collageSwipeLabel}</p>
          <h2 id="fruit-day-gallery-title" className="fruit-day-gallery__title">
            Fruit Day Highlights
          </h2>
          <p className="fruit-day-gallery__intro">
            Moments from BALITECH Fruit Day celebrations — team activities,
            prizes, and summer festivities.
          </p>
        </header>

        <div className="fruit-day-gallery__video-wrap">
          <video
            className="fruit-day-gallery__video"
            src={videos.fruitDayCommercial.src}
            controls
            playsInline
            preload="metadata"
            aria-label={videos.fruitDayCommercial.label}
          />
        </div>
      </div>
    </section>
  );
}
