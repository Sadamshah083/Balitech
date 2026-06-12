"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

type VideoItem = {
  id: string;
  title: string;
  src: string;
};

type GalleryPortraitPlayerProps = {
  portraitVideos: VideoItem[];
  featuredVideo: VideoItem | null;
};

const FALLBACK_ASPECT = {
  portrait: 9 / 16,
  landscape: 16 / 9,
} as const;

async function tryPlay(video: HTMLVideoElement) {
  video.muted = true;
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
}

function useVideoAspect(
  fallback: number,
  onVideoRef: (el: HTMLVideoElement | null) => void
) {
  const [aspect, setAspect] = useState(fallback);

  const setRef = useCallback(
    (el: HTMLVideoElement | null) => {
      onVideoRef(el);
    },
    [onVideoRef]
  );

  const onLoadedMetadata = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = event.currentTarget;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setAspect(video.videoWidth / video.videoHeight);
      }
    },
    []
  );

  const screenStyle = {
    "--video-aspect": aspect,
  } as CSSProperties;

  return { setRef, onLoadedMetadata, screenStyle, aspect };
}

function PhoneVideoCard({
  item,
  index,
  videoRef,
}: {
  item: VideoItem;
  index: number;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
  const { setRef, onLoadedMetadata, screenStyle } = useVideoAspect(
    FALLBACK_ASPECT.portrait,
    videoRef
  );

  return (
    <article className="gallery-device gallery-device--phone gallery-phone-card">
      <div className="gallery-device__shell gallery-phone">
        <div className="gallery-device__screen gallery-phone__screen" style={screenStyle}>
          <video
            ref={setRef}
            className="gallery-device__video"
            src={item.src}
            controls
            autoPlay={index === 0}
            muted
            playsInline
            loop
            preload="auto"
            aria-label={item.title}
            onLoadedMetadata={onLoadedMetadata}
          />
        </div>
      </div>
      <h3 className="gallery-device__title">{item.title}</h3>
    </article>
  );
}

function TvVideoCard({
  item,
  videoRef,
}: {
  item: VideoItem;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
  const { setRef, onLoadedMetadata, screenStyle } = useVideoAspect(
    FALLBACK_ASPECT.landscape,
    videoRef
  );

  return (
    <article className="gallery-device gallery-device--tv gallery-tv-card">
      <div className="gallery-tv">
        <div className="gallery-tv__bezel">
          <div className="gallery-tv__screen gallery-device__screen" style={screenStyle}>
            <video
              ref={setRef}
              className="gallery-device__video"
              src={item.src}
              controls
              muted
              playsInline
              loop
              preload="auto"
              aria-label={item.title}
              onLoadedMetadata={onLoadedMetadata}
            />
          </div>
          <div className="gallery-tv__chin">
            <span className="gallery-tv__brand">BALITECH</span>
            <span className="gallery-tv__led" aria-hidden />
          </div>
        </div>
      </div>
      <h3 className="gallery-device__title">{item.title}</h3>
    </article>
  );
}

function FullWidthVideoCard({
  item,
  videoRef,
}: {
  item: VideoItem;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
  const { setRef, onLoadedMetadata, aspect } = useVideoAspect(
    FALLBACK_ASPECT.landscape,
    videoRef
  );

  return (
    <article className="gallery-featured-video">
      <div className="gallery-featured-video__frame glow-border">
        <div
          className="gallery-featured-video__screen"
          style={{ aspectRatio: aspect }}
        >
          <video
            ref={setRef}
            className="gallery-device__video"
            src={item.src}
            controls
            muted
            playsInline
            loop
            preload="auto"
            aria-label={item.title}
            onLoadedMetadata={onLoadedMetadata}
          />
        </div>
      </div>
      <h3 className="gallery-device__title gallery-featured-video__title">
        {item.title}
      </h3>
    </article>
  );
}

export default function GalleryPortraitPlayer({
  portraitVideos,
  featuredVideo,
}: GalleryPortraitPlayerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isInViewRef = useRef(false);

  const playAll = useCallback(async () => {
    if (!isInViewRef.current) return;

    await Promise.all(
      videoRefs.current.map((video) =>
        video ? tryPlay(video) : Promise.resolve(false)
      )
    );
  }, []);

  const pauseAll = useCallback(() => {
    videoRefs.current.forEach((video) => video?.pause());
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        isInViewRef.current = visible;

        if (visible) {
          void playAll();
        } else {
          pauseAll();
        }
      },
      { threshold: [0, 0.2, 0.45] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [playAll, pauseAll]);

  if (portraitVideos.length === 0 && !featuredVideo) return null;

  const featuredIndex = portraitVideos.length;

  return (
    <section
      ref={sectionRef}
      className="gallery-portrait-player section-with-net"
      aria-label="Event videos"
    >
      <SectionAnimatedNet />
      {portraitVideos.length > 0 && (
        <div className="gallery-portrait-player__row">
          {portraitVideos.map((item, index) => {
            const setVideoRef = (el: HTMLVideoElement | null) => {
              videoRefs.current[index] = el;
            };

            if (index === 2) {
              return (
                <TvVideoCard key={item.id} item={item} videoRef={setVideoRef} />
              );
            }

            return (
              <PhoneVideoCard
                key={item.id}
                item={item}
                index={index}
                videoRef={setVideoRef}
              />
            );
          })}
        </div>
      )}
      {featuredVideo && (
        <div className="gallery-portrait-player__featured">
          <FullWidthVideoCard
            item={featuredVideo}
            videoRef={(el) => {
              videoRefs.current[featuredIndex] = el;
            }}
          />
        </div>
      )}
    </section>
  );
}
