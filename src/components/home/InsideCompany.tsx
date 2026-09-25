import Image from "next/image";
import { ArrowRight } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { companyContent } from "@/lib/content";
import { homeCollage } from "@/lib/page-imagery";

const { insideCompany } = companyContent;

/**
 * Home page only: a short culture teaser. The full employer-brand story
 * (trips, awards, events, benefits) lives on the careers page.
 */
export default function InsideCompany() {
  return (
    <section
      id="inside-balitech"
      className="culture"
      aria-labelledby="inside-balitech-title"
    >
      <div className="ent-shell culture__shell">
        <div className="culture__intro">
          <p className="ent-eyebrow">{insideCompany.label}</p>
          <h2 id="inside-balitech-title" className="ent-title">
            {insideCompany.title} <em>{insideCompany.highlight}</em>
          </h2>
          <p className="ent-lede">{insideCompany.subtitle}</p>

          <dl className="culture__stats">
            {insideCompany.highlights.map((item) => (
              <div key={item.value} className="culture__stat">
                <dd className="culture__stat-value">{item.value}</dd>
                <dt className="culture__stat-label">{item.label}</dt>
              </div>
            ))}
          </dl>

          <IntentLink href={insideCompany.cta.href} className="ent-btn mt-9">
            {insideCompany.cta.label}
            <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
          </IntentLink>
        </div>

        <ul className="culture__strip">
          {homeCollage.map((photo) => (
            <li key={photo.src} className="culture__frame">
              <Image
                src={photo.src}
                alt={photo.alt}
                width={760}
                height={950}
                className="culture__photo"
                sizes="(max-width: 1024px) 33vw, 17vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
