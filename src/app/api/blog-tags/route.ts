import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import {
  normalizeTagName,
  tagSlugFromName,
} from "@/lib/blog-taxonomy";
import { uniqueTagSlug } from "@/lib/blog-admin";
import { refreshPublicPages } from "@/lib/refresh-public-pages";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const tags = await prisma.blogTag.findMany({
    where: q
      ? {
          OR: [{ name: { contains: q } }, { slug: { contains: q } }],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { blogs: true } },
    },
  });

  return NextResponse.json({
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: tag._count.blogs,
      categories: tag.categories.map((c) => c.category),
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const name = normalizeTagName(String(body.name ?? ""));
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = await uniqueTagSlug(
      tagSlugFromName(body.slug ? String(body.slug) : name)
    );

    const existing = await prisma.blogTag.findFirst({
      where: { OR: [{ slug }, { name }] },
    });
    if (existing) {
      return NextResponse.json({ tag: existing }, { status: 200 });
    }

    const tag = await prisma.blogTag.create({ data: { name, slug } });

    const categoryIds = Array.isArray(body.categoryIds)
      ? body.categoryIds.map(String)
      : [];
    if (categoryIds.length) {
      await prisma.blogCategoryTag.createMany({
        data: categoryIds.map((categoryId: string) => ({
          categoryId,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      });
    }

    refreshPublicPages();
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("[blog-tags POST]", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
