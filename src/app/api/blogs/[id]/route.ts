import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { refreshPublicPages } from "@/lib/refresh-public-pages";
import { slugify } from "@/lib/blog";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: String(body.title).trim() }),
        ...(body.slug !== undefined && {
          slug: String(body.slug).trim() || slugify(String(body.title ?? "")),
        }),
        ...(body.excerpt !== undefined && {
          excerpt: body.excerpt ? String(body.excerpt).trim() : null,
        }),
        ...(body.content !== undefined && {
          content: String(body.content).trim(),
        }),
        ...(body.image !== undefined && {
          image: body.image ? String(body.image).trim() : null,
        }),
        ...(body.tags !== undefined && { tags: String(body.tags) }),
        ...(body.format !== undefined && { format: String(body.format) }),
        ...(body.metaTitle !== undefined && {
          metaTitle: body.metaTitle ? String(body.metaTitle).trim().slice(0, 120) : null,
        }),
        ...(body.metaDescription !== undefined && {
          metaDescription: body.metaDescription
            ? String(body.metaDescription).trim().slice(0, 320)
            : null,
        }),
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.isPublished !== undefined && {
          isPublished: Boolean(body.isPublished),
        }),
      },
    });

    refreshPublicPages();
    return NextResponse.json({ blog });
  } catch {
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
