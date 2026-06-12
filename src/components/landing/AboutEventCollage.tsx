"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const { about } = companyContent;
const { videos, images } = siteImages.aboutCollage;
const { annualTrips } = about;

const TRIP_SLIDES = [
  { id: "trip2k25", video: videos.trip2k25, content: annualTrips.trip2k25 },
  { id: "trip2k26", video: videos.trip2k26, content: annualTrips.trip2k26 },
  { id: "managementTrip", video: videos.managementTrip, content: annualTrips.managementTrip },
] as const;

const DEFAULT_TRIP_INDEX = 1;

const carouselImages = images;

const leftPanelImages = carouselImages.slice(0, 4);
const rightColumnImages = carouselImages.slice(4);

const leftColumnOneImages = leftPanelImages.filter((_, index) => index % 2 === 0);
const leftColumnTwoImages = leftPanelImages.filter((_, index) => index % 2 === 1);

function loopSlides<T>(slides: T[]) {
  return [...slides, ...slides];
}

async function playVideo(video: HTMLVideoElement, withSound: boolean) {
  video.volume = 1;

  if (withSound) {
    video.muted = false;
    try {
      await video.play();
      return true;
    } catch {
      // Browsers block unmuted autoplay — fall back to muted.
    }
  }

  video.muted = true;
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
}

export default function AboutEventCollage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeTripIndexRef = useRef(DEFAULT_TRIP_INDEX);
  const isInViewRef = useRef(false);
  const [activeTripIndex, setActiveTripIndex] = useState(DEFAULT_TRIP_INDEX);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    activeTripIndexRef.current = activeTripIndex;
    isInViewRef.current = isInView;
  }, [activeTripIndex, isInView]);

  const activeContent = TRIP_SLIDES[activeTripIndex].content;

  const pauseInactiveVideos = useCallback((activeIndex: number) => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== activeIndex) {
        video.pause();
      }
    });
  }, []);

  const playTripAt = useCallback(
    async (index: number, withSound: boolean) => {
      pauseInactiveVideos(index);

      const activeVideo = videoRefs.current[index];
      if (!activeVideo || !isInViewRef.current) return;

      if (activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      await playVideo(activeVideo, withSound);
    },
    [pauseInactiveVideos]
  );

  const navigateToTrip = useCallback(
    (index: number, withSound: boolean) => {
      setActiveTripIndex(index);
      void playTripAt(index, withSound);
    },
    [playTripAt]
  );

  const showPreviousTrip = useCallback(() => {
    const nextIndex =
      (activeTripIndexRef.current - 1 + TRIP_SLIDES.length) % TRIP_SLIDES.length;
    navigateToTrip(nextIndex, true);
  }, [navigateToTrip]);

  const showNextTrip = useCallback(() => {
    const nextIndex = (activeTripIndexRef.current + 1) % TRIP_SLIDES.length;
    navigateToTrip(nextIndex, true);
  }, [navigateToTrip]);

  const handleVideoReady = useCallback(
    (index: number) => {
      if (index !== activeTripIndexRef.current || !isInViewRef.current) return;
      void playTripAt(index, false);
    },
    [playTripAt]
  );

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);
        isInViewRef.current = visible;

        if (visible) {
          void playTripAt(activeTripIndexRef.current, false);
        } else {
          videoRefs.current.forEach((video) => video?.pause());
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -2% 0px" }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [playTripAt]);

  return (
    <div className="about-event-collage">
      <section
        className="about-event-collage__hero-section"
        aria-label="Annual trips videos"
      >
        <header className="about-event-collage__header">
          <p className="about-event-collage__eyebrow brand-label">
            {about.collageLabel}
          </p>
          <h2 className="about-event-collage__title">
            <HeadingLastWord text={about.collageTitle} />
          </h2>
          <p className="about-event-collage__intro">{about.collageIntro}</p>
        </header>

        <div className="about-trip-stage" aria-label="Annual trips video display">
          <div
            ref={heroRef}
            className="about-trip-stage__display about-event-collage__hero about-event-collage__hero--video"
          >
            <div
              className="about-trip-video-track"
              style={{ "--trip-slide": activeTripIndex } as CSSProperties}
            >
              {TRIP_SLIDES.map((slide, index) => (
                <div key={slide.id} className="about-trip-video-pane">
                  <video
                    ref={(element) => {
                      videoRefs.current[index] = element;
                    }}
                    className="about-trip-video"
                    src={slide.video.src}
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    onCanPlay={() => handleVideoReady(index)}
                    onLoadedData={() => handleVideoReady(index)}
                  />
                </div>
              ))}
            </div>

            <div
              className="about-trip-video-controls"
              aria-label="Annual trips navigation"
            >
              <button
                type="button"
                className="about-trip-video-controls__btn"
                aria-label="Previous trip video"
                onClick={showPreviousTrip}
              >
                <ChevronLeft aria-hidden size={22} strokeWidth={2.5} />
              </button>
              <p className="about-trip-video-controls__title">
                {activeContent.title}
              </p>
              <button
                type="button"
                className="about-trip-video-controls__btn"
                aria-label="Next trip video"
                onClick={showNextTrip}
              >
                <ChevronRight aria-hidden size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        className="about-event-collage__swipe-section"
        aria-label="Event gallery swipe"
      >
        <div className="about-event-collage__frame">
          <p className="about-event-collage__swipe-label brand-label">
            {about.collageSwipeLabel}
          </p>

          <div className="culture-gallery-section">
            <div className="culture-gallery-section__left">
              <div className="culture-gallery-col culture-gallery-col--left">
                <div className="culture-gallery-track culture-gallery-track--right">
                  {loopSlides(leftColumnOneImages).map((slide, index) => (
                    <div
                      key={`left-one-${slide.src}-${index}`}
                      className="culture-gallery-slide"
                    >
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        draggable={false}
                        className="object-cover"
                        sizes="(max-width: 767px) 100vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="culture-gallery-col culture-gallery-col--left">
                <div className="culture-gallery-track culture-gallery-track--right">
                  {loopSlides(leftColumnTwoImages).map((slide, index) => (
                    <div
                      key={`left-two-${slide.src}-${index}`}
                      className="culture-gallery-slide"
                    >
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        draggable={false}
                        className="object-cover"
                        sizes="(max-width: 767px) 100vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="culture-gallery-section__right">
              <div className="culture-gallery-col culture-gallery-col--right">
                <div className="culture-gallery-track culture-gallery-track--up">
                  {loopSlides(rightColumnImages).map((slide, index) => (
                    <div
                      key={`right-${slide.src}-${index}`}
                      className="culture-gallery-slide"
                    >
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        draggable={false}
                        className="object-cover"
                        sizes="(max-width: 767px) 100vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
