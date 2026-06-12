import { prisma, isMediaItemReady } from "@/lib/prisma";
import { fallbackMediaItems, type PublicMediaItem } from "@/lib/fallback-media";

export type { PublicMediaItem };

export const mediaSectionOptions = [
  { value: "gallery", label: "Gallery Grid" },
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

  if (!isMediaItemReady()) {
    return fallback;
  }

  try {
    const items = await prisma.mediaItem.findMany({
      where: {
        isActive: true,
        ...(section ? { section } : {}),
      },
      orderBy: { order: "asc" },
      select: publicMediaSelect,
    });
    if (items.length === 0) {
      return fallback;
    }
    return items;
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
