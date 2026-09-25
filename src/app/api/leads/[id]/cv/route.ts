import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { resolveCvAbsolutePath } from "@/lib/cv-upload";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      cvFileName: true,
      cvPath: true,
    },
  });

  if (!lead?.cvPath) {
    return NextResponse.json(
      { error: "No CV file available for this lead" },
      { status: 404 }
    );
  }

  const absolutePath = resolveCvAbsolutePath(lead.cvPath);
  if (!existsSync(absolutePath)) {
    return NextResponse.json(
      { error: "CV file is missing on the server" },
      { status: 404 }
    );
  }

  const stats = statSync(absolutePath);
  const downloadName = lead.cvFileName || path.basename(absolutePath);
  const ext = downloadName.toLowerCase().split(".").pop();
  const contentType =
    ext === "pdf"
      ? "application/pdf"
      : ext === "doc"
        ? "application/msword"
        : ext === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/octet-stream";

  const nodeStream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stats.size),
      "Content-Disposition": `attachment; filename="${downloadName.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
