import { ArrowRight, Briefcase, Clock, MapPin } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import {
  careerApplyHref,
  careerDetailHref,
  listCareerOpenings,
} from "@/lib/careers/career-board";
import { companyContent } from "@/lib/content";
import { careerHref, joinUsHref } from "@/lib/navigation";

const { career } = companyContent;
const HOME_VACANCY_LIMIT = 3;

/**
 * Active admin vacancies as cards in a row on the home page, above the
 * business / professionals audience split.
 */
export default async function HomeOpenVacancies() {
  const openings = (await listCareerOpenings()).slice(0, HOME_VACANCY_LIMIT);

  return (
    <section
      id="open-vacancies"
      className="home-vacancies"
      aria-labelledby="home-vacancies-title"
    >
      <div className="home-vacancies__aura" aria-hidden />

      <div className="ent-shell">
        <div className="home-vacancies__head">
          <div>
            <p className="ent-eyebrow">Open vacancies</p>
            <h2 id="home-vacancies-title" className="ent-title">
              {career.titleLine} <em>{career.titleHighlight}</em>
            </h2>
            <p className="ent-lede">{career.description}</p>
          </div>

          <div className="home-vacancies__actions">
            <IntentLink href={careerHref} className="ent-btn">
              View all openings
              <ArrowRight size={16} aria-hidden />
            </IntentLink>
            <IntentLink href={`${joinUsHref}#apply`} scroll={false} className="ent-btn ent-btn--ghost">
              {career.cta}
            </IntentLink>
          </div>
        </div>

        {openings.length === 0 ? (
          <div className="home-vacancies__empty">
            <p>No open roles are listed right now. You can still send a general application.</p>
            <IntentLink href={`${joinUsHref}#apply`} scroll={false} className="ent-btn">
              Apply on Join Us
              <ArrowRight size={16} aria-hidden />
            </IntentLink>
          </div>
        ) : (
          <ul className="home-vacancies__row">
            {openings.map((opening) => {
              const schedule = [opening.workingDays, opening.workingHours]
                .filter(Boolean)
                .join(" · ");
              const branch =
                opening.branchLabels.length > 0
                  ? opening.branchLabels.join(" · ")
                  : opening.remoteAllowed
                    ? "Remote"
                    : "BALITECH offices";

              return (
                <li key={opening.id} className="home-vacancies__item">
                  <article className="home-vacancy-card">
                    <div className="home-vacancy-card__meta">
                      <span className="career-job__category">{opening.categoryLabel}</span>
                      {opening.campaign && (
                        <span className="career-job__campaign">{opening.campaign}</span>
                      )}
                    </div>

                    <h3 className="home-vacancy-card__title">
                      <IntentLink href={careerDetailHref(opening)}>
                        {opening.title}
                      </IntentLink>
                    </h3>

                    <ul className="home-vacancy-card__facts">
                      <li>
                        <MapPin size={16} aria-hidden />
                        <span>
                          <strong>Branch</strong>
                          {branch}
                        </span>
                      </li>
                      <li>
                        <Briefcase size={16} aria-hidden />
                        <span>
                          <strong>Arrangement</strong>
                          {opening.workArrangement || "On-site"}
                          {opening.remoteAllowed ? " · Remote option" : ""}
                        </span>
                      </li>
                      {schedule && (
                        <li>
                          <Clock size={16} aria-hidden />
                          <span>
                            <strong>Schedule</strong>
                            {schedule}
                          </span>
                        </li>
                      )}
                    </ul>

                    <div className="home-vacancy-card__actions">
                      <IntentLink href={careerApplyHref(opening)} className="ent-btn">
                        Apply for this role
                        <ArrowRight size={16} aria-hidden />
                      </IntentLink>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
