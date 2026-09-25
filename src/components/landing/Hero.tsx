"use client";

import IntentLink from "@/components/navigation/IntentLink";
import { ArrowRight } from "lucide-react";
import HeroBackgroundSlider from "@/components/landing/HeroBackgroundSlider";
import { companyContent } from "@/lib/content";
import { HERO_INTRO_WORDMARK } from "@/lib/hero-loader";

const INTRO_HEIGHT = "100dvh";
const { hero } = companyContent;

const handleImageReady = () => {};

export default function Hero() {
  return (
    <section id="home" className="hero-section">
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

      <div className="hero-shell">
        <div className="hero-copy">
          <h1 className="hero-copy__title hero-pitch__reveal">
            {hero.titleLine1}{" "}
            <span className="hero-copy__title-accent">{hero.titleLine2}</span>
          </h1>

          <p className="hero-copy__subtitle hero-pitch__reveal">
            {hero.subtitle}
          </p>

          <div className="hero-copy__actions hero-pitch__reveal">
            <IntentLink href={hero.primaryCta.href} className="ent-btn ent-btn--lg">
              {hero.primaryCta.label}
              <ArrowRight size={17} aria-hidden />
            </IntentLink>
            <IntentLink
              href={hero.secondaryCta.href}
              className="ent-btn ent-btn--lg ent-btn--ghost"
            >
              {hero.secondaryCta.label}
            </IntentLink>
          </div>

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
        </div>

        <div className="hero-media">
          <div className="hero-media__frame">
            <HeroBackgroundSlider onFirstImageReady={handleImageReady} />
            <span className="hero-media__scrim" aria-hidden />
            <span className="hero-media__tag" aria-hidden>
              {companyContent.name}
            </span>
          </div>

          <ul className="hero-media__stats">
            {hero.highlights.map((item) => (
              <li key={item.value} className={`hero-stat hero-stat--${item.type}`}>
                <span className="hero-stat__value">{item.value}</span>
                <span className="hero-stat__label">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
