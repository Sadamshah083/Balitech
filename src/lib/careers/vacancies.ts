import type { Campaign, Vacancy } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseCampaignLocations } from "@/lib/campaign-locations";
import {
  CAMPAIGN_POSITION_SEPARATOR,
  CAMPAIGN_VACANCY_PREFIX,
  DEPARTMENTS,
  MEDICAL_BILLING_POSITIONS,
  MEDICAL_BILLING_SKILLS_QUESTION,
  findCatalogPosition,
  isCampaignVacancyId,
  isMedicalBillingCampaign,
  isRoleGroup,
  type RoleGroup,
} from "./catalog";
import type { PublicVacancy } from "./application";
import { fallbackVacancies } from "./fallback-vacancies";

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((x) => String(x).trim()).filter((x, i, all) => x && all.indexOf(x) === i)
      : [];
  } catch {
    return [];
  }
}

/** URL-safe slug from a vacancy title (SEO paths + apply query params). */
export function slugifyVacancyTitle(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return base || "role";
}

export function toPublicVacancy(row: Vacancy): PublicVacancy {
  const slug =
    (row as Vacancy & { slug?: string | null }).slug?.trim() ||
    slugifyVacancyTitle(row.title);
  return {
    id: row.id,
    title: row.title,
    slug,
    department: row.department,
    roleGroups: parseList(row.roleGroups).filter(isRoleGroup),
    branches: parseList(row.branches),
    remoteAllowed: row.remoteAllowed,
    campaign: row.campaign?.trim() || null,
    workingDays: row.workingDays?.trim() || null,
    workingHours: row.workingHours?.trim() || null,
    workArrangement: row.workArrangement?.trim() || null,
    cvRequired: row.cvRequired,
    customQuestion: row.customQuestion?.trim() || null,
    description: row.description?.trim() || null,
  };
}

