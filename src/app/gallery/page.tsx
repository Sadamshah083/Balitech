import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import FruitDayGallery from "@/components/gallery/FruitDayGallery";
import GalleryPortraitPlayer from "@/components/gallery/GalleryPortraitPlayer";
import OfficeGallery from "@/components/gallery/OfficeGallery";
import EventsGallery from "@/components/landing/EventsGallery";
import AwardDistributionSection from "@/components/landing/AwardDistributionSection";
import {
  getFeaturedVideo,
  getGalleryMedia,
  getPortraitVideos,
  getPublicMedia,
  getWorkspaceMedia,
} from "@/lib/media";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Gallery & Events",
  description:
    "Photos and videos from Bali Tech events, awards, annual trips, culture day, top performers, and office life across Rawalpindi and Islamabad.",
  path: "/gallery",
  keywords: [
    "Bali Tech gallery",
    "BALITECH events",
    "company culture Pakistan",
    "annual trip",
    "top performers",
    "award distribution",
  ],
});

export default async function GalleryPage() {
  const [galleryItems, workspaceItems, portraitVideos, featuredVideo, eventsItems] =
    await Promise.all([
      getGalleryMedia(),
      getWorkspaceMedia(),
      getPortraitVideos(),
      getFeaturedVideo(),
      getPublicMedia("events"),
    ]);

  const portraitVideoItems = portraitVideos.map((item) => ({
    id: item.id,
    title: item.title,
    src: item.src,
  }));

  const featuredVideoItem = featuredVideo
    ? {
        id: featuredVideo.id,
        title: featuredVideo.title,
        src: featuredVideo.src,
      }
    : null;

  const eventGalleryItems =
    eventsItems.length > 0
      ? eventsItems.map((item) => ({
          id: item.id,
          title: item.title,
          image: item.src,
          featured: item.isFeatured,
        }))
      : [];

  return (
    <SitePage>
      <PageBanner
        title="Gallery"
        subtitle="Celebrating milestones, team spirit, and excellence at Bali Tech."
      />
      <FruitDayGallery />
      <GalleryPortraitPlayer
        portraitVideos={portraitVideoItems}
        featuredVideo={featuredVideoItem}
      />
      {eventGalleryItems.length > 0 && (
        <EventsGallery items={eventGalleryItems} />
      )}
      <AwardDistributionSection />
      {workspaceItems.length > 0 && <OfficeGallery items={workspaceItems} />}
      {galleryItems.length > 0 && <GalleryGrid items={galleryItems} />}
    </SitePage>
  );
}
