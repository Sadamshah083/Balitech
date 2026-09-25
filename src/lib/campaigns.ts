import { isDatabaseAvailable, prisma } from "@/lib/prisma";
import { companyContent } from "@/lib/content";
import {
  initialCampaignLocations,
  parseCampaignLocations,
} from "@/lib/campaign-locations";

export type PublicCampaign = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  /** Every branch this campaign is hiring at. Never empty. */
  locations: string[];
};

function fallbackCampaigns(): PublicCampaign[] {
  return companyContent.programs.items.map((item, index) => ({
    id: `program-${index}`,
    title: item.title,
    description: item.description,
    icon: item.icon,
    locations: initialCampaignLocations(item.title),
  }));
}

/**
 * Server-side campaign list so hiring cards ship in the initial HTML. The
 * client carousel on /join-us still fetches, but pages that only render can
 * skip the round trip.
 */
export async function getPublicCampaigns(): Promise<PublicCampaign[]> {
  if (!(await isDatabaseAvailable())) return fallbackCampaigns();

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        location: true,
        locations: true,
      },
    });

    if (campaigns.length === 0) return fallbackCampaigns();

    return campaigns.map(({ location, locations, ...campaign }) => ({
      ...campaign,
      locations: parseCampaignLocations(locations, location),
    }));
  } catch {
    return fallbackCampaigns();
  }
}
