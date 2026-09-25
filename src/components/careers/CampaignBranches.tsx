import { Fragment } from "react";
import { MapPin } from "lucide-react";

/**
 * The branches a campaign is hiring at.
 *
 * Most run at a single office and read exactly as they did when a campaign
 * could only have one. Some run at several — Final Expense is hiring at Iran
 * Road and Commercial — and those name every branch, because which office a
 * job is at is the first thing an applicant looks for.
 *
 * The card wrapping this is a link with its own `aria-label` covering the
 * branches, so the separators here are decorative only.
 */
export default function CampaignBranches({
  branches,
  className,
  iconSize = 13,
}: {
  branches: string[];
  className?: string;
  iconSize?: number;
}) {
  const classes = ["job-branches", className].filter(Boolean).join(" ");

  return (
    <p className={classes} data-count={branches.length}>
      <MapPin size={iconSize} className="job-branches__pin" aria-hidden />
      <span className="job-branches__list">
        {branches.map((branch, index) => (
          <Fragment key={branch}>
            {index > 0 && (
              <span className="job-branches__sep" aria-hidden>
                ·
              </span>
            )}
            <span className="job-branches__item">{branch}</span>
          </Fragment>
        ))}
      </span>
    </p>
  );
}
