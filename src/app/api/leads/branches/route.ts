import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { leadMatchesBranch } from "@/lib/lead-branch";

/**
 * The branch filter offers exactly the active offices from the Offices admin,
 * with how many leads applied to each. Adding or retiring an office there
 * changes this list; nothing here is hard-coded.
 */
export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const [leads, offices] = await Promise.all([
    prisma.lead.findMany({
      select: { referenceId: true, company: true, message: true, cvPath: true },
    }),
    prisma.office.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { name: true },
    }),
  ]);

  const branches = offices.map((office) => {
    const matching = leads.filter((lead) => leadMatchesBranch(lead, office.name));
    return {
      value: office.name,
      leads: matching.length,
      cvs: matching.filter((lead) => lead.cvPath).length,
    };
  });

  return NextResponse.json({ branches });
}
