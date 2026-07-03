import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import BlogPageHero from "@/components/blog/BlogPageHero";
import CEOLeadershipShowcase from "@/components/blog/CEOLeadershipShowcase";
import { companyContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

const { ceo } = companyContent;

export const metadata = pageMetadata({
  title: "Blog & Leadership Insights",
  description: `Leadership insights and articles from ${ceo.name}, ${ceo.title} of ${ceo.company}. Read the latest from BALITECH on BPO, culture, and growth.`,
  path: "/blog",
  keywords: [
    "Bali Tech blog",
    "BPO insights",
    "leadership Pakistan",
    "Sheraz Bali blog",
    "company culture",
  ],
});

export default function BlogPage() {
  return (
    <SitePage>
      <div className="blog-page section-with-net">
        <SectionAnimatedNet />
        <BlogPageHero />
        <CEOLeadershipShowcase variant="page" />
      </div>
    </SitePage>
  );
}
