import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
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

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "S.No",
    "Name",
    "Email",
    "Phone",
    "Company",
    "Message",
    "Status",
    "Submitted At",
  ];

  const rows = leads.map((lead, index) => [
    index + 1,
    lead.name,
    lead.email,
    lead.phone ?? "",
    lead.company ?? "",
    lead.message ?? "",
    lead.status,
    formatDate(lead.createdAt),
  ]);

  const csv =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="balitech-leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
