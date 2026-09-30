import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { resolveLeadPosition } from "@/lib/lead-position";
import { buildLeadWhere } from "@/lib/lead-filters";
import { FLAG_LABELS, parseFlags, queueLabel } from "@/lib/careers/review";
import { NextResponse } from "next/server";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const exportAll = url.searchParams.get("all") === "1";
  const filters = buildLeadWhere(url.searchParams);

  const leads = await prisma.lead.findMany({
    where: exportAll ? filters : { AND: [filters, { exportedAt: null }] },
    orderBy: { createdAt: "desc" },
  });

  if (!exportAll && leads.length === 0) {
    return NextResponse.json(
      { error: "No new leads to download. Use “Download all again” for the full list." },
      { status: 404 }
    );
  }

  const headers = [
    "S.No",
    "Name",
    "Email",
    "Phone",
    "Company",
    "Job Applied",
    "Message",
    "CV File",
    "Status",
    "Submitted At",
    "Application ID",
    "Review Queue",
    "Flags",
  ];

  const rows = leads.map((lead, index) => [
    index + 1,
    lead.name,
    lead.email,
    lead.phone ?? "",
    lead.company ?? "",
    resolveLeadPosition(lead) ?? "",
    lead.message ?? "",
    lead.cvFileName ?? "",
    lead.status,
    formatDate(lead.createdAt),
    lead.referenceId ?? "",
    queueLabel(lead.queue) ?? "",
    parseFlags(lead.flags)
      .map((flag) => FLAG_LABELS[flag] ?? flag)
      .join("; "),
  ]);

  const csv =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

  if (!exportAll && leads.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: leads.map((lead) => lead.id) } },
      data: { exportedAt: new Date() },
    });
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const kind = exportAll ? "all" : "new";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="balitech-leads-${kind}-${stamp}.csv"`,
      "Cache-Control": "no-store",
      "X-Lead-Count": String(leads.length),
    },
  });
}
