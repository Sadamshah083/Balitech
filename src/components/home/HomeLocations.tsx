import { ArrowRight, Building2, Clock, MapPin } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { getPublicOffices } from "@/lib/offices";

/**
 * Home page only: a compact locations strip. The full office pages with maps
 * and per-branch contact details live at /our-offices.
 */
export default async function HomeLocations() {
  const offices = await getPublicOffices();
  if (offices.length === 0) return null;

  return (
    <section
      id="locations"
      className="ent-section"
      aria-labelledby="home-locations-title"
    >
      <div className="ent-shell">
        <header className="ent-head">
          <p className="ent-eyebrow">Where We Operate</p>
          <h2 id="home-locations-title" className="ent-title">
            Four Offices Across{" "}
            <em>Rawalpindi &amp; Islamabad</em>
          </h2>
          <p className="ent-lede">
            Physical operations floors with redundant connectivity and backup
            power, not a distributed remote workforce.
          </p>
        </header>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {offices.map((office) => (
            <article key={office.id} className="ent-card">
              <div className="flex items-center justify-between">
                <span className="ent-card__icon" aria-hidden>
                  <Building2 size={25} strokeWidth={1.6} />
                </span>
                {/* The branch name already carries the location, so the badge
                    marks the role instead of repeating it. */}
                {office.isHeadOffice && (
                  <span className="home-locations__badge">Primary</span>
                )}
              </div>

              <h3 className="ent-card__title">{office.name}</h3>

              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0 text-orange/70"
                  aria-hidden
                />
                {office.address}
              </p>

              {office.hours && (
                <p className="mt-3 flex items-start gap-2 text-sm text-muted">
                  <Clock
                    size={15}
                    className="mt-0.5 shrink-0 text-orange/70"
                    aria-hidden
                  />
                  {office.hours}
                </p>
              )}
            </article>
          ))}
        </div>

        <div className="mt-9">
          <IntentLink href="/our-offices" className="ent-link">
            View office details and maps
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </IntentLink>
        </div>
      </div>
    </section>
  );
}
