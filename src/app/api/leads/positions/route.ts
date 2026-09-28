import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { leadMatchesPosition } from "@/lib/lead-position";

/**
 * The job filter offers exactly the active campaigns from the Campaigns admin,
 * in their admin order, with how many leads and CVs each has. Adding or
 * deactivating a campaign there changes this list; nothing here is hard-coded.
 */
export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const [leads, campaigns] = await Promise.all([
    prisma.lead.findMany({
      select: { position: true, message: true, cvPath: true },
    }),
    prisma.campaign.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { title: "asc" }],
      select: { title: true },
    }),
  ]);

  const positions = campaigns.map((campaign) => {
    const matching = leads.filter((lead) => leadMatchesPosition(lead, campaign.title));
    return {
      value: campaign.title,
      leads: matching.length,
      cvs: matching.filter((lead) => lead.cvPath).length,
      group: "campaign" as const,
    };
  });

  return NextResponse.json({
    positions,
    totals: {
      leads: leads.length,
      cvs: leads.filter((lead) => lead.cvPath).length,
    },
  });
}
