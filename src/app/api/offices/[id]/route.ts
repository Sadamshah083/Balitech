import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { buildMapEmbedUrl, slugifyOffice } from "@/lib/offices";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.isHeadOffice === true) {
      await prisma.office.updateMany({
        where: { isHeadOffice: true, NOT: { id } },
        data: { isHeadOffice: false },
      });
    }

    const existing = await prisma.office.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    const nextAddress =
      body.address !== undefined ? String(body.address).trim() : existing.address;

    const office = await prisma.office.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.slug !== undefined && {
          slug: body.slug?.trim() || slugifyOffice(String(body.name ?? existing.name)),
        }),
        ...(body.address !== undefined && { address: nextAddress }),
        ...(body.phone !== undefined && {
          phone: body.phone ? String(body.phone).trim() : null,
        }),
        ...(body.email !== undefined && {
          email: body.email ? String(body.email).trim() : null,
        }),
        ...(body.hours !== undefined && {
          hours: body.hours ? String(body.hours).trim() : null,
        }),
        ...(body.city !== undefined && {
          city: body.city ? String(body.city).trim() : null,
        }),
        ...(body.country !== undefined && {
          country: body.country ? String(body.country).trim() : "Pakistan",
        }),
        ...(body.image !== undefined && {
          image: body.image ? String(body.image).trim() : null,
        }),
        ...(body.mapEmbedUrl !== undefined && {
          mapEmbedUrl: body.mapEmbedUrl
            ? String(body.mapEmbedUrl).trim()
            : buildMapEmbedUrl(nextAddress),
        }),
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.isHeadOffice !== undefined && {
          isHeadOffice: Boolean(body.isHeadOffice),
        }),
      },
    });

    return NextResponse.json({ office });
  } catch {
    return NextResponse.json(
      { error: "Failed to update office" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    await prisma.office.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete office" },
      { status: 500 }
    );
  }
}
