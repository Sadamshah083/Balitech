import { ArrowUpRight } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import MediaShowcase, {
  type ShowcaseItem,
} from "@/components/media/MediaShowcase";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";

export type EventGalleryItem = ShowcaseItem;

type EventsGalleryProps = {
  items: EventGalleryItem[];
};

/** Culture proof for candidates — lives on /join-us only. */
export default function EventsGallery({ items }: EventsGalleryProps) {
  if (items.length === 0) return null;

  return (
    <section
      id="events"
      className="moments-section"
      aria-labelledby="moments-title"
    >
      <div className="moments-section__aura" aria-hidden />

      <div className="moments-section__head">
        <p className="ent-eyebrow">Events &amp; Culture</p>
        <h2 id="moments-title" className="ent-title">
          <HeadingLastWord text="Moments That Define Us" />
        </h2>
        <p className="ent-lede">
          Team celebrations, recognition nights and the everyday energy of our
          operations floor.
        </p>
      </div>

      <MediaShowcase items={items} tone="events" slideLabel="moment" />

      <div className="moments-section__foot">
        <IntentLink href="/gallery" className="ent-btn">
          View Full Gallery
          <ArrowUpRight size={17} aria-hidden />
        </IntentLink>
      </div>
    </section>
  );
}
