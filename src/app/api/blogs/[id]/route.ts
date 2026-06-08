import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/blog";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.isPublished !== undefined && {
          isPublished: Boolean(body.isPublished),
        }),
      },
    });

    return NextResponse.json({ blog });
  } catch {
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.blog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
