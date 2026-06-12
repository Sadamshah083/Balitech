import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { buildMapEmbedUrl, slugifyOffice } from "@/lib/offices";
import { fallbackOffices } from "@/lib/fallback-offices";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";

  if (publicOnly) {
    try {
      const offices = await prisma.office.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          phone: true,
          email: true,
          hours: true,
          city: true,
          country: true,
          image: true,
          mapEmbedUrl: true,
          order: true,
          isHeadOffice: true,
        },
      });
      if (offices.length === 0) {
        return NextResponse.json({ offices: fallbackOffices, fallback: true });
      }
      return NextResponse.json({ offices });
    } catch (error) {
      console.error("[offices] Database unavailable:", error);
      return NextResponse.json({ offices: fallbackOffices, fallback: true });
    }
  }

  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const offices = await prisma.office.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ offices });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const {
      name,
      slug,
      address,
      phone,
      email,
      hours,
      city,
      country,
      image,
      mapEmbedUrl,
      order,
      isActive,
      isHeadOffice,
    } = body;

    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 }
      );
    }

    const finalSlug = slug?.trim() || slugifyOffice(String(name));
    const finalAddress = String(address).trim();

    if (isHeadOffice) {
      await prisma.office.updateMany({
        where: { isHeadOffice: true },
        data: { isHeadOffice: false },
      });
    }

    const office = await prisma.office.create({
      data: {
        name: String(name).trim(),
        slug: finalSlug,
        address: finalAddress,
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        hours: hours ? String(hours).trim() : null,
        city: city ? String(city).trim() : null,
        country: country ? String(country).trim() : "Pakistan",
        image: image ? String(image).trim() : null,
        mapEmbedUrl: mapEmbedUrl
          ? String(mapEmbedUrl).trim()
          : buildMapEmbedUrl(finalAddress),
        order: typeof order === "number" ? order : 0,
        isActive: isActive !== false,
        isHeadOffice: Boolean(isHeadOffice),
      },
    });

    return NextResponse.json({ office }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create office. Slug may already exist." },
      { status: 500 }
    );
  }
}
