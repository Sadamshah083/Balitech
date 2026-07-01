"use client";

import { useEffect, useRef } from "react";
import { siteImages } from "@/lib/images";

type HeroBackgroundSliderProps = {
  onFirstImageReady?: () => void;
};

export default function HeroBackgroundSlider({
  onFirstImageReady,
}: HeroBackgroundSliderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { heroVideo } = siteImages;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    video.muted = true;
    void video.play().catch(() => {
      // Autoplay can be blocked until user interaction.
    });
  }, []);

  return (
    <div className="hero-bg-slider hero-bg-slider--static" aria-hidden>
      <div className="hero-bg-track">
        <div className="hero-bg-slide-wrap">
          <video
            ref={videoRef}
            className="hero-bg-video object-cover"
            src={heroVideo.src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label={heroVideo.label}
            onCanPlay={onFirstImageReady}
          />
        </div>
      </div>
    </div>
  );
}
