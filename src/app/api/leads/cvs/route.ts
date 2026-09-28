import { existsSync } from "fs";
import path from "path";
import { PassThrough, Readable } from "stream";
import archiver from "archiver";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { resolveCvAbsolutePath } from "@/lib/cv-upload";
import { resolveLeadBranch } from "@/lib/lead-branch";
import { buildLeadWhere, hasLeadFilters } from "@/lib/lead-filters";
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
  const branch = url.searchParams.get("branch")?.trim() || null;
  const filtered = hasLeadFilters(url.searchParams);

  const leads = await prisma.lead.findMany({
    where: {
      AND: [buildLeadWhere(url.searchParams), { NOT: { cvPath: null } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      position: true,
      message: true,
      company: true,
      referenceId: true,
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
        error: filtered
          ? "No CVs available for this selection"
          : "No CVs available to download",
      },
      { status: 404 }
    );
  }

  const archive = archiver("zip", { zlib: { level: 6 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // The sequence prefix keeps entry names unique even for duplicate applicants.
  files.forEach((file, index) => {
    const jobLabel = position
      ? ""
      : `-${slugify(resolveLeadPosition(file.lead) || "unassigned")}`;
    const branchLabel = branch
      ? ""
      : `-${slugify(resolveLeadBranch(file.lead) || "no-branch")}`;
    const entryName = `${String(index + 1).padStart(3, "0")}-${slugify(
      file.name
    )}${jobLabel}${branchLabel}${file.ext}`;
    archive.file(file.absolutePath, { name: entryName });
  });

  archive.on("error", () => passthrough.destroy());
  archive.finalize().catch(() => passthrough.destroy());

  const stamp = new Date().toISOString().slice(0, 10);
  const scope =
    [position, branch]
      .filter(Boolean)
      .map((part) => slugify(part as string).toLowerCase())
      .join("-") || (filtered ? "filtered" : "all-jobs");
  const zipName = `balitech-cvs-${scope}-${stamp}.zip`;

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
