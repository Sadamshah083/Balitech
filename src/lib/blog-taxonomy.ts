import { slugify } from "@/lib/blog";

export const BLOG_STATUSES = ["draft", "published", "scheduled"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const DEFAULT_BLOG_CATEGORIES = [
  {
    name: "BPO & Outsourcing",
    slug: "bpo-outsourcing",
    description:
      "Outsourcing strategy, BPO delivery models, and scaling contact-center partnerships.",
    order: 1,
  },
  {
    name: "Call Center Operations",
    slug: "call-center-operations",
    description:
      "Floor management, QA, workforce planning, and day-to-day call center excellence.",
    order: 2,
  },
  {
    name: "Technology",
    slug: "technology-crm",
    description:
      "CRM, dialers, automation, and the tools that power modern BPO delivery.",
    order: 3,
  },
  {
    name: "Sales, Lead Generation & B2B",
    slug: "sales-lead-generation",
    description:
      "Outbound sales, inbound conversion, lead gen programs, and B2B outreach.",
    order: 4,
  },
  {
    name: "Careers & Workplace",
    slug: "careers-workplace",
    description:
      "Hiring, culture, training, and life inside Bali Tech’s teams and offices.",
    order: 5,
  },
  {
    name: "BaliTech Insights",
    slug: "balitech-insights",
    description:
      "Company updates, leadership notes, and insights from Bali Tech’s growth story.",
    order: 6,
  },
] as const;

export function normalizeTagName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function tagSlugFromName(name: string) {
  return slugify(normalizeTagName(name));
}

export function categorySlugFromName(name: string) {
  return slugify(name.trim());
}

export function isBlogStatus(value: unknown): value is BlogStatus {
  return (
    typeof value === "string" &&
    (BLOG_STATUSES as readonly string[]).includes(value)
  );
}

/** Published now, including schedules that have already come due. */
export function publicBlogWhere(now = new Date()) {
  return {
    OR: [
      { status: "published" },
      { status: "scheduled", scheduledAt: { lte: now } },
      // Legacy rows that still rely on isPublished before status backfill.
      {
        AND: [
          { isPublished: true },
          { status: { notIn: ["draft", "scheduled"] } },
        ],
      },
    ],
  };
}
