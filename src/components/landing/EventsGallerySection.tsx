import EventsGallery from "@/components/landing/EventsGallery";
import { getPublicMedia } from "@/lib/media";
import { toShowcaseItems } from "@/lib/showcase";

export default async function EventsGallerySection() {
  const media = await getPublicMedia("events");

  return <EventsGallery items={toShowcaseItems(media)} />;
}
