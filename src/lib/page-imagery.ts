/**
 * Photos reserved to a single page.
 *
 * The media catalog deliberately lists the same file under several sections so
 * admins can reuse assets, but that surfaced the same shot on three different
 * pages. Feature placements claim their photo here, and /gallery excludes
 * everything reserved so the catalog never repeats a page hero.
 */

/** Home page culture collage — boardroom, operations floor, team event. */
export const homeCollage = [
  {
    src: "/gallery/gallery-event-2.jpg",
    alt: "BALITECH leadership team in a strategy meeting",
  },
  {
    src: "/gallery/gallery-office-workplace-1.jpg",
    alt: "BALITECH operations floor with agents on live campaigns",
  },
  {
    src: "/gallery/gallery-event-5.jpg",
    alt: "BALITECH team at a company recognition event",
  },
] as const;

/** Home page careers pathway card. */
export const homeCareersPathImage = {
  src: "/hero/hero-team-office.png",
  alt: "BALITECH team gathered on the operations floor",
} as const;

/** Home page "how we work" panel — the operations floor in use. */
export const homeOperationsImage = {
  src: "/balitech_office/DSC03814.webp",
  alt: "BALITECH operations centre with agents working live campaigns",
} as const;

/** About page story photograph — rendered through next/image. */
export const aboutStoryImage = {
  src: "/balitech_office/DSC03829.webp",
  alt: "BALITECH main office floor and team workstations",
} as const;

/**
 * Page banners are CSS backgrounds, so `next/image` never resizes them and the
 * file goes over the wire as-is. These point at the derivatives built by
 * `npm run optimize:media` rather than at the originals.
 */
export const servicesBannerImage = "/banners/services-banner.webp";
export const aboutBannerImage = "/banners/about-banner.webp";

/** Careers page "Moments That Define Us" is fed by the `events` media section. */
export const reservedImageSrcs: ReadonlySet<string> = new Set([
  ...homeCollage.map((photo) => photo.src),
  homeCareersPathImage.src,
  homeOperationsImage.src,
  aboutStoryImage.src,
  /* The banner derivatives are cropped from these, so the gallery must not
     publish the sources or the same shot appears on two pages. */
  "/hero/hero-meeting-new.jpg",
  "/gallery/gallery-office-workplace-2.jpg",
]);
