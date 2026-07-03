"use client";

import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { getCampaignApplyHref } from "@/lib/apply";
import { companyContent } from "@/lib/content";
import { getCampaignIcon } from "@/lib/icons";

const { programs } = companyContent;

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
};

function getCardsPerView(width: number) {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  if (width < 1280) return 3;
  return 4;
}

function CampaignCard({
  campaign,
  applyHref,
  location,
}: {
  campaign: Campaign;
  applyHref: string;
  location: string;
}) {
  const icon = getCampaignIcon(campaign.icon);
  const bullets = [
    campaign.description ?? "",
    ...programs.defaultRequirements,
  ].slice(0, 2);

  return (
    <article className="campaigns-carousel__card">
      <Link
        href={applyHref}
        className="campaign-job-card group/card"
        aria-label={`Apply for ${campaign.title} campaign`}
      >
        <span className="campaign-job-card__shade" aria-hidden />
        <span className="campaign-job-card__glow" aria-hidden />

        <div className="campaign-job-card__icon" aria-hidden>
          {createElement(icon, { size: 52, strokeWidth: 1.35 })}
        </div>

        <h3 className="campaign-job-card__title">{campaign.title}</h3>

        <p className="campaign-job-card__location">
          <MapPin size={14} className="campaign-job-card__pin" aria-hidden />
          {location}
        </p>

        <ul className="campaign-job-card__list">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <span className="campaign-job-card__apply">Apply Now</span>
      </Link>
    </article>
  );
}

function measureCarouselOffset(
  viewport: HTMLDivElement,
  track: HTMLDivElement,
  cardsPerView: number,
  activeIndex: number
) {
  const styles = getComputedStyle(track);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
  const paddingLeft = Number.parseFloat(styles.paddingLeft || "0") || 0;
  const paddingRight = Number.parseFloat(styles.paddingRight || "0") || 0;
  const viewportWidth = viewport.offsetWidth;
  const cardWidth = Math.max(
    240,
    (viewportWidth - paddingLeft - paddingRight - gap * (cardsPerView - 1)) /
      cardsPerView
  );

  viewport.style.setProperty("--campaign-card-width", `${cardWidth}px`);
  return activeIndex * (cardWidth + gap);
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [location, setLocation] = useState(programs.location);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [slideOffset, setSlideOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [campaignRes, officeRes] = await Promise.all([
          fetch("/api/campaigns?public=true"),
          fetch("/api/offices?public=true"),
        ]);

        if (campaignRes.ok) {
          const data = await campaignRes.json();
          if (data.campaigns?.length) {
            setCampaigns(data.campaigns);
          } else {
            setCampaigns(
              programs.items.map((item, index) => ({
                id: `program-${index}`,
                title: item.title,
                description: item.description,
                icon: item.icon,
              }))
            );
          }
        }

        if (officeRes.ok) {
          const data = await officeRes.json();
          const head =
            data.offices?.find(
              (office: { isHeadOffice: boolean }) => office.isHeadOffice
            ) ?? data.offices?.[0];
          if (head?.name) {
            setLocation(head.name);
          }
        }
      } catch {
        setCampaigns(
          programs.items.map((item, index) => ({
            id: `program-${index}`,
            title: item.title,
            description: item.description,
            icon: item.icon,
          }))
        );
      }
    }

    load();
  }, []);

  useEffect(() => {
    function updateCardsPerView() {
      setCardsPerView(getCardsPerView(window.innerWidth));
    }

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const displayCampaigns =
    campaigns.length > 0
      ? campaigns
      : programs.items.map((item, index) => ({
          id: `program-${index}`,
          title: item.title,
          description: item.description,
          icon: item.icon,
        }));

  const total = displayCampaigns.length;
  const maxIndex = Math.max(0, total - cardsPerView);
  const pageCount = maxIndex + 1;

  const clampedActiveIndex = Math.min(activeIndex, maxIndex);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) {
      setSlideOffset(0);
      return;
    }

    const update = () => {
      setSlideOffset(
        measureCarouselOffset(viewport, track, cardsPerView, clampedActiveIndex)
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [clampedActiveIndex, cardsPerView, total, displayCampaigns]);

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      setActiveIndex(Math.min(Math.max(index, 0), maxIndex));
    },
    [maxIndex, total]
  );

  const showPrevious = useCallback(() => {
    goTo(clampedActiveIndex - 1);
  }, [clampedActiveIndex, goTo]);

  const showNext = useCallback(() => {
    goTo(clampedActiveIndex + 1);
  }, [clampedActiveIndex, goTo]);

  return (
    <section id="campaigns" className="section-with-net py-14">
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="brand-label mb-4">{programs.label}</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            {programs.title}
          </AnimatedTitle>
          <p className="campaigns-section__subtitle mx-auto mt-6 max-w-2xl">
            {programs.subtitle}
          </p>
        </div>
      </div>

      <div className="campaigns-carousel-lane campaigns-carousel-lane--fullwidth relative z-[1]">
        <div className="campaigns-marquee-lane__line" aria-hidden />

        <div className="campaigns-carousel">
          <div
            ref={viewportRef}
            className="campaigns-carousel__viewport"
            aria-live="polite"
          >
            <div
              ref={trackRef}
              className="campaigns-carousel__track"
              style={{ transform: `translateX(-${slideOffset}px)` }}
            >
              {displayCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  applyHref={getCampaignApplyHref(campaign.title)}
                  location={location}
                />
              ))}
            </div>
          </div>

          <div className="campaigns-carousel__controls" aria-label="Campaign carousel navigation">
            <button
              type="button"
              className="campaigns-carousel__btn"
              aria-label="Previous campaign"
              onClick={showPrevious}
              disabled={clampedActiveIndex === 0}
            >
              <ChevronLeft aria-hidden size={24} strokeWidth={2.5} />
            </button>

            <div className="campaigns-carousel__dots" role="tablist" aria-label="Campaign slides">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  className={`campaigns-carousel__dot${
                    index === clampedActiveIndex ? " is-active" : ""
                  }`}
                  aria-label={`Go to campaign slide ${index + 1}`}
                  aria-selected={index === clampedActiveIndex}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>

            <button
              type="button"
              className="campaigns-carousel__btn"
              aria-label="Next campaign"
              onClick={showNext}
              disabled={clampedActiveIndex >= maxIndex}
            >
              <ChevronRight aria-hidden size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="campaigns-marquee-lane__line" aria-hidden />
      </div>
    </section>
  );
}
