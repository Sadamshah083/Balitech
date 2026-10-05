import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import {
  categorySlugFromName,
  DEFAULT_BLOG_CATEGORIES,
} from "@/lib/blog-taxonomy";
import {
  resolveTagIds,
  syncCategoryTagLinks,
  uniqueCategorySlug,
} from "@/lib/blog-admin";
import { refreshPublicPages } from "@/lib/refresh-public-pages";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";

  if (publicOnly) {
    const categories = await prisma.blogCategory.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        tagLinks: { include: { tag: true } },
        _count: { select: { blogs: true } },
      },
    });
    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        tags: c.tagLinks.map((l) => l.tag),
        postCount: c._count.blogs,
        tagLinks: undefined,
        _count: undefined,
      })),
    });
  }

  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  const categories = await prisma.blogCategory.findMany({
    where: {
      AND: [
        status === "active" ? { isActive: true } : {},
        status === "inactive" ? { isActive: false } : {},
        q
          ? {
              OR: [
                { name: { contains: q } },
                { slug: { contains: q } },
                { description: { contains: q } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      tagLinks: {
        include: { tag: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { blogs: true } },
    },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      imageAlt: c.imageAlt,
      metaTitle: c.metaTitle,
      metaDescription: c.metaDescription,
      isActive: c.isActive,
      order: c.order,
      tags: c.tagLinks.map((l) => l.tag),
      postCount: c._count.blogs,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const baseSlug = categorySlugFromName(body.slug || name);
    const slug = await uniqueCategorySlug(baseSlug);
    const tagIds = await resolveTagIds(
      Array.isArray(body.tagIds)
        ? body.tagIds
        : Array.isArray(body.tags)
          ? body.tags
          : []
    );

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description: body.description ? String(body.description).trim() : null,
        image: body.image ? String(body.image).trim() : null,
        imageAlt: body.imageAlt ? String(body.imageAlt).trim() : null,
        metaTitle: body.metaTitle
          ? String(body.metaTitle).trim().slice(0, 120)
          : null,
        metaDescription: body.metaDescription
          ? String(body.metaDescription).trim().slice(0, 320)
          : null,
        isActive: body.isActive !== false,
        order: Number(body.order) || 0,
      },
    });

    await syncCategoryTagLinks(category.id, tagIds);
    refreshPublicPages();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[blog-categories POST]", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

/** Ensures the six seed categories exist with SEO + recommended tags (idempotent). */
export async function PUT(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  for (const item of DEFAULT_BLOG_CATEGORIES) {
    let category = await prisma.blogCategory.findUnique({
      where: { slug: item.slug },
    });

    if (!category && item.formerSlugs?.length) {
      for (const oldSlug of item.formerSlugs) {
        const former = await prisma.blogCategory.findUnique({
          where: { slug: oldSlug },
        });
        if (former) {
          category = await prisma.blogCategory.update({
            where: { id: former.id },
            data: { slug: item.slug },
          });
          await prisma.blogCategoryRedirect.upsert({
            where: { oldSlug },
            create: { oldSlug, categoryId: former.id },
            update: { categoryId: former.id },
          });
          break;
        }
      }
    }

    if (category) {
      category = await prisma.blogCategory.update({
        where: { id: category.id },
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          order: item.order,
          isActive: true,
        },
      });
    } else {
      category = await prisma.blogCategory.create({
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          order: item.order,
          isActive: true,
        },
      });
    }

    for (const oldSlug of item.formerSlugs ?? []) {
      if (oldSlug === item.slug) continue;
      await prisma.blogCategoryRedirect.upsert({
        where: { oldSlug },
        create: { oldSlug, categoryId: category.id },
        update: { categoryId: category.id },
      });
    }

    const tagIds = await resolveTagIds([...item.tags]);
    await syncCategoryTagLinks(category.id, tagIds);
  }

  // Clean up garbage tags created by the old CUID-detection bug: tags whose
  // name looks like a Prisma ID (c + 20+ lowercase alphanumeric chars).
  const garbageTags = await prisma.blogTag.findMany({
    where: { slug: { startsWith: "c" } },
    select: { id: true, name: true, slug: true },
  });
  const cuidRe = /^c[a-z0-9]{20,}$/;
  const garbageIds = garbageTags
    .filter((t) => cuidRe.test(t.name) || cuidRe.test(t.slug))
    .map((t) => t.id);
  if (garbageIds.length > 0) {
    await prisma.blogTagOnBlog.deleteMany({
      where: { tagId: { in: garbageIds } },
    });
    await prisma.blogCategoryTag.deleteMany({
      where: { tagId: { in: garbageIds } },
    });
    await prisma.blogTag.deleteMany({
      where: { id: { in: garbageIds } },
    });
  }

  refreshPublicPages();
  return NextResponse.json({ ok: true, garbageTagsCleaned: garbageIds.length });
}
