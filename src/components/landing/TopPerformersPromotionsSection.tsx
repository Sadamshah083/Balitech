import TopPerformersPromotionsCarousel from "@/components/landing/TopPerformersPromotionsCarousel";
import { getMobileHighlights } from "@/lib/mobile-highlights";

export default async function TopPerformersPromotionsSection() {
  const items = await getMobileHighlights();

  return (
    <section
      id="top-performers"
      className="top-performers-promotions-section top-performers-promotions-section--fullwidth section-gradient py-6 lg:py-8"
      aria-labelledby="top-performers-title"
    >
      <TopPerformersPromotionsCarousel items={items} />
    </section>
  );
}
