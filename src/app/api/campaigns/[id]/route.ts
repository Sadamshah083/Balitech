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

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: String(body.title).trim() }),
        ...(body.description !== undefined && {
          description: body.description
            ? String(body.description).trim()
            : null,
        }),
        ...(body.icon !== undefined && { icon: String(body.icon).trim() }),
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
