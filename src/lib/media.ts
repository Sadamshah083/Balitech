import { prisma, isDatabaseAvailable, isMediaItemReady } from "@/lib/prisma";
import { fallbackMediaItems, type PublicMediaItem } from "@/lib/fallback-media";

export type { PublicMediaItem };

export const mediaSectionOptions = [
  { value: "about-collage", label: "About Collage (Homepage)" },
  { value: "hero", label: "Hero Slides" },
  { value: "awards", label: "Award Distribution (Homepage)" },
  { value: "bonus-achievers", label: "Med Alert Bonus Achievers" },
  { value: "aca-self-verifiers", label: "ACA Self Verifiers Best Performers" },
  { value: "promotions", label: "Team Promotions (Homepage)" },
  { value: "workspace", label: "Office Workspace Section" },
  { value: "portrait-video", label: "Portrait Videos Row" },
  { value: "featured-video", label: "Featured Full-Width Video" },
  { value: "events", label: "Events Gallery (Homepage)" },
  { value: "banner", label: "Page Banner" },
] as const;

export const mediaCategoryOptions = [
  "Events",
  "Awards",
  "Team",
  "Training",
  "Office",
  "Fruit Day",
] as const;

export const mediaKindOptions = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
] as const;

const publicMediaSelect = {
  id: true,
  title: true,
  alt: true,
  src: true,
  kind: true,
  section: true,
  category: true,
  order: true,
  isFeatured: true,
} as const;

export async function getPublicMedia(
  section?: string
): Promise<PublicMediaItem[]> {
  const fallback = section
    ? fallbackMediaItems.filter((item) => item.section === section)
    : fallbackMediaItems;

  if (!isMediaItemReady() || !(await isDatabaseAvailable())) {
    return fallback;
  }

  try {
    const dbItems = await prisma.mediaItem.findMany({
      where: section ? { section } : undefined,
      orderBy: { order: "asc" },
      select: {
        ...publicMediaSelect,
        isActive: true,
      },
    });

    const dbBySrc = new Map(dbItems.map((item) => [item.src, item]));
    const fallbackSrcs = new Set(fallback.map((item) => item.src));

    const mergedCatalog = fallback
      .map((item) => {
        const existing = dbBySrc.get(item.src);
        if (existing) {
          if (!existing.isActive) return null;
          const { isActive: _isActive, ...publicItem } = existing;
          return publicItem;
        }
        return item;
      })
      .filter((item): item is PublicMediaItem => item !== null);

    const extraDbItems = dbItems
      .filter((item) => item.isActive && !fallbackSrcs.has(item.src))
      .map(({ isActive: _isActive, ...item }) => item);

    if (mergedCatalog.length === 0 && extraDbItems.length === 0) {
      return fallback;
    }

    return [...mergedCatalog, ...extraDbItems].sort(
      (a, b) => a.order - b.order || a.title.localeCompare(b.title)
    );
  } catch (error) {
    console.error("[media] Database unavailable, serving fallback:", error);
    return fallback;
  }
}

export async function getGalleryMedia() {
  return getPublicMedia("gallery");
}

export async function getWorkspaceMedia() {
  return getPublicMedia("workspace");
}

export async function getPortraitVideos() {
  return getPublicMedia("portrait-video");
}

export async function getFeaturedVideo() {
  const items = await getPublicMedia("featured-video");
  return items.find((item) => item.isFeatured) ?? items[0] ?? null;
}

export async function getAwardMedia() {
  return getPublicMedia("awards");
}

export async function getBonusAchievers() {
  return getPublicMedia("bonus-achievers");
}

export async function getAcaSelfVerifiers() {
  return getPublicMedia("aca-self-verifiers");
}

export async function getPromotions() {
  return getPublicMedia("promotions");
}

export type AdminMediaItem = PublicMediaItem & {
  isActive: boolean;
  fromCatalog: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getAdminMediaList(
  section?: string
): Promise<AdminMediaItem[]> {
  const catalog = section
    ? fallbackMediaItems.filter((item) => item.section === section)
    : fallbackMediaItems;

  if (!isMediaItemReady() || !(await isDatabaseAvailable())) {
    return catalog.map((item) => ({
      ...item,
      isActive: true,
      fromCatalog: true,
    }));
  }

  try {
    const dbItems = await prisma.mediaItem.findMany({
      where: section ? { section } : undefined,
      orderBy: [{ section: "asc" }, { order: "asc" }],
    });

    const dbBySrc = new Map(dbItems.map((item) => [item.src, item]));

    const mergedCatalog = catalog.map((item) => {
      const existing = dbBySrc.get(item.src);
      if (existing) {
        return {
          id: existing.id,
          title: existing.title,
          alt: existing.alt,
          src: existing.src,
          kind: existing.kind,
          section: existing.section,
          category: existing.category,
          order: existing.order,
          isFeatured: existing.isFeatured,
          isActive: existing.isActive,
          fromCatalog: false,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        };
      }
      return {
        ...item,
        isActive: true,
        fromCatalog: true,
      };
    });

    const catalogSrcs = new Set(catalog.map((item) => item.src));
    const extraDbItems = dbItems
      .filter((item) => !catalogSrcs.has(item.src))
      .map((item) => ({
        id: item.id,
        title: item.title,
        alt: item.alt,
        src: item.src,
        kind: item.kind,
        section: item.section,
        category: item.category,
        order: item.order,
        isFeatured: item.isFeatured,
        isActive: item.isActive,
        fromCatalog: false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

    return [...mergedCatalog, ...extraDbItems].sort(
      (a, b) =>
        a.section.localeCompare(b.section) ||
        a.order - b.order ||
        a.title.localeCompare(b.title)
    );
  } catch (error) {
    console.error("[media] Admin list unavailable, serving catalog:", error);
    return catalog.map((item) => ({
      ...item,
      isActive: true,
      fromCatalog: true,
    }));
  }
}

export async function syncMediaCatalog() {
  if (!isMediaItemReady() || !(await isDatabaseAvailable())) return 0;

  let created = 0;
  for (const item of fallbackMediaItems) {
    const existing = await prisma.mediaItem.findFirst({
      where: { src: item.src, section: item.section },
    });
    if (existing) continue;

    await prisma.mediaItem.create({
      data: {
        title: item.title,
        alt: item.alt,
        src: item.src,
        kind: item.kind,
        section: item.section,
        category: item.category,
        order: item.order,
        isFeatured: item.isFeatured,
        isActive: true,
      },
    });
    created += 1;
  }
  return created;
}
