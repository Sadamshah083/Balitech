"use client";

import { createElement, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { getCampaignApplyHref } from "@/lib/apply";
import { companyContent } from "@/lib/content";
import { getCampaignIcon } from "@/lib/icons";

const { programs } = companyContent;

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
};

function CampaignCard({
  campaign,
  applyHref,
  location,
}: {
  campaign: Campaign;
  applyHref: string;
  location: string;
}) {
  const icon = getCampaignIcon(campaign.icon);
  const bullets = [
    campaign.description ?? "",
    ...programs.defaultRequirements,
  ].slice(0, 2);

  return (
    <article className="campaigns-marquee__card">
      <Link
        href={applyHref}
        className="campaign-job-card group/card"
        aria-label={`Apply for ${campaign.title} campaign`}
      >
        <span className="campaign-job-card__shade" aria-hidden />
        <span className="campaign-job-card__glow" aria-hidden />

        <div className="campaign-job-card__icon" aria-hidden>
          {createElement(icon, { size: 52, strokeWidth: 1.35 })}
        </div>

        <h3 className="campaign-job-card__title">{campaign.title}</h3>

        <p className="campaign-job-card__location">
          <MapPin size={14} className="campaign-job-card__pin" aria-hidden />
          {location}
        </p>

        <ul className="campaign-job-card__list">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <span className="campaign-job-card__apply">Apply Now</span>
      </Link>
    </article>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [location, setLocation] = useState(programs.location);

  useEffect(() => {
    async function load() {
      try {
        const [campaignRes, officeRes] = await Promise.all([
          fetch("/api/campaigns?public=true"),
          fetch("/api/offices?public=true"),
        ]);

        if (campaignRes.ok) {
          const data = await campaignRes.json();
          if (data.campaigns?.length) {
            setCampaigns(data.campaigns);
          } else {
            setCampaigns(
              programs.items.map((item, index) => ({
                id: `program-${index}`,
                title: item.title,
                description: item.description,
                icon: item.icon,
              }))
            );
          }
        }

        if (officeRes.ok) {
          const data = await officeRes.json();
          const head =
            data.offices?.find(
              (office: { isHeadOffice: boolean }) => office.isHeadOffice
            ) ?? data.offices?.[0];
          if (head?.name) {
            setLocation(head.name);
          }
        }
      } catch {
        setCampaigns(
          programs.items.map((item, index) => ({
            id: `program-${index}`,
            title: item.title,
            description: item.description,
            icon: item.icon,
          }))
        );
      }
    }

    load();
  }, []);

  const displayCampaigns =
    campaigns.length > 0
      ? campaigns
      : programs.items.map((item, index) => ({
          id: `program-${index}`,
          title: item.title,
          description: item.description,
          icon: item.icon,
        }));

  const marqueeItems = [...displayCampaigns, ...displayCampaigns];

  return (
    <section id="campaigns" className="section-with-net py-14">
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="brand-label mb-4">{programs.label}</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            {programs.title}
          </AnimatedTitle>
          <p className="campaigns-section__subtitle mx-auto mt-6 max-w-2xl">
            {programs.subtitle}
          </p>
        </div>
      </div>

      <div className="campaigns-marquee-lane relative z-[1]">
        <div className="campaigns-marquee-lane__line" aria-hidden />

        <div className="campaigns-marquee relative overflow-hidden">
          <div className="campaigns-marquee__fade campaigns-marquee__fade--left" aria-hidden />
          <div className="campaigns-marquee__fade campaigns-marquee__fade--right" aria-hidden />

          <div className="campaigns-marquee__track">
            {marqueeItems.map((campaign, index) => (
              <CampaignCard
                key={`${campaign.id}-${index}`}
                campaign={campaign}
                applyHref={getCampaignApplyHref(campaign.title)}
                location={location}
              />
            ))}
          </div>
        </div>

        <div className="campaigns-marquee-lane__line" aria-hidden />
      </div>
    </section>
  );
}
