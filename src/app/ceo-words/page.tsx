import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import BlogPageHero from "@/components/blog/BlogPageHero";
import CEOLeadershipShowcase from "@/components/blog/CEOLeadershipShowcase";
import { companyContent } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

const { ceo } = companyContent;

export const metadata = pageMetadata({
  title: "CEO Words",
  description: `Vision, leadership, and culture from ${ceo.name}, ${ceo.title} of ${ceo.company}.`,
  path: "/ceo-words",
});

export default function CeoWordsPage() {
  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "CEO Words", path: "/ceo-words" }])}
      />
      <div className="blog-page section-with-net">
        <SectionAnimatedNet />
        <BlogPageHero />
        <CEOLeadershipShowcase variant="page" />
      </div>
    </SitePage>
  );
}
