import IntentLink from "@/components/navigation/IntentLink";
import { ArrowRight } from "lucide-react";
import { getPublicCampaigns } from "@/lib/campaigns";
import { getCampaignApplyHref } from "@/lib/apply";
import { companyContent } from "@/lib/content";
import { careerHref, joinUsHref } from "@/lib/navigation";
import HomeCareersRail, { type HomeCareersSlide } from "./HomeCareersRail";

const { career, programs } = companyContent;

/**
 * Hiring cards for the home page. The slides are built on the server so every
 * role ships in the initial HTML; the child only owns the paging. Each card
 * links straight into the application form with the role pre-selected.
 */
export default async function HomeCareers() {
  const campaigns = await getPublicCampaigns();
  if (campaigns.length === 0) return null;

  const slides: HomeCareersSlide[] = campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    icon: campaign.icon,
    branches: campaign.locations,
    applyHref: getCampaignApplyHref(campaign.title),
    bullets: [campaign.description, ...programs.defaultRequirements]
      .filter((bullet): bullet is string => Boolean(bullet?.trim()))
      .slice(0, 2),
  }));

  return (
    <section
      id="careers"
      className="home-careers"
      aria-labelledby="home-careers-title"
    >
      <div className="home-careers__aura" aria-hidden />

      <div className="ent-shell">
        <div className="home-careers__head">
          <div>
            <p className="ent-eyebrow">For Professionals</p>
            <h2 id="home-careers-title" className="ent-title">
              {career.titleLine} <em>{career.titleHighlight}</em>
            </h2>
            <p className="ent-lede">{career.description}</p>
          </div>

          <div className="home-careers__actions">
            <IntentLink href={`${joinUsHref}#apply`} scroll={false} className="ent-btn">
              {career.cta}
              <ArrowRight size={16} aria-hidden />
            </IntentLink>
            <IntentLink href={careerHref} className="ent-btn ent-btn--ghost">
              All Openings
            </IntentLink>
          </div>
        </div>
      </div>

      <HomeCareersRail
        slides={slides}
        defaultRequirements={[...programs.defaultRequirements]}
      />

      <div className="ent-shell">
        <p className="home-careers__note">{career.salary}</p>
      </div>
    </section>
  );
}
