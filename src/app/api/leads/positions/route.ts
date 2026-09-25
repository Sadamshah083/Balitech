import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { UNSPECIFIED_POSITION, resolveLeadPosition } from "@/lib/lead-position";
import {
  isCampaignVacancyId,
  leadPositionTitle,
  listPublicVacancies,
} from "@/lib/careers/vacancies";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const [leads, open] = await Promise.all([
    prisma.lead.findMany({
      select: { position: true, message: true, cvPath: true },
    }),
    listPublicVacancies().catch(() => ({ vacancies: [] })),
  ]);

  const buckets = new Map<string, { leads: number; cvs: number }>();

  for (const lead of leads) {
    const label = resolveLeadPosition(lead) || UNSPECIFIED_POSITION;
    const bucket = buckets.get(label) ?? { leads: 0, cvs: 0 };
    bucket.leads += 1;
    if (lead.cvPath) bucket.cvs += 1;
    buckets.set(label, bucket);
  }

  /* Every open campaign position is listed, even before anyone applies, so
     HR can see at a glance which campaigns have no applicants yet. */
  const campaignLabels = open.vacancies
    .filter((vacancy) => isCampaignVacancyId(vacancy.id))
    .map(leadPositionTitle);
  const campaignSet = new Set(campaignLabels);
  for (const label of campaignLabels) {
    if (!buckets.has(label)) buckets.set(label, { leads: 0, cvs: 0 });
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
    },
  });
}
