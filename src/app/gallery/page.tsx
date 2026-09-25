import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import FruitDayGallery from "@/components/gallery/FruitDayGallery";
import GalleryFeaturedVideo from "@/components/gallery/GalleryFeaturedVideo";
import GalleryPortraitPlayer, {
  type GalleryVideoItem,
} from "@/components/gallery/GalleryPortraitPlayer";
import { getVideoPoster } from "@/lib/video-posters";
import GalleryTripFilms from "@/components/gallery/GalleryTripFilms";
import OfficeGallery from "@/components/gallery/OfficeGallery";
import AboutEventCollage from "@/components/landing/AboutEventCollage";
import AwardDistribution from "@/components/landing/AwardDistribution";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import {
  getAwardMedia,
  getFeaturedVideo,
  getGalleryMedia,
  getPortraitVideos,
  getPublicMedia,
  getWorkspaceMedia,
} from "@/lib/media";
import { createMediaDeduper, toShowcaseItems } from "@/lib/showcase";
import { reservedImageSrcs } from "@/lib/page-imagery";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

export const metadata = pageMetadata({
  title: "Gallery & Events",
  description:
    "Photos and videos from Bali Tech events, awards, annual trips, culture day, New Year, top performers, and office life across Rawalpindi and Islamabad.",
  path: "/gallery",
});

/** Award photos that should no longer be published. */
const RETIRED_AWARD_IMAGES = [
  "/awards/award-honda-key-group.png",
  "/awards/award-honda-key-presentation.png",
];

function toVideoItem(item: { id: string; title: string; src: string }): GalleryVideoItem {
  const known = getVideoPoster(item.src);
  return {
    id: item.id,
    title: item.title,
    src: item.src,
    poster: known?.poster,
    aspect: known ? known.width / known.height : undefined,
  };
}

export default async function GalleryPage() {
  const [
    galleryItems,
    workspaceItems,
    portraitVideos,
    featuredVideo,
    awardItems,
    eventItems,
  ] = await Promise.all([
    getGalleryMedia(),
    getWorkspaceMedia(),
    getPortraitVideos(),
    getFeaturedVideo(),
    getAwardMedia(),
    getPublicMedia("events"),
  ]);

  /**
   * The catalog lists the same file under several sections, so each section
   * claims its photos in render order and later sections skip what is already
   * on screen. The seed also blocks photos owned by another page — retired
   * awards, the careers-page event shots, and the home/about feature images.
   */
  const deduper = createMediaDeduper([
    ...RETIRED_AWARD_IMAGES,
    ...reservedImageSrcs,
    ...eventItems.map((item) => item.src),
  ]);
  const awards = toShowcaseItems(deduper.claim(awardItems));
  const workspace = deduper.claim(workspaceItems);
  const grid = deduper.claim(galleryItems);

  const portraitVideoItems = portraitVideos.map(toVideoItem);
  const featuredVideoItem = featuredVideo ? toVideoItem(featuredVideo) : null;

  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "Gallery", path: "/gallery" }])}
      />
      <PageBanner
        title="Gallery"
        subtitle="Celebrating milestones, team spirit, and excellence at Bali Tech."
      />

      <AwardDistribution items={awards} />

      <section
        className="gallery-culture-block section-with-net section-gradient"
        aria-label="Culture Day and New Year"
      >
        <SectionAnimatedNet />
        <div className="gallery-culture-block__inner">
          <AboutEventCollage />
          {featuredVideoItem && <GalleryFeaturedVideo item={featuredVideoItem} />}
        </div>
      </section>

      <FruitDayGallery />
      <GalleryTripFilms />
      <GalleryPortraitPlayer
        portraitVideos={portraitVideoItems}
        featuredVideo={null}
      />
      {workspace.length > 0 && <OfficeGallery items={workspace} />}
      {grid.length > 0 && <GalleryGrid items={grid} />}
    </SitePage>
  );
}
