import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { normalizeTagName, tagSlugFromName } from "@/lib/blog-taxonomy";
import { uniqueTagSlug } from "@/lib/blog-admin";
import { refreshPublicPages } from "@/lib/refresh-public-pages";
import { stringifyTags } from "@/lib/blog";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const existing = await prisma.blogTag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const body = await request.json();
    const name =
      body.name !== undefined
        ? normalizeTagName(String(body.name))
        : existing.name;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = await uniqueTagSlug(
      tagSlugFromName(
        body.slug != null && String(body.slug).trim()
          ? String(body.slug)
          : name
      ),
      id
    );

    const tag = await prisma.blogTag.update({
      where: { id },
      data: { name, slug },
    });

    if (Array.isArray(body.categoryIds)) {
      await prisma.blogCategoryTag.deleteMany({ where: { tagId: id } });
      const categoryIds = body.categoryIds.map(String).filter(Boolean);
      if (categoryIds.length) {
        await prisma.blogCategoryTag.createMany({
          data: categoryIds.map((categoryId: string) => ({
            categoryId,
            tagId: id,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Keep legacy Blog.tags JSON in sync for linked posts.
    const linked = await prisma.blogTagOnBlog.findMany({
      where: { tagId: id },
      select: { blogId: true },
    });
    for (const row of linked) {
      const tags = await prisma.blogTag.findMany({
        where: { blogs: { some: { blogId: row.blogId } } },
        select: { name: true },
      });
      await prisma.blog.update({
        where: { id: row.blogId },
        data: { tags: stringifyTags(tags.map((t) => t.name)) },
      });
    }

    refreshPublicPages();
    return NextResponse.json({ tag });
  } catch (error) {
    console.error("[blog-tags PATCH]", error);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const existing = await prisma.blogTag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const linked = await prisma.blogTagOnBlog.findMany({
      where: { tagId: id },
      select: { blogId: true },
    });

    await prisma.blogTag.delete({ where: { id } });

    for (const row of linked) {
      const tags = await prisma.blogTag.findMany({
        where: { blogs: { some: { blogId: row.blogId } } },
        select: { name: true },
      });
      await prisma.blog.update({
        where: { id: row.blogId },
        data: { tags: stringifyTags(tags.map((t) => t.name)) },
      });
    }

    refreshPublicPages();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[blog-tags DELETE]", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
