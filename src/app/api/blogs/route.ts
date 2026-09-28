import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { refreshPublicPages } from "@/lib/refresh-public-pages";
import { blogFieldError, uniqueBlogSlug } from "@/lib/blog-server";
import { fallbackBlogs } from "@/lib/fallback-blogs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";
  const limit = Number(searchParams.get("limit") ?? 0);

  if (publicOnly) {
    try {
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
          metaTitle: true,
          metaDescription: true,
          order: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ blogs });
    } catch (error) {
      console.error("[blogs] Database unavailable, serving fallback:", error);
      const blogs =
        limit > 0 ? fallbackBlogs.slice(0, limit) : fallbackBlogs;
      return NextResponse.json({ blogs, fallback: true });
    }
  }
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const blogs = await prisma.blog.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ blogs });
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
      tags,
      format,
      metaTitle,
      metaDescription,
      order,
      isPublished,
    } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const fieldError = blogFieldError({ title, content, excerpt, image, tags });
    if (fieldError) {
      return NextResponse.json({ error: fieldError }, { status: 400 });
    }

    const finalSlug = await uniqueBlogSlug(slug, String(title));

    const blog = await prisma.blog.create({
      data: {
        title: String(title).trim(),
        slug: finalSlug,
        excerpt: excerpt ? String(excerpt).trim() : null,
        content: String(content).trim(),
        image: image ? String(image).trim() : null,
        tags: tags ? String(tags) : "[]",
        format: format ? String(format) : "standard",
        metaTitle: metaTitle ? String(metaTitle).trim().slice(0, 120) : null,
        metaDescription: metaDescription
          ? String(metaDescription).trim().slice(0, 320)
          : null,
        order: typeof order === "number" ? order : 0,
        isPublished: isPublished !== false,
      },
    });

    refreshPublicPages();
    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    console.error("[blogs] create failed:", error);
    return NextResponse.json(
      { error: "The blog could not be saved. Please try again." },
      { status: 500 }
    );
  }
}
