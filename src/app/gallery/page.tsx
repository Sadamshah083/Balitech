import type { Metadata } from "next";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import EventsGallery from "@/components/landing/EventsGallery";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Gallery | Bali Tech Pvt. Ltd",
  description: "Photos from events, awards, team activities, and office life at Bali Tech.",
};

export default function GalleryPage() {
  return (
    <SitePage>
      <PageBanner
        title="Gallery"
        subtitle="Celebrating milestones, team spirit, and excellence at Bali Tech."
        image={siteImages.gallery.main}
      />
      <EventsGallery />
      <GalleryGrid />
    </SitePage>
  );
}
