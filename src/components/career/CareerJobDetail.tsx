import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Clock,
  Layers,
  MapPin,
} from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import {
  careerApplyHref,
  jobDescriptionToHtml,
  type CareerOpening,
} from "@/lib/careers/career-board";

type Props = {
  opening: CareerOpening;
};

export default function CareerJobDetail({ opening }: Props) {
  const descriptionHtml = jobDescriptionToHtml(opening.description, opening.title);
  const applyHref = careerApplyHref(opening);

  return (
    <article className="career-detail">
      <div className="ent-shell career-detail__shell">
        <IntentLink href="/career#openings" className="career-detail__back">
          <ArrowLeft size={16} aria-hidden />
          All openings
        </IntentLink>

        <h1 className="career-detail__title">{opening.title}</h1>

        <div className="career-detail__summary">
          <ul className="career-detail__facts">
            <li>
              <Layers size={16} aria-hidden />
              <span>
                <strong>Category</strong>
                {opening.categoryLabel}
                {opening.campaign ? (
                  <span className="career-detail__fact-extra">{opening.campaign}</span>
                ) : null}
              </span>
            </li>
            <li>
              <MapPin size={16} aria-hidden />
              <span>
                <strong>Branch</strong>
                {opening.branchLabels.length > 0
                  ? opening.branchLabels.join(" · ")
                  : opening.remoteAllowed
                    ? "Remote"
                    : "BALITECH offices"}
              </span>
            </li>
            <li>
              <Briefcase size={16} aria-hidden />
              <span>
                <strong>Arrangement</strong>
                {opening.workArrangement?.trim() || "On-site"}
                {opening.remoteAllowed ? " · Remote option" : ""}
              </span>
            </li>
            <li>
              <Clock size={16} aria-hidden />
              <span>
                <strong>Schedule</strong>
                {[opening.workingDays, opening.workingHours].filter(Boolean).join(" · ") ||
                  "Not stated"}
              </span>
            </li>
            <li className="career-detail__facts-apply">
              <IntentLink href={applyHref} className="ent-btn career-detail__apply-btn">
                Apply for this role
                <ArrowRight size={16} aria-hidden />
              </IntentLink>
            </li>
          </ul>
        </div>

        <section className="career-detail__body" aria-labelledby="career-jd-title">
          <h2 id="career-jd-title" className="career-detail__section-title">
            Job description
          </h2>

          {!descriptionHtml ? (
            <p className="career-detail__empty-jd">
              {opening.excerpt}
            </p>
          ) : (
            <div
              className="career-detail__jd"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
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
