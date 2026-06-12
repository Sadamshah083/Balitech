import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, message } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        company: company ? String(company).trim() : null,
        message: message ? String(message).trim() : null,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "Lead id and status are required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
