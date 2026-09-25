import {
  Award,
  Eye,
  Handshake,
  Shield,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { companyContent } from "@/lib/content";

const { values } = companyContent;

const icons: Record<string, LucideIcon> = {
  award: Award,
  users: Users,
  shield: Shield,
  eye: Eye,
  trending: TrendingUp,
  handshake: Handshake,
};

/**
 * About page only: operating principles. Distinct from the home page's
 * client-facing capability section.
 */
export default function CompanyValues() {
  return (
    <section
      id="values"
      className="ent-section ent-section--lit"
      aria-labelledby="company-values-title"
    >
      <div className="ent-shell">
        <header className="ent-head">
          <p className="ent-eyebrow">{values.label}</p>
          <h2 id="company-values-title" className="ent-title">
            {values.title} <em>{values.highlight}</em>
          </h2>
          <p className="ent-lede">{values.subtitle}</p>
        </header>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {values.items.map((item, index) => {
            const Icon = icons[item.icon] ?? Award;

            return (
              <article key={item.title} className="ent-card">
                <div className="flex items-start justify-between">
                  <span className="ent-card__icon" aria-hidden>
                    <Icon size={25} strokeWidth={1.6} />
                  </span>
                  <span className="ent-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="ent-card__title">{item.title}</h3>
                <p className="ent-card__text">{item.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
