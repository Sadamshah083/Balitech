import type { Prisma } from "@prisma/client";
import { officeSearchFromQuery } from "@/lib/application-reference";
import { buildBranchWhere } from "@/lib/lead-branch";
import { buildPositionWhere } from "@/lib/lead-position";

function buildSearchWhere(query: string | null | undefined): Prisma.LeadWhereInput {
  const q = query?.trim();
  if (!q) return {};

  const office = officeSearchFromQuery(q);
  const clauses: Prisma.LeadWhereInput[] = [
    { referenceId: { contains: q } },
    { name: { contains: q } },
    { email: { contains: q } },
    { phone: { contains: q } },
    { company: { contains: q } },
    { position: { contains: q } },
  ];

  if (office.code) {
    clauses.push({ referenceId: { contains: `BT-${office.code}-` } });
    clauses.push({ referenceId: { contains: `-${office.code}-` } });
  }
  if (office.keyword) {
    clauses.push({ company: { contains: office.keyword } });
    clauses.push({ message: { contains: `Branch: ${office.keyword}` } });
  }

  return { OR: clauses };
}

/**
 * The admin Leads filters (job applied, review queue, branch, search), read
 * from a request's query string. The list, the CV zip and the Excel export all
 * build their query from this, so the three always agree on which leads match.
 */
export function buildLeadWhere(params: URLSearchParams): Prisma.LeadWhereInput {
  const queue = params.get("queue")?.trim();
  return {
    AND: [
      buildPositionWhere(params.get("position")),
      buildBranchWhere(params.get("branch")),
      buildSearchWhere(params.get("q") ?? params.get("search")),
      ...(queue ? [{ queue }] : []),
    ],
  };
}

export function hasLeadFilters(params: URLSearchParams) {
  return ["position", "queue", "branch", "q", "search"].some((key) =>
    params.get(key)?.trim()
  );
}
