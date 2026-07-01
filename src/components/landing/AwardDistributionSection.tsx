import AwardDistribution, {
  type AwardItem,
} from "@/components/landing/AwardDistribution";
import { getAwardMedia } from "@/lib/media";

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

export default async function AwardDistributionSection() {
  const awardMedia = await getAwardMedia();
  const fromDb = toAwardItems(awardMedia);
  const awards = fromDb.length >= 3 ? fromDb : defaultAwardItems;

  return <AwardDistribution items={awards} />;
}
