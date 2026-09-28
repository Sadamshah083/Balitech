import type { Prisma } from "@prisma/client";

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

/**
 * Separator between a campaign and one of its departments in a lead's
 * position, e.g. "Medical Billing — Coding Department" (see
 * `leadPositionTitle` in careers/vacancies.ts).
 */
const DEPARTMENT_SEPARATOR = " — ";

/**
 * Leads for one campaign (the job filter lists the active campaigns). A lead
 * matches when it applied to the campaign itself or one of its departments, or
 * when an older lead names it on a "Position:" or "Campaign:" line (the contact
 * form's "[Campaign: X]" prefix included).
 */
export function buildPositionWhere(
  position: string | null | undefined
): Prisma.LeadWhereInput {
  const value = position?.trim();
  if (!value) return {};

  /* Message lines must name the whole title, so "Medicare" does not also
     match "Medicare Verifier": the name has to end the line, close the
     "[Campaign: X]" bracket, or be followed by a department. */
  const lines = ["Position", "Campaign"].flatMap((field) => {
    const line = `${field}: ${value}`;
    return [
      { message: { contains: `${line}\n` } },
      { message: { contains: `${line}]` } },
      { message: { contains: `${line}${DEPARTMENT_SEPARATOR}` } },
      { message: { endsWith: line } },
    ];
  });

  return {
    OR: [
      { position: value },
      { position: { startsWith: `${value}${DEPARTMENT_SEPARATOR}` } },
      ...lines,
    ],
  };
}

/** The same test as `buildPositionWhere`, for counting in memory. */
export function leadMatchesPosition(
  lead: { position?: string | null; message?: string | null },
  campaign: string
) {
  const value = campaign.trim().toLowerCase();
  const position = (lead.position ?? "").trim().toLowerCase();
  const message = (lead.message ?? "").toLowerCase();
  const line = (field: string) => {
    const text = `${field}: ${value}`;
    return (
      message.includes(`${text}\n`) ||
      message.includes(`${text}]`) ||
      message.includes(`${text}${DEPARTMENT_SEPARATOR}`) ||
      message.endsWith(text)
    );
  };
  return (
    position === value ||
    position.startsWith(`${value}${DEPARTMENT_SEPARATOR}`) ||
    line("position") ||
    line("campaign")
  );
}