/** Unique slug for create/update; keeps current slug when title is unchanged. */
export async function allocateVacancySlug(
  title: string,
  options?: { excludeId?: string; preferred?: string | null }
) {
  const preferred = options?.preferred?.trim();
  let base = preferred ? slugifyVacancyTitle(preferred) : slugifyVacancyTitle(title);
  if (!base) base = "role";

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await prisma.vacancy.findFirst({
      where: {
        slug: candidate,
        ...(options?.excludeId ? { NOT: { id: options.excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export type AdminVacancy = PublicVacancy & { order: number; isActive: boolean };

export function toAdminVacancy(row: Vacancy): AdminVacancy {
  return { ...toPublicVacancy(row), order: row.order, isActive: row.isActive };
}

export { fallbackVacancies };

export { isCampaignVacancyId };

/** Titles kept off the public join-us form (DB rows left untouched). */
const HIDDEN_FORM_TITLES = new Set([
  "customer service representative",
  "sales agent",
]);

function isHiddenFromForm(title: string) {
  return HIDDEN_FORM_TITLES.has(title.trim().toLowerCase());
}

/* Campaign cards on the site are job ads with an Apply button, so each active
   campaign is also offered as a position unless HR published a vacancy for it. */
function campaignRole(title: string): { department: string; roleGroups: RoleGroup[] } {
  const known = findCatalogPosition(title);
  if (known) return { department: known.department, roleGroups: known.groups };
  if (/dialer/i.test(title)) return { department: "it", roleGroups: ["it", "english"] };
  if (/\bqa\b|quality/i.test(title)) return { department: "quality", roleGroups: ["specialist", "english"] };
  if (/\bbdm\b|business development/i.test(title)) {
    return { department: "operations", roleGroups: ["specialist", "english"] };
  }
  return { department: "operations", roleGroups: ["campaign", "english"] };
}

function toCampaignVacancy(row: Campaign): PublicVacancy {
  const title = row.title.trim();
  return {
    id: `${CAMPAIGN_VACANCY_PREFIX}${row.id}`,
    title,
    slug: slugifyVacancyTitle(title),
    ...campaignRole(title),
    branches: parseCampaignLocations(row.locations, row.location),
    remoteAllowed: false,
    campaign: title,
    workingDays: null,
    workingHours: null,
    workArrangement: null,
    cvRequired: false,
    customQuestion: null,
    description: row.description?.trim() || null,
  };
}

/* Medical billing hires into several departments, so its card offers each
   department as a position instead of one position named after the card. */
function toCampaignVacancies(row: Campaign): PublicVacancy[] {
  const base = toCampaignVacancy(row);
  if (!isMedicalBillingCampaign(base.title)) return [base];
  return MEDICAL_BILLING_POSITIONS.map((position) => ({
    ...base,
    id: `${base.id}${CAMPAIGN_POSITION_SEPARATOR}${position.key}`,
    title: position.title,
    slug: slugifyVacancyTitle(`${base.title}-${position.title}`),
    ...campaignRole(position.title),
    customQuestion: MEDICAL_BILLING_SKILLS_QUESTION,
  }));
}

async function listCampaignVacancies() {
  const rows = await prisma.campaign.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return rows.flatMap(toCampaignVacancies);
}

/**
 * The position saved on a lead. Campaign departments carry their campaign so
 * HR can tell "Medical Billing — Coding Department" from another team's coder.
 */
export function leadPositionTitle(vacancy: PublicVacancy) {
  return isCampaignVacancyId(vacancy.id) && vacancy.campaign && vacancy.campaign !== vacancy.title
    ? `${vacancy.campaign} — ${vacancy.title}`
    : vacancy.title;
}

export async function listPublicVacancies(): Promise<{
  vacancies: PublicVacancy[];
  fallback: boolean;
}> {
  /* Campaign cards on Current Job Openings always feed the form dropdown. */
  const fromCampaigns = await listCampaignVacancies();
  const campaignTitles = new Set(
    fromCampaigns
      .flatMap((v) => [v.title, v.campaign ?? ""])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  );

  const total = await prisma.vacancy.count();
  if (total === 0) {
    return {
      vacancies: fromCampaigns.filter((v) => !isHiddenFromForm(v.title)),
      fallback: true,
    };
  }

  const rows = await prisma.vacancy.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });
  /* Skip HR vacancy rows that duplicate an active campaign opening title. */
  const published = rows
    .map(toPublicVacancy)
    .filter(
      (v) =>
        !isHiddenFromForm(v.title) &&
        !campaignTitles.has(v.title.trim().toLowerCase()) &&
        !(v.campaign && campaignTitles.has(v.campaign.trim().toLowerCase()))
    );
  return {
    vacancies: [
      ...fromCampaigns.filter((v) => !isHiddenFromForm(v.title)),
      ...published,
    ],
    fallback: false,
  };
}

/** An open vacancy by id, or null when it is closed or never existed. */
export async function findOpenVacancy(idOrSlug: string): Promise<PublicVacancy | null> {
  if (isCampaignVacancyId(idOrSlug)) {
    const [campaignId] = idOrSlug
      .slice(CAMPAIGN_VACANCY_PREFIX.length)
      .split(CAMPAIGN_POSITION_SEPARATOR);
    const row = await prisma.campaign.findFirst({
      where: { id: campaignId, isActive: true },
    });
    return row
      ? (toCampaignVacancies(row).find((v) => v.id === idOrSlug) ?? null)
      : null;
  }
  if (idOrSlug.startsWith("fallback-")) {
    const total = await prisma.vacancy.count();
    if (total > 0) return null;
    return fallbackVacancies.find((v) => v.id === idOrSlug) ?? null;
  }
  const row = await prisma.vacancy.findFirst({
    where: {
      isActive: true,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
  return row ? toPublicVacancy(row) : null;
}

type VacancyInput = Record<string, unknown>;

const text = (value: unknown, max = 191) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

/**
 * Admin writes. Returns an error message instead of throwing so the route can
 * answer 400 with something the editor can show.
 */
export function toVacancyData(
  body: VacancyInput,
  partial: boolean
): { data: Record<string, unknown> } | { error: string } {
  const data: Record<string, unknown> = {};
  const has = (key: string) => body[key] !== undefined;

  if (!partial || has("title")) {
    const title = text(body.title, 120);
    if (!title) return { error: "Title is required." };
    data.title = title;
  }
  if (!partial || has("slug")) {
    const slug = text(body.slug, 80);
    if (slug) data.slug = slugifyVacancyTitle(slug);
  }
  if (!partial || has("department")) {
    const department = String(body.department ?? "");
    if (!DEPARTMENTS.some((d) => d.value === department)) {
      return { error: "Choose a department." };
    }
    data.department = department;
  }
  if (!partial || has("roleGroups")) {
    const groups = Array.isArray(body.roleGroups) ? body.roleGroups.filter(isRoleGroup) : [];
    data.roleGroups = JSON.stringify([...new Set(groups)]);
  }
  if (!partial || has("branches")) {
    const branches = Array.isArray(body.branches)
      ? body.branches.map((b) => String(b).trim()).filter(Boolean)
      : [];
    if (branches.length === 0 && body.remoteAllowed !== true) {
      return { error: "Enable at least one branch, or allow remote work." };
    }
    data.branches = JSON.stringify([...new Set(branches)]);
  }
  if (!partial || has("remoteAllowed")) data.remoteAllowed = body.remoteAllowed === true;
  if (!partial || has("campaign")) data.campaign = text(body.campaign, 120);
  if (!partial || has("workingDays")) data.workingDays = text(body.workingDays, 120);
  if (!partial || has("workingHours")) data.workingHours = text(body.workingHours, 120);
  if (!partial || has("workArrangement")) data.workArrangement = text(body.workArrangement, 60);
  if (!partial || has("cvRequired")) data.cvRequired = body.cvRequired === true;
  if (!partial || has("customQuestion")) data.customQuestion = text(body.customQuestion, 300);
  if (!partial || has("description")) data.description = text(body.description, 10000);
  if (!partial || has("order")) data.order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;
  if (!partial || has("isActive")) data.isActive = body.isActive !== false;

  return { data };
}
