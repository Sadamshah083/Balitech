import type { Metadata } from "next";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import GalleryPortraitPlayer from "@/components/gallery/GalleryPortraitPlayer";
import OfficeGallery from "@/components/gallery/OfficeGallery";
import EventsGallery from "@/components/landing/EventsGallery";
import {
  getFeaturedVideo,
  getGalleryMedia,
  getPortraitVideos,
  getPublicMedia,
  getWorkspaceMedia,
} from "@/lib/media";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Gallery | Bali Tech Pvt. Ltd",
  description:
    "Photos from events, awards, team activities, and office life at Bali Tech.",
};

export default async function GalleryPage() {
  const [galleryItems, workspaceItems, portraitVideos, featuredVideo, eventsItems] =
    await Promise.all([
      getGalleryMedia(),
      getWorkspaceMedia(),
      getPortraitVideos(),
      getFeaturedVideo(),
      getPublicMedia("events"),
    ]);

  const bannerImage =
    galleryItems[0]?.src ?? eventsItems[0]?.src ?? siteImages.gallery.main;

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
        image={bannerImage}
      />
      <GalleryPortraitPlayer
        portraitVideos={portraitVideoItems}
        featuredVideo={featuredVideoItem}
      />
      {eventGalleryItems.length > 0 && (
        <EventsGallery items={eventGalleryItems} />
      )}
      {workspaceItems.length > 0 && <OfficeGallery items={workspaceItems} />}
      {galleryItems.length > 0 && <GalleryGrid items={galleryItems} />}
    </SitePage>
  );
}
