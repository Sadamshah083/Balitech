import { existsSync } from "fs";
import path from "path";
import { PassThrough, Readable } from "stream";
import archiver from "archiver";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { resolveCvAbsolutePath } from "@/lib/cv-upload";
import { buildLeadWhere } from "@/lib/lead-filters";
import { resolveLeadPosition } from "@/lib/lead-position";

function slugify(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "cv"
  );
}

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const position = url.searchParams.get("position")?.trim() || null;
  const filters = buildLeadWhere(url.searchParams);

  const leads = await prisma.lead.findMany({
    where: {
      AND: [filters, { NOT: { cvPath: null } }, { cvDownloadedAt: null }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      position: true,
      message: true,
      cvFileName: true,
      cvPath: true,
    },
  });

  const files = leads.flatMap((lead) => {
    const absolutePath = resolveCvAbsolutePath(lead.cvPath as string);
    if (!existsSync(absolutePath)) return [];
    const ext = path.extname(lead.cvFileName || absolutePath) || ".pdf";
    return [{ absolutePath, ext, name: lead.name, lead }];
  });

  if (files.length === 0) {
    return NextResponse.json(
      {
        error: position
          ? `No new CVs available for "${position}"`
          : "No new CVs available to download",
      },
      { status: 404 }
    );
  }

  const archive = archiver("zip", { zlib: { level: 6 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  files.forEach((file, index) => {
    const jobLabel = position
      ? ""
      : `-${slugify(resolveLeadPosition(file.lead) || "unassigned")}`;
    const entryName = `${String(index + 1).padStart(2, "0")}-${slugify(
      file.name
    )}${jobLabel}${file.ext}`;
    archive.file(file.absolutePath, { name: entryName });
  });

  const stampedIds = files.map((file) => file.lead.id);
  let stamped = false;
  const stampDownloads = () => {
    if (stamped) return;
    stamped = true;
    void prisma.lead.updateMany({
      where: { id: { in: stampedIds } },
      data: { cvDownloadedAt: new Date() },
    });
  };

  passthrough.on("close", stampDownloads);
  passthrough.on("end", stampDownloads);
  archive.on("error", () => passthrough.destroy());
  archive.finalize().catch(() => passthrough.destroy());

  const stamp = new Date().toISOString().slice(0, 10);
  const zipName = `balitech-cvs-new-${
    position ? slugify(position).toLowerCase() : "all-jobs"
  }-${stamp}.zip`;

  return new NextResponse(Readable.toWeb(passthrough) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Cache-Control": "no-store",
      "X-Cv-Count": String(files.length),
    },
  });
}
