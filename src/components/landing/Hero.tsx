import Image from "next/image";
import IntentLink from "@/components/navigation/IntentLink";
import { ArrowRight, BarChart3, Clock, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import type { HeroSlide } from "@/components/landing/HeroCarousel";
import HeroCenterSlider, { type CenterSlide } from "@/components/landing/HeroCenterSlider";
import HeroPageSlider, { type PageSlide } from "@/components/landing/HeroPageSlider";
import HeroBubbleSlider, { type BubbleSlide } from "@/components/landing/HeroBubbleSlider";
import { companyContent } from "@/lib/content";
import { HERO_INTRO_WORDMARK } from "@/lib/hero-loader";

const INTRO_HEIGHT = "100dvh";
const { hero } = companyContent;

/* Paired with `hero.highlights` by position: headcount, coverage, QA, scaling. */
const HIGHLIGHT_ICONS: LucideIcon[] = [Users, Clock, ShieldCheck, BarChart3];

/* The centre circle slides through these gallery photos, each with its own
   caption underneath (titles taken from the site's gallery). */
const CENTER_SLIDES: CenterSlide[] = [
  { src: "/hero/center/center-3.webp", alt: "BALITECH annual trip 2K26 in the snowy mountains", lead: "Annual Trip 2K26", text: "Together beyond the office", dark: 0.1 },
  { src: "/hero/center/center-14.webp", alt: "A BALITECH team member speaking into a microphone at Cultural Day 2K26", lead: "Cultural Day 2K26", text: "Our voices, our heritage", dark: 0.24 },
  { src: "/hero/center/center-5.webp", alt: "BALITECH Fruit Day, Culture Day and prize distribution collage", lead: "Fruit Day at BALITECH", text: "Culture Day and prize distribution", dark: 0.08 },
  { src: "/hero/center/center-15.webp", alt: "BALITECH colleagues singing and playing tabla at Cultural Day 2K26", lead: "Cultural Day 2K26", text: "Songs, tabla and tradition", dark: 0.2 },
  { src: "/hero/center/center-6.webp", alt: "BALITECH leadership and team in a strategic session in the boardroom", lead: "Strategic Session", text: "Planning the next step together", dark: 0.14 },
  { src: "/hero/center/center-17.webp", alt: "Three BALITECH team members holding the Honda CG 125 Top Performer key", lead: "Top Performer Awards", text: "A Honda CG 125 for our best", dark: 0.16 },
  { src: "/hero/center/center-16.webp", alt: "The whole BALITECH office in traditional dress at Cultural Day 2K26", lead: "Cultural Day 2K26", text: "The whole office, together", dark: 0.28 },
  { src: "/hero/center/center-19.webp", alt: "The 2026 lights at the BALITECH new year celebration", lead: "Welcome 2026", text: "A new year, bigger goals", dark: 0.34 },
  /* The Growth page's "Top Performers 2025", one by one (the one placeholder
     avatar there, Anna Methew, is left out because it has no photo). */
  ...[
    "Bryan Jhonson",
    "Max Marshall",
    "Steve Henely",
    "Mark Edward",
    "James Wilson",
    "Bryan Morries",
    "Bryan Morries",
    "Kevin Brown",
    "Sarah Smith",
    "John Harris",
    "Michael Davis",
    "David Brown",
    "Kevin Smith",
  ].map(
    (name, i): CenterSlide => ({
      /* "growth-card-N": new file names, so browsers drop the old face-only crops. */
      src: `/hero/center/growth-card-${i + 1}.webp`,
      alt: `${name}, BALITECH top performer 2025`,
      lead: name,
      text: "Top Performer 2025",
      dark: 0.12,
      card: true,
    })
  ),
];

/* Photo set kept for a slider elsewhere; not shown in the circle any more. */
export const HERO_SLIDES: HeroSlide[] = [
  { src: "/hero/slides/hero-slide-12.webp", alt: "BALITECH Commercial team members smiling at the Hello Summer event in Rawalpindi", width: 803, height: 578, framed: true },
  { src: "/hero/slides/hero-slide-1.webp", alt: "BALITECH call center agent in Rawalpindi giving two thumbs up", width: 708, height: 1100 },
  { src: "/hero/slides/hero-slide-3.webp", alt: "BALITECH team lead in company uniform at the Rawalpindi BPO office", width: 512, height: 1100 },
  { src: "/hero/slides/hero-slide-4.webp", alt: "BALITECH customer support professional in company uniform", width: 520, height: 1100 },
  { src: "/hero/slides/hero-slide-7.webp", alt: "BALITECH colleague seated in the call center office", width: 991, height: 1008 },
  { src: "/hero/slides/hero-slide-8.webp", alt: "BALITECH BPO team members sharing cupcakes for Pinktober", width: 1100, height: 715 },
  { src: "/hero/slides/hero-slide-9.webp", alt: "Four BALITECH call center team members in green shirts at the Hello Summer event", width: 483, height: 262 },
  { src: "/hero/slides/hero-slide-11.webp", alt: "Three BALITECH team members in red at the Hello Summer event", width: 501, height: 287 },
];
/* Photos on the open book's pages (desktop). Cut-outs, not round-cropped.
   Left page, top to bottom: the recruitment table, the traditional-dress group,
   the whole team. Right page: the Top Performer key, then the nine standing. */
/* Each frame on the pages is a slider: its first photo is the one that was
   always there; the new event photos follow it. Every photo is shown whole on
   the frame's colour and changes with a hide-and-show fade. */
type PageSliderData = {
  tone: "orange" | "blue" | "sun";
  intervalMs: number;
  slides: PageSlide[];
};

const PAGE_SLIDERS_LEFT: PageSliderData[] = [
  {
    tone: "orange",
    intervalMs: 4600,
    slides: [
      { src: "/hero/pages/hiring.webp", alt: "Two BALITECH recruiters at the Now Hiring booth in front of the 7 to 850+ banner", width: 900, height: 600, caption: "Seminar Activities", focus: "50% 62%" },
      { src: "/hero/pages/expo.webp", alt: "BALITECH team talking with students and visitors at a careers expo", width: 900, height: 600, caption: "Meeting future teammates", focus: "50% 36%" },
      { src: "/hero/pages/workspace-3.webp", alt: "BALITECH Commercial operations floor with teams at work", width: 900, height: 599, caption: "Commercial operations", focus: "50% 50%" },
    ],
  },
  {
    tone: "blue",
    intervalMs: 5300,
    slides: [
      { src: "/hero/pages/yes2026.webp", alt: "Three BALITECH team members in front of the YES 2026 sign in Islamabad", width: 900, height: 600, caption: "Seminar", focus: "50% 52%" },
      { src: "/hero/pages/camp.webp", alt: "Three BALITECH colleagues sharing a blanket and laughing at a night camp", width: 800, height: 533, caption: "Nights we remember", focus: "50% 50%" },
      { src: "/hero/pages/group-night.webp", alt: "The BALITECH team standing together at a night event", width: 900, height: 506, caption: "A night with the team", focus: "50% 45%" },
    ],
  },
  {
    tone: "sun",
    intervalMs: 6000,
    slides: [
      { src: "/hero/pages/audience.webp", alt: "BALITECH team members listening to the Pinktober awareness session", width: 900, height: 600, caption: "Pinktober awareness session", focus: "50% 62%" },
      { src: "/hero/pages/audience2.webp", alt: "BALITECH colleagues seated in front of the To Lead Is To Imagine Beyond Boundaries wall", width: 900, height: 600, caption: "To lead is to imagine", focus: "50% 72%" },
      { src: "/hero/pages/meeting.webp", alt: "A BALITECH strategy meeting around the boardroom table", width: 900, height: 675, caption: "Planning together", focus: "50% 55%" },
    ],
  },
];

/* Right page: the rectangle photo at the top is a slider too; every other
   photo is a small round bubble beneath it. */
const PAGE_SLIDER_RIGHT: PageSliderData = {
  tone: "blue",
  intervalMs: 5000,
  slides: [
    { src: "/hero/pages/doctor.webp", alt: "A BALITECH team member receiving a gift box from the doctor at the Pinktober awareness event", width: 900, height: 600, caption: "Pinktober, together we make a difference", focus: "50% 45%" },
    { src: "/hero/pages/tables.webp", alt: "Pinktober gift tables with balloons and cupcake boxes at the BALITECH office", width: 900, height: 600, caption: "Pinktober gifts and activities", focus: "50% 62%" },
    { src: "/hero/pages/workspace-1.webp", alt: "The BALITECH Commercial office floor with rows of workstations", width: 900, height: 600, caption: "Commercial office floor", focus: "50% 50%" },
    { src: "/hero/pages/workspace-2.webp", alt: "BALITECH Office workspace and team seating", width: 900, height: 600, caption: "Office workspace", focus: "50% 50%" },
    { src: "/hero/pages/office-shamsabad.webp", alt: "The BALITECH Shamsabad office in Rawalpindi with its lit sign", width: 900, height: 579, caption: "Shamsabad office", focus: "50% 45%" },
    { src: "/hero/pages/office-islamabad.webp", alt: "The BALITECH Islamabad office I-9/3 with its lit sign", width: 900, height: 579, caption: "Islamabad office", focus: "50% 45%" },
  ],
};

type BubbleData = {
  tone: "orange" | "blue" | "sun";
  /** Bubbles come in three sizes so the cluster looks hand-placed. */
  size: "lg" | "md" | "sm";
  intervalMs: number;
  /** First photo is the one that was always there; the rest slide in after it. */
  slides: BubbleSlide[];
};

/* The six round photos on the right page. Each one slides through its own
   photos: the cut-outs (no background) stand on the bubble's colour, the
   seminar photos fill the circle. Their timings differ, so they never all
   change together. */
const RIGHT_BUBBLES: BubbleData[] = [
  {
    tone: "orange", size: "lg", intervalMs: 3900,
    slides: [
      { src: "/hero/pages/fruit-01.webp", caption: "Fruit Day", alt: "Three BALITECH colleagues in red at the Fruit Day event", width: 640, height: 468, focus: "50% 35%" },
      { src: "/hero/pages/seminar-expo.webp", caption: "Careers expo", alt: "BALITECH team talking with students at a careers expo", width: 700, height: 467, focus: "50% 40%" },
      { src: "/hero/pages/fruit-05.webp", caption: "Fruit Day moments", alt: "A collage of four BALITECH Fruit Day moments", width: 640, height: 468, focus: "50% 40%" },
    ],
  },
  {
    tone: "sun", size: "sm", intervalMs: 4500,
    slides: [
      { src: "/hero/pages/seminar-portrait-1.webp", caption: "YES Summit 2026", alt: "A BALITECH team member in front of the Young CEOs, Entrepreneurs and Innovators Summit board", width: 520, height: 780, focus: "50% 38%" },
      { src: "/hero/pages/fruit-03.webp", caption: "Fruit Day", alt: "BALITECH colleagues at the Fruit Day event", width: 640, height: 468, focus: "50% 40%" },
      { src: "/hero/pages/fruit-07.webp", caption: "Fruit Day frames", alt: "BALITECH colleagues with the fruit frames at Fruit Day", width: 640, height: 468, focus: "50% 40%" },
    ],
  },
  {
    tone: "blue", size: "md", intervalMs: 5100,
    slides: [
      { src: "/hero/pages/fruit-06.webp", caption: "Fruit Day", alt: "BALITECH colleagues at the Fruit Day backdrop", width: 640, height: 468, focus: "50% 38%" },
      { src: "/hero/pages/culture-b.webp", caption: "Cultural Day", alt: "BALITECH colleagues in traditional dress at Cultural Day 2K26", width: 640, height: 360, focus: "50% 40%" },
      { src: "/hero/pages/fruit-02.webp", caption: "Fruit Day, green team", alt: "Four BALITECH team members in green at the Fruit Day event", width: 640, height: 468, focus: "50% 38%" },
    ],
  },
  {
    tone: "sun", size: "sm", intervalMs: 4200,
    slides: [
      { src: "/hero/pages/seminar-cupcakes.webp", caption: "Pinktober cupcakes", alt: "BALITECH colleagues sharing pink cupcakes at the Pinktober session", width: 700, height: 467, focus: "40% 40%" },
      { src: "/hero/pages/fruit-09.webp", caption: "Fruit Day activities", alt: "BALITECH colleagues at the Fruit Day celebration", width: 640, height: 468, focus: "50% 40%" },
      { src: "/hero/pages/culture-c.webp", caption: "Cultural Day", alt: "BALITECH colleagues enjoying Cultural Day 2K26", width: 640, height: 360, focus: "50% 40%" },
    ],
  },
  {
    tone: "orange", size: "lg", intervalMs: 5700,
    slides: [
      { src: "/hero/pages/fruit-08.webp", caption: "Fruit Day cake", alt: "BALITECH colleagues cutting a fruit cake at Fruit Day", width: 640, height: 468, focus: "50% 45%" },
      { src: "/hero/pages/fruit-04.webp", caption: "Fruit Day frames", alt: "BALITECH colleagues with the fruit-themed photo frames", width: 640, height: 468, focus: "50% 40%" },
      { src: "/hero/pages/seminar-portrait-2.webp", caption: "YES Summit 2026", alt: "A BALITECH team member at the Young CEOs Summit, Expo and Awards 2026 in Islamabad", width: 520, height: 780, focus: "50% 40%" },
    ],
  },
  {
    tone: "blue", size: "md", intervalMs: 4800,
    slides: [
      { src: "/hero/center/center-3.webp", caption: "Annual Trip 2K26", alt: "BALITECH annual trip 2K26 in the snowy mountains", width: 1000, height: 1000 },
      { src: "/hero/center/center-6.webp", caption: "Strategic Session", alt: "BALITECH leadership and team in a strategic session", width: 1000, height: 1000 },
      { src: "/hero/center/center-19.webp", caption: "Welcome 2026", alt: "The 2026 lights at the BALITECH new year celebration", width: 1000, height: 1000 },
    ],
  },
];

export default function Hero() {
  return (
    <>
    <section id="home" className="hero-section" aria-label="BALITECH, outsourcing built to scale your business">
      {/* The whole intro — ink wipe, overlay fade and hero reveal — is timed
          in CSS from first paint. It used to start on a React timer, so on slow
          phones the splash stayed up until the JS bundle had hydrated, which is
          what pushed field LCP to 6.7 s. The overlay stays mounted and ends at
          `visibility: hidden`, which removes it from the accessibility tree
          and tab order while keeping the LCP node resolvable. */}
      <div
        className="hero-intro"
        style={{ height: INTRO_HEIGHT, minHeight: INTRO_HEIGHT }}
        aria-hidden
      >
        <div className="hero-intro__aura" aria-hidden />

        <div className="hero-intro__content">
          {/* Wiped left-to-right so the calligraphy stays connected */}
          <p className="hero-intro__script">
            <span className="hero-intro__script-ink">{HERO_INTRO_WORDMARK}</span>
            <span className="hero-intro__script-nib" aria-hidden />
          </p>

          <div className="hero-intro__meter">
            <div className="hero-intro__track">
              <div className="hero-intro__fill" />
            </div>
            <div className="hero-intro__readout">
              <span>{companyContent.tagline}</span>
              {/* Digits are drawn by CSS from the same animated property as
                  the wipe, so the two never drift apart. */}
              <span className="hero-intro__percent" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <div className="hero-section__aura" aria-hidden />
      {/* Two more strips under the bottom-right one: a sharp one, then a soft
          blurred one beneath it (desktop only). */}
      <span className="hero-strip hero-strip--sharp" aria-hidden />
      <span className="hero-strip hero-strip--soft" aria-hidden />
      <span className="hero-strip hero-strip--fourth" aria-hidden />
      {/* Two strips in the top-left corner: the bottom-right ones turned 180°. */}
      <span className="hero-strip hero-strip--tl hero-strip--tl-a" aria-hidden />
      <span className="hero-strip hero-strip--tl hero-strip--tl-b" aria-hidden />
      <span className="hero-strip hero-strip--tl hero-strip--tl-c" aria-hidden />

      {/* The two-column grid and the services strip share one container and
          stack in normal flow, so the strip always sits under the grid. */}
      <div className="hero-container">
        <div className="hero-shell">
          {/* The book's leather cover, behind the pages (desktop only). */}
          <span className="hero-cover" aria-hidden />
          {/* A dark veil over the pages; its strength follows the centre photo. */}
          <span className="hero-dim" aria-hidden />
          {/* Page-turn state lives in this checkbox, so the whole book stays
              server-rendered and every word is in the HTML for crawlers. */}
          <input
            type="checkbox"
            id="hero-book-flip"
            className="hero-flip__input"
            aria-label="Turn the page to read more from the BALITECH magazine"
          />
          {/* Page 1 (left): photos only. Its words sit under the book. */}
          <div className="hero-copy">
            <span className="hero-page__no" aria-hidden>01</span>
            <div className="hero-art hero-art--left">
              {/* Left page: rectangle, three rounds, rectangle. (The second
                  rectangle moved to the end of the right page.) */}
              <HeroPageSlider
                slides={PAGE_SLIDERS_LEFT[0].slides}
                tone={PAGE_SLIDERS_LEFT[0].tone}
                intervalMs={PAGE_SLIDERS_LEFT[0].intervalMs}
              />
              <ul className="hero-bubbles">
                {RIGHT_BUBBLES.slice(3).map((b, i) => (
                  <HeroBubbleSlider
                    key={`${b.slides[0].src}-l${i}`}
                    slides={b.slides}
                    tone={b.tone}
                    size={b.size}
                    intervalMs={b.intervalMs}
                  />
                ))}
              </ul>
              <HeroPageSlider
                slides={PAGE_SLIDERS_LEFT[2].slides}
                tone={PAGE_SLIDERS_LEFT[2].tone}
                intervalMs={PAGE_SLIDERS_LEFT[2].intervalMs}
              />
            </div>
          </div>

          <div className="hero-media">
            <div className="hero-stage">
              <span className="hero-stage__orbit" aria-hidden />
              <span className="hero-stage__disc" aria-hidden />
              <HeroCenterSlider slides={CENTER_SLIDES} />
            </div>
          </div>

          {/* Page 4, waiting under the leaf. Text taken from the BALITECH
              Corporate Edition 2025 magazine. */}
          <div className="hero-page4">
            <p className="hero-page__eyebrow">Man Behind the dream</p>
            <span className="hero-page__no" aria-hidden>04</span>
            <p className="hero-page4__name">Muhammad Sheraz Bali</p>
            <p className="hero-page4__role">Chief Executive Officer, BALITECH</p>
            <p className="hero-page4__text">
              Leadership at BALITECH is measured not only by the size of the
              organisation, but by the number of people who discover their
              potential inside it.
            </p>
            <blockquote className="hero-page4__quote">
              “Leadership is not about building a company; it is about building
              people who build the company.”
            </blockquote>
            <p className="hero-page4__text">
              Muhammad Sheraz Bali began with seven pioneers and a belief that
              Pakistan could produce a modern organisation built on
              performance, opportunity and professional growth.
            </p>
            <ul className="hero-page4__pillars">
              <li>Built on struggle</li>
              <li>Driven by vision</li>
              <li>Powered by people</li>
            </ul>
          </div>

          {/* The leaf: page 2 on the front, page 3 on the back. */}
          <div className="hero-leaf">
            <div className="hero-stats">
              <span className="hero-page__no" aria-hidden>02</span>
              <div className="hero-art hero-art--right">
                <HeroPageSlider
                  slides={PAGE_SLIDER_RIGHT.slides}
                  tone={PAGE_SLIDER_RIGHT.tone}
                  intervalMs={PAGE_SLIDER_RIGHT.intervalMs}
                />
                <ul className="hero-bubbles">
                  {RIGHT_BUBBLES.slice(0, 3).map((b, i) => (
                    <HeroBubbleSlider
                      key={`${b.slides[0].src}-r${i}`}
                      slides={b.slides}
                      tone={b.tone}
                      size={b.size}
                      intervalMs={b.intervalMs}
                    />
                  ))}
                </ul>
                {/* The rectangle that used to be second on the left page. */}
                <HeroPageSlider
                  slides={PAGE_SLIDERS_LEFT[1].slides}
                  tone={PAGE_SLIDERS_LEFT[1].tone}
                  intervalMs={PAGE_SLIDERS_LEFT[1].intervalMs}
                />
              </div>
              <label
                htmlFor="hero-book-flip"
                className="hero-flip__btn hero-flip__btn--next"
              >
                Turn the page <ArrowRight size={16} aria-hidden />
              </label>
            </div>

            <div className="hero-leaf__back">
              <p className="hero-page__eyebrow">From our magazine</p>
              <span className="hero-page__no" aria-hidden>03</span>
              <figure className="hero-leaf__plate">
                <Image
                  src="/hero/book/magazine-page-2.webp"
                  alt="BALITECH Corporate Edition 2025 magazine page: We didn’t have the infrastructure. We just had the vision. And that vision became BALITECH."
                  fill
                  sizes="(min-width: 1024px) 28vw, 0px"
                  unoptimized
                  className="hero-leaf__img"
                />
                <figcaption className="hero-leaf__cap">
                  The Genesis and the Evolution · Corporate Edition 2025
                </figcaption>
              </figure>
              <label
                htmlFor="hero-book-flip"
                className="hero-flip__btn hero-flip__btn--prev"
              >
                <ArrowRight size={16} aria-hidden className="hero-flip__arrow-back" /> Back
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* The words that used to sit on the pages now sit under the book, in a
        section of their own, so the book keeps its exact size and position.
        The page's single <h1> lives here. */}
    <section className="hero-under" aria-labelledby="hero-title">
      <div className="hero-under__inner">
        <div className="hero-under__copy">
          <p className="hero-page__eyebrow">BPO partner · Since 2022</p>
          <h1 id="hero-title" className="hero-copy__title">
            <span className="hero-copy__title-plain">
              <span className="hero-copy__title-line">Outsourcing</span>{" "}
              <span className="hero-copy__title-line">Built To</span>
            </span>{" "}
            <span className="hero-copy__title-accent">
              <span className="hero-copy__title-line">Scale Your</span>{" "}
              <span className="hero-copy__title-line">Business</span>
            </span>
          </h1>

          <p className="hero-copy__subtitle">{hero.subtitle}</p>

          <IntentLink
            href={hero.careerLink.href}
            className="hero-copy__career"
          >
            {hero.careerLink.label}
            <span className="hero-copy__career-cta">
              Explore Careers
              <ArrowRight size={14} aria-hidden />
            </span>
          </IntentLink>

          <p className="hero-since">Since 2022 · Still running</p>
        </div>

        <div className="hero-under__facts">
          <p className="hero-page__eyebrow">At a glance</p>
          <ul className="hero-under__list">
            {hero.highlights.map((item, index) => {
              const Icon = HIGHLIGHT_ICONS[index] ?? ShieldCheck;
              return (
                <li
                  key={item.value}
                  className={`hero-stat hero-stat--${item.type}`}
                >
                  <Icon className="hero-stat__icon" aria-hidden />
                  <span className="hero-stat__text">
                    <span className="hero-stat__value">{item.value}</span>
                    <span className="hero-stat__label">{item.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="hero-page__note" aria-hidden>
            {companyContent.tagline}
          </p>
        </div>
      </div>
    </section>
    </>
  );
}