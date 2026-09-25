import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import {
  toStoredCampaignLocations,
  withCampaignBranchList,
} from "@/lib/campaign-locations";
import { refreshPublicPages } from "@/lib/refresh-public-pages";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";

  if (publicOnly) {
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
        order: true,
      },
    });
    return NextResponse.json({
      campaigns: campaigns.map(withCampaignBranchList),
    });
  }

  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const campaigns = await prisma.campaign.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({
    campaigns: campaigns.map(withCampaignBranchList),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { title, description, icon, order, isActive } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        icon: icon ? String(icon).trim() : "briefcase",
        ...toStoredCampaignLocations(body),
        order: typeof order === "number" ? order : 0,
        isActive: isActive !== false,
      },
    });

    refreshPublicPages();
    return NextResponse.json(
      { campaign: withCampaignBranchList(campaign) },
      { status: 201 }
    );
  } catch (error) {
    /* The reply stays generic, but a swallowed cause meant a failing save
       looked identical to a bug in the form. */
    console.error("[api/campaigns] create failed:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
