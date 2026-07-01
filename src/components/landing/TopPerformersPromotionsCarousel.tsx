"use client";

import Image from "next/image";
import { useState } from "react";
import type { AwardItem } from "@/components/landing/AwardDistribution";

function BonusAchieverCard({ item }: { item: AwardItem }) {
  const isRemote = item.image.startsWith("http");
  const isSquarePoster = item.image.includes("/aca-verifiers/");

  return (
    <article
      className={`bonus-instagram-card bonus-instagram-card--cflow gallery-device gallery-device--phone gallery-phone-card${
        isSquarePoster ? " bonus-instagram-card--square-poster" : ""
      }`}
    >
      <div className="gallery-device__shell gallery-phone bonus-instagram-card__shell">
        <div
          className="gallery-device__screen gallery-phone__screen bonus-instagram-card__screen"
          style={
            { "--video-aspect": isSquarePoster ? 1 : 9 / 16 } as React.CSSProperties
          }
        >
          <Image
            src={item.image}
            alt={item.alt ?? item.title}
            fill
            unoptimized={isRemote}
            sizes="(max-width: 767px) 320px, 520px"
            className={`bonus-instagram-card__image ${
              isSquarePoster ? "object-cover" : "object-contain"
            }`}
          />
        </div>
      </div>
      <p className="gallery-device__title bonus-instagram-card__name">{item.title}</p>
    </article>
  );
}

type TopPerformersPromotionsCarouselProps = {
  title?: string;
  subtitle?: string;
  items: AwardItem[];
};

export default function TopPerformersPromotionsCarousel({
  title = "Top Performers & Promotions",
  subtitle = "Bonus achievers and career milestones at BALITECH",
  items,
}: TopPerformersPromotionsCarouselProps) {
  const [paused, setPaused] = useState(false);
  const count = items.length;

  if (count === 0) return null;

  return (
    <div className="bonus-achievers-block bonus-achievers-block--fullbleed top-performers-carousel">
      <div className="bonus-achievers-block__header">
        <h3 id="top-performers-title" className="bonus-achievers-block__title">
          {title}
        </h3>
        <p className="bonus-achievers-block__subtitle">{subtitle}</p>
      </div>

      <div
        className="tp-3d-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="tp-3d-scene">
          <div
            className={`tp-3d-ring${paused ? " is-paused" : ""}`}
            style={{ "--tp-n": count } as React.CSSProperties}
            aria-live="polite"
            aria-label="Top performers and promotions carousel"
          >
            {items.map((item, index) => (
              <div
                key={item.id}
                className="tp-3d-card"
                style={{ "--tp-i": index } as React.CSSProperties}
              >
                <BonusAchieverCard item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
