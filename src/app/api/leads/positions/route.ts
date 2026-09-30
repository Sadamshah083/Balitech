import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { buildLeadWhere } from "@/lib/lead-filters";
import { UNSPECIFIED_POSITION, resolveLeadPosition } from "@/lib/lead-position";
import {
  isCampaignVacancyId,
  leadPositionTitle,
  listPublicVacancies,
} from "@/lib/careers/vacancies";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const filters = buildLeadWhere(url.searchParams);

  const [leads, open] = await Promise.all([
    prisma.lead.findMany({
      where: filters,
      select: {
        position: true,
        message: true,
        cvPath: true,
        exportedAt: true,
        cvDownloadedAt: true,
      },
    }),
    listPublicVacancies().catch(() => ({ vacancies: [] })),
  ]);

  const buckets = new Map<
    string,
    { leads: number; cvs: number; newLeads: number; newCvs: number }
  >();

  for (const lead of leads) {
    const label = resolveLeadPosition(lead) || UNSPECIFIED_POSITION;
    const bucket = buckets.get(label) ?? {
      leads: 0,
      cvs: 0,
      newLeads: 0,
      newCvs: 0,
    };
    bucket.leads += 1;
    if (!lead.exportedAt) bucket.newLeads += 1;
    if (lead.cvPath) {
      bucket.cvs += 1;
      if (!lead.cvDownloadedAt) bucket.newCvs += 1;
    }
    buckets.set(label, bucket);
  }

  const campaignLabels = open.vacancies
    .filter((vacancy) => isCampaignVacancyId(vacancy.id))
    .map(leadPositionTitle);
  const campaignSet = new Set(campaignLabels);
  for (const label of campaignLabels) {
    if (!buckets.has(label)) {
      buckets.set(label, { leads: 0, cvs: 0, newLeads: 0, newCvs: 0 });
    }
  }

  const positions = [...buckets.entries()]
    .map(([value, counts]) => ({
      value,
      ...counts,
      group: campaignSet.has(value) ? ("campaign" as const) : ("position" as const),
    }))
    .sort((a, b) => {
      if (a.value === UNSPECIFIED_POSITION) return 1;
      if (b.value === UNSPECIFIED_POSITION) return -1;
      return a.value.localeCompare(b.value);
    });

  return NextResponse.json({
    positions,
    totals: {
      leads: leads.length,
      cvs: leads.filter((lead) => lead.cvPath).length,
      newLeads: leads.filter((lead) => !lead.exportedAt).length,
      newCvs: leads.filter((lead) => lead.cvPath && !lead.cvDownloadedAt).length,
    },
  });
}
