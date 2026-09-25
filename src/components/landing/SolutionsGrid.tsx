import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  ClipboardList,
  Clock,
  Headphones,
  Phone,
  Shield,
  Target,
  type LucideIcon,
} from "lucide-react";
import { companyContent } from "@/lib/content";
import { serviceHref } from "@/lib/service-pages";

const { solutions } = companyContent;

const icons: Record<string, LucideIcon> = {
  headphones: Headphones,
  phone: Phone,
  clock: Clock,
  target: Target,
  shield: Shield,
  clipboard: ClipboardList,
  briefcase: Briefcase,
};

/**
 * Services page only: the full service catalogue with scope detail.
 */
export default function SolutionsGrid() {
  return (
    <section
      id="solutions"
      className="ent-section ent-section--lit"
      aria-labelledby="solutions-grid-title"
    >
      <div className="ent-shell">
        <header className="ent-head">
          <p className="ent-eyebrow">{solutions.label}</p>
          <h2 id="solutions-grid-title" className="ent-title">
            {solutions.title} <em>{solutions.highlight}</em>
          </h2>
          <p className="ent-lede">{solutions.subtitle}</p>
        </header>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {solutions.items.map((item) => {
            const Icon = icons[item.icon] ?? Briefcase;

            return (
              <article
                key={item.id}
                id={item.id}
                className="ent-card scroll-mt-28"
              >
                <span className="ent-card__icon" aria-hidden>
                  <Icon size={25} strokeWidth={1.6} />
                </span>

                <h3 className="ent-card__title">
                  <Link href={serviceHref(item.id)} className="hover:text-orange">
                    {item.title}
                  </Link>
                </h3>
                <p className="ent-card__text">{item.summary}</p>

                <div className="mt-6 rounded-lg border border-foreground/10 bg-background/40 p-4">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-orange">
                    Who it is for
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {item.forWho}
                  </p>
                </div>

                <p className="mt-7 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-muted/70">
                  Capabilities
                </p>
                <ul className="mt-3 space-y-2">
                  {item.capabilities.map((capability) => (
                    <li
                      key={capability}
                      className="solutions-grid__bullet text-sm text-foreground/80"
                    >
                      {capability}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-7">
                  <Link href={serviceHref(item.id)} className="ent-link">
                    Explore {item.title.toLowerCase()}
                    <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
                  </Link>
                  <Link href="#contact" className="ent-link">
                    Discuss this service
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
