type VideoPoster = {
  poster: string;
  width: number;
  height: number;
};

const POSTERS: Record<string, VideoPoster> = {
  "/i9-reveal/i9-reveal.mp4": {
    poster: "/gallery/video-posters/i9-reveal.webp",
    width: 1080,
    height: 1920,
  },
  "/independence video/Independence day celeberation.mp4": {
    poster: "/gallery/video-posters/independence-day.webp",
    width: 1280,
    height: 720,
  },
  "/newyear/Balitech New Year.mp4": {
    poster: "/gallery/video-posters/new-year.webp",
    width: 1280,
    height: 720,
  },
  "/Serena Breakfast/ACA Serena Breakfast.mp4": {
    poster: "/gallery/video-posters/serena-breakfast.webp",
    width: 1280,
    height: 2276,
  },
  "/transition video/Transition Video1.mp4": {
    poster: "/gallery/video-posters/transition.webp",
    width: 1280,
    height: 2276,
  },
  "/baliCulture_Day/fruit-day-commercial.mp4": {
    poster: "/gallery/video-posters/fruit-day.webp",
    width: 1280,
    height: 720,
  },
};

function normalize(src: string) {
  try {
    return decodeURI(src.split(/[?#]/)[0]);
  } catch {
    return src;
  }
}

/**
 * Poster frame and real dimensions for videos shipped with the site, so the
 * gallery can frame each clip and show a thumbnail without fetching any video
 * bytes. Admin uploads are not listed and fall back to reading metadata.
 */
export function getVideoPoster(src: string): VideoPoster | undefined {
  return POSTERS[normalize(src)];
}
