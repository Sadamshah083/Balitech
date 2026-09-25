import {
  ArrowRight,
  BarChart3,
  Settings2,
  Shield,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { companyContent } from "@/lib/content";

const { whyUs } = companyContent;

const icons: Record<string, LucideIcon> = {
  users: Users,
  target: Target,
  shield: Shield,
  trending: TrendingUp,
  chart: BarChart3,
  settings: Settings2,
};

/**
 * Home page only: client-facing capability positioning. The pitch sits in the
 * left column so the capability tiles on the right read as evidence for it.
 */
export default function WhyBalitech() {
  return (
    <section
      id="why-balitech"
      className="why-section"
      aria-labelledby="why-balitech-title"
    >
      <div className="ent-shell why-section__shell">
        <div className="why-section__intro">
          <p className="ent-eyebrow">{whyUs.label}</p>
          <h2 id="why-balitech-title" className="ent-title">
            {whyUs.title} <em>{whyUs.highlight}</em>
          </h2>
          <p className="ent-lede">{whyUs.subtitle}</p>

          <IntentLink href="/about" className="ent-btn mt-9">
            Learn More About Us
            <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
          </IntentLink>
        </div>

        <ul className="why-section__tiles">
          {whyUs.items.map((item) => {
            const Icon = icons[item.icon] ?? Shield;

            return (
              <li key={item.num} className="why-tile">
                <span className="why-tile__icon" aria-hidden>
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <h3 className="why-tile__title">{item.title}</h3>
                <p className="why-tile__text">{item.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
