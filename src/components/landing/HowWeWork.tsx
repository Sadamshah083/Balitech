import Image from "next/image";
import { ArrowRight } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { companyContent } from "@/lib/content";
import { homeOperationsImage } from "@/lib/page-imagery";

const { howWeWork } = companyContent;

/**
 * Home page only: the five-step onboarding path, framed against the operations
 * floor so the process reads as something that physically happens somewhere.
 */
export default function HowWeWork() {
  return (
    <section
      id="how-we-work"
      className="operations"
      aria-labelledby="how-we-work-title"
    >
      <div className="ent-shell">
        <div className="operations__top">
          <figure className="operations__media">
            <Image
              src={homeOperationsImage.src}
              alt={homeOperationsImage.alt}
              width={1280}
              height={960}
              className="operations__image"
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
            <span className="operations__media-scrim" aria-hidden />
            <figcaption className="operations__media-tag">
              Inside the operation
            </figcaption>
          </figure>

          <div className="operations__intro">
            <p className="ent-eyebrow">{howWeWork.label}</p>
            <h2 id="how-we-work-title" className="ent-title">
              {howWeWork.title} <em>{howWeWork.highlight}</em>
            </h2>
            <p className="ent-lede">{howWeWork.subtitle}</p>

            <IntentLink href="/services#delivery" className="ent-btn mt-9">
              See How We Work
              <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
            </IntentLink>
          </div>
        </div>

        <ol className="operations__steps">
          {howWeWork.steps.map((step) => (
            <li key={step.num} className="operations__step">
              <div className="operations__marker" aria-hidden>
                <span className="operations__num">{step.num}</span>
              </div>
              <h3 className="operations__step-title">{step.title}</h3>
              <p className="operations__step-text">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
