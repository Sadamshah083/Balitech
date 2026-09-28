import type { Prisma } from "@prisma/client";

/**
 * Where a lead's branch lives depends on when it was submitted:
 *
 * - Careers applications (they carry a `referenceId`) store the branch label in
 *   `company`, via `branchLabel(answers.branch)` in the applications route.
 * - Applications from the older form wrote a "Branch: <label>" line into the
 *   message body, one field per line.
 * - Contact-form inquiries have no branch; their `company` is a real company
 *   name and must not be read as one.
 */
export function extractBranchFromMessage(message: string | null | undefined) {
  if (!message) return null;
  const match = message.match(/^\s*Branch:\s*(.+)$/im);
  return match?.[1]?.trim() || null;
}

export function resolveLeadBranch(lead: {
  referenceId?: string | null;
  company?: string | null;
  message?: string | null;
}) {
  if (lead.referenceId) return lead.company?.trim() || null;
  return extractBranchFromMessage(lead.message);
}

/**
 * The distinctive part of an office name: "Iran Road Office" → "Iran Road".
 * Branch labels have changed over time ("Islamabad I-9/3" before "Islamabad
 * Office"), and every version names the place, so that is what is matched.
 */
export function branchKeyword(officeName: string) {
  return officeName.replace(/\s+office$/i, "").trim() || officeName.trim();
}

/** The same test as `buildBranchWhere`, for counting in memory. */
export function leadMatchesBranch(
  lead: { referenceId?: string | null; company?: string | null; message?: string | null },
  officeName: string
) {
  const keyword = branchKeyword(officeName).toLowerCase();
  if (lead.referenceId) {
    return (lead.company ?? "").toLowerCase().includes(keyword);
  }
  return (lead.message ?? "").toLowerCase().includes(`branch: ${keyword}`);
}

export function buildBranchWhere(
  branch: string | null | undefined
): Prisma.LeadWhereInput {
  const value = branch?.trim();
  if (!value) return {};

  const keyword = branchKeyword(value);
  return {
    OR: [
      { NOT: { referenceId: null }, company: { contains: keyword } },
      { referenceId: null, message: { contains: `Branch: ${keyword}` } },
    ],
  };
}
