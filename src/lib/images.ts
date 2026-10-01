export const siteImages = {
  /**
   * The 4K 60fps original is kept in `public/herovideo` as the master, but what
   * ships is the 1080p derivative from `npm run optimize:media` — the panel is
   * a few hundred pixels wide and muted, and the original was 42 MB.
   */
  heroVideo: {
    src: "/herovideo/balitech-hero-1080.mp4",
    poster: "/herovideo/balitech-hero-poster.webp",
    label: "BALITECH hero video",
  },
  aboutCollage: {
    title: "Annual Trips",
    /**
     * `poster` lets a player show a real frame while the file itself stays
     * unfetched — these clips run 19–25 MB each, so nothing downloads until
     * a visitor presses play.
     */
    videos: {
      trip2k25: {
        src: "/balitech_Video/Annual%20Trip%202K25.mp4",
        label: "Annual Trip 2k25",
        poster: "/gallery/trip-posters/annual-trip-2k25.webp",
      },
      trip2k26: {
        src: "/balitech_Video/Balitech%20Annual%20Trip%202K26.mp4",
        label: "Annual Trip 2k26",
        poster: "/gallery/trip-posters/annual-trip-2k26.webp",
      },
      managementTrip: {
        src: "/management_trip/Management%20Trip.mp4",
        label: "Management Trip",
        poster: "/gallery/trip-posters/management-trip.webp",
      },
      fruitDayCommercial: {
        src: "/baliCulture_Day/fruit-day-commercial.mp4",
        label: "Fruit Day Commercial",
        poster: "/gallery/video-posters/fruit-day.webp",
      },
    },
    /**
     * Culture Day photos, shown on /gallery. The Fruit Day set is owned
     * by the /gallery catalog so neither page repeats the other's photos.
     */
    images: [
      {
        src: "/baliCulture_Day/WhatsApp%20Image%202026-05-11%20at%2012.03.23%20PM%20(1).jpeg",
        alt: "BALITECH Culture Day and Prize Distribution — team celebration",
      },
      {
        src: "/baliCulture_Day/WhatsApp%20Image%202026-05-11%20at%2012.03.24%20PM.jpeg",
        alt: "BALITECH Culture Day and Prize Distribution — office festivities",
      },
      {
        src: "/baliCulture_Day/WhatsApp%20Image%202026-05-11%20at%2012.03.25%20PM.jpeg",
        alt: "BALITECH Culture Day and Prize Distribution — top performer award",
      },
      {
        src: "/baliCulture_Day/WhatsApp%20Image%202026-05-11%20at%2012.03.33%20PM.jpeg",
        alt: "BALITECH Culture Day and Prize Distribution — cultural event",
      },
      {
        src: "/baliCulture_Day/WhatsApp%20Image%202026-05-11%20at%2012.03.34%20PM.jpeg",
        alt: "BALITECH Culture Day and Prize Distribution — team gathering",
      },
      {
        src: "/baliCulture_Day/WhatsApp%20Image%202026-05-11%20at%2012.03.34%20PM%20(1).jpeg",
        alt: "BALITECH Culture Day and Prize Distribution — celebration highlights",
      },
      {
        src: "/baliCulture_Day/WhatsApp%20Image%202026-05-11%20at%2012.03.34%20PM%20(2).jpeg",
        alt: "BALITECH Culture Day and Prize Distribution — team culture",
      },
    ],
  },
  logo: "/bali-tech-logo-nav.png",
  career: "/career/career-cta-bg.jpg",
} as const;
