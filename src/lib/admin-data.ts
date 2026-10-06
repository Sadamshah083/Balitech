import { prisma } from "@/lib/prisma";
import { withCampaignBranchList } from "@/lib/campaign-locations";
import { toAdminVacancy } from "@/lib/careers/vacancies";
import { getAdminMediaList } from "@/lib/media";
import { buildLeadWhere } from "@/lib/lead-filters";
import { UNSPECIFIED_POSITION, resolveLeadPosition } from "@/lib/lead-position";
import {
  isCampaignVacancyId,
  leadPositionTitle,
  listPublicVacancies,
} from "@/lib/careers/vacancies";
import { leadMatchesBranch } from "@/lib/lead-branch";

type Serialized<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

function toJSON<T>(obj: T): Serialized<T> {
  return JSON.parse(JSON.stringify(obj));
}

export async function prefetchCampaigns() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { order: "asc" } });
  return toJSON(campaigns.map(withCampaignBranchList));
}

export async function prefetchOffices() {
  const offices = await prisma.office.findMany({ orderBy: { order: "asc" } });
  return toJSON(offices);
}

export async function prefetchMedia() {
  const media = await getAdminMediaList();
  return toJSON(media);
}

export async function prefetchUsers() {
  const users = await prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plainPassword: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return toJSON(users);
}

export async function prefetchVacancies() {
  const rows = await prisma.vacancy.findMany({
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });
  return toJSON(rows.map(toAdminVacancy));
}

export async function prefetchVacancyBranches() {
  const offices = await prisma.office.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return offices.map((o) => o.name);
}

export async function prefetchVacancyCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { title: true },
  });
  return campaigns.map((c) => c.title);
}

const adminBlogInclude = {
  category: {
    select: { id: true, name: true, slug: true, isActive: true },
  },
  tagLinks: {
    include: { tag: { select: { id: true, name: true, slug: true } } },
  },
} as const;

export async function prefetchBlogCategories() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      tagLinks: {
        include: { tag: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { blogs: true } },
    },
  });

  return toJSON(categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    imageAlt: c.imageAlt,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    isActive: c.isActive,
    order: c.order,
    tags: c.tagLinks.map((l) => l.tag),
    postCount: c._count.blogs,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  })));
}

export async function prefetchBlogTags() {
  const tags = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { blogs: true } },
    },
  });

  return toJSON(tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    postCount: tag._count.blogs,
    categories: tag.categories.map((c) => c.category),
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  })));
}

export async function prefetchBlogs() {
  const blogs = await prisma.blog.findMany({
    orderBy: [{ createdAt: "desc" }, { order: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      image: true,
      imageAlt: true,
      tags: true,
      format: true,
      metaTitle: true,
      metaDescription: true,
      order: true,
      isPublished: true,
      status: true,
      publishedAt: true,
      scheduledAt: true,
      createdAt: true,
      categoryId: true,
      category: adminBlogInclude.category,
      tagLinks: adminBlogInclude.tagLinks,
    },
  });

  return toJSON(blogs.map((b) => ({
    ...b,
    tagList: b.tagLinks.map((l) => l.tag),
    tagLinks: undefined,
  })));
}

const DEFAULT_PAGE_SIZE = 25;

export async function prefetchLeads() {
  const params = new URLSearchParams();
  const where = buildLeadWhere(params);

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: DEFAULT_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        position: true,
        message: true,
        cvFileName: true,
        cvPath: true,
        status: true,
        createdAt: true,
        referenceId: true,
        queue: true,
        flags: true,
        details: true,
        exportedAt: true,
        cvDownloadedAt: true,
        cnic: true,
        source: true,
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads: toJSON(leads),
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)),
    },
  };
}

export async function prefetchLeadPositions() {
  const [leads, open] = await Promise.all([
    prisma.lead.findMany({
      select: {
        position: true,
        message: true,
        cvPath: true,
        exportedAt: true,
        cvDownloadedAt: true,
      },
    }),
    listPublicVacancies().catch(() => ({ vacancies: [] })),
  ]);

  const buckets = new Map<
    string,
    { leads: number; cvs: number; newLeads: number; newCvs: number }
  >();

  for (const lead of leads) {
    const label = resolveLeadPosition(lead) || UNSPECIFIED_POSITION;
    const bucket = buckets.get(label) ?? {
      leads: 0,
      cvs: 0,
      newLeads: 0,
      newCvs: 0,
    };
    bucket.leads += 1;
    if (!lead.exportedAt) bucket.newLeads += 1;
    if (lead.cvPath) {
      bucket.cvs += 1;
      if (!lead.cvDownloadedAt) bucket.newCvs += 1;
    }
    buckets.set(label, bucket);
  }

  const campaignLabels = open.vacancies
    .filter((vacancy) => isCampaignVacancyId(vacancy.id))
    .map(leadPositionTitle);
  const campaignSet = new Set(campaignLabels);
  for (const label of campaignLabels) {
    if (!buckets.has(label)) {
      buckets.set(label, { leads: 0, cvs: 0, newLeads: 0, newCvs: 0 });
    }
  }

  const positions = [...buckets.entries()]
    .map(([value, counts]) => ({
      value,
      ...counts,
      group: campaignSet.has(value) ? ("campaign" as const) : ("position" as const),
    }))
    .sort((a, b) => {
      if (a.value === UNSPECIFIED_POSITION) return 1;
      if (b.value === UNSPECIFIED_POSITION) return -1;
      return a.value.localeCompare(b.value);
    });

  return {
    positions,
    totals: {
      leads: leads.length,
      cvs: leads.filter((lead) => lead.cvPath).length,
      newLeads: leads.filter((lead) => !lead.exportedAt).length,
      newCvs: leads.filter((lead) => lead.cvPath && !lead.cvDownloadedAt).length,
    },
  };
}

export async function prefetchLeadBranches() {
  const [leads, offices] = await Promise.all([
    prisma.lead.findMany({
      select: {
        referenceId: true,
        company: true,
        message: true,
        cvPath: true,
        cvDownloadedAt: true,
      },
    }),
    prisma.office.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { name: true },
    }),
  ]);

  return offices.map((office) => {
    const matching = leads.filter((lead) => leadMatchesBranch(lead, office.name));
    return {
      value: office.name,
      leads: matching.length,
      cvs: matching.filter((lead) => lead.cvPath && !lead.cvDownloadedAt).length,
    };
  });
}
