"use client";

import { useCallback, useRef, useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

export type GalleryVideoItem = {
  id: string;
  title: string;
  src: string;
  poster?: string;
  /** width / height when known ahead of time. */
  aspect?: number;
};

type GalleryPortraitPlayerProps = {
  portraitVideos: GalleryVideoItem[];
  featuredVideo: GalleryVideoItem | null;
};

const FALLBACK_ASPECT = {
  portrait: 9 / 16,
  landscape: 16 / 9,
} as const;

type VideoHandlers = {
  onPlay: (event: SyntheticEvent<HTMLVideoElement>) => void;
};

/**
 * Nothing plays until the visitor presses play. Clips with a poster stay
 * unfetched until then; the rest load metadata only so a frame can show.
 */
function GalleryVideo({
  item,
  handlers,
  onLoadedMetadata,
}: {
  item: GalleryVideoItem;
  handlers: VideoHandlers;
  onLoadedMetadata?: (event: SyntheticEvent<HTMLVideoElement>) => void;
}) {
  return (
    <video
      className="gallery-device__video"
      src={item.poster ? item.src : `${item.src}#t=0.1`}
      poster={item.poster}
      controls
      playsInline
      preload={item.poster ? "none" : "metadata"}
      aria-label={item.title}
      onPlay={handlers.onPlay}
      onLoadedMetadata={onLoadedMetadata}
    />
  );
}

function PhoneVideoCard({
  item,
  handlers,
  onLandscape,
}: {
  item: GalleryVideoItem;
  handlers: VideoHandlers;
  onLandscape: (id: string) => void;
}) {
  const [aspect, setAspect] = useState(item.aspect ?? FALLBACK_ASPECT.portrait);
  const onLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight } = event.currentTarget;
    if (!videoWidth || !videoHeight) return;
    if (videoWidth > videoHeight) onLandscape(item.id);
    else setAspect(videoWidth / videoHeight);
  };

  return (
    <article className="gallery-device gallery-device--phone gallery-phone-card">
      <div className="gallery-device__shell gallery-phone">
        <div
          className="gallery-device__screen gallery-phone__screen"
          style={{ "--video-aspect": aspect } as CSSProperties}
        >
          <GalleryVideo
            item={item}
            handlers={handlers}
            onLoadedMetadata={item.aspect ? undefined : onLoadedMetadata}
          />
        </div>
      </div>
      <h3 className="gallery-device__title">{item.title}</h3>
    </article>
  );
}

function TvVideoCard({
  item,
  handlers,
}: {
  item: GalleryVideoItem;
  handlers: VideoHandlers;
}) {
  const [aspect, setAspect] = useState(item.aspect ?? FALLBACK_ASPECT.landscape);
  const onLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight } = event.currentTarget;
    if (videoWidth && videoHeight) setAspect(videoWidth / videoHeight);
  };

  return (
    <article className="gallery-device gallery-device--tv gallery-tv-card">
      <div className="gallery-tv">
        <div className="gallery-tv__bezel">
          <div
            className="gallery-tv__screen gallery-device__screen"
            style={{ "--video-aspect": aspect } as CSSProperties}
          >
            <GalleryVideo
              item={item}
              handlers={handlers}
              onLoadedMetadata={item.aspect ? undefined : onLoadedMetadata}
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
  handlers,
}: {
  item: GalleryVideoItem;
  handlers: VideoHandlers;
}) {
  return (
    <article className="gallery-featured-video">
      <div className="gallery-featured-video__frame glow-border">
        <div className="gallery-featured-video__screen">
          <GalleryVideo item={item} handlers={handlers} />
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
  /* Clips without a known shape start in a phone frame and move to the TV
     frame once their real dimensions load, so admin order never mis-frames one. */
  const [landscapeIds, setLandscapeIds] = useState<ReadonlySet<string>>(() => new Set());
  const markLandscape = useCallback((id: string) => {
    setLandscapeIds((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);

  const handlers: VideoHandlers = {
    onPlay: (event) => {
      const playing = event.currentTarget;
      sectionRef.current?.querySelectorAll("video").forEach((video) => {
        if (video !== playing) video.pause();
      });
    },
  };

  if (portraitVideos.length === 0 && !featuredVideo) return null;

  return (
    <section
      ref={sectionRef}
      className="gallery-portrait-player section-with-net"
      aria-label="Event videos"
    >
      <SectionAnimatedNet />
      {portraitVideos.length > 0 && (
        <div className="gallery-portrait-player__row">
          {portraitVideos.map((item) => {
            const landscape = item.aspect ? item.aspect > 1 : landscapeIds.has(item.id);
            return landscape ? (
              <TvVideoCard key={item.id} item={item} handlers={handlers} />
            ) : (
              <PhoneVideoCard
                key={item.id}
                item={item}
                handlers={handlers}
                onLandscape={markLandscape}
              />
            );
          })}
        </div>
      )}
      {featuredVideo && (
        <div className="gallery-portrait-player__featured">
          <FullWidthVideoCard item={featuredVideo} handlers={handlers} />
        </div>
      )}
    </section>
  );
}
