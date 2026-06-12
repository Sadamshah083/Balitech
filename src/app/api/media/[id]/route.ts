import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.mediaItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    const nextSection =
      body.section !== undefined ? String(body.section).trim() : existing.section;

    if (body.isFeatured === true) {
      await prisma.mediaItem.updateMany({
        where: {
          section: nextSection,
          isFeatured: true,
          NOT: { id },
        },
        data: { isFeatured: false },
      });
    }

    const item = await prisma.mediaItem.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: String(body.title).trim() }),
        ...(body.alt !== undefined && {
          alt: body.alt ? String(body.alt).trim() : null,
        }),
        ...(body.src !== undefined && { src: String(body.src).trim() }),
        ...(body.kind !== undefined && { kind: String(body.kind).trim() }),
        ...(body.section !== undefined && { section: nextSection }),
        ...(body.category !== undefined && {
          category: String(body.category).trim(),
        }),
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.isFeatured !== undefined && {
          isFeatured: Boolean(body.isFeatured),
        }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json(
      { error: "Failed to update media item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    await prisma.mediaItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete media item" },
      { status: 500 }
    );
  }
}
