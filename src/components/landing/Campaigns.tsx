"use client";

import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import IntentLink from "@/components/navigation/IntentLink";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import CampaignBranches from "@/components/careers/CampaignBranches";
import { getCampaignApplyHref } from "@/lib/apply";
import {
  describeCampaignLocations,
  initialCampaignLocations,
  parseCampaignLocations,
} from "@/lib/campaign-locations";
import { type ClientCampaign, fetchPublicCampaigns } from "@/lib/campaigns-client";
import { companyContent } from "@/lib/content";
import { getCampaignIcon } from "@/lib/icons";

const { programs } = companyContent;

type Campaign = ClientCampaign;

/** Shown when the endpoint has nothing to give, so the section is never empty. */
const fallbackCampaignCards = (): Campaign[] =>
  programs.items.map((item, index) => ({
    id: `program-${index}`,
    title: item.title,
    description: item.description,
    icon: item.icon,
    locations: initialCampaignLocations(item.title),
  }));

function getCardsPerView(width: number) {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  if (width < 1280) return 3;
  return 4;
}

function CampaignCard({
  campaign,
  applyHref,
}: {
  campaign: Campaign;
  applyHref: string;
}) {
  const icon = getCampaignIcon(campaign.icon);
  const branches = parseCampaignLocations(
    campaign.locations,
    campaign.location ?? programs.location
  );
  const bullets = [
    campaign.description ?? "",
    ...programs.defaultRequirements,
  ].slice(0, 2);

  return (
    <article className="campaigns-carousel__card">
      <IntentLink
        href={applyHref}
        scroll={false}
        className="campaign-job-card group/card"
        aria-label={`Apply for ${campaign.title} campaign at ${describeCampaignLocations(branches)}`}
      >
        <span className="campaign-job-card__shade" aria-hidden />
        <span className="campaign-job-card__glow" aria-hidden />

        <div className="campaign-job-card__icon" aria-hidden>
          {createElement(icon, { size: 52, strokeWidth: 1.35 })}
        </div>

        <h3 className="campaign-job-card__title">{campaign.title}</h3>

        <CampaignBranches
          branches={branches}
          className="campaign-job-card__location"
          iconSize={14}
        />

        <ul className="campaign-job-card__list">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <span className="campaign-job-card__apply">Apply Now</span>
      </IntentLink>
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [slideOffset, setSlideOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      /* Shared with the apply form, which needs the same rows to work out
         which branches a campaign is hiring at. */
      const list = await fetchPublicCampaigns();
      setCampaigns(list.length > 0 ? list : fallbackCampaignCards());
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
    campaigns.length > 0 ? campaigns : fallbackCampaignCards();

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
