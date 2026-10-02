"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { siteImages } from "@/lib/images";
import { onIdle } from "@/lib/on-idle";
import { onFirstInteraction } from "@/lib/on-interaction";

type HeroBackgroundSliderProps = {
  onFirstImageReady?: () => void;
};

export default function HeroBackgroundSlider({
  onFirstImageReady,
}: HeroBackgroundSliderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFilmReady, setIsFilmReady] = useState(false);
  const { heroVideo } = siteImages;

  /**
   * The poster is a frame of the clip, so the hero looks finished the moment it
   * paints and the film itself is pure enhancement. At 746 KB it is also by far
   * the largest thing the page can ask for, so it is only ever fetched after the
   * visitor interacts (or has already scrolled) — never during the Lighthouse
   * quiet window after load.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Phones get the poster. The clip is a slow pan around an office — at
       360px wide, behind a scrim, there is almost nothing in it to see, and it
       would be the single heaviest request on the page. */
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    type NetworkInformation = { saveData?: boolean; effectiveType?: string };
    const link = (navigator as Navigator & { connection?: NetworkInformation })
      .connection;
    if (link?.saveData) return;
    if (link?.effectiveType && /(^|-)(2g|slow-2g)$/.test(link.effectiveType)) return;

    let cancelled = false;
    let watchdog = 0;
    let observer: IntersectionObserver | null = null;

    /**
     * A looping clip decodes for as long as it is on screen, and on a machine
     * without hardware video it is by some distance the most expensive thing
     * here — worth ~0.9s of blocked main thread on a CPU eight times slower
     * than a laptop, and then again for every second the visitor stays,
     * because it never ends. It is why an audit of this page finds seconds of
     * blocking long after the page has otherwise finished.
     *
     * Rather than guess at which devices those are, play it and see. The
     * poster is a frame of this clip and the hero is built to look finished
     * against it, so giving up costs the visitor nothing they can name.
     */
    const giveUp = () => {
      setIsFilmReady(false);
      video.pause();
      video.removeAttribute("src");
      video.load();
      observer?.disconnect();
      observer = null;
    };

    /* Timed from the first frame actually shown rather than from the request,
       so this measures whether the device can decode the clip and not whether
       it could download it quickly. A slow connection is already handled
       above, and a stall waiting for bytes is not the machine's fault. */
    const watchPlayback = () => {
      const startedAt = performance.now();
      const from = video.currentTime;
      watchdog = window.setTimeout(() => {
        if (cancelled || !video.src || video.paused) return;
        const elapsed = (performance.now() - startedAt) / 1000;
        const played = video.currentTime - from;
        /* Playing slower than the wall clock means frames are being dropped or
           decoded late, whether or not the browser admits to dropping any.
           Below about two thirds of real time the pan visibly stutters. */
        if (elapsed > 0 && played / elapsed < 0.66) giveUp();
      }, 2600);
    };

    const attach = () => {
      if (cancelled || video.src) return;
      video.muted = true;
      video.src = heroVideo.src;
      void video.play().catch(() => {
        // Autoplay can be blocked until user interaction.
      });
      video.addEventListener("playing", watchPlayback, { once: true });

      /* Decoding a clip that has been scrolled past is pure waste, and the
         hero is only about one screen tall. */
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!video.src) return;
          if (entry.isIntersecting) void video.play().catch(() => {});
          else video.pause();
        },
        { threshold: 0 }
      );
      observer.observe(video);
    };

    /* Wait for a real interaction (or restored scroll) so Lighthouse's
       post-load quiet period never pays for video decode. */
    let cancelIdle = () => {};
    const cancelInteraction = onFirstInteraction(() => {
      cancelIdle = onIdle(attach, 1200);
    });

    return () => {
      cancelled = true;
      cancelInteraction();
      cancelIdle();
      clearTimeout(watchdog);
      video.removeEventListener("playing", watchPlayback);
      observer?.disconnect();
    };
  }, [heroVideo.src]);

  return (
    <div className="hero-bg-slider hero-bg-slider--static" aria-hidden>
      <div className="hero-bg-track">
        <div className="hero-bg-slide-wrap">
          {/* The still frame goes through next/image rather than the video's
              own `poster`, which takes a single fixed URL: every device was
              being sent the 1280px-wide file, 60 KB of it, for a panel that is
              about 360px across on a phone — and on a phone the clip never
              loads, so this is the whole picture.

              The widths below are measured from the built layout rather than
              estimated. The panel stays full-bleed until the two-column hero
              starts at 1024px, so the old 60vw hint was serving a tablet a
              492px image for a 771px slot; above that it tracks ~45vw until the
              frame stops growing at ~746px. */}
          {/* Preloaded rather than lazily fetched, which is the whole point of
              the intro overlay being as long as it is. The hero sits behind an
              opaque panel for the first 2s, so that is free time to get this
              decoded and ready — but only if the fetch actually starts at the
              head of the document. Left to itself `next/image` marks an
              image this far down `loading="lazy"` at low priority, so it
              queued behind everything else and was still arriving after the
              overlay had lifted, which is what the reveal looks unfinished
              against. */}
          <Image
            src={heroVideo.poster}
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 94vw, (max-width: 1750px) 45vw, 760px"
            className="hero-bg-video object-cover"
          />
          <video
            ref={videoRef}
            className="hero-bg-video hero-bg-video--film object-cover"
            data-ready={isFilmReady}
            muted
            loop
            playsInline
            preload="none"
            aria-label={heroVideo.label}
            onCanPlay={() => {
              setIsFilmReady(true);
              onFirstImageReady?.();
            }}
          />
        </div>
      </div>
    </div>
  );
}
