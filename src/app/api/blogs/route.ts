import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/blog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";
  const limit = Number(searchParams.get("limit") ?? 0);

  if (publicOnly) {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: limit > 0 ? limit : undefined,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        image: true,
        tags: true,
        format: true,
        order: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ blogs });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blogs = await prisma.blog.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ blogs });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      image,
      tags,
      format,
      order,
      isPublished,
    } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const finalSlug = slug?.trim() || slugify(String(title));

    const blog = await prisma.blog.create({
      data: {
        title: String(title).trim(),
        slug: finalSlug,
        excerpt: excerpt ? String(excerpt).trim() : null,
        content: String(content).trim(),
        image: image ? String(image).trim() : null,
        tags: tags ? String(tags) : "[]",
        format: format ? String(format) : "standard",
        order: typeof order === "number" ? order : 0,
        isPublished: isPublished !== false,
      },
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create blog. Slug may already exist." },
      { status: 500 }
    );
  }
}
