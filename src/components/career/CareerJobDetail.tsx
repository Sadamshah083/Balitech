import { ArrowLeft, ArrowRight, Briefcase, Clock, MapPin } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import {
  careerApplyHref,
  formatJobDescription,
  type CareerOpening,
} from "@/lib/careers/career-board";

type Props = {
  opening: CareerOpening;
};

export default function CareerJobDetail({ opening }: Props) {
  const { blocks } = formatJobDescription(opening.description);
  const applyHref = careerApplyHref(opening);

  return (
    <article className="career-detail">
      <div className="ent-shell career-detail__shell">
        <IntentLink href="/career#openings" className="career-detail__back">
          <ArrowLeft size={16} aria-hidden />
          All openings
        </IntentLink>

        <div className="career-detail__meta">
          <span className="career-job__category">{opening.categoryLabel}</span>
          {opening.campaign && (
            <span className="career-job__campaign">{opening.campaign}</span>
          )}
        </div>

        <h1 className="career-detail__title">{opening.title}</h1>

        <ul className="career-detail__facts">
          {opening.branchLabels.length > 0 && (
            <li>
              <MapPin size={16} aria-hidden />
              <span>
                <strong>Branch</strong>
                {opening.branchLabels.join(" · ")}
              </span>
            </li>
          )}
          {opening.workArrangement && (
            <li>
              <Briefcase size={16} aria-hidden />
              <span>
                <strong>Arrangement</strong>
                {opening.workArrangement}
                {opening.remoteAllowed ? " · Remote option" : ""}
              </span>
            </li>
          )}
          {(opening.workingDays || opening.workingHours) && (
            <li>
              <Clock size={16} aria-hidden />
              <span>
                <strong>Schedule</strong>
                {[opening.workingDays, opening.workingHours].filter(Boolean).join(" · ")}
              </span>
            </li>
          )}
        </ul>

        <div className="career-detail__actions">
          <IntentLink href={applyHref} className="ent-btn">
            Apply for this role
            <ArrowRight size={16} aria-hidden />
          </IntentLink>
        </div>

        <section className="career-detail__body" aria-labelledby="career-jd-title">
          <h2 id="career-jd-title" className="career-detail__section-title">
            Job description
          </h2>

          {blocks.length === 0 ? (
            <p className="career-detail__empty-jd">
              {opening.excerpt}
            </p>
          ) : (
            <div className="career-detail__jd">
              {blocks.map((block, i) =>
                block.type === "ul" ? (
                  <ul key={i}>
                    {block.lines.map((line, j) => (
                      <li key={j}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{block.lines[0]}</p>
                )
              )}
            </div>
          )}

          {opening.customQuestion && (
            <div className="career-detail__note">
              <p className="career-detail__note-label">Application question</p>
              <p>{opening.customQuestion}</p>
            </div>
          )}
        </section>

        <div className="career-detail__actions career-detail__actions--bottom">
          <IntentLink href={applyHref} className="ent-btn">
            Apply now
            <ArrowRight size={16} aria-hidden />
          </IntentLink>
          <IntentLink href="/career#openings" className="ent-btn ent-btn--ghost">
            Back to openings
          </IntentLink>
        </div>
      </div>
    </article>
  );
}
