import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { refreshPublicPages } from "@/lib/refresh-public-pages";
import { slugify } from "@/lib/blog";
import { fallbackBlogs } from "@/lib/fallback-blogs";
import { publicBlogWhere } from "@/lib/blog-taxonomy";
import {
  resolvePublishFields,
  resolveTagIds,
  syncBlogTagLinks,
  uniqueBlogSlug,
} from "@/lib/blog-admin";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";
  const limit = Number(searchParams.get("limit") ?? 0);

  if (publicOnly) {
    try {
      const now = new Date();
      const blogs = await prisma.blog.findMany({
        where: publicBlogWhere(now),
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { order: "asc" }],
        take: limit > 0 ? limit : undefined,
        include: adminInclude,
      });
      return NextResponse.json({
        blogs: blogs.map((b) => mapAdminBlog(b)),
      });
    } catch (error) {
      console.error("[blogs] Database unavailable, serving fallback:", error);
      const blogs =
        limit > 0 ? fallbackBlogs.slice(0, limit) : fallbackBlogs;
      return NextResponse.json({ blogs, fallback: true });
    }
  }

  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId")?.trim() ?? "";

  const blogs = await prisma.blog.findMany({
    where: {
      AND: [
        status ? { status } : {},
        categoryId ? { categoryId } : {},
        q
          ? {
              OR: [
                { title: { contains: q } },
                { slug: { contains: q } },
                { excerpt: { contains: q } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ createdAt: "desc" }, { order: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      image: true,
      imageAlt: true,
      tags: true,
      format: true,
      metaTitle: true,
      metaDescription: true,
      order: true,
      isPublished: true,
      status: true,
      publishedAt: true,
      scheduledAt: true,
      createdAt: true,
      categoryId: true,
      category: adminInclude.category,
      tagLinks: adminInclude.tagLinks,
    },
  });

  return NextResponse.json({
    blogs: blogs.map((b) => mapAdminBlog(b)),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      image,
      imageAlt,
      format,
      metaTitle,
      metaDescription,
      order,
      categoryId,
      tagIds,
      tags,
    } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Primary category is required" },
        { status: 400 }
      );
    }

    const category = await prisma.blogCategory.findUnique({
      where: { id: String(categoryId) },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    const finalSlug = await uniqueBlogSlug(
      slug?.trim() || slugify(String(title))
    );
    const publish = resolvePublishFields(body);
    const resolvedTagIds = await resolveTagIds(
      Array.isArray(tagIds)
        ? tagIds
        : Array.isArray(tags)
          ? tags
          : typeof tags === "string"
            ? (() => {
                try {
                  return JSON.parse(tags);
                } catch {
                  return [];
                }
              })()
            : []
    );

    const blog = await prisma.blog.create({
      data: {
        title: String(title).trim(),
        slug: finalSlug,
        excerpt: excerpt ? String(excerpt).trim() : null,
        content: String(content).trim(),
        image: image ? String(image).trim() : null,
        imageAlt: imageAlt ? String(imageAlt).trim().slice(0, 180) : null,
        tags: "[]",
        format: format ? String(format) : "standard",
        metaTitle: metaTitle ? String(metaTitle).trim().slice(0, 120) : null,
        metaDescription: metaDescription
          ? String(metaDescription).trim().slice(0, 320)
          : null,
        order: typeof order === "number" ? order : 0,
        categoryId: category.id,
        ...publish,
      },
    });

    await syncBlogTagLinks(blog.id, resolvedTagIds);

    const full = await prisma.blog.findUnique({
      where: { id: blog.id },
      include: adminInclude,
    });

    refreshPublicPages();
    revalidatePath(`/blog/${finalSlug}`);
    return NextResponse.json(
      { blog: full ? mapAdminBlog(full) : blog },
      { status: 201 }
    );
  } catch (error) {
    console.error("[blogs POST]", error);
    return NextResponse.json(
      { error: "Failed to create blog. Slug may already exist." },
      { status: 500 }
    );
  }
}
