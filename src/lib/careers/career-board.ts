/**
 * Public career board helpers. Openings come only from admin Vacancy rows
 * (join-us form logic is separate and unchanged).
 */
import { prisma } from "@/lib/prisma";
import { joinUsHref } from "@/lib/navigation";
import { looksLikeHtml, sanitizeBlogHtml } from "@/lib/blog";
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

export type JobDescriptionBlock =
  | { type: "h"; lines: string[] }
  | { type: "p"; lines: string[] }
  | { type: "ul"; lines: string[] };

const JD_HEADING_RE =
  /^(role overview|overview|key responsibilities|responsibilities|requirements|what we offer|benefits|about the role|about this role|qualifications|nice to have|must have)$/i;

/** Known heading stuck on the same line as body copy, e.g. "Role overview Support dialer…". */
function splitLeadingHeading(line: string): { heading: string | null; rest: string } {
  const match = line.match(
    /^(role overview|overview|key responsibilities|responsibilities|requirements|what we offer|benefits|about the role|about this role|qualifications)\b[:\s—–-]*(.*)$/i
  );
  if (!match) return { heading: null, rest: line };
  const heading = match[1].trim();
  const rest = match[2].trim();
  if (!JD_HEADING_RE.test(heading) && !/^role overview$/i.test(heading)) {
    return { heading: null, rest: line };
  }
  return { heading, rest };
}

function isListSectionHeading(heading: string) {
  return /responsibilit|requirement|qualification|benefit|offer|must have|nice to have/i.test(
    heading
  );
}

function looksLikeBulletLine(line: string) {
  return /^[•\-\*]\s+/.test(line) || /^\d+[\.)]\s+/.test(line);
}

function stripBullet(line: string) {
  return line.replace(/^[•\-\*]\s+/, "").replace(/^\d+[\.)]\s+/, "").trim();
}

/**
 * Split admin description into HTML-ready blocks (headings, paragraphs, lists)
 * for the public /career/[slug] job page.
 */
export function formatJobDescription(description: string | null): {
  paragraphs: string[];
  blocks: JobDescriptionBlock[];
} {
  const raw = description?.replace(/\r\n/g, "\n").trim() ?? "";
  if (!raw) return { paragraphs: [], blocks: [] };

  const lines = raw.split("\n");
  const blocks: JobDescriptionBlock[] = [];
  let para: string[] = [];
  let bullets: string[] = [];
  let listMode = false;

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
  const pushHeading = (heading: string) => {
    flushPara();
    flushBullets();
    blocks.push({ type: "h", lines: [heading] });
    listMode = isListSectionHeading(heading);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushBullets();
      continue;
    }

    if (JD_HEADING_RE.test(trimmed) && trimmed.length <= 48) {
      pushHeading(trimmed);
      continue;
    }

    const split = splitLeadingHeading(trimmed);
    if (split.heading) {
      pushHeading(split.heading);
      if (!split.rest) continue;
      if (listMode || looksLikeBulletLine(split.rest)) {
        flushPara();
        bullets.push(stripBullet(split.rest));
      } else {
        flushBullets();
        para.push(split.rest);
      }
      continue;
    }

    if (looksLikeBulletLine(trimmed) || listMode) {
      flushPara();
      bullets.push(stripBullet(trimmed));
      continue;
    }

    flushBullets();
    listMode = false;
    para.push(trimmed);
  }
  flushPara();
  flushBullets();

  return {
    paragraphs: blocks.filter((b) => b.type === "p").flatMap((b) => b.lines),
    blocks,
  };
}

const JD_LABELS =
  "Company|Location|Employment Type|Job Type|Work Arrangement|Experience|Position|Salary|Working Hours|Working Days|Shift|Department|Description|Responsibilities|Requirements|Qualifications|Benefits";
const JD_LABEL_SPLIT_RE = new RegExp(`(?:^|\\s)(?=(?:${JD_LABELS})\\s*:)`, "g");
const JD_LABEL_RE = new RegExp(`^(${JD_LABELS})\\s*:\\s*([\\s\\S]*)$`);

function escapeJdHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "Label: value" with the label in bold (any short leading label, not just known ones). */
function boldLead(text: string) {
  const known = text.match(JD_LABEL_RE);
  if (known) {
    return `<strong>${escapeJdHtml(known[1])}:</strong> ${escapeJdHtml(known[2])}`;
  }
  const generic = text.match(/^([A-Z][^:]{1,40}):\s+([\s\S]+)$/);
  if (generic) {
    return `<strong>${escapeJdHtml(generic[1])}:</strong> ${escapeJdHtml(generic[2])}`;
  }
  return escapeJdHtml(text);
}

/** One fact cell: bold label on top, value underneath. */
function factCell(text: string) {
  const m = text.match(JD_LABEL_RE);
  if (!m) return `<li>${escapeJdHtml(text)}</li>`;
  return `<li><strong>${escapeJdHtml(m[1])}</strong><span>${escapeJdHtml(m[2])}</span></li>`;
}

const HTML_FACT_P = String.raw`<p[^>]*>\s*<(?:strong|b)>\s*([^<]{1,40}?)\s*:?\s*</(?:strong|b)>\s*:?\s*([\s\S]*?)</p>\s*`;
const HTML_FACT_RUN_RE = new RegExp(`(?:${HTML_FACT_P}){2,}`, "gi");
const HTML_FACT_ONE_RE = new RegExp(HTML_FACT_P, "gi");

/**
 * Admin HTML: a run of "<p><strong>Label:</strong> value</p>" lines becomes the
 * fact-card grid, so any labels the admin types (Salary, Shift, ...) show as cards.
 * A leading <h1> that repeats the job title is dropped (the page already has it).
 */
function factsFromHtml(html: string, title: string) {
  let out = html.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, inner: string) =>
    inner.replace(/<[^>]*>/g, "").trim().toLowerCase() === title.trim().toLowerCase()
      ? ""
      : `<h2>${inner}</h2>`
  );
  out = out.replace(HTML_FACT_RUN_RE, (run) => {
    const cells: string[] = [];
    for (const m of run.matchAll(HTML_FACT_ONE_RE)) {
      cells.push(`<li><strong>${m[1].trim()}</strong><span>${m[2].trim()}</span></li>`);
    }
    return `<ul class="career-detail__jd-facts">${cells.join("")}</ul>`;
  });
  return out;
}

/**
 * Job description as safe HTML for the public job page. Admin text that is
 * already HTML is sanitized and kept; plain text gets headings, lists and
 * bold labels (Company:, Location:, Salary: ...), and run-together label
 * lines become a bold-label list.
 */
export function jobDescriptionToHtml(description: string | null, title = ""): string {
  const raw = description?.trim() ?? "";
  if (!raw) return "";
  if (looksLikeHtml(raw)) return factsFromHtml(sanitizeBlogHtml(raw), title);

  const out: string[] = [];
  const { blocks } = formatJobDescription(raw);
  blocks.forEach((block, i) => {
    const first = block.lines[0] ?? "";
    if (block.type === "p" && i === 0 && first.trim().toLowerCase() === title.trim().toLowerCase()) {
      return;
    }
    if (block.type === "h") {
      out.push(`<h3 class="career-detail__jd-heading">${escapeJdHtml(first)}</h3>`);
      return;
    }
    if (block.type === "ul") {
      out.push(`<ul>${block.lines.map((l) => `<li>${boldLead(l)}</li>`).join("")}</ul>`);
      return;
    }
    const parts = first.split(JD_LABEL_SPLIT_RE).map((s) => s.trim()).filter(Boolean);
    if (parts.filter((p) => JD_LABEL_RE.test(p)).length >= 2) {
      // Facts (Company, Location, Salary...) as a list; "Description:" stays a paragraph.
      const facts = parts.filter((p) => JD_LABEL_RE.test(p) && !/^Description\s*:/.test(p));
      const rest = parts.filter((p) => !facts.includes(p));
      out.push(`<ul class="career-detail__jd-facts">${facts.map(factCell).join("")}</ul>`);
      for (const r of rest) out.push(`<p>${boldLead(r)}</p>`);
      return;
    }
    out.push(`<p>${boldLead(first)}</p>`);
  });
  return out.join("\n");
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
