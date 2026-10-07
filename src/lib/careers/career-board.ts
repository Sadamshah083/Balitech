/**
 * Public career board helpers. Openings come only from admin Vacancy rows
 * (join-us form logic is separate and unchanged).
 */
import { prisma } from "@/lib/prisma";
import { joinUsHref } from "@/lib/navigation";
import { DEPARTMENTS, departmentLabel } from "./catalog";
import { toPublicVacancy } from "./vacancies";
import type { PublicVacancy } from "./application";

/** Filter chips on /career — department keys with public labels. */
export const CAREER_CATEGORIES = [
  { value: "operations", label: "Sales & Marketing" },
  { value: "medical-billing", label: "Medical Billing" },
  { value: "quality", label: "QA & Training" },
  { value: "hr", label: "Human Resource" },
  { value: "it", label: "IT & Networking" },
  { value: "creative", label: "Creative & Marketing" },
  { value: "development", label: "Development" },
  { value: "admin", label: "Administrative" },
] as const;

export type CareerCategoryValue = (typeof CAREER_CATEGORIES)[number]["value"];

export type CareerOpening = PublicVacancy & {
  categoryLabel: string;
  excerpt: string;
  locationLabel: string;
  /** Office names shown as branch chips on /career cards. */
  branchLabels: string[];
};

export function careerCategoryLabel(department: string): string {
  const known = CAREER_CATEGORIES.find((c) => c.value === department);
  if (known) return known.label;
  return departmentLabel(department) || department;
}

function excerptFrom(description: string | null, title: string, campaign: string | null): string {
  const raw = description?.replace(/\s+/g, " ").trim();
  if (raw) return raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}…` : raw;
  if (campaign) {
    return `${title} opening on the ${campaign} campaign. Apply to join BALITECH’s trained floor teams.`;
  }
  return `${title} at BALITECH. Competitive role with structured training and growth paths.`;
}

function locationLabel(branches: string[], remoteAllowed: boolean, arrangement: string | null): string {
  const parts: string[] = [];
  if (arrangement?.trim()) parts.push(arrangement.trim());
  if (branches.length === 1) parts.push(branches[0]);
  else if (branches.length > 1) parts.push(`${branches.length} branches`);
  if (remoteAllowed && !/remote/i.test(arrangement ?? "")) parts.push("Remote option");
  return parts.join(" · ") || "BALITECH offices";
}

export function toCareerOpening(vacancy: PublicVacancy): CareerOpening {
  return {
    ...vacancy,
    categoryLabel: careerCategoryLabel(vacancy.department),
    excerpt: excerptFrom(vacancy.description, vacancy.title, vacancy.campaign),
    locationLabel: locationLabel(
      vacancy.branches,
      vacancy.remoteAllowed,
      vacancy.workArrangement
    ),
    branchLabels: vacancy.branches.length
      ? vacancy.branches
      : vacancy.remoteAllowed
        ? ["Remote"]
        : [],
  };
}

/** Active admin vacancies for the public /career board. */
export async function listCareerOpenings(): Promise<CareerOpening[]> {
  try {
    const rows = await prisma.vacancy.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { title: "asc" }],
    });
    return rows.map((row) => toCareerOpening(toPublicVacancy(row)));
  } catch {
    return [];
  }
}

/** One active vacancy by SEO slug (or legacy cuid id). */
export async function getCareerOpening(
  slugOrId: string
): Promise<CareerOpening | null> {
  if (!slugOrId?.trim()) return null;
  try {
    const key = slugOrId.trim();
    const row = await prisma.vacancy.findFirst({
      where: {
        isActive: true,
        OR: [{ slug: key }, { id: key }],
      },
    });
    return row ? toCareerOpening(toPublicVacancy(row)) : null;
  } catch {
    return null;
  }
}

export function careerDetailHref(opening: Pick<PublicVacancy, "slug" | "id">) {
  return `/career/${encodeURIComponent(opening.slug || opening.id)}`;
}

/** Deep-link into the existing join-us application form (SEO slug in ?position=). */
export function careerApplyHref(
  opening: Pick<PublicVacancy, "id" | "slug" | "branches" | "campaign">
) {
  const url = new URL(joinUsHref, "https://balitech.org");
  url.searchParams.set("position", opening.slug || opening.id);
  if (opening.branches.length === 1) {
    url.searchParams.set("branch", opening.branches[0]);
  }
  if (opening.campaign) {
    url.searchParams.set("campaign", opening.campaign);
  }
  url.hash = "apply";
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Split admin description into paragraphs / bullet lines for the detail page. */
export function formatJobDescription(description: string | null): {
  paragraphs: string[];
  blocks: { type: "p" | "ul"; lines: string[] }[];
} {
  const raw = description?.replace(/\r\n/g, "\n").trim() ?? "";
  if (!raw) return { paragraphs: [], blocks: [] };

  const lines = raw.split("\n");
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];
  let para: string[] = [];
  let bullets: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    blocks.push({ type: "p", lines: [para.join(" ").trim()] });
    para = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push({ type: "ul", lines: bullets });
    bullets = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushBullets();
      continue;
    }
    if (/^[•\-\*]\s+/.test(trimmed) || /^\d+[\.)]\s+/.test(trimmed)) {
      flushPara();
      bullets.push(trimmed.replace(/^[•\-\*]\s+/, "").replace(/^\d+[\.)]\s+/, ""));
      continue;
    }
    flushBullets();
    para.push(trimmed);
  }
  flushPara();
  flushBullets();

  return {
    paragraphs: blocks.filter((b) => b.type === "p").flatMap((b) => b.lines),
    blocks,
  };
}

export function careerDepartmentsInUse(openings: CareerOpening[]) {
  const present = new Set(openings.map((o) => o.department));
  return CAREER_CATEGORIES.filter((c) => present.has(c.value));
}

export function careerBranchesInUse(openings: CareerOpening[]) {
  const set = new Set<string>();
  for (const o of openings) {
    for (const b of o.branches) set.add(b);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export { DEPARTMENTS };
