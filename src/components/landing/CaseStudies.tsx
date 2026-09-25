import { ArrowRight, ArrowUpRight } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { companyContent } from "@/lib/content";

const { caseStudies } = companyContent.proof;

/**
 * Renders nothing until BALITECH supplies approved client outcomes, so the
 * site never shows placeholder or unverifiable numbers.
 */
export default function CaseStudies() {
  if (caseStudies.items.length === 0) return null;

  return (
    <section id="results" className="impact" aria-labelledby="case-studies-title">
      <div className="ent-shell">
        <div className="ent-head-split">
          <header className="ent-head">
            <p className="ent-eyebrow">{caseStudies.label}</p>
            <h2 id="case-studies-title" className="ent-title">
              {caseStudies.title} <em>Delivered</em>
            </h2>
            <p className="ent-lede">{caseStudies.subtitle}</p>
          </header>

          <IntentLink
            href="/services"
            className="ent-btn ent-btn--ghost shrink-0"
          >
            View Case Studies
            <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
          </IntentLink>
        </div>

        <div className="impact__grid">
          {caseStudies.items.map((study) => (
            <article
              key={`${study.client}-${study.industry}`}
              className="impact-card"
            >
              <div className="impact-card__head">
                <h3 className="impact-card__client">{study.client}</h3>
                <span className="impact-card__tag">{study.industry}</span>
              </div>

              <dl className="impact-card__body">
                <div>
                  <dt className="impact-card__label">Challenge</dt>
                  <dd className="impact-card__text">{study.challenge}</dd>
                </div>
                <div>
                  <dt className="impact-card__label">BALITECH solution</dt>
                  <dd className="impact-card__text">{study.solution}</dd>
                </div>
              </dl>

              <div className="impact-card__foot">
                <ul className="impact-card__results">
                  {study.results.map((result) => (
                    <li key={result.label} className="impact-card__result">
                      <span className="impact-card__result-value">
                        {result.value}
                      </span>
                      {result.label}
                    </li>
                  ))}
                </ul>

                <span className="impact-card__arrow" aria-hidden>
                  <ArrowUpRight size={16} strokeWidth={2.25} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
