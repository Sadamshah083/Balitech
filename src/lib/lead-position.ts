import type { Prisma } from "@prisma/client";

export const UNSPECIFIED_POSITION = "Not specified";

/**
 * Applications submitted before the dedicated `position` column existed stored
 * the job inside the message body as a "Position: <label>" line.
 */
export function extractPositionFromMessage(message: string | null | undefined) {
  if (!message) return null;
  const match = message.match(/^\s*Position:\s*(.+)$/im);
  return match?.[1]?.trim() || null;
}

export function resolveLeadPosition(lead: {
  position?: string | null;
  message?: string | null;
}) {
  return (
    lead.position?.trim() ||
    extractPositionFromMessage(lead.message) ||
    null
  );
}

export function buildPositionWhere(
  position: string | null | undefined
): Prisma.LeadWhereInput {
  const value = position?.trim();
  if (!value) return {};

  if (value === UNSPECIFIED_POSITION) {
    return {
      AND: [
        { OR: [{ position: null }, { position: "" }] },
        {
          OR: [
            { message: null },
            { NOT: { message: { contains: "Position:" } } },
          ],
        },
      ],
    };
  }

  return {
    OR: [{ position: value }, { message: { contains: `Position: ${value}` } }],
  };
}
