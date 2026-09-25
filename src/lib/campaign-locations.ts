export const campaignLocations = [
  "Shamsabad Office",
  "Islamabad Office",
  "Commercial Office",
  "Iran Road Office",
] as const;

export type CampaignLocation = (typeof campaignLocations)[number];

export const defaultCampaignLocation: CampaignLocation = "Shamsabad Office";

/**
 * Campaigns that run at more than the head office.
 *
 * Read in the two places that have to describe a campaign without being able
 * to ask the database: the seed that first fills it, and the fallback list
 * served when it cannot be reached. Once a row exists the admin panel owns it,
 * so editing a branch there is not undone by anything here.
 */
export const seedCampaignLocations: Record<string, string[]> = {
  "Final Expense": ["Iran Road Office", "Commercial Office"],
};

/** The branches a campaign starts life with. */
export function initialCampaignLocations(title: string): string[] {
  return seedCampaignLocations[title] ?? [defaultCampaignLocation];
}

export function normalizeCampaignLocation(
  value: string | null | undefined
): string {
  const trimmed = value?.trim();
  if (!trimmed) return defaultCampaignLocation;
  return trimmed;
}

/**
 * The branches a campaign is hiring at, as a list.
 *
 * A campaign used to run at exactly one office, so it was stored as a single
 * string. Some of them run at several — Final Expense is at Iran Road and
 * Commercial — so the list now lives in `Campaign.locations` as JSON, and the
 * old single `location` is kept as the first of them.
 *
 * Both are accepted here because rows written before the column existed have an
 * empty list and only the single value. The result is never empty, so callers
 * can render it without a special case for a job whose branch was never set.
 */
export function parseCampaignLocations(
  locations: string | string[] | null | undefined,
  fallback?: string | null
): string[] {
  const raw =
    typeof locations === "string" ? safeParseList(locations) : locations ?? [];

  const cleaned = raw
    .map((value) => String(value).trim())
    .filter(Boolean)
    /* An office removed from the picker should not linger on a job, and a
       double-click in the admin should not list a branch twice. */
    .filter((value, index, all) => all.indexOf(value) === index);

  if (cleaned.length > 0) return cleaned;
  return [normalizeCampaignLocation(fallback)];
}

function safeParseList(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    /* Written by hand or by an older tool: treat it as one branch. */
    return value.trim() ? [value] : [];
  }
}

export function stringifyCampaignLocations(locations: string[]): string {
  return JSON.stringify(parseCampaignLocations(locations));
}

/** Reads as "Iran Road Office and Commercial Office" for screen readers. */
export function describeCampaignLocations(locations: string[]): string {
  if (locations.length <= 1) return locations[0] ?? defaultCampaignLocation;
  return `${locations.slice(0, -1).join(", ")} and ${locations[locations.length - 1]}`;
}

/**
 * Branches are stored as a JSON string but always travel as an array, so the
 * cards, the carousel, the apply form and the admin table all read one shape.
 */
export function withCampaignBranchList<
  T extends { location: string; locations: string }
>(campaign: T): Omit<T, "location" | "locations"> & { locations: string[] } {
  const { locations, location, ...rest } = campaign;
  return { ...rest, locations: parseCampaignLocations(locations, location) };
}

/**
 * The other direction, for writes. A single `location` is still accepted so a
 * client that predates multi-branch hiring keeps working, and `location` is
 * always written as the first branch to keep the two columns in step.
 */
export function toStoredCampaignLocations(body: {
  locations?: unknown;
  location?: unknown;
}): { location: string; locations: string } {
  const list = parseCampaignLocations(
    Array.isArray(body.locations) ? body.locations.map(String) : undefined,
    typeof body.location === "string" ? body.location : undefined
  );

  return { location: list[0], locations: stringifyCampaignLocations(list) };
}
