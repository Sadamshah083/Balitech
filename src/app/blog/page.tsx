import type { Metadata } from "next";
import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import BlogPageHero from "@/components/blog/BlogPageHero";
import CEOLeadershipShowcase from "@/components/blog/CEOLeadershipShowcase";
import { companyContent } from "@/lib/content";

const { ceo } = companyContent;

export const metadata: Metadata = {
  title: "Blog | Bali Tech Pvt. Ltd",
  description: `Leadership insights from ${ceo.name}, ${ceo.title} of ${ceo.company}.`,
};

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
