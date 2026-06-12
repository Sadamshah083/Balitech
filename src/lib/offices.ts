import { prisma, isOfficeReady } from "@/lib/prisma";
import { fallbackOffices, type PublicOffice } from "@/lib/fallback-offices";

export type { PublicOffice };

export function slugifyOffice(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function buildMapEmbedUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=en&z=14&output=embed`;
}

const publicOfficeSelect = {
  id: true,
  name: true,
  slug: true,
  address: true,
  phone: true,
  email: true,
  hours: true,
  city: true,
  country: true,
  image: true,
  mapEmbedUrl: true,
  order: true,
  isHeadOffice: true,
} as const;

export async function getPublicOffices(): Promise<PublicOffice[]> {
  if (!isOfficeReady()) {
    return fallbackOffices;
  }

  try {
    const offices = await prisma.office.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: publicOfficeSelect,
    });
    if (offices.length === 0) return fallbackOffices;
    return offices;
  } catch (error) {
    console.error("[offices] Database unavailable, serving fallback:", error);
    return fallbackOffices;
  }
}

export async function getHeadOffice(): Promise<PublicOffice | null> {
  const offices = await getPublicOffices();
  return offices.find((o) => o.isHeadOffice) ?? offices[0] ?? null;
}
