import Image from "next/image";
import { siteImages } from "@/lib/images";

const { images } = siteImages.aboutCollage;

/**
 * Left stack = first two thirds of photos (panel 1 on top, panel 2 under it).
 * Right column = remaining photos spanning the full height.
 */
const midpoint = Math.ceil(images.length / 3);
const panelOne = images.slice(0, midpoint);
const panelTwo = images.slice(midpoint, midpoint * 2);
const panelThree = images.slice(midpoint * 2);

/**
 * Doubles a track so the marquee can loop seamlessly. The second pass is
 * flagged as a clone so it renders decoratively — assistive tech and content
 * audits should see each photo once.
 */
function loopSlides<T>(slides: readonly T[]) {
  return [
    ...slides.map((slide) => ({ slide, isClone: false })),
    ...slides.map((slide) => ({ slide, isClone: true })),
  ];
}

type CollageImage = (typeof images)[number];

function Track({
  slides,
  keyPrefix,
}: {
  slides: readonly CollageImage[];
  keyPrefix: string;
}) {
  if (slides.length === 0) return null;
  return (
    <div className="culture-gallery-track culture-gallery-track--up">
      {loopSlides(slides).map(({ slide, isClone }, index) => (
        <div
          key={`${keyPrefix}-${slide.src}-${index}`}
          className="culture-gallery-slide"
          aria-hidden={isClone || undefined}
        >
          <Image
            src={slide.src}
            alt={isClone ? "" : slide.alt}
            aria-hidden={isClone || undefined}
            fill
            draggable={false}
            className="object-cover"
            sizes="(max-width: 767px) 100vw, 50vw"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Culture Day collage: panel 2 sits under panel 1 (same width); panel 3
 * fills the right side. Matches the gallery video row width above/below.
 */
export default function AboutEventCollage() {
  return (
    <div className="about-event-collage">
      <section
        className="about-event-collage__swipe-section"
        aria-label="Culture day and prize distribution gallery"
      >
        <div className="about-event-collage__frame">
          <p className="about-event-collage__swipe-label brand-label">
            Culture Day and Prize Distribution
          </p>
          <div className="culture-gallery-section culture-gallery-section--stack">
            <div className="culture-gallery-section__left">
              <div className="culture-gallery-col culture-gallery-col--panel">
                <Track slides={panelOne} keyPrefix="panel-1" />
              </div>
              <div className="culture-gallery-col culture-gallery-col--panel">
                <Track slides={panelTwo} keyPrefix="panel-2" />
              </div>
            </div>
            <div className="culture-gallery-section__right">
              <div className="culture-gallery-col culture-gallery-col--panel">
                <Track slides={panelThree} keyPrefix="panel-3" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
