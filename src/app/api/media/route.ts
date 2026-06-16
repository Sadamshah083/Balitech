import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { getAdminMediaList, getPublicMedia, syncMediaCatalog } from "@/lib/media";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";
  const section = searchParams.get("section") ?? undefined;

  if (publicOnly) {
    const media = await getPublicMedia(section);
    return NextResponse.json({ media });
  }

  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const media = await getAdminMediaList(section);

  return NextResponse.json({ media });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const {
      title,
      alt,
      src,
      kind,
      section,
      category,
      order,
      isFeatured,
      isActive,
    } = body;

    if (!title?.trim() || !src?.trim()) {
      return NextResponse.json(
        { error: "Title and source URL are required" },
        { status: 400 }
      );
    }

    if (isFeatured && section) {
      await prisma.mediaItem.updateMany({
        where: { section: String(section), isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const item = await prisma.mediaItem.create({
      data: {
        title: String(title).trim(),
        alt: alt ? String(alt).trim() : null,
        src: String(src).trim(),
        kind: kind ? String(kind).trim() : "image",
        section: section ? String(section).trim() : "gallery",
        category: category ? String(category).trim() : "Events",
        order: typeof order === "number" ? order : 0,
        isFeatured: Boolean(isFeatured),
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create media item" },
      { status: 500 }
    );
  }
}
