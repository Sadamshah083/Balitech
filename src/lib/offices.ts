import { prisma, isDatabaseAvailable, isOfficeReady } from "@/lib/prisma";
import { fallbackOffices, removedOfficeSlugs, officeHours, type PublicOffice } from "@/lib/fallback-offices";

export type { PublicOffice };
export { officeHours };

const LEGACY_HOURS = /^\s*mon\s*-\s*fri\s+from\s+6\s*pm\s+to\s+4\s*o'?clock\s*$/i;

const LEGACY_ISLAMABAD_STREET_5 =
  /Plot No\.349-352 street No 5 industrial Area 1-9\/3,\s*Islamabad/i;
const ISLAMABAD_STREET_1 =
  "Plot No.349-352 street No 1 industrial Area 1-9/3, Islamabad";

/**
 * Office rows were saved with a `.com` address and an unformatted hours
 * string. BALITECH operates on balitech.org, so normalise on read rather than
 * waiting for every stored record to be corrected by hand.
 */
function normalizeOfficeContact(office: PublicOffice): PublicOffice {
  const email = office.email?.replace(/@balitech\.com$/i, "@balitech.org");
  const hours =
    office.hours && LEGACY_HOURS.test(office.hours) ? officeHours : office.hours;
  const address = LEGACY_ISLAMABAD_STREET_5.test(office.address)
    ? ISLAMABAD_STREET_1
    : office.address;
  const mapNeedsFix =
    address !== office.address ||
    Boolean(
      office.mapEmbedUrl &&
        (office.mapEmbedUrl.includes(encodeURIComponent("street No 5")) ||
          /street(?:%20|\+)?No(?:%20|\+)?5/i.test(office.mapEmbedUrl))
    );
  const mapEmbedUrl = mapNeedsFix
    ? buildMapEmbedUrl(address)
    : office.mapEmbedUrl;

  if (
    email === office.email &&
    hours === office.hours &&
    address === office.address &&
    mapEmbedUrl === office.mapEmbedUrl
  ) {
    return office;
  }
  return {
    ...office,
    email: email ?? null,
    hours: hours ?? null,
    address,
    mapEmbedUrl,
  };
}

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
  let offices: PublicOffice[];

  if (!isOfficeReady() || !(await isDatabaseAvailable())) {
    offices = fallbackOffices;
  } else {
    try {
      const dbOffices = await prisma.office.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: publicOfficeSelect,
      });
      offices = dbOffices.length === 0 ? fallbackOffices : dbOffices;
    } catch (error) {
      console.error("[offices] Database unavailable, serving fallback:", error);
      offices = fallbackOffices;
    }
  }

  return offices
    .filter((office) => !removedOfficeSlugs.has(office.slug))
    .map(normalizeOfficeContact);
}

/**
 * An office's phone field as separate dialable numbers. Admins enter several
 * in one field ("0370 0585660 / 0327 1233435"), so it is split on "/", "," or
 * ";" and each local 0-prefixed number gets its +92 form for the tel: link.
 */
export function officePhoneLinks(phone: string | null | undefined) {
  if (!phone) return [];
  return phone
    .split(/[/,;]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => {
      const digits = label.replace(/[^\d+]/g, "");
      const international = digits.startsWith("+")
        ? digits
        : digits.startsWith("0")
          ? `+92${digits.slice(1)}`
          : digits;
      return { label, href: `tel:${international}` };
    });
}

export async function getHeadOffice(): Promise<PublicOffice | null> {
  const offices = await getPublicOffices();
  return offices.find((o) => o.isHeadOffice) ?? offices[0] ?? null;
}
