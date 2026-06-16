import AwardDistribution, {
  type AwardItem,
} from "@/components/landing/AwardDistribution";
import { getAwardMedia, getBonusAchievers, getPromotions } from "@/lib/media";

const REMOVED_AWARD_IMAGES = new Set([
  "/awards/award-honda-key-group.png",
  "/awards/award-honda-key-presentation.png",
]);

const defaultAwardItems: AwardItem[] = [
  {
    id: "award-1",
    title: "iPhone & Certificate Award",
    image: "/awards/award-iphone-certificate.png",
    alt: "BALITECH employee receiving iPhone and certificate award",
    featured: true,
  },
  {
    id: "award-honda",
    title: "Honda CG 125 Top Performer",
    image: "/awards/award-honda-motorcycle-presentation.jpg",
    alt: "BALITECH top performer Honda CG 125 motorcycle presentation",
  },
  {
    id: "award-emporio",
    title: "Top Performer Emporio Armani Gift",
    image: "/awards/award-emporio-armani-gift.jpg",
    alt: "BALITECH top performer receiving Emporio Armani gift",
  },
];

const defaultMobileHighlights: AwardItem[] = [
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
];

function toAwardItems(
  media: Awaited<ReturnType<typeof getAwardMedia>>
): AwardItem[] {
  const items = media
    .filter(
      (item) =>
        item.kind === "image" &&
        item.src?.trim() &&
        !REMOVED_AWARD_IMAGES.has(item.src)
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      image: item.src,
      alt: item.alt,
      featured: item.isFeatured,
    }));

  const featured = items.find((item) => item.featured) ?? items[0];
  if (!featured) return [];

  const rest = items.filter((item) => item.id !== featured.id);
  return [featured, ...rest.slice(0, 2)];
}

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

function mergeMobileHighlights(
  bonus: AwardItem[],
  promotions: AwardItem[]
): AwardItem[] {
  const seen = new Set<string>();
  const merged: AwardItem[] = [];

  for (const item of [...bonus, ...promotions]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}

export default async function AwardDistributionSection() {
  const [awardMedia, bonusMedia, promotionMedia] = await Promise.all([
    getAwardMedia(),
    getBonusAchievers(),
    getPromotions(),
  ]);

  const fromDb = toAwardItems(awardMedia);
  const awards = fromDb.length >= 3 ? fromDb : defaultAwardItems;

  const bonus = toMobileItems(bonusMedia, / — Med Alert Bonus Achiever$/);
  const promotions = toMobileItems(promotionMedia);

  const defaultBonus = defaultMobileHighlights.slice(0, 3);
  const defaultPromo = defaultMobileHighlights.slice(3);

  const mobileHighlights = mergeMobileHighlights(
    bonus.length > 0 ? bonus : defaultBonus,
    promotions.length > 0 ? promotions : defaultPromo
  );

  const highlights =
    mobileHighlights.length > 0 ? mobileHighlights : defaultMobileHighlights;

  return (
    <AwardDistribution items={awards} mobileHighlights={highlights} />
  );
}
