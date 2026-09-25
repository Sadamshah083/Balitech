import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { companyContent } from "@/lib/content";

const { engagementModels } = companyContent;

/**
 * Services page only: how a client can structure the commercial relationship.
 */
export default function EngagementModels() {
  return (
    <section
      id="engagement"
      className="ent-section"
      aria-labelledby="engagement-models-title"
    >
      <div className="ent-shell">
        <header className="ent-head ent-head--center">
          <p className="ent-eyebrow">{engagementModels.label}</p>
          <h2 id="engagement-models-title" className="ent-title">
            {engagementModels.title} <em>{engagementModels.highlight}</em>
          </h2>
          <p className="ent-lede">{engagementModels.subtitle}</p>
        </header>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {engagementModels.models.map((model) => {
            const featured = "featured" in model && model.featured;

            return (
              <article
                key={model.name}
                className={`ent-card engagement-card${
                  featured ? " engagement-card--featured" : ""
                }`}
              >
                {featured && (
                  <span className="engagement-card__flag">Most common</span>
                )}

                <h3 className="text-xl font-bold text-foreground">
                  {model.name}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {model.summary}
                </p>

                <div className="mt-6 rounded-lg border border-foreground/10 bg-background/40 p-4">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-orange">
                    Best for
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {model.bestFor}
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5">
                  {model.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-foreground/80"
                    >
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-orange"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <Link href="#contact" className="ent-link">
                    Discuss this model
                    <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
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
