import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { MAX_CV_BYTES, resolveCvAbsolutePath, saveLeadCv } from "@/lib/cv-upload";
import { buildLeadWhere } from "@/lib/lead-filters";
import { extractPositionFromMessage } from "@/lib/lead-position";
import { notifyNewLead } from "@/lib/mail";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 50;

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * limit;
  const where = buildLeadWhere(url.searchParams);

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        position: true,
        message: true,
        cvFileName: true,
        cvPath: true,
        status: true,
        createdAt: true,
        referenceId: true,
        queue: true,
        flags: true,
        details: true,
        exportedAt: true,
        cvDownloadedAt: true,
      },
    }),
    prisma.lead.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}

async function parseLeadPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const cv = formData.get("cv");

    return {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: formData.get("phone") ? String(formData.get("phone")) : null,
      company: formData.get("company") ? String(formData.get("company")) : null,
      position: formData.get("position")
        ? String(formData.get("position"))
        : null,
      message: formData.get("message") ? String(formData.get("message")) : null,
      cvFile: cv instanceof File && cv.size > 0 ? cv : null,
    };
  }

  const body = await request.json();
  return {
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    phone: body.phone ? String(body.phone) : null,
    company: body.company ? String(body.company) : null,
    position: body.position ? String(body.position) : null,
    message: body.message ? String(body.message) : null,
    cvFile: null as File | null,
  };
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, company, position, message, cvFile } =
      await parseLeadPayload(request);

    if (!name.trim() || !email.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    let cvFileName: string | null = null;
    let cvPath: string | null = null;

    if (cvFile) {
      if (cvFile.size > MAX_CV_BYTES) {
        return NextResponse.json(
          { error: "CV file must be 5MB or smaller" },
          { status: 400 }
        );
      }
      try {
        const saved = await saveLeadCv(cvFile);
        cvFileName = saved.cvFileName;
        cvPath = saved.cvPath;
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Failed to upload CV file",
          },
          { status: 400 }
        );
      }
    }

    const messageWithoutCvLine = message
      ? message
          .split("\n")
          .filter((line) => !/^CV File:/i.test(line.trim()))
          .join("\n")
          .trim()
      : null;

    const resolvedPosition =
      position?.trim() || extractPositionFromMessage(messageWithoutCvLine);

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        company: company ? company.trim() : null,
        position: resolvedPosition || null,
        message: messageWithoutCvLine || null,
        cvFileName,
        cvPath,
      },
    });

    await notifyNewLead({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      position: lead.position,
      message: lead.message,
      leadId: lead.id,
      hasCv: Boolean(lead.cvPath),
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
    const body = await request.json();
    const { id, name, email, phone, company, position, message, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(email !== undefined && {
          email: String(email).trim().toLowerCase(),
        }),
        ...(phone !== undefined && {
          phone: phone ? String(phone).trim() : null,
        }),
        ...(company !== undefined && {
          company: company ? String(company).trim() : null,
        }),
        ...(position !== undefined && {
          position: position ? String(position).trim() : null,
        }),
        ...(message !== undefined && {
          message: message ? String(message).trim() : null,
        }),
        ...(status !== undefined && { status: String(status).trim() }),
      },
    });

    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.lead.findUnique({
      where: { id },
      select: { cvPath: true },
    });

    await prisma.lead.delete({
      where: { id },
    });

    if (existing?.cvPath) {
      try {
        await unlink(resolveCvAbsolutePath(existing.cvPath));
      } catch {
        /* file may already be gone */
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
