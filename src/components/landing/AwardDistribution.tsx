import { Trophy } from "lucide-react";
import MediaShowcase, {
  type ShowcaseItem,
} from "@/components/media/MediaShowcase";

export type AwardItem = ShowcaseItem;

type AwardDistributionProps = {
  items: AwardItem[];
};

const highlights = [
  "Monthly and quarterly top-performer awards",
  "Motorcycles, smartphones and premium gifts",
  "Certificates presented by senior management",
];

/** Recognition proof — lives on /gallery only. */
export default function AwardDistribution({ items }: AwardDistributionProps) {
  if (items.length === 0) return null;

  return (
    <section
      id="awards"
      className="recognition-section"
      aria-labelledby="recognition-title"
    >
      <div className="recognition-section__head">
        <div className="recognition-section__intro">
          <p className="ent-eyebrow">
            <Trophy size={14} aria-hidden />
            Recognition
          </p>
          <h2 id="recognition-title" className="ent-title">
            Award Distribution
          </h2>
          <p className="ent-lede">
            Celebrating the people behind our numbers with prizes, certificates
            and recognition ceremonies across every BALITECH office.
          </p>
        </div>

        <ul className="recognition-section__highlights">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <MediaShowcase items={items} tone="awards" slideLabel="award" />
    </section>
  );
}
