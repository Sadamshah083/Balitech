import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  ClipboardList,
  Headphones,
  PhoneIncoming,
  Shield,
  Target,
  type LucideIcon,
} from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { companyContent } from "@/lib/content";

const { services } = companyContent;

const icons: Record<string, LucideIcon> = {
  headphones: Headphones,
  "phone-incoming": PhoneIncoming,
  target: Target,
  briefcase: Briefcase,
  shield: Shield,
  clipboard: ClipboardList,
};

export default function ServiceCards() {
  return (
    <section
      id="services"
      className="ent-section ent-section--lit"
      aria-labelledby="home-services-title"
    >
      <div className="ent-shell">
        <div className="ent-head-split">
          <header className="ent-head">
            <p className="ent-eyebrow">{services.label}</p>
            <h2 id="home-services-title" className="ent-title">
              {services.title} <em>{services.highlight}</em>
            </h2>
            <p className="ent-lede">{services.subtitle}</p>
          </header>

          <IntentLink
            href="/services"
            className="ent-btn ent-btn--ghost shrink-0"
          >
            View All Solutions
            <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
          </IntentLink>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.cards.map((card, index) => {
            const Icon = icons[card.icon] ?? Headphones;

            return (
              <article key={card.id} className="ent-card">
                <div className="flex items-start justify-between">
                  <span className="ent-card__icon" aria-hidden>
                    <Icon size={26} strokeWidth={1.6} />
                  </span>
                  <span className="ent-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="ent-card__title">{card.title}</h3>
                <p className="ent-card__text">{card.description}</p>

                <div className="mt-auto pt-8">
                  {/* Six cards, one destination between them. Left to itself
                      Next prefetches /services once per card as the grid
                      scrolls past — the same route fetched six times while the
                      visitor is moving. The heading's button above warms it on
                      hover for anyone heading that way. */}
                  <Link
                    href={`/services#${card.id}`}
                    prefetch={false}
                    className="ent-card__cta"
                    aria-label={`${card.title} — see how it works`}
                  >
                    See how it works
                    <span className="ent-card__cta-arrow" aria-hidden>
                      <ArrowRight size={14} strokeWidth={2.4} />
                    </span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
