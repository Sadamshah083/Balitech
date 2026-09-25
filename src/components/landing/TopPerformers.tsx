import Image from "next/image";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

/**
 * Each award graphic already carries the employee name, campaign and payout, so
 * the cards render the artwork alone — a text caption underneath would repeat
 * the name and expose the filename suffix on the two same-named performers.
 */
const topPerformers = [
  "Bryan Jhonson",
  "Max Marshall",
  "Steve Henely",
  "Mark Edward",
  "James Wilson",
  "Bryan Morries",
  "Bryan Morries 1",
  "Kevin Brown",
  "Sarah Smith",
  "John Harris",
  "Michael Davis",
  "David Brown",
  "Anna Methew",
  "Kevin Smith",
] as const;

const performers = topPerformers.map((filename) => ({
  id: filename,
  /* Trailing "-1" style suffixes distinguish files, never people */
  name: filename.replace(/\s\d+$/, ""),
  image: `/awards/Top performance/${filename}.webp`,
}));

export default function TopPerformers() {
  return (
    <section
      id="team"
      className="top-performers-growth section-gradient section-with-net py-20"
    >
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="brand-label mb-4">Our Growth</p>
          <AnimatedTitle containerClass="mx-auto max-w-4xl">
            Celebrating Our Top Performers In 2025
          </AnimatedTitle>
        </div>

        <ul className="top-performers-growth__grid">
          {performers.map((performer) => (
            <li key={performer.id} className="top-performer-card">
              <Image
                src={performer.image}
                alt={`${performer.name} — BALITECH best performer, ACA AEP 2025`}
                width={1440}
                height={1800}
                className="top-performer-card__image"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
