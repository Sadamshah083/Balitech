import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { refreshPublicPages } from "@/lib/refresh-public-pages";
import { slugify } from "@/lib/blog";
import {
  resolvePublishFields,
  resolveTagIds,
  syncBlogTagLinks,
  uniqueBlogSlug,
} from "@/lib/blog-admin";

type RouteContext = { params: Promise<{ id: string }> };

const adminInclude = {
  category: {
    select: { id: true, name: true, slug: true, isActive: true },
  },
  tagLinks: {
    include: { tag: { select: { id: true, name: true, slug: true } } },
  },
} as const;

function mapAdminBlog<T extends {
  tagLinks: { tag: { id: string; name: string; slug: string } }[];
}>(blog: T) {
  return {
    ...blog,
    tagList: blog.tagLinks.map((l) => l.tag),
    tagLinks: undefined,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth(_request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: adminInclude,
  });
  if (!blog) {
    return NextResponse.json({ error: "Blog not found" }, { status: 404 });
  }

  return NextResponse.json({ blog: mapAdminBlog(blog) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const body = await request.json();

    if (body.categoryId !== undefined) {
      if (!body.categoryId) {
        return NextResponse.json(
          { error: "Primary category is required" },
          { status: 400 }
        );
      }
      const category = await prisma.blogCategory.findUnique({
        where: { id: String(body.categoryId) },
      });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
    }

    const nextTitle =
      body.title !== undefined ? String(body.title).trim() : existing.title;
    if (body.title !== undefined && !nextTitle) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (body.content !== undefined && !String(body.content).trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    let nextSlug = existing.slug;
    if (body.slug !== undefined || body.title !== undefined) {
      nextSlug = await uniqueBlogSlug(
        body.slug != null && String(body.slug).trim()
          ? String(body.slug).trim()
          : slugify(nextTitle),
        id
      );
    }

    const publish =
      body.status !== undefined ||
      body.isPublished !== undefined ||
      body.scheduledAt !== undefined ||
      body.publishedAt !== undefined
        ? resolvePublishFields({
            status: body.status ?? existing.status,
            isPublished: body.isPublished ?? existing.isPublished,
            publishedAt: body.publishedAt ?? existing.publishedAt,
            scheduledAt: body.scheduledAt ?? existing.scheduledAt,
          })
        : null;

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: nextTitle }),
        ...(body.slug !== undefined || body.title !== undefined
          ? { slug: nextSlug }
          : {}),
        ...(body.excerpt !== undefined && {
          excerpt: body.excerpt ? String(body.excerpt).trim() : null,
        }),
        ...(body.content !== undefined && {
          content: String(body.content).trim(),
        }),
        ...(body.image !== undefined && {
          image: body.image ? String(body.image).trim() : null,
        }),
        ...(body.imageAlt !== undefined && {
          imageAlt: body.imageAlt
            ? String(body.imageAlt).trim().slice(0, 180)
            : null,
        }),
        ...(body.format !== undefined && { format: String(body.format) }),
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
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.categoryId !== undefined && {
          categoryId: String(body.categoryId),
        }),
        ...(publish ?? {}),
      },
    });

    if (body.tagIds !== undefined || body.tags !== undefined) {
      const resolvedTagIds = await resolveTagIds(
        Array.isArray(body.tagIds)
          ? body.tagIds
          : Array.isArray(body.tags)
            ? body.tags
            : typeof body.tags === "string"
              ? (() => {
                  try {
                    return JSON.parse(body.tags);
                  } catch {
                    return [];
                  }
                })()
              : []
      );
      await syncBlogTagLinks(id, resolvedTagIds);
    }

    const full = await prisma.blog.findUnique({
      where: { id },
      include: adminInclude,
    });

    refreshPublicPages();
    revalidatePath(`/blog/${blog.slug}`);
    if (existing.slug !== blog.slug) {
      revalidatePath(`/blog/${existing.slug}`);
    }
    return NextResponse.json({
      blog: full
        ? {
            ...full,
            tagList: full.tagLinks.map((l) => l.tag),
            tagLinks: undefined,
          }
        : blog,
    });
  } catch (error) {
    console.error("[blogs PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    await prisma.blog.delete({ where: { id } });
    refreshPublicPages();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
