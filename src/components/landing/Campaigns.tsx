"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BentoTilt from "@/components/animations/BentoTilt";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import { getCampaignApplyHref } from "@/lib/apply";
import { companyContent } from "@/lib/content";
import { getCampaignIcon } from "@/lib/icons";

const { programs } = companyContent;

const CAMPAIGNS_DISPLAY_LIMIT = 6;

const displayCampaigns = programs.items
  .slice(0, CAMPAIGNS_DISPLAY_LIMIT)
  .map((item, index) => ({
  id: `program-${index}`,
  title: item.title,
  description: item.description,
  icon: item.icon,
}));

export default function Campaigns() {
  const pathname = usePathname();

  return (
    <section id="campaigns" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="brand-label mb-4">{programs.label}</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            {programs.title}
          </AnimatedTitle>
          <p className="mx-auto mt-6 max-w-2xl text-muted">
            {programs.subtitle}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayCampaigns.map((campaign) => {
            const Icon = getCampaignIcon(campaign.icon);
            const applyHref = getCampaignApplyHref(campaign.title, pathname);

            return (
              <BentoTilt key={campaign.id}>
                <Link
                  href={applyHref}
                  className="group/card block h-full cursor-pointer"
                  aria-label={`Apply for ${campaign.title} campaign`}
                >
                  <div className="glow-border flex h-full flex-col items-center rounded-2xl bg-card p-8 text-center transition-all duration-300 group-hover/card:border-orange">
                    <div className="brand-icon-wrap mb-4 rounded-full p-5 transition">
                      <Icon size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {campaign.title}
                    </h3>
                    {campaign.description && (
                      <p className="mt-2 text-sm text-muted">
                        {campaign.description}
                      </p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-orange transition group-hover/card:gap-2">
                      Apply Now →
                    </span>
                  </div>
                </Link>
              </BentoTilt>
            );
          })}
        </div>
      </div>
    </section>
  );
}
