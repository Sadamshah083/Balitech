import type { GalleryVideoItem } from "@/components/gallery/GalleryPortraitPlayer";

type Props = {
  item: GalleryVideoItem;
};

/** Full-width featured clip shown directly under Culture Day on /gallery. */
export default function GalleryFeaturedVideo({ item }: Props) {
  return (
    <article
      className="gallery-featured-video gallery-featured-video--under-culture"
      aria-label={item.title}
    >
      <div className="gallery-featured-video__frame glow-border">
        <div className="gallery-featured-video__screen">
          <video
            className="gallery-device__video"
            src={item.poster ? item.src : `${item.src}#t=0.1`}
            poster={item.poster}
            controls
            playsInline
            preload={item.poster ? "none" : "metadata"}
            aria-label={item.title}
          />
        </div>
      </div>
      <h3 className="gallery-device__title gallery-featured-video__title">
        {item.title}
      </h3>
    </article>
  );
}
