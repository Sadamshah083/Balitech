import Image from "next/image";
import IntentLink from "@/components/navigation/IntentLink";
import { ArrowRight, Check } from "lucide-react";
import { companyContent } from "@/lib/content";
import { homeCareersPathImage } from "@/lib/page-imagery";

const { audiencePaths } = companyContent;

/** Rising bars, drawn in CSS so the business card needs no stock imagery. */
const chartBars = [38, 52, 46, 68, 84, 100];

export default function AudiencePaths() {
  return (
    <section
      id="start-here"
      className="paths"
      aria-labelledby="audience-paths-title"
    >
      <div className="ent-shell">
        <h2 id="audience-paths-title" className="sr-only">
          {audiencePaths.title}
        </h2>

        <div className="paths__grid">
          {audiencePaths.paths.map((path) => (
            <article key={path.id} className={`path-card path-card--${path.id}`}>
              <div className="path-card__body">
                <p className="path-card__eyebrow">{path.eyebrow}</p>
                <h3 className="path-card__title">{path.title}</h3>
                <p className="path-card__text">{path.description}</p>

                <ul className="path-card__list">
                  {path.bullets.map((bullet) => (
                    <li key={bullet}>
                      <Check size={15} strokeWidth={2.5} aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>

                <IntentLink href={path.cta.href} className="ent-btn path-card__cta">
                  {path.cta.label}
                  <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
                </IntentLink>
              </div>

              <div className="path-card__visual" aria-hidden>
                {path.id === "business" ? (
                  <div className="path-chart">
                    {chartBars.map((height, index) => (
                      <span
                        key={height}
                        className="path-chart__bar"
                        style={{
                          height: `${height}%`,
                          animationDelay: `${index * 90}ms`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Image
                    src={homeCareersPathImage.src}
                    alt=""
                    width={1024}
                    height={683}
                    className="path-card__photo"
                    sizes="(max-width: 900px) 60vw, 30vw"
                  />
                )}
                <span className="path-card__fade" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
