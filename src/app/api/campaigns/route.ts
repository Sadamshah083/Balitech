import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

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
        order: true,
      },
    });
    return NextResponse.json({ campaigns });
  }

  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const campaigns = await prisma.campaign.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ campaigns });
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
        order: typeof order === "number" ? order : 0,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
