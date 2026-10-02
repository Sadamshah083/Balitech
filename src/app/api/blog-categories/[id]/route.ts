import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { categorySlugFromName } from "@/lib/blog-taxonomy";
import {
  resolveTagIds,
  syncCategoryTagLinks,
  uniqueCategorySlug,
} from "@/lib/blog-admin";
import { refreshPublicPages } from "@/lib/refresh-public-pages";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const existing = await prisma.blogCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const nextName =
      body.name !== undefined ? String(body.name).trim() : existing.name;
    if (!nextName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let nextSlug = existing.slug;
    if (body.slug !== undefined || body.name !== undefined) {
      const base = categorySlugFromName(
        body.slug != null && String(body.slug).trim()
          ? String(body.slug)
          : nextName
      );
      nextSlug = await uniqueCategorySlug(base, id);
      if (nextSlug !== existing.slug) {
        await prisma.blogCategoryRedirect.upsert({
          where: { oldSlug: existing.slug },
          create: { oldSlug: existing.slug, categoryId: id },
          update: { categoryId: id },
        });
      }
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data: {
        name: nextName,
        slug: nextSlug,
        ...(body.description !== undefined && {
          description: body.description ? String(body.description).trim() : null,
        }),
        ...(body.image !== undefined && {
          image: body.image ? String(body.image).trim() : null,
        }),
        ...(body.imageAlt !== undefined && {
          imageAlt: body.imageAlt ? String(body.imageAlt).trim() : null,
        }),
        ...(body.metaTitle !== undefined && {
          metaTitle: body.metaTitle
            ? String(body.metaTitle).trim().slice(0, 120)
            : null,
        }),
        ...(body.metaDescription !== undefined && {
          metaDescription: body.metaDescription
            ? String(body.metaDescription).trim().slice(0, 320)
            : null,
        }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.order !== undefined && { order: Number(body.order) || 0 }),
      },
    });

    if (body.tagIds !== undefined || body.tags !== undefined) {
      const tagIds = await resolveTagIds(
        Array.isArray(body.tagIds)
          ? body.tagIds
          : Array.isArray(body.tags)
            ? body.tags
            : []
      );
      await syncCategoryTagLinks(id, tagIds);
    }

    refreshPublicPages();
    return NextResponse.json({ category });
  } catch (error) {
    console.error("[blog-categories PATCH]", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const reassignTo = url.searchParams.get("reassignTo")?.trim() || null;

    const existing = await prisma.blogCategory.findUnique({
      where: { id },
      include: { _count: { select: { blogs: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existing._count.blogs > 0) {
      if (!reassignTo || reassignTo === id) {
        return NextResponse.json(
          {
            error:
              "This category has posts. Choose another category to reassign them before deleting.",
            postCount: existing._count.blogs,
          },
          { status: 409 }
        );
      }
      const target = await prisma.blogCategory.findUnique({
        where: { id: reassignTo },
      });
      if (!target) {
        return NextResponse.json(
          { error: "Reassignment category not found" },
          { status: 400 }
        );
      }
      await prisma.blog.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignTo },
      });
    }

    await prisma.blogCategoryRedirect.deleteMany({ where: { categoryId: id } });
    await prisma.blogCategory.delete({ where: { id } });
    refreshPublicPages();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[blog-categories DELETE]", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
