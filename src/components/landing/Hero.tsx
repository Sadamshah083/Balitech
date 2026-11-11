import Image from "next/image";
import IntentLink from "@/components/navigation/IntentLink";
import { ArrowRight, BarChart3, Clock, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import HeroCarousel, { type HeroSlide } from "@/components/landing/HeroCarousel";import { companyContent } from "@/lib/content";
import { HERO_INTRO_WORDMARK } from "@/lib/hero-loader";

const INTRO_HEIGHT = "100dvh";
const { hero } = companyContent;

/* Paired with `hero.highlights` by position: headcount, coverage, QA, scaling. */
const HIGHLIGHT_ICONS: LucideIcon[] = [Users, Clock, ShieldCheck, BarChart3];

const HERO_SLIDES: HeroSlide[] = [
  { src: "/hero/slides/hero-slide-12.webp", alt: "BALITECH Commercial team members smiling at the Hello Summer event in Rawalpindi", width: 803, height: 578, framed: true },
  { src: "/hero/slides/hero-slide-1.webp", alt: "BALITECH call center agent in Rawalpindi giving two thumbs up", width: 708, height: 1100 },
  { src: "/hero/slides/hero-slide-3.webp", alt: "BALITECH team lead in company uniform at the Rawalpindi BPO office", width: 512, height: 1100 },
  { src: "/hero/slides/hero-slide-4.webp", alt: "BALITECH customer support professional in company uniform", width: 520, height: 1100 },
  { src: "/hero/slides/hero-slide-7.webp", alt: "BALITECH colleague seated in the call center office", width: 991, height: 1008 },
  { src: "/hero/slides/hero-slide-8.webp", alt: "BALITECH BPO team members sharing cupcakes for Pinktober", width: 1100, height: 715 },
  { src: "/hero/slides/hero-slide-9.webp", alt: "Four BALITECH call center team members in green shirts at the Hello Summer event", width: 483, height: 262 },
  { src: "/hero/slides/hero-slide-11.webp", alt: "Three BALITECH team members in red at the Hello Summer event", width: 501, height: 287 },
];
export default function Hero() {
  return (
    <section id="home" className="hero-section" aria-labelledby="hero-title">
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

      {/* The two-column grid and the services strip share one container and
          stack in normal flow, so the strip always sits under the grid. */}
      <div className="hero-container">
        <div className="hero-shell">
          {/* Page-turn state lives in this checkbox, so the whole book stays
              server-rendered and every word is in the HTML for crawlers. */}
          <input
            type="checkbox"
            id="hero-book-flip"
            className="hero-flip__input"
            aria-label="Turn the page to read more from the BALITECH magazine"
          />
          <div className="hero-copy">
            <p className="hero-page__eyebrow hero-pitch__reveal">
              BPO partner · Since 2022
            </p>
            <span className="hero-page__no" aria-hidden>01</span>
            <h1 id="hero-title" className="hero-copy__title hero-pitch__reveal">
              <span className="hero-copy__title-plain">
                <span className="hero-copy__title-line">Outsourcing</span>{" "}
                <span className="hero-copy__title-line">Built To</span>
              </span>{" "}
              <span className="hero-copy__title-accent">
                <span className="hero-copy__title-line">Scale Your</span>{" "}
                <span className="hero-copy__title-line">Business</span>
              </span>
            </h1>

            <p className="hero-copy__subtitle hero-pitch__reveal">
              {hero.subtitle}
            </p>

            <IntentLink
              href={hero.careerLink.href}
              className="hero-copy__career hero-pitch__reveal"
            >
              {hero.careerLink.label}
              <span className="hero-copy__career-cta">
                Explore Careers
                <ArrowRight size={14} aria-hidden />
              </span>
            </IntentLink>

            <p className="hero-since">Since 2022 · Still running</p>
          </div>

          <div className="hero-media">
            <div className="hero-stage">
              <span className="hero-stage__orbit" aria-hidden />
              <span className="hero-stage__disc" aria-hidden />
              <HeroCarousel slides={HERO_SLIDES} />
            </div>
          </div>

          {/* Page 4, waiting under the leaf. Text taken from the BALITECH
              Corporate Edition 2025 magazine. */}
          <div className="hero-page4">
            <p className="hero-page__eyebrow">The Architect</p>
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
              <p className="hero-page__eyebrow">At a glance</p>
              <span className="hero-page__no" aria-hidden>02</span>
              <ul className="hero-stats__list">
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
  );
}