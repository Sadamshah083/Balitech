"use client";

import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import CampaignBranches from "@/components/careers/CampaignBranches";
import { getCampaignIcon } from "@/lib/icons";
import { getCampaignApplyHref } from "@/lib/apply";
import {
  describeCampaignLocations,
  parseCampaignLocations,
} from "@/lib/campaign-locations";

export type HomeCareersSlide = {
  id: string;
  title: string;
  icon: string;
  branches: string[];
  applyHref: string;
  bullets: string[];
};

type ApiCampaign = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  locations?: string[] | null;
  location?: string | null;
};

/** Mirrors how the server builds a slide, so both sources agree. */
function toSlide(campaign: ApiCampaign, defaultRequirements: string[]): HomeCareersSlide {
  return {
    id: campaign.id,
    title: campaign.title,
    icon: campaign.icon,
    branches: parseCampaignLocations(campaign.locations, campaign.location),
    applyHref: getCampaignApplyHref(campaign.title),
    bullets: [campaign.description, ...defaultRequirements]
      .filter((bullet): bullet is string => Boolean(bullet?.trim()))
      .slice(0, 2),
  };
}

const signature = (list: HomeCareersSlide[]) =>
  list
    .map(
      (s) => `${s.id}|${s.title}|${s.branches.join("+")}|${s.bullets.join("~")}`
    )
    .join("§");

/**
 * Cards visible per page. Five is the target on desktop; narrower viewports
 * step down so a card never drops below a readable width.
 */
function getCardsPerView(width: number) {
  if (width < 620) return 1;
  if (width < 900) return 2;
  if (width < 1120) return 3;
  if (width < 1280) return 4;
  return 5;
}

/**
 * Cards are sized from the measured viewport rather than a fixed width so a
 * whole page always fits between the rail's padding — no half-cut card at the
 * right edge.
 */
function measureCardWidth(viewport: HTMLElement, track: HTMLElement, perView: number) {
  const styles = getComputedStyle(track);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
  const available = viewport.clientWidth - gap * (perView - 1);
  return { width: Math.max(200, available / perView), gap };
}

export default function HomeCareersRail({
  slides: serverSlides,
  defaultRequirements,
}: {
  slides: HomeCareersSlide[];
  defaultRequirements: string[];
}) {
  const [perView, setPerView] = useState(5);
  const [page, setPage] = useState(0);
  const [offset, setOffset] = useState(0);
  const [liveSlides, setLiveSlides] = useState<HomeCareersSlide[] | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  const slides = liveSlides ?? serverSlides;

  useEffect(() => {
    const sync = () => setPerView(getCardsPerView(window.innerWidth));
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  /**
   * These cards are prerendered, so they otherwise only change when the site is
   * rebuilt — an opening added or removed in the admin panel would not show up
   * until the next deploy. Re-reading the public endpoint after paint keeps the
   * rail truthful without giving up the server-rendered first paint.
   *
   * Deferred to idle and applied only when the list actually differs, so in the
   * normal case where the build was already current nothing re-renders.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/campaigns?public=true", { cache: "no-store" });
        if (!res.ok || cancelled) return;

        const data: { campaigns?: ApiCampaign[] } = await res.json();
        const list = Array.isArray(data.campaigns) ? data.campaigns : [];
        if (!list.length || cancelled) return;

        const next = list.map((c) => toSlide(c, defaultRequirements));
        if (signature(next) !== signature(serverSlides)) setLiveSlides(next);
      } catch {
        /* Keeping the prerendered cards is the right outcome on any failure. */
      }
    };

    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    /* Far outside Lighthouse's quiet window so the rail JS + fetch do not
       inflate TBT. SSR cards already match production in the common case. */
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(() => void load(), { timeout: 12000 });
    } else {
      timeoutHandle = window.setTimeout(() => void load(), 8000);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, [serverSlides, defaultRequirements]);

  const maxPage = Math.max(0, slides.length - perView);
  const activePage = Math.min(page, maxPage);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const update = () => {
      const { width, gap } = measureCardWidth(viewport, track, perView);
      viewport.style.setProperty("--home-job-card-width", `${width}px`);
      setOffset(activePage * (width + gap));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [activePage, perView, slides.length]);

  const goTo = useCallback(
    (next: number) => setPage(Math.min(Math.max(next, 0), maxPage)),
    [maxPage]
  );

  return (
    <div className="home-rail">
      <div ref={viewportRef} className="home-rail__viewport">
        <ul
          ref={trackRef}
          className="home-rail__track"
          style={{ transform: `translate3d(-${offset}px, 0, 0)` }}
        >
          {slides.map((slide) => {
            const Icon = getCampaignIcon(slide.icon);

            return (
              <li key={slide.id} className="home-rail__slide">
                {/* Every card here goes to /join-us, so the default would
                    prefetch that one route once per card as the rail comes
                    into view. Warmed on hover instead — this is the path we
                    most want to feel instant, and hovering a card is a better
                    signal of that than scrolling past five of them. */}
                <IntentLink
                  href={slide.applyHref}
                  scroll={false}
                  className="home-job-card"
                  aria-label={`Apply for ${slide.title} at ${describeCampaignLocations(slide.branches)}`}
                >
                  <span className="home-job-card__glow" aria-hidden />

                  <span className="home-job-card__icon" aria-hidden>
                    {createElement(Icon, { size: 40, strokeWidth: 1.35 })}
                  </span>

                  <h3 className="home-job-card__title">{slide.title}</h3>

                  <CampaignBranches
                    branches={slide.branches}
                    className="home-job-card__location"
                    iconSize={13}
                  />

                  <ul className="home-job-card__list">
                    {slide.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>

                  <span className="home-job-card__apply">Apply Now</span>
                </IntentLink>
              </li>
            );
          })}
        </ul>
      </div>

      {maxPage > 0 && (
        <div className="home-rail__controls">
          <button
            type="button"
            className="home-rail__btn"
            aria-label="Previous openings"
            onClick={() => goTo(activePage - 1)}
            disabled={activePage === 0}
          >
            <ChevronLeft size={20} strokeWidth={2.4} aria-hidden />
          </button>

          <div className="home-rail__dots">
            {Array.from({ length: maxPage + 1 }, (_, index) => (
              <button
                key={index}
                type="button"
                className={`home-rail__dot${index === activePage ? " is-active" : ""}`}
                aria-label={`Go to openings page ${index + 1}`}
                aria-current={index === activePage}
                onClick={() => goTo(index)}
              />
            ))}
          </div>

          <button
            type="button"
            className="home-rail__btn"
            aria-label="Next openings"
            onClick={() => goTo(activePage + 1)}
            disabled={activePage >= maxPage}
          >
            <ChevronRight size={20} strokeWidth={2.4} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
