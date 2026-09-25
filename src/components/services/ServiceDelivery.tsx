import {
  BarChart3,
  Check,
  Lock,
  Server,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { companyContent } from "@/lib/content";

const { serviceDelivery } = companyContent;

const icons: Record<string, LucideIcon> = {
  shield: Shield,
  server: Server,
  chart: BarChart3,
  lock: Lock,
};

/**
 * Services page only: the operating layer around a campaign. Deliberately
 * distinct from the home page's "Why BALITECH" positioning section.
 */
export default function ServiceDelivery() {
  return (
    <section
      id="delivery"
      className="ent-section ent-section--raised"
      aria-labelledby="service-delivery-title"
    >
      <div className="ent-shell">
        <header className="ent-head">
          <p className="ent-eyebrow">{serviceDelivery.label}</p>
          <h2 id="service-delivery-title" className="ent-title">
            {serviceDelivery.title} <em>{serviceDelivery.highlight}</em>
          </h2>
          <p className="ent-lede">{serviceDelivery.subtitle}</p>
        </header>

        <div className="ent-grid mt-12 sm:grid-cols-2">
          {serviceDelivery.pillars.map((pillar) => {
            const Icon = icons[pillar.icon] ?? Shield;

            return (
              <article key={pillar.title} className="ent-grid__cell">
                <span className="ent-card__icon" aria-hidden>
                  <Icon size={25} strokeWidth={1.6} />
                </span>

                <h3 className="ent-card__title">{pillar.title}</h3>
                <p className="ent-card__text">{pillar.text}</p>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {pillar.points.map((point) => (
                    <li key={point} className="service-delivery__chip">
                      <Check size={12} strokeWidth={3} aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
