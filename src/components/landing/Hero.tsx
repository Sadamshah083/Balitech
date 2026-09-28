"use client";

import IntentLink from "@/components/navigation/IntentLink";
import {
  ArrowRight,
  BarChart3,
  Clock,
  FileText,
  Headphones,
  PhoneOutgoing,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import HeroBackgroundSlider from "@/components/landing/HeroBackgroundSlider";
import { companyContent } from "@/lib/content";
import { HERO_INTRO_WORDMARK } from "@/lib/hero-loader";

const INTRO_HEIGHT = "100dvh";
const { hero } = companyContent;

/* Paired with `hero.highlights` by position: headcount, coverage, QA, scaling. */
const HIGHLIGHT_ICONS: LucideIcon[] = [Users, Clock, ShieldCheck, BarChart3];

const SERVICE_ICONS: LucideIcon[] = [
  Headphones,
  PhoneOutgoing,
  Users,
  Settings,
  FileText,
];

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

      {/* The two-column grid and the services strip share one container and
          stack in normal flow, so the strip always sits under the grid. */}
      <div className="hero-container">
        <div className="hero-shell">
          <div className="hero-copy">
            <h1 className="hero-copy__title hero-pitch__reveal">
              <span className="hero-copy__title-line">Outsourcing</span>{" "}
              <span className="hero-copy__title-line">Built To</span>{" "}
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
          </div>

          <div className="hero-media">
            <span className="hero-media__orbit" aria-hidden />

            <div className="hero-media__frame">
              <HeroBackgroundSlider onFirstImageReady={handleImageReady} />
              <span className="hero-media__scrim" aria-hidden />

              <div className="hero-media__badge" aria-hidden>
                <span className="hero-media__badge-dot" />
                <span className="hero-media__badge-text">
                  <strong>Life at {companyContent.name}</strong>
                  <span>Explore our work culture</span>
                </span>
              </div>
            </div>

            <ul className="hero-media__stats">
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
          </div>
        </div>

        <nav className="hero-services" aria-label="Our services">
          <ul className="hero-services__list">
            {hero.services.map((service, index) => {
              const Icon = SERVICE_ICONS[index] ?? Headphones;
              return (
                <li key={service.label}>
                  <IntentLink href={service.href} className="hero-services__item">
                    <Icon className="hero-services__icon" aria-hidden />
                    <span>{service.label}</span>
                  </IntentLink>
                </li>
              );
            })}
          </ul>

          <IntentLink href="/services" className="hero-services__cta">
            <span className="hero-services__cta-arrow" aria-hidden>
              <ArrowRight size={18} />
            </span>
            <span className="hero-services__cta-text">
              <span>Discover How</span>
              <strong>We Help Businesses Grow</strong>
            </span>
          </IntentLink>
        </nav>
      </div>
    </section>
  );
}
