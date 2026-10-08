import type { Prisma } from "@prisma/client";
import { officeSearchFromQuery } from "@/lib/application-reference";
import { buildBranchWhere } from "@/lib/lead-branch";
import { buildPositionWhere } from "@/lib/lead-position";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Pakistan CNIC shape: 37405-4445073-1 */
function formatCnic(digits: string) {
  if (digits.length !== 13) return null;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

/**
 * Search variants so CNIC/phone match with or without dashes/spaces
 * (e.g. 37405-4445073-1 and 3740544450731).
 */
function identitySearchVariants(query: string): string[] {
  const variants = new Set<string>();
  const trimmed = query.trim();
  if (!trimmed) return [];

  variants.add(trimmed);

  const dashed = trimmed.replace(/[\s_]+/g, "-").replace(/-+/g, "-");
  if (dashed !== trimmed) variants.add(dashed);

  const digits = digitsOnly(trimmed);
  if (digits) {
    variants.add(digits);
    const cnic = formatCnic(digits);
    if (cnic) variants.add(cnic);
  }

  return [...variants];
}

function buildSearchWhere(query: string | null | undefined): Prisma.LeadWhereInput {
  const q = query?.trim();
  if (!q) return {};

  const office = officeSearchFromQuery(q);
  const identityVariants = identitySearchVariants(q);
  const clauses: Prisma.LeadWhereInput[] = [
    { referenceId: { contains: q } },
    { name: { contains: q } },
    { email: { contains: q } },
    { company: { contains: q } },
    { position: { contains: q } },
  ];

  for (const variant of identityVariants) {
    clauses.push({ phone: { contains: variant } });
    clauses.push({ cnic: { contains: variant } });
  }

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
