import type { Prisma } from "@prisma/client";
import { buildBranchWhere } from "@/lib/lead-branch";
import { buildPositionWhere } from "@/lib/lead-position";

/**
 * The admin Leads filters (job applied, review queue, branch), read from a
 * request's query string. The list, the CV zip and the Excel export all build
 * their query from this, so the three always agree on which leads match.
 */
export function buildLeadWhere(params: URLSearchParams): Prisma.LeadWhereInput {
  const queue = params.get("queue")?.trim();
  return {
    AND: [
      buildPositionWhere(params.get("position")),
      buildBranchWhere(params.get("branch")),
      ...(queue ? [{ queue }] : []),
    ],
  };
}

export function hasLeadFilters(params: URLSearchParams) {
  return ["position", "queue", "branch"].some((key) => params.get(key)?.trim());
}
