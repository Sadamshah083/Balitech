import EventsGallery, {
  type EventGalleryItem,
} from "@/components/landing/EventsGallery";
import { getPublicMedia } from "@/lib/media";
import { siteImages } from "@/lib/images";

export const indexEventGalleryItems: EventGalleryItem[] = [
  {
    id: "events-1",
    title: "Strategic Session",
    image: siteImages.gallery.main,
    featured: true,
  },
  {
    id: "events-2",
    title: "Leadership Briefing",
    image: siteImages.gallery.events[0],
  },
  {
    id: "events-3",
    title: "Balitech Commercial Office",
    image: siteImages.gallery.events[1],
  },
  {
    id: "events-4",
    title: "Annual Celebrations",
    image: siteImages.gallery.events[2],
  },
  {
    id: "events-5",
    title: "Top Performers Recognition",
    image: siteImages.gallery.events[3],
  },
];

function toGalleryItems(
  media: Awaited<ReturnType<typeof getPublicMedia>>
): EventGalleryItem[] {
  return media
    .filter((item) => item.kind === "image" && item.src?.trim())
    .map((item) => ({
      id: item.id,
      title: item.title,
      image: item.src,
      featured: item.isFeatured,
    }));
}

export default async function EventsGallerySection() {
  const media = await getPublicMedia("events");
  const fromDb = toGalleryItems(media);
  const items = fromDb.length >= 3 ? fromDb : indexEventGalleryItems;

  return <EventsGallery items={items} />;
}
