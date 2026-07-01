import type { AwardItem } from "@/components/landing/AwardDistribution";
import { defaultAcaSelfVerifiers } from "@/lib/aca-self-verifiers";
import {
  getAcaSelfVerifiers,
  getBonusAchievers,
  getPromotions,
  getPublicMedia,
} from "@/lib/media";

export const defaultMobileHighlights: AwardItem[] = [
  {
    id: "bonus-tommy",
    title: "Tommy Espinoza",
    image: "/awards/bonus-tommy-espinoza.png",
    alt: "Tommy Espinoza Med Alert Bonus Achiever — earned 166,500",
  },
  {
    id: "bonus-ronnie",
    title: "Ronnie Adams",
    image: "/awards/bonus-ronnie-adams.png",
    alt: "Ronnie Adams Med Alert Bonus Achiever — earned 251,500",
  },
  {
    id: "bonus-ken",
    title: "Ken Lee",
    image: "/awards/bonus-ken-lee.png",
    alt: "Ken Lee Med Alert Bonus Achiever — earned 176,500",
  },
  {
    id: "promo-mohsin",
    title: "Mohsin Nazir",
    image: "/awards/promotion-mohsin-nazir.png",
    alt: "Mohsin Nazir promoted from Verifier to Team Lead at BALITECH",
  },
  {
    id: "promo-shad",
    title: "Shad Azam",
    image: "/awards/promotion-shad-azam.png",
    alt: "Shad Azam promoted from Verifier to Team Lead at BALITECH",
  },
  {
    id: "promo-haris",
    title: "Haris Zaheer",
    image: "/awards/promotion-haris-zaheer.png",
    alt: "Haris Zaheer promoted to Associate Manager at BALITECH",
  },
  {
    id: "promo-zimmel",
    title: "Zimmel Shahid",
    image: "/awards/promotion-zimmel-shahid.png",
    alt: "Zimmel Shahid promoted from Closer to Retention Manager on Med Alert Campaign",
  },
  {
    id: "award-iphone",
    title: "iPhone Award",
    image: "/awards/award-iphone-certificate.png",
    alt: "BALITECH employee receiving iPhone and certificate award",
  },
  {
    id: "award-honda-bike",
    title: "Honda CG 125 Award",
    image: "/awards/award-honda-motorcycle-presentation.jpg",
    alt: "BALITECH top performer Honda CG 125 motorcycle presentation",
  },
  {
    id: "award-emporio",
    title: "Emporio Armani Gift",
    image: "/awards/award-emporio-armani-gift.jpg",
    alt: "BALITECH top performer receiving Emporio Armani gift",
  },
  {
    id: "award-honda-key",
    title: "Honda Key Presentation",
    image: "/awards/award-honda-key-presentation.png",
    alt: "BALITECH Honda key presentation for top performer",
  },
  {
    id: "award-certificate",
    title: "Certificate Ceremony",
    image: "/awards/award-certificate-ceremony.png",
    alt: "BALITECH certificate award ceremony",
  },
  {
    id: "award-honda-group",
    title: "Honda Award Group",
    image: "/awards/award-honda-key-group.png",
    alt: "BALITECH team Honda award group photo",
  },
];

function toMobileItems(
  media: Awaited<ReturnType<typeof getBonusAchievers>>,
  titleCleanup?: RegExp
): AwardItem[] {
  return media
    .filter((item) => item.kind === "image" && item.src?.trim())
    .map((item) => ({
      id: item.id,
      title: titleCleanup
        ? item.title.replace(titleCleanup, "")
        : item.title.split(" — ")[0] ?? item.title,
      image: item.src,
      alt: item.alt,
    }));
}

function mergeMobileHighlights(...groups: AwardItem[][]): AwardItem[] {
  const seen = new Set<string>();
  const merged: AwardItem[] = [];

  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }

  return merged;
}

export async function getMobileHighlights(): Promise<AwardItem[]> {
  const [acaMedia, bonusMedia, promotionMedia, awardMedia] = await Promise.all([
    getAcaSelfVerifiers(),
    getBonusAchievers(),
    getPromotions(),
    getPublicMedia("awards"),
  ]);

  const aca = toMobileItems(acaMedia, / — ACA Self Verifiers Best Performer$/);
  const bonus = toMobileItems(bonusMedia, / — Med Alert Bonus Achiever$/);
  const promotions = toMobileItems(promotionMedia);
  const awards = toMobileItems(awardMedia);

  const mobileHighlights = mergeMobileHighlights(
    aca,
    defaultAcaSelfVerifiers,
    bonus,
    promotions,
    awards,
    defaultMobileHighlights
  );

  return mobileHighlights.length > 0
    ? mobileHighlights
    : [...defaultAcaSelfVerifiers, ...defaultMobileHighlights];
}
