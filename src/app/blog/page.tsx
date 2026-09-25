import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import BlogArticles from "@/components/blog/BlogArticles";
import InsightsHero from "@/components/blog/InsightsHero";
import { getPublicBlogs } from "@/lib/blogs";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

export const metadata = pageMetadata({
  title: "Blogs",
  description:
    "Operations, culture, and growth articles from BALITECH — BPO delivery, team excellence, and life across our offices.",
  path: "/blog",
});

export default async function BlogPage() {
  const blogs = await getPublicBlogs();

  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "Blogs", path: "/blog" }])}
      />
      <div className="blog-page section-with-net">
        <SectionAnimatedNet />
        <InsightsHero />
        <BlogArticles blogs={blogs} />
      </div>
    </SitePage>
  );
}
