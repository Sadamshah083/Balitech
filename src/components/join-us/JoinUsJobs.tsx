import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import HomeCareersRail, {
  type HomeCareersSlide,
} from "@/components/home/HomeCareersRail";
import { getCampaignApplyHref } from "@/lib/apply";
import { getPublicCampaigns } from "@/lib/campaigns";
import { companyContent } from "@/lib/content";

const { programs } = companyContent;

/**
 * Same glowing job cards as the homepage careers rail, so /join-us and /
 * show one hiring list with the same look and Apply Now path.
 */
export default async function JoinUsJobs() {
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
      id="openings"
      className="join-us-jobs section-with-net"
      aria-labelledby="join-us-jobs-title"
    >
      <SectionAnimatedNet />
      <div className="join-us-jobs__inner">
        <header className="join-us-jobs__header">
          <p className="brand-label">Open Positions</p>
          <h2 id="join-us-jobs-title" className="join-us-jobs__title">
            <HeadingLastWord text="Current Job Openings" />
          </h2>
          <p className="join-us-jobs__lede">
            Click a role to apply. Your application opens with that campaign
            ready to confirm.
          </p>
        </header>
      </div>

      <HomeCareersRail
        slides={slides}
        defaultRequirements={[...programs.defaultRequirements]}
      />
    </section>
  );
}
